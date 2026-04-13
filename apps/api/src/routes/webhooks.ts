/**
 * Razorpay webhook handler.
 * Mounts at /api/webhooks
 *
 * IMPORTANT: This router must be mounted BEFORE express.json() in index.ts
 * so that the raw body is available for HMAC-SHA256 signature verification.
 *
 * Task 11.2 — Requirements: 13.5, 13.6, 13.7, 13.8, 13.9, 19.5
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { createNotification } from '../lib/notifications';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Verify Razorpay HMAC-SHA256 webhook signature (Req 13.8, 13.9, 19.5) */
function verifyWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
}

/** Resolve user ID from a Razorpay subscription ID stored on the user row. */
async function getUserBySubscriptionId(subscriptionId: string) {
  return prisma.user.findFirst({
    where: { subscriptionId },
    select: { id: true, email: true, subscriptionStatus: true },
  });
}

/** Record a subscription event for audit / idempotency. */
async function recordEvent(
  userId: string | null,
  eventType: string,
  razorpayEventId: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  try {
    await prisma.subscriptionEvent.create({
      data: {
        userId,
        eventType,
        razorpayEventId,
        payload: payload as any,
      },
    });
    return true;
  } catch (err: unknown) {
    // Unique constraint violation → duplicate event, already processed
    const msg = (err as Error).message ?? '';
    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      return false; // idempotency: skip
    }
    throw err;
  }
}

// ─── POST /api/webhooks/razorpay ─────────────────────────────────────────────
// Task 11.2 — Razorpay webhook handler

router.post(
  '/razorpay',
  // express.raw() is applied per-route here so the global express.json() doesn't
  // consume the body before we can compute the HMAC.
  (req, _res, next) => {
    // If body is already a Buffer (mounted with express.raw upstream), pass through.
    // Otherwise apply express.raw inline.
    if (Buffer.isBuffer(req.body)) {
      next();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('express').raw({ type: 'application/json' })(req, _res, next);
    }
  },
  async (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[webhooks/razorpay] RAZORPAY_WEBHOOK_SECRET is not set');
      res.status(500).json({ error: { code: 'CONFIGURATION_ERROR', message: 'Webhook secret not configured.' } });
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    if (!signature) {
      console.warn('[webhooks/razorpay] Missing x-razorpay-signature header');
      res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Missing webhook signature.' } });
      return;
    }

    const rawBody: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

    // Verify HMAC-SHA256 signature (Req 13.8, 13.9, 19.5)
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.warn('[webhooks/razorpay] Invalid signature — rejecting request', {
        timestamp: new Date().toISOString(),
        ip: req.ip,
      });
      res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed.' } });
      return;
    }

    let event: {
      entity: string;
      event: string;
      payload?: {
        subscription?: { entity?: { id?: string; status?: string; current_end?: number } };
        payment?: { entity?: { id?: string; subscription_id?: string; amount?: number; currency?: string } };
      };
    };

    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'Could not parse webhook payload.' } });
      return;
    }

    const eventType = event.event;
    // Razorpay sends a unique event ID in the payload entity; fall back to a hash
    const razorpayEventId =
      (event as unknown as Record<string, unknown>)['id'] as string | undefined
      ?? crypto.createHash('sha256').update(rawBody).digest('hex');

    const subscriptionEntity = event.payload?.subscription?.entity;
    const paymentEntity = event.payload?.payment?.entity;

    // Resolve subscription ID from the event
    const subscriptionId =
      subscriptionEntity?.id ??
      paymentEntity?.subscription_id;

    // Look up the user associated with this subscription
    const user = subscriptionId ? await getUserBySubscriptionId(subscriptionId) : null;

    // Idempotency: record the event (returns false if already processed)
    let isNew: boolean;
    try {
      isNew = await recordEvent(
        user?.id ?? null,
        eventType,
        razorpayEventId,
        event as unknown as Record<string, unknown>
      );
    } catch (err) {
      console.error('[webhooks/razorpay] Failed to record event:', err);
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to record event.' } });
      return;
    }

    if (!isNew) {
      // Duplicate delivery — already processed, return 200 to stop Razorpay retries
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    if (!user) {
      // Unknown subscription — log and acknowledge so Razorpay doesn't keep retrying
      console.warn('[webhooks/razorpay] No user found for subscription', subscriptionId, 'event', eventType);
      res.status(200).json({ received: true });
      return;
    }

    try {
      switch (eventType) {
        // ── subscription.activated ────────────────────────────────────────────
        // Req 13.5: set subscription_status = "active", is_premium = true
        case 'subscription.activated': {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: 'active',
              isPremium: true,
            },
          });
          await createNotification({
            userId: user.id,
            type: 'subscription_activated',
            payload: { subscriptionId, eventType },
          });
          console.info('[webhooks/razorpay] subscription.activated for user', user.id);
          break;
        }

        // ── subscription.charged ──────────────────────────────────────────────
        // Req 13.6: record payment, extend next_billing_date
        case 'subscription.charged': {
          // next_billing_date comes from the subscription entity's current_end (Unix timestamp)
          const currentEnd = subscriptionEntity?.current_end;
          const nextBillingDate = currentEnd ? new Date(currentEnd * 1000) : null;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: 'active',
              isPremium: true,
              ...(nextBillingDate ? { nextBillingDate } : {}),
            },
          });
          console.info('[webhooks/razorpay] subscription.charged for user', user.id, 'next billing:', nextBillingDate);
          break;
        }

        // ── subscription.cancelled ────────────────────────────────────────────
        // Req 13.7: set is_premium = false, subscription_status = "cancelled"
        case 'subscription.cancelled': {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: 'cancelled',
              isPremium: false,
            },
          });
          await createNotification({
            userId: user.id,
            type: 'subscription_cancelled',
            payload: { subscriptionId, eventType },
          });
          console.info('[webhooks/razorpay] subscription.cancelled for user', user.id);
          break;
        }

        // ── payment.failed ────────────────────────────────────────────────────
        // Req 13.7: set is_premium = false, subscription_status = "payment_failed"
        // Req 19.5 (notification): trigger notification service
        case 'payment.failed': {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: 'payment_failed',
              isPremium: false,
            },
          });
          // Trigger in-app notification (Req 17.3 / 19.5)
          await createNotification({
            userId: user.id,
            type: 'payment_failed',
            payload: {
              subscriptionId,
              paymentId: paymentEntity?.id,
              amount: paymentEntity?.amount,
              currency: paymentEntity?.currency,
              eventType,
            },
          });
          console.info('[webhooks/razorpay] payment.failed for user', user.id);
          break;
        }

        default:
          // Unhandled event type — acknowledge receipt
          console.info('[webhooks/razorpay] Unhandled event type:', eventType);
          break;
      }
    } catch (err) {
      console.error('[webhooks/razorpay] Error processing event', eventType, err);
      res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to process webhook event.' } });
      return;
    }

    res.status(200).json({ received: true });
  }
);

export default router;
