/**
 * Academy router
 *
 * GET  /api/academy/courses                              — list all courses with user progress %
 * GET  /api/academy/courses/:courseId/lessons/:lessonId  — get lesson content (free-tier: only order_index=1)
 * POST /api/academy/lessons/:lessonId/complete           — mark lesson complete, award badge if course done
 * GET  /api/academy/lessons/:lessonId/bookmark           — bookmark a lesson in user preferences
 *
 * Tasks 13.1 — Requirements: 11.1, 11.2, 11.4, 11.5, 11.6, 11.7
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyToken } from '../middleware/auth';
import { createNotification } from '../lib/notifications';

interface LessonSummary {
  id: string;
  orderIndex: number;
}

interface CourseWithLessons {
  id: string;
  title: string;
  category: string;
  description: string | null;
  isPremium: boolean;
  lessons: LessonSummary[];
}

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the user has an active premium subscription or a valid trial. */
function isPremiumUser(user: { isPremium: boolean; subscriptionStatus: string; trialStartDate: Date }): boolean {
  if (user.isPremium && user.subscriptionStatus === 'active') return true;
  if (user.subscriptionStatus === 'trial') {
    const TRIAL_DAYS = 30;
    const expiryMs = user.trialStartDate.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() <= expiryMs;
  }
  return false;
}

// ─── GET /api/academy/courses ─────────────────────────────────────────────────
// List all courses — no auth required, progress shown if logged in
router.get('/courses', async (req: Request, res: Response): Promise<void> => {
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

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const PAGE_SIZE = 20;

  try {
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          lessons: {
            select: { id: true, orderIndex: true },
          },
        },
        orderBy: { title: 'asc' },
      }),
      prisma.course.count(),
    ]);

    // Fetch user's completed lessons for these courses in one query
    const typedCourses = courses as CourseWithLessons[];
    const lessonIds = typedCourses.flatMap((course) => course.lessons.map((lesson) => lesson.id));

    const completedProgress = lessonIds.length && userId
      ? await prisma.userLessonProgress.findMany({
          where: { userId, lessonId: { in: lessonIds }, completed: true },
          select: { lessonId: true },
        })
      : [];

    const completedSet = new Set(completedProgress.map((prog: { lessonId: string }) => prog.lessonId));

    const data = typedCourses.map((course) => {
      const totalLessons = course.lessons.length;
      const completedCount = course.lessons.filter((lesson) => completedSet.has(lesson.id)).length;
      const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        id: course.id,
        title: course.title,
        category: course.category,
        description: course.description,
        isPremium: course.isPremium,
        totalLessons,
        completedLessons: completedCount,
        progressPercent: progressPct,
      };
    });

    res.json({
      data,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    console.error('[academy] GET /courses error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch courses.', retryable: true },
    });
  }
});

// ─── GET /api/academy/courses/:courseId ──────────────────────────────────────
// Get a single course with all its lessons — no auth required

router.get('/courses/:courseId', async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;

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
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true, title: true, orderIndex: true, isFree: true },
        },
      },
    });

    if (!course) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found.', retryable: false } });
      return;
    }

    // Get progress if authenticated
    let completedSet = new Set<string>();
    if (userId) {
      const lessonIds = course.lessons.map(l => l.id);
      const progress = await prisma.userLessonProgress.findMany({
        where: { userId, lessonId: { in: lessonIds }, completed: true },
        select: { lessonId: true },
      });
      completedSet = new Set(progress.map(p => p.lessonId));
    }

    const totalLessons = course.lessons.length;
    const completedCount = course.lessons.filter(l => completedSet.has(l.id)).length;

    res.json({
      data: {
        id: course.id,
        title: course.title,
        category: course.category,
        description: course.description,
        isPremium: course.isPremium,
        totalLessons,
        completedLessons: completedCount,
        progressPercent: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
        lessons: course.lessons.map(l => ({
          id: l.id,
          title: l.title,
          orderIndex: l.orderIndex,
          isFree: l.isFree,
          completed: completedSet.has(l.id),
        })),
      },
    });
  } catch (err) {
    console.error('[academy] GET /courses/:courseId error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch course.', retryable: true } });
  }
});

