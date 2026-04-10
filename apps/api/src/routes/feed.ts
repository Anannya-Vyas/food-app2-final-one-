/**
 * Social Feed routes
 * Mounts at /api/feed
 *
 * Tasks 8.1, 8.2, 8.4, 8.6, 8.8
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7
 */

import { Router, Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { Follow } from '../models/Follow';
import mongoose from 'mongoose';

const router = Router();

const PAGE_LIMIT = 20;
const VIDEO_MAX_BYTES = 200 * 1024 * 1024; // 200 MB

/** Returns true if MongoDB is connected */
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/** Middleware: return 503 if MongoDB is not available */
function requireMongo(req: Request, res: Response, next: () => void) {
  if (!isMongoConnected()) {
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Social feed is temporarily unavailable. Please try again later.', retryable: true } });
    return;
  }
  next();
}

/** Strip HTML tags and trim whitespace. */
function sanitize(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

// ─── POST /api/feed/posts ─────────────────────────────────────────────────────
// No auth required — anyone can post

router.post('/posts', requireMongo, async (req: Request, res: Response) => {
  const userId = req.user?.userId || 'anonymous';
  const { caption, media, recipe_tags } = req.body;

  // Validate caption (Req 7.2)
  if (!caption || typeof caption !== 'string' || !caption.trim()) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'caption is required.', retryable: false } });
    return;
  }
  if (caption.length > 500) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'caption must not exceed 500 characters.', retryable: false } });
    return;
  }

  // Validate media array (Req 7.2)
  const mediaItems: { type: 'image' | 'video'; url: string; size_bytes: number }[] = [];
  if (media !== undefined) {
    if (!Array.isArray(media)) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'media must be an array.', retryable: false } });
      return;
    }

    const images = media.filter((m: { type: string }) => m.type === 'image');
    const videos = media.filter((m: { type: string }) => m.type === 'video');

    if (images.length > 10) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'A post may contain at most 10 images.', retryable: false } });
      return;
    }
    if (videos.length > 1) {
      res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'A post may contain at most one video.', retryable: false } });
      return;
    }

    for (const item of media) {
      if (!item.url || typeof item.url !== 'string') {
        res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Each media item must have a url.', retryable: false } });
        return;
      }
      if (item.type === 'video' && typeof item.size_bytes === 'number' && item.size_bytes > VIDEO_MAX_BYTES) {
        res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Video must not exceed 200 MB.', retryable: false } });
        return;
      }
      mediaItems.push({
        type: item.type,
        url: sanitize(item.url),
        size_bytes: Number(item.size_bytes) || 0,
      });
    }
  }

  const sanitizedCaption = sanitize(caption);
  const sanitizedTags = Array.isArray(recipe_tags)
    ? recipe_tags.map((t: unknown) => sanitize(String(t)))
    : [];

  try {
    const post = await Post.create({
      author_id: userId,
      caption: sanitizedCaption,
      media: mediaItems,
      recipe_tags: sanitizedTags,
      status: 'published', // publish directly — no moderation
    });

    res.status(201).json({ post });
  } catch (err) {
    console.error('[feed] create post error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create post.', retryable: true } });
  }
});

// ─── GET /api/feed ────────────────────────────────────────────────────────────
// Personal feed — no auth required, shows all published posts if not logged in

router.get('/', requireMongo, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));

  // Try to get userId from token if present
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const jwt = await import('jsonwebtoken');
      const payload = jwt.default.verify(authHeader.slice(7), process.env.JWT_SECRET || '') as { userId: string };
      userId = payload.userId;
    } catch { /* unauthenticated */ }
  }

  try {
    let posts;
    if (userId) {
      // Authenticated: show posts from followed users
      const follows = await Follow.find({ follower_id: userId }).select('following_id').lean();
      const followingIds = follows.map(f => f.following_id);
      if (followingIds.length === 0) {
        // Not following anyone — show all published posts
        posts = await Post.find({ status: 'published' }).sort({ created_at: -1 }).skip((page - 1) * PAGE_LIMIT).limit(PAGE_LIMIT).lean();
      } else {
        posts = await Post.find({ author_id: { $in: followingIds }, status: 'published' }).sort({ created_at: -1 }).skip((page - 1) * PAGE_LIMIT).limit(PAGE_LIMIT).lean();
      }
    } else {
      // Not logged in — show all published posts
      posts = await Post.find({ status: 'published' }).sort({ created_at: -1 }).skip((page - 1) * PAGE_LIMIT).limit(PAGE_LIMIT).lean();
    }

    res.json({ posts, page, limit: PAGE_LIMIT });
  } catch (err) {
    console.error('[feed] personal feed error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch feed.', retryable: true } });
  }
});

