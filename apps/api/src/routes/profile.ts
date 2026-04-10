/**
 * Profile routes
 * Mounts at /api/profile
 *
 * Tasks 15.1, 15.3, 15.4
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';
import { Follow } from '../models/Follow';
import { Post } from '../models/Post';

const router = Router();

/** Strip HTML tags and trim whitespace. */
function sanitize(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

// ─── GET /api/profile/leaderboard ────────────────────────────────────────────
// Real leaderboard based on recipe count and ratings

router.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const topAuthors = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        _count: {
          select: { recipes: true, ratings: true },
        },
      },
      orderBy: { recipes: { _count: 'desc' } },
      take: 20,
    });

    const leaders = topAuthors
      .filter(u => u._count.recipes > 0)
      .map((u, i) => ({
        rank: i + 1,
        userId: u.id,
        displayName: u.displayName || `Chef ${u.id.slice(0, 6)}`,
        avatarUrl: u.avatarUrl,
        recipeCount: u._count.recipes,
        ratingCount: u._count.ratings,
        points: u._count.recipes * 100 + u._count.ratings * 10,
      }));

    res.json({ leaders });
  } catch (err) {
    console.error('[profile] leaderboard error:', err);
    res.json({ leaders: [] });
  }
});

// ─── GET /api/profile/me ─────────────────────────────────────────────────────
// Get current user's own profile

router.get('/me', verifyToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        preferredLang: true,
        profileVisibility: true,
        isPremium: true,
        subscriptionStatus: true,
        trialStartDate: true,
        nextBillingDate: true,
        notificationPreferences: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error('[profile] me error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch profile.' } });
  }
});

// ─── GET /api/profile/:userId ─────────────────────────────────────────────────
// View user profile — no auth required for public profiles

router.get('/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Try to get requesterId from token if present
  let requesterId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const jwt = await import('jsonwebtoken');
      const payload = jwt.default.verify(authHeader.slice(7), process.env.JWT_SECRET || '') as { userId: string };
      requesterId = payload.userId;
    } catch { /* unauthenticated */ }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        profileVisibility: true,
        recipes: {
          where: { status: 'published' },
          select: { id: true, title: true, coverImageUrl: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        notifications: {
          where: {
            type: 'new_lesson',
          },
          select: { id: true, payload: true, createdAt: true },
        },
        ratings: {
          select: {
            recipe: {
              select: { id: true, title: true, coverImageUrl: true, regionId: true },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.', retryable: false } });
      return;
    }

    // Private profile check (Req 16.3, 16.4)
    if (user.profileVisibility === 'private' && requesterId !== userId) {
      let isFollower = false;
      try { isFollower = !!(await Follow.exists({ follower_id: requesterId, following_id: userId })); } catch { /* MongoDB unavailable */ }
      if (!isFollower) {
        res.status(403).json({ error: { code: 'PROFILE_PRIVATE', message: 'This profile is private.', retryable: false } });
        return;
      }
    }
    // Follower / following counts from MongoDB (Req 16.1)
    let followerCount = 0, followingCount = 0;
    try {
      [followerCount, followingCount] = await Promise.all([
        Follow.countDocuments({ following_id: userId }),
        Follow.countDocuments({ follower_id: userId }),
      ]);
    } catch { /* MongoDB unavailable - return 0 counts */ }

    // Social feed posts from MongoDB (Req 16.1)
    let posts: unknown[] = [];
    try {
      posts = await Post.find({ author_id: userId, status: 'published' }).sort({ created_at: -1 }).limit(20).lean();
    } catch { /* MongoDB unavailable */ }

    // Badges: notifications of type 'new_lesson' where payload.event = 'course_completed' (Req 16.1)
    const badges = user.notifications
      .filter((n: { id: string; payload: unknown; createdAt: Date }) => {
        const payload = n.payload as Record<string, unknown> | null;
        return payload?.event === 'course_completed';
      })
      .map((n: { id: string; payload: unknown; createdAt: Date }) => {
        const payload = n.payload as Record<string, unknown>;
        return { id: n.id, courseId: payload.courseId ?? null, earnedAt: n.createdAt };
      });

    // Saved recipes proxy: recipes the user has rated (Req 16.1)
    const savedRecipes = user.ratings.map((r: { recipe: { id: string; title: string; coverImageUrl: string | null; regionId: string | null } }) => r.recipe);

    res.json({
      profile: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        followerCount,
        followingCount,
        submittedRecipes: user.recipes,
        posts,
        badges,
        savedRecipes,
      },
    });
  } catch (err) {
    console.error('[profile] get profile error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch profile.', retryable: true } });
  }
});

// ─── PATCH /api/profile ───────────────────────────────────────────────────────
// Task 15.3 — update profile fields (Requirements: 16.2)

router.patch('/', verifyToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { displayName, avatarUrl, bio, preferredLang, profileVisibility } = req.body;

  const ALLOWED_LANGS = ['en', 'es', 'fr', 'hi', 'ar', 'pt', 'zh', 'ja', 'de', 'it'];
  const ALLOWED_VISIBILITY = ['public', 'private'];

  const updates: Record<string, unknown> = {};

  if (displayName !== undefined) {
    const name = sanitize(displayName);
    if (!name) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'displayName cannot be empty.', retryable: false } });
      return;
    }
    updates.displayName = name;
  }

  if (avatarUrl !== undefined) {
    updates.avatarUrl = sanitize(avatarUrl) || null;
  }

  if (bio !== undefined) {
    updates.bio = sanitize(bio) || null;
  }

  if (preferredLang !== undefined) {
    if (!ALLOWED_LANGS.includes(preferredLang)) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: `preferredLang must be one of: ${ALLOWED_LANGS.join(', ')}.`, retryable: false } });
      return;
    }
    updates.preferredLang = preferredLang;
  }

  if (profileVisibility !== undefined) {
    if (!ALLOWED_VISIBILITY.includes(profileVisibility)) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'profileVisibility must be "public" or "private".', retryable: false } });
      return;
    }
    updates.profileVisibility = profileVisibility;
  }

  if (Object.keys(updates).length === 0) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'No valid fields provided for update.', retryable: false } });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        preferredLang: true,
        profileVisibility: true,
      },
    });

    res.json({ profile: updated });
  } catch (err) {
    console.error('[profile] update profile error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update profile.', retryable: true } });
  }
});

// ─── GET /api/profile/:userId/passport ───────────────────────────────────────
// Task 15.4 — Culinary Passport (Requirements: 16.5)

router.get('/:userId/passport', verifyToken, async (req: Request, res: Response) => {
  const requesterId = req.user!.userId;
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileVisibility: true,
        ratings: {
          select: {
            recipe: {
              select: { regionId: true },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found.', retryable: false } });
      return;
    }

    // Private profile check
    if (user.profileVisibility === 'private' && requesterId !== userId) {
      let isFollower = false;
      try { isFollower = !!(await Follow.exists({ follower_id: requesterId, following_id: userId })); } catch { /* MongoDB unavailable */ }
      if (!isFollower) {
        res.status(403).json({ error: { code: 'PROFILE_PRIVATE', message: 'This profile is private.', retryable: false } });
        return;
      }
    }

    // Distinct region IDs from rated recipes (proxy for cooked/saved, Req 16.5)
    const regionIds = [
      ...new Set(
        user.ratings
          .map((r: { recipe: { regionId: string | null } }) => r.recipe.regionId)
          .filter((id: string | null): id is string => id !== null)
      ),
    ];

    res.json({ passport: { regionIds } });
  } catch (err) {
    console.error('[profile] passport error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch culinary passport.', retryable: true } });
  }
});

export default router;
