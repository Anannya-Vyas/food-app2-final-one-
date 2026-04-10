/**
 * Subscription routes — Razorpay subscription creation.
 * Mounts at /api/subscriptions
 *
 * Task 11.1 — Requirements: 13.4
 */

import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import { verifyToken } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured.');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ─── POST /api/subscriptions/create ──────────────────────────────────────────
// Task 11.1 — Initiate Razorpay subscription with autopay (Req 13.4)

router.post('/create', verifyToken, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const planId = process.env.RAZORPAY_PLAN_ID;
  if (!planId) {
    res.status(500).json({
      error: { code: 'CONFIGURATION_ERROR', message: 'Subscription plan is not configured.', retryable: false },
    });
    return;
  }

  // Fetch user to check current status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true, subscriptionStatus: true, subscriptionId: true },
  });

  if (!user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found.', retryable: false } });
    return;
  }

  // Already active — return existing subscription info
  if (user.subscriptionStatus === 'active' && user.subscriptionId) {
    res.status(409).json({
      error: {
        code: 'ALREADY_SUBSCRIBED',
        message: 'You already have an active subscription.',
        retryable: false,
      },
    });
    return;
  }

  let razorpay: Razorpay;
  try {
    razorpay = getRazorpayClient();
  } catch {
    res.status(500).json({
      error: { code: 'CONFIGURATION_ERROR', message: 'Payment service is not configured.', retryable: false },
    });
    return;
  }

  try {
    // Create Razorpay subscription with autopay enabled (Req 13.4)
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12, // 12 billing cycles (1 year); Razorpay requires this field
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: userId,
        email: user.email,
      },
    });

    // Persist the subscription_id on the user row so the webhook can look it up
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionId: subscription.id },
    });

    // Build the Razorpay hosted checkout URL
    const keyId = process.env.RAZORPAY_KEY_ID!;
    const checkoutUrl = `https://api.razorpay.com/v1/checkout/embedded?subscription_id=${subscription.id}&key=${keyId}`;

    res.status(201).json({
      subscription_id: subscription.id,
      checkout_url: checkoutUrl,
      status: subscription.status,
    });
  } catch (err) {
    console.error('[subscriptions/create] Razorpay error:', err);
    res.status(502).json({
      error: {
        code: 'PAYMENT_SERVICE_ERROR',
        message: 'Failed to create subscription. Please try again.',
        retryable: true,
      },
    });
  }
});

export default router;