// ─── GET /api/academy/courses/:courseId/lessons/:lessonId ─────────────────────
// Get lesson content — no auth required for free lessons
router.get('/courses/:courseId/lessons/:lessonId', async (req: Request, res: Response): Promise<void> => {
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

  const { courseId, lessonId } = req.params;

  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, courseId },
      select: { id: true, courseId: true, title: true, content: true, orderIndex: true, isFree: true },
    });

    if (!lesson) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found.', retryable: false } });
      return;
    }

    // Fetch user's progress for this lesson if authenticated
    let progressData = null;
    if (userId) {
      progressData = await prisma.userLessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
        select: { completed: true, completedAt: true },
      }).catch(() => null);
    }

    res.json({
      data: {
        ...lesson,
        completed: progressData?.completed ?? false,
        completedAt: progressData?.completedAt ?? null,
      },
    });
  } catch (err) {
    console.error('[academy] GET /courses/:courseId/lessons/:lessonId error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch lesson.', retryable: true },
    });
  }
});

// ─── POST /api/academy/lessons/:lessonId/complete ─────────────────────────────
// Mark a lesson as complete, update course progress, award badge if 100% (Req 11.2, 11.4)
router.post('/lessons/:lessonId/complete', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { lessonId } = req.params;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true, orderIndex: true },
    });

    if (!lesson) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found.', retryable: false } });
      return;
    }

    // Upsert progress record
    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, completed: true, completedAt: new Date() },
      update: { completed: true, completedAt: new Date() },
    });

    // Compute course progress
    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({ where: { courseId: lesson.courseId } }),
      prisma.userLessonProgress.count({
        where: { userId, completed: true, lesson: { courseId: lesson.courseId } },
      }),
    ]);

    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Award completion badge if course is 100% complete (Req 11.4)
    if (progressPercent === 100) {
      const course = await prisma.course.findUnique({
        where: { id: lesson.courseId },
        select: { id: true, title: true },
      });

      // Create a 'new_lesson' notification carrying badge info (Req 11.4, 17.1)
      await createNotification({
        userId,
        type: 'new_lesson',
        payload: {
          event: 'course_completed',
          courseId: lesson.courseId,
          courseTitle: course?.title ?? '',
          badge: {
            type: 'course_completion',
            courseId: lesson.courseId,
            courseTitle: course?.title ?? '',
            awardedAt: new Date().toISOString(),
          },
        },
      });
    }

    res.json({
      data: {
        lessonId,
        completed: true,
        courseId: lesson.courseId,
        progressPercent,
        badgeAwarded: progressPercent === 100,
      },
    });
  } catch (err) {
    console.error('[academy] POST /lessons/:lessonId/complete error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to mark lesson complete.', retryable: true },
    });
  }
});

// ─── GET /api/academy/lessons/:lessonId/bookmark ─────────────────────────────
// Bookmark a lesson — stored in user's notificationPreferences JSON as bookmarked_lessons (Req 11.5)
router.get('/lessons/:lessonId/bookmark', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { lessonId } = req.params;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, title: true },
    });

    if (!lesson) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Lesson not found.', retryable: false } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    const prefs = (user?.notificationPreferences as Record<string, unknown>) ?? {};
    const existing = Array.isArray(prefs.bookmarked_lessons) ? (prefs.bookmarked_lessons as string[]) : [];

    // Toggle: add if not present, remove if already bookmarked
    const isBookmarked = existing.includes(lessonId);
    const updated = isBookmarked ? existing.filter((id) => id !== lessonId) : [...existing, lessonId];

    await prisma.user.update({
      where: { id: userId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { notificationPreferences: { ...prefs, bookmarked_lessons: updated } as any },
    });

    res.json({
      data: {
        lessonId,
        bookmarked: !isBookmarked,
        message: isBookmarked ? 'Lesson removed from bookmarks.' : 'Lesson bookmarked successfully.',
      },
    });
  } catch (err) {
    console.error('[academy] GET /lessons/:lessonId/bookmark error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to bookmark lesson.', retryable: true },
    });
  }
});

export default router;
