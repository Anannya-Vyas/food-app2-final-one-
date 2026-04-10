/**
 * Content moderation endpoints.
 * Mounts at /api/moderation
 *
 * Tasks: 5.8, 5.17
 * Requirements: 4.3, 4.4, 4.5, 15.1, 15.2, 15.3, 15.6, 5.6
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';
import { Comment } from '../models/Comment';
import { createNotification } from '../lib/notifications';
import { meiliClient, RECIPES_INDEX } from '../lib/meilisearch';

const router = Router();

// ─── Prohibited keyword pre-screening (Req 15.2) ─────────────────────────────

const PROHIBITED_KEYWORDS = [
  'spam',
  'scam',
  'hate',
  'violence',
  'explicit',
  'porn',
  'xxx',
  'drugs',
  'illegal',
  'abuse',
  'harassment',
  'racist',
  'sexist',
];

/**
 * Returns true if the text contains any prohibited keyword.
 */
export function containsProhibitedKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return PROHIBITED_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Pre-screen a recipe for prohibited content.
 * Returns true if the recipe should be flagged.
 */
function screenRecipe(recipe: { title: string; ingredients: unknown; steps: unknown }): boolean {
  const titleFlagged = containsProhibitedKeywords(recipe.title);
  if (titleFlagged) return true;

  if (Array.isArray(recipe.ingredients)) {
    for (const ing of recipe.ingredients as Record<string, unknown>[]) {
      if (typeof ing?.name === 'string' && containsProhibitedKeywords(ing.name)) return true;
    }
  }
  if (Array.isArray(recipe.steps)) {
    for (const step of recipe.steps as Record<string, unknown>[]) {
      if (typeof step?.text === 'string' && containsProhibitedKeywords(step.text)) return true;
    }
  }
  return false;
}

// ─── GET /api/moderation/queue ───────────────────────────────────────────────
// List pending items (recipes + comments) — Req 4.3, 15.1, 15.3

router.get('/queue', verifyToken, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const skip = (page - 1) * limit;

  try {
    const [recipes, recipeTotal] = await Promise.all([
      prisma.recipe.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          authorId: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.recipe.count({ where: { status: 'pending' } }),
    ]);

    const comments = await Comment.find({ status: 'pending' })
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const commentTotal = await Comment.countDocuments({ status: 'pending' });

    res.json({
      recipes: { items: recipes, total: recipeTotal },
      comments: { items: comments, total: commentTotal },
      page,
      limit,
    });
  } catch (err) {
    console.error('[moderation] queue error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch moderation queue.', retryable: true } });
  }
});

// ─── POST /api/moderation/:id/approve ────────────────────────────────────────
// Approve content — Req 4.4, 15.6, 5.6 (Meilisearch sync)

router.post('/:id/approve', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type = 'recipe' } = req.body; // 'recipe' | 'comment'

  try {
    if (type === 'comment') {
      const comment = await Comment.findByIdAndUpdate(
        id,
        { status: 'published' },
        { new: true }
      );
      if (!comment) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Comment not found.', retryable: false } });
        return;
      }

      // Notify author (Req 15.6)
      await createNotification({
        userId: comment.author_id,
        type: 'comment_approved',
        payload: { comment_id: String(comment._id) },
      });

      res.json({ message: 'Comment approved.', comment });
      return;
    }

    // Default: recipe
    const recipe = await prisma.recipe.update({
      where: { id },
      data: { status: 'published' },
      include: { region: true },
    });

    // Notify author (Req 4.4, 15.6)
    if (recipe.authorId) {
      await createNotification({
        userId: recipe.authorId,
        type: 'recipe_approved',
        payload: { recipe_id: recipe.id, title: recipe.title },
      });
    }

    // Task 5.17 — Sync to Meilisearch after approval (Req 5.6)
    try {
      const agg = await prisma.rating.aggregate({
        where: { recipeId: recipe.id },
        _avg: { value: true },
      });

      const ingredientsFlat = Array.isArray(recipe.ingredients)
        ? (recipe.ingredients as Record<string, unknown>[])
            .map((ing) => ing?.name ?? '')
            .filter(Boolean)
            .join(', ')
        : '';

      const meiliDoc = {
        id: recipe.id,
        title: recipe.title,
        description: null,
        ingredients_flat: ingredientsFlat,
        region_id: recipe.regionId,
        region_name: recipe.region?.name ?? null,
        dietary_tags: recipe.dietaryTags,
        prep_time_mins: recipe.prepTimeMins,
        cook_time_mins: recipe.cookTimeMins,
        status: recipe.status,
        average_rating: agg._avg.value ?? 0,
        created_at: recipe.createdAt.toISOString(),
      };

      await meiliClient.index(RECIPES_INDEX).addDocuments([meiliDoc], { primaryKey: 'id' });
    } catch (meiliErr) {
      // Non-fatal: log but don't fail the approval
      console.error('[moderation] Meilisearch sync error:', (meiliErr as Error).message);
    }

    res.json({ message: 'Recipe approved and published.', recipe });
  } catch (err) {
    console.error('[moderation] approve error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to approve content.', retryable: true } });
  }
});

// ─── POST /api/moderation/:id/reject ─────────────────────────────────────────
// Reject content — Req 4.5, 15.6

router.post('/:id/reject', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type = 'recipe', rejection_reason } = req.body;

  if (!rejection_reason || typeof rejection_reason !== 'string' || !rejection_reason.trim()) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'rejection_reason is required.', retryable: false } });
    return;
  }

  try {
    if (type === 'comment') {
      const comment = await Comment.findByIdAndUpdate(
        id,
        { status: 'removed' },
        { new: true }
      );
      if (!comment) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Comment not found.', retryable: false } });
        return;
      }

      // Notify author (Req 15.6)
      await createNotification({
        userId: comment.author_id,
        type: 'comment_rejected',
        payload: { comment_id: String(comment._id), reason: rejection_reason },
      });

      res.json({ message: 'Comment rejected.', comment });
      return;
    }

    // Default: recipe
    const recipe = await prisma.recipe.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: rejection_reason },
    });

    // Notify author (Req 4.5, 15.6)
    if (recipe.authorId) {
      await createNotification({
        userId: recipe.authorId,
        type: 'recipe_rejected',
        payload: { recipe_id: recipe.id, title: recipe.title, reason: rejection_reason },
      });
    }

    res.json({ message: 'Recipe rejected.', recipe });
  } catch (err) {
    console.error('[moderation] reject error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to reject content.', retryable: true } });
  }
});

// ─── POST /api/moderation/screen ─────────────────────────────────────────────
// Automated pre-screening endpoint (Req 15.2, 15.3)
// Called internally or by the recipe/comment creation flow to flag content.

router.post('/screen', verifyToken, async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'text is required.', retryable: false } });
    return;
  }

  const flagged = containsProhibitedKeywords(text);
  res.json({ flagged, message: flagged ? 'Content contains prohibited keywords and has been flagged for review.' : 'Content passed automated screening.' });
});

export default router;
