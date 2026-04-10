/**
 * Paywall guard middleware.
 *
 * Checks whether the authenticated user's trial has expired and they have no
 * active subscription. Returns HTTP 402 (Payment Required) if access should
 * be blocked.
 *
 * Task 11.5 — Requirements: 13.2, 13.11
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const TRIAL_DURATION_DAYS = 30;

/**
 * Returns true if the user's 30-day trial has expired.
 */
function isTrialExpired(trialStartDate: Date): boolean {
  const expiryMs = trialStartDate.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() > expiryMs;
}

/**
 * `paywallGuard` — Express middleware that blocks access to premium features
 * when the user's trial has expired and they do not have an active subscription.
 *
 * Must be used after `verifyToken` so that `req.user` is populated.
 *
 * Returns 402 Payment Required when:
 *   - trial_start_date is more than 30 days ago, AND
 *   - subscription_status is not "active"
 */
export async function paywallGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    // verifyToken should have already rejected unauthenticated requests with 401.
    // Guard defensively here.
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.', retryable: false },
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        isPremium: true,
        trialStartDate: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'User not found.', retryable: false },
      });
      return;
    }

    // Active subscribers always pass through (Req 13.11)
    if (user.subscriptionStatus === 'active' && user.isPremium) {
      next();
      return;
    }

    // Trial users pass through while the trial is still valid (Req 13.2)
    if (user.subscriptionStatus === 'trial' && !isTrialExpired(user.trialStartDate)) {
      next();
      return;
    }

    // Trial expired or subscription cancelled/failed — block with 402
    res.status(402).json({
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message:
          'Your free trial has expired. Subscribe to unlock premium features like unlimited AI Recipe Fixer queries, offline Audio Guides, and full Culinary Academy access.',
        retryable: false,
        subscription_required: true,
      },
    });
  } catch (err) {
    console.error('[paywallGuard] DB error:', err);
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.', retryable: true },
    });
  }
}