// ─── POST /api/feed/follow/:userId ────────────────────────────────────────────
// Task 8.4 — follow a user (Requirements: 7.4)

router.post('/follow/:userId', verifyToken, requireMongo, async (req: Request, res: Response) => {
  const followerId = req.user!.userId;
  const { userId: followingId } = req.params;

  if (followerId === followingId) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'You cannot follow yourself.', retryable: false } });
    return;
  }

  try {
    await Follow.create({ follower_id: followerId, following_id: followingId });
    res.status(201).json({ message: 'Followed successfully.' });
  } catch (err: unknown) {
    // Duplicate key — already following
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
      res.status(409).json({ error: { code: 'ALREADY_FOLLOWING', message: 'You are already following this user.', retryable: false } });
      return;
    }
    console.error('[feed] follow error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to follow user.', retryable: true } });
  }
});

// ─── DELETE /api/feed/follow/:userId ─────────────────────────────────────────
// Task 8.4 — unfollow a user (Requirements: 7.4)

router.delete('/follow/:userId', verifyToken, requireMongo, async (req: Request, res: Response) => {
  const followerId = req.user!.userId;
  const { userId: followingId } = req.params;

  try {
    const result = await Follow.findOneAndDelete({ follower_id: followerId, following_id: followingId });
    if (!result) {
      res.status(404).json({ error: { code: 'NOT_FOLLOWING', message: 'You are not following this user.', retryable: false } });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('[feed] unfollow error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to unfollow user.', retryable: true } });
  }
});

// ─── GET /api/feed/discover ───────────────────────────────────────────────────
// Task 8.6 — trending posts (Requirements: 7.6)

router.get('/discover', requireMongo, async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));

  try {
    const posts = await Post.aggregate([
      { $match: { status: 'published' } },
      {
        $addFields: {
          engagement_score: { $add: ['$likes_count', '$comments_count', '$shares_count'] },
        },
      },
      { $sort: { engagement_score: -1, created_at: -1 } },
      { $skip: (page - 1) * PAGE_LIMIT },
      { $limit: PAGE_LIMIT },
    ]);

    res.json({ posts, page, limit: PAGE_LIMIT });
  } catch (err) {
    console.error('[feed] discover error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch discover feed.', retryable: true } });
  }
});

// ─── POST /api/feed/posts/:id/like ────────────────────────────────────────────
// Task 8.8 — like a post (Requirements: 7.3)

router.post('/posts/:id/like', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { likes_count: 1 } },
      { new: true }
    );
    if (!post) {
      res.status(404).json({ error: { code: 'POST_NOT_FOUND', message: 'Post not found.', retryable: false } });
      return;
    }
    res.json({ likes_count: post.likes_count });
  } catch (err) {
    console.error('[feed] like error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to like post.', retryable: true } });
  }
});

// ─── POST /api/feed/posts/:id/comments ───────────────────────────────────────
// Task 8.8 — comment on a post (Requirements: 7.3)

router.post('/posts/:id/comments', verifyToken, async (req: Request, res: Response) => {
  const { id: postId } = req.params;
  const userId = req.user!.userId;
  const { text } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'text is required.', retryable: false } });
    return;
  }
  if (text.length > 2000) {
    res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Comment text must not exceed 2000 characters.', retryable: false } });
    return;
  }

  try {
    const { Types } = await import('mongoose');

    const postObjectId = new Types.ObjectId(postId);
    const post = await Post.findById(postObjectId);
    if (!post) {
      res.status(404).json({ error: { code: 'POST_NOT_FOUND', message: 'Post not found.', retryable: false } });
      return;
    }

    const comment = await Comment.create({
      post_id: postObjectId,
      author_id: userId,
      text: sanitize(text),
      status: 'pending',
    });

    // Increment comments_count on the post
    await Post.findByIdAndUpdate(postObjectId, { $inc: { comments_count: 1 } });

    res.status(201).json({ comment });
  } catch (err) {
    console.error('[feed] comment error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to add comment.', retryable: true } });
  }
});

// ─── POST /api/feed/posts/:id/share ──────────────────────────────────────────
// Task 8.8 — share a post (Requirements: 7.3)

router.post('/posts/:id/share', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { shares_count: 1 } },
      { new: true }
    );
    if (!post) {
      res.status(404).json({ error: { code: 'POST_NOT_FOUND', message: 'Post not found.', retryable: false } });
      return;
    }
    res.json({ shares_count: post.shares_count });
  } catch (err) {
    console.error('[feed] share error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to share post.', retryable: true } });
  }
});

export default router;
