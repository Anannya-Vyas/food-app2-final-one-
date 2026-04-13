/**
 * Recipe routes — CRUD, ratings, comments.
 * Mounts at /api/recipes
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';
import { Comment } from '../models/Comment';
import { translateText, translateJsonArray } from '../lib/translate';

const router = Router();

// ─── GET /api/recipes ─────────────────────────────────────────────────────────
// List published recipes with pagination

router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const regionId = req.query.region ? String(req.query.region) : undefined;
  const dietaryTag = req.query.dietary_tag ? String(req.query.dietary_tag) : undefined;

  try {
    const where: Record<string, unknown> = { status: 'published' };
    if (regionId) where.regionId = regionId;
    if (dietaryTag) where.dietaryTags = { has: dietaryTag };

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: { region: { select: { id: true, name: true, country: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recipe.count({ where }),
    ]);

    // Compute average ratings
    const recipeIds = recipes.map(r => r.id);
    const ratings = recipeIds.length ? await prisma.rating.groupBy({
      by: ['recipeId'],
      where: { recipeId: { in: recipeIds } },
      _avg: { value: true },
      _count: true,
    }) : [];
    const ratingMap = new Map(ratings.map(r => [r.recipeId, { avg: (r._avg as any).value, count: (r as any)._count }]));

    const data = recipes.map(r => ({
      id: r.id,
      title: r.title,
      coverImageUrl: r.coverImageUrl,
      region: r.region,
      isFamilyRecipe: r.isFamilyRecipe,
      flavorSpectrum: r.flavorSpectrum,
      prepTimeMins: r.prepTimeMins,
      dietaryTags: r.dietaryTags,
      averageRating: (ratingMap.get(r.id) as any)?.avg ?? null,
      ratingCount: (ratingMap.get(r.id) as any)?.count ?? 0,
    }));

    res.json({ recipes: data, total, page, limit });
  } catch (err) {
    console.error('[recipes] list error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch recipes.', retryable: true } });
  }
});

// ─── Input sanitization ──────────────────────────────────────────────────────

/** Strip HTML tags and trim whitespace from a string. */
function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
}

/** Sanitize all string fields in an object (shallow). */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'string' ? sanitizeText(value) : value;
  }
  return result;
}

/** Sanitize an array of ingredient objects. */
function sanitizeIngredients(ingredients: unknown[]): Record<string, unknown>[] {
  return ingredients.map((ing) => {
    if (typeof ing === 'object' && ing !== null) {
      return sanitizeObject(ing as Record<string, unknown>);
    }
    return ing as Record<string, unknown>;
  });
}

/** Sanitize an array of step objects. */
function sanitizeSteps(steps: unknown[]): Record<string, unknown>[] {
  return steps.map((step) => {
    if (typeof step === 'object' && step !== null) {
      return sanitizeObject(step as Record<string, unknown>);
    }
    return step as Record<string, unknown>;
  });
}

// ─── POST /api/recipes ───────────────────────────────────────────────────────
// Create recipe — no auth required, anyone can publish

