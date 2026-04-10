/**
 * Notifications router
 *
 * GET  /api/notifications              — list user's notifications (paginated, max 20)
 * PATCH /api/notifications/:id/read    — mark a notification as read
 * PATCH /api/notifications/preferences — update notification category preferences
 *
 * Tasks 12.3, 12.4 — Requirements: 17.1, 17.2
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyToken } from '../middleware/auth';
import type { NotificationType } from '../lib/notifications';

const router = Router();

// All notification routes require authentication
router.use(verifyToken);

// ─── GET /api/notifications ───────────────────────────────────────────────────
// List the authenticated user's notifications, paginated (max 20 per page).
// Query params: page (default 1)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const PAGE_SIZE = 20;

  try {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          type: true,
          payload: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    res.json({
      data: notifications,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    console.error('[notifications] GET /api/notifications error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch notifications.', retryable: true },
    });
  }
});

// ─── PATCH /api/notifications/preferences ────────────────────────────────────
// Update notification preferences for the authenticated user.
// Body: { new_follower: true, payment_failed: false, ... }
// Must be defined BEFORE /:id/read to avoid route collision.
router.patch('/preferences', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const updates = req.body as Record<string, unknown>;

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Body must be a JSON object of notification category toggles.', retryable: false },
    });
    return;
  }

  // Validate that all keys are valid NotificationType values and values are booleans
  const validTypes: NotificationType[] = [
    'recipe_approved',
    'recipe_rejected',
    'comment_approved',
    'comment_rejected',
    'new_follower',
    'post_liked',
    'post_commented',
    'subscription_activated',
    'subscription_cancelled',
    'payment_failed',
    'new_lesson',
  ];

  for (const [key, value] of Object.entries(updates)) {
    if (!validTypes.includes(key as NotificationType)) {
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Unknown notification type: "${key}". Valid types are: ${validTypes.join(', ')}.`,
          retryable: false,
        },
      });
      return;
    }
    if (typeof value !== 'boolean') {
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `Value for "${key}" must be a boolean.`,
          retryable: false,
        },
      });
      return;
    }
  }

  try {
    // Merge with existing preferences (partial update)
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    const currentPrefs = (existing?.notificationPreferences as Record<string, unknown>) ?? {};
    const merged = { ...currentPrefs, ...updates };

    await prisma.user.update({
      where: { id: userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { notificationPreferences: merged as any },
    });

    res.json({ data: merged });
  } catch (err) {
    console.error('[notifications] PATCH /api/notifications/preferences error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update notification preferences.', retryable: true },
    });
  }
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
// Mark a specific notification as read.
router.patch('/:id/read', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notification) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Notification not found.', retryable: false },
      });
      return;
    }

    if (notification.userId !== userId) {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You do not have permission to update this notification.', retryable: false },
      });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      select: { id: true, type: true, isRead: true, createdAt: true },
    });

    res.json({ data: updated });
  } catch (err) {
    console.error('[notifications] PATCH /api/notifications/:id/read error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to mark notification as read.', retryable: true },
    });
  }
});

export default router;