router.post('/', async (req: Request, res: Response) => {
  // Use authenticated userId if available, otherwise use a fixed anonymous UUID
  const ANON_USER_ID = '00000000-0000-0000-0000-000000000001';
  const userId = req.user?.userId || ANON_USER_ID;
  const {
    title,
    region_id,
    ingredients,
    steps,
    cover_image_url,
    prep_time_mins,
    cook_time_mins,
    servings,
    dietary_tags,
    flavor_spectrum,
    is_family_recipe,
  } = req.body;

  // Validate required fields
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'title is required.', retryable: false } });
    return;
  }
  if (!region_id || typeof region_id !== 'string') {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'region_id is required.', retryable: false } });
    return;
  }
  if (!Array.isArray(ingredients) || ingredients.length < 3) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'At least 3 ingredients are required.', retryable: false } });
    return;
  }
  if (!Array.isArray(steps) || steps.length < 2) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'At least 2 preparation steps are required.', retryable: false } });
    return;
  }
  if (!cover_image_url || typeof cover_image_url !== 'string' || !cover_image_url.trim()) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'cover_image_url is required.', retryable: false } });
    return;
  }

  // Sanitize all text inputs (Req 19.4)
  const sanitizedTitle = sanitizeText(title);
  const sanitizedCoverImageUrl = sanitizeText(cover_image_url);
  const sanitizedIngredients = sanitizeIngredients(ingredients);
  const sanitizedSteps = sanitizeSteps(steps);
  const sanitizedDietaryTags = Array.isArray(dietary_tags)
    ? dietary_tags.map((t: unknown) => sanitizeText(String(t)))
    : [];

  // Resolve region — accept either a UUID or a region name string
  let resolvedRegionId: string | null = null;
  if (region_id) {
    // Check if it looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(region_id)) {
      resolvedRegionId = region_id;
    } else {
      // Treat as region name — find or create
      const existing = await prisma.region.findFirst({ where: { name: { equals: region_id, mode: 'insensitive' } } });
      if (existing) {
        resolvedRegionId = existing.id;
      } else {
        const created = await prisma.region.create({ data: { name: region_id, country: region_id } });
        resolvedRegionId = created.id;
      }
    }
  }

  try {
    const recipe = await prisma.recipe.create({
      data: {
        title: sanitizedTitle,
        authorId: userId,
        regionId: resolvedRegionId,
        ingredients: sanitizedIngredients as object[],
        steps: sanitizedSteps as object[],
        coverImageUrl: sanitizedCoverImageUrl,
        prepTimeMins: prep_time_mins ? Number(prep_time_mins) : null,
        cookTimeMins: cook_time_mins ? Number(cook_time_mins) : null,
        servings: servings ? Number(servings) : null,
        dietaryTags: sanitizedDietaryTags,
        flavorSpectrum: flavor_spectrum ?? null,
        isFamilyRecipe: Boolean(is_family_recipe),
        status: 'published', // publish directly — no moderation needed
      },
    });

    res.status(201).json({ recipe });
  } catch (err) {
    console.error('[recipes] create error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create recipe.', retryable: true } });
  }
});

// ─── GET /api/recipes/:id ────────────────────────────────────────────────────
// Task 5.4 — fetch recipe with translation (Requirements: 2.3, 2.4, 14.3, 14.5)

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  // Determine user's preferred language (from JWT if authenticated, else 'en')
  let preferredLang = 'en';
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const jwt = await import('jsonwebtoken');
      const payload = jwt.default.verify(
        authHeader.slice(7),
        process.env.JWT_SECRET || ''
      ) as { userId: string };
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { preferredLang: true } });
      if (user?.preferredLang) preferredLang = user.preferredLang;
    } catch {
      // unauthenticated or invalid token — use default 'en'
    }
  }

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        region: true,
        ratings: { select: { value: true } },
      },
    });

    if (!recipe) {
      res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'The requested recipe does not exist.', retryable: false } });
      return;
    }

    // Compute average rating
    const avgRating =
      recipe.ratings.length > 0
        ? Math.round((recipe.ratings.reduce((sum: number, r: { value: number }) => sum + r.value, 0) / recipe.ratings.length) * 10) / 10
        : null;

    const baseRecipe = {
      id: recipe.id,
      title: recipe.title,
      region_id: recipe.regionId,
      region: recipe.region,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      prep_time_mins: recipe.prepTimeMins,
      cook_time_mins: recipe.cookTimeMins,
      servings: recipe.servings,
      dietary_tags: recipe.dietaryTags,
      flavor_spectrum: recipe.flavorSpectrum,
      cover_image_url: recipe.coverImageUrl,
      is_family_recipe: recipe.isFamilyRecipe,
      status: recipe.status,
      author_id: recipe.authorId,
      average_rating: avgRating,
      rating_count: recipe.ratings.length,
      created_at: recipe.createdAt,
    };

    // If preferred language is English, no translation needed
    if (preferredLang === 'en') {
      res.json({ recipe: baseRecipe, translation: null, translation_fallback: false });
      return;
    }

    // Check translation cache (Req 14.3)
    const cached = await prisma.recipeTranslation.findUnique({
      where: { recipeId_language: { recipeId: id, language: preferredLang } },
    });

    if (cached) {
      res.json({
        recipe: baseRecipe,
        translation: {
          language: preferredLang,
          title: cached.title,
          ingredients: cached.ingredients,
          steps: cached.steps,
        },
        translation_fallback: false,
      });
      return;
    }

    // Cache miss — call LibreTranslate (Req 2.3, 14.3)
    let translationFallback = false;
    const titleResult = await translateText(recipe.title, preferredLang);
    if (titleResult.fallback) translationFallback = true;

    const ingredientsArray = Array.isArray(recipe.ingredients) ? (recipe.ingredients as Record<string, unknown>[]) : [];
    const stepsArray = Array.isArray(recipe.steps) ? (recipe.steps as Record<string, unknown>[]) : [];

    const { translated: translatedIngredients, fallback: ingFallback } = await translateJsonArray(
      ingredientsArray,
      'name',
      preferredLang
    );
    const { translated: translatedSteps, fallback: stepFallback } = await translateJsonArray(
      stepsArray,
      'text',
      preferredLang
    );

    if (ingFallback || stepFallback) translationFallback = true;

    // Cache the translation result (Req 14.3) — only if not a fallback
    if (!translationFallback) {
      try {
        await prisma.recipeTranslation.upsert({
          where: { recipeId_language: { recipeId: id, language: preferredLang } },
          create: {
            recipeId: id,
            language: preferredLang,
            title: titleResult.translatedText,
            ingredients: translatedIngredients as object[],
            steps: translatedSteps as object[],
          },
          update: {
            title: titleResult.translatedText,
            ingredients: translatedIngredients as object[],
            steps: translatedSteps as object[],
          },
        });
      } catch (cacheErr) {
        console.error('[recipes] translation cache write error:', cacheErr);
      }
    }

    res.json({
      recipe: baseRecipe,
      translation: {
        language: preferredLang,
        title: titleResult.translatedText,
        ingredients: translatedIngredients,
        steps: translatedSteps,
      },
      translation_fallback: translationFallback,
      // Req 14.5: show banner when LibreTranslate is unavailable
      ...(translationFallback && {
        banner: 'Translation is temporarily unavailable. Showing content in English.',
      }),
    });
  } catch (err) {
    console.error('[recipes] fetch error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch recipe.', retryable: true } });
  }
});

// ─── PUT /api/recipes/:id ────────────────────────────────────────────────────
// Task 5.6 — update recipe with ownership check (Requirements: 4.7)

router.put('/:id', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const existing = await prisma.recipe.findUnique({ where: { id }, select: { authorId: true } });
    if (!existing) {
      res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found.', retryable: false } });
      return;
    }
    if (existing.authorId !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to edit this recipe.', retryable: false } });
      return;
    }

    const {
      title,
      region_id,
      ingredients,
      steps,
      cover_image_url,
      prep_time_mins,
      cook_time_mins,
      servings,
      dietary_tags,
      flavor_spectrum,
      is_family_recipe,
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = sanitizeText(title);
    if (region_id !== undefined) updateData.regionId = region_id;
    if (ingredients !== undefined) updateData.ingredients = sanitizeIngredients(ingredients);
    if (steps !== undefined) updateData.steps = sanitizeSteps(steps);
    if (cover_image_url !== undefined) updateData.coverImageUrl = sanitizeText(cover_image_url);
    if (prep_time_mins !== undefined) updateData.prepTimeMins = Number(prep_time_mins);
    if (cook_time_mins !== undefined) updateData.cookTimeMins = Number(cook_time_mins);
    if (servings !== undefined) updateData.servings = Number(servings);
    if (dietary_tags !== undefined) updateData.dietaryTags = (dietary_tags as unknown[]).map((t) => sanitizeText(String(t)));
    if (flavor_spectrum !== undefined) updateData.flavorSpectrum = flavor_spectrum;
    if (is_family_recipe !== undefined) updateData.isFamilyRecipe = Boolean(is_family_recipe);

    const updated = await prisma.recipe.update({ where: { id }, data: updateData });
    res.json({ recipe: updated });
  } catch (err) {
    console.error('[recipes] update error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update recipe.', retryable: true } });
  }
});

// ─── DELETE /api/recipes/:id ─────────────────────────────────────────────────
// Task 5.6 — delete recipe with ownership check (Requirements: 4.7)

router.delete('/:id', verifyToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const existing = await prisma.recipe.findUnique({ where: { id }, select: { authorId: true } });
    if (!existing) {
      res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found.', retryable: false } });
      return;
    }
    if (existing.authorId !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this recipe.', retryable: false } });
      return;
    }

    await prisma.recipe.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error('[recipes] delete error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete recipe.', retryable: true } });
  }
});

// ─── POST /api/recipes/:id/ratings ───────────────────────────────────────────
// Task 5.12 — upsert rating (Requirements: 6.1, 6.7)

router.post('/:id/ratings', async (req: Request, res: Response) => {
  const { id: recipeId } = req.params;
  const userId = req.user?.userId;
  const { value } = req.body;

  const ratingValue = Number(value);
  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Rating value must be an integer between 1 and 5.', retryable: false } });
    return;
  }

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
    if (!recipe) {
      res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found.', retryable: false } });
      return;
    }

    // If user is authenticated, upsert their rating
    if (userId) {
      await prisma.$executeRaw`
        INSERT INTO ratings (id, user_id, recipe_id, value, created_at, updated_at)
        VALUES (gen_random_uuid(), ${userId}::uuid, ${recipeId}::uuid, ${ratingValue}::smallint, NOW(), NOW())
        ON CONFLICT (user_id, recipe_id)
        DO UPDATE SET value = ${ratingValue}::smallint, updated_at = NOW()
      `;
    } else {
      // Anonymous rating — just create a new one with a generated UUID
      await prisma.$executeRaw`
        INSERT INTO ratings (id, user_id, recipe_id, value, created_at, updated_at)
        VALUES (gen_random_uuid(), gen_random_uuid(), ${recipeId}::uuid, ${ratingValue}::smallint, NOW(), NOW())
      `;
    }

    const agg = await prisma.rating.aggregate({ where: { recipeId }, _avg: { value: true }, _count: true });

    res.status(200).json({
      average_rating: agg._avg.value !== null ? Math.round(agg._avg.value * 10) / 10 : null,
      rating_count: agg._count,
    });
  } catch (err) {
    console.error('[recipes] rating error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to submit rating.', retryable: true } });
  }
});

// ─── POST /api/recipes/:id/comments ──────────────────────────────────────────
// Task 5.15 — create comment (Requirements: 6.3, 6.4, 6.5, 6.6)

router.post('/:id/comments', async (req: Request, res: Response) => {
  // No auth required — anyone can comment
  const userId = req.user?.userId || 'anonymous';
  const { id: recipeId } = req.params;
  const { text, video_url } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Comment text is required.', retryable: false } });
    return;
  }
  if (text.length > 2000) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Comment text must not exceed 2000 characters.', retryable: false } });
    return;
  }

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
    if (!recipe) {
      res.status(404).json({ error: { code: 'RECIPE_NOT_FOUND', message: 'Recipe not found.', retryable: false } });
      return;
    }

    // Comments are stored in MongoDB (Req 6.3, 6.5)
    // post_id is required by the schema — use a placeholder ObjectId for recipe comments
    const { Types } = await import('mongoose');
    const comment = await Comment.create({
      post_id: new Types.ObjectId(), // placeholder for recipe-level comments
      recipe_id: recipeId,
      author_id: userId,
      text: sanitizeText(text),
      video_url: video_url ? sanitizeText(video_url) : undefined,
      status: 'published', // publish directly — no moderation needed
    });

    res.status(201).json({ comment });
  } catch (err) {
    console.error('[recipes] comment create error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to submit comment.', retryable: true } });
  }
});

// ─── GET /api/recipes/:id/comments ───────────────────────────────────────────
// Task 5.15 — list published comments sorted by created_at DESC (Requirements: 6.4)

router.get('/:id/comments', async (req: Request, res: Response) => {
  const { id: recipeId } = req.params;
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));

  try {
    const comments = await Comment.find({ recipe_id: recipeId, status: { $in: ['published', 'pending'] } })
      .sort({ created_at: -1 }) // most recent first (Req 6.4)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ comments, page, limit });
  } catch (err) {
    console.error('[recipes] comments fetch error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch comments.', retryable: true } });
  }
});

// ─── DELETE /api/recipes/:id/comments/:commentId ─────────────────────────────
// Task 5.15 — delete own comment (Requirements: 6.6)

router.delete('/:id/comments/:commentId', verifyToken, async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.userId;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found.', retryable: false } });
      return;
    }
    if (comment.author_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only delete your own comments.', retryable: false } });
      return;
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(204).send();
  } catch (err) {
    console.error('[recipes] comment delete error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete comment.', retryable: true } });
  }
});

export default router;
