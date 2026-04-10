/**
 * Notification helper — inserts into the PostgreSQL notifications table via Prisma.
 * Respects per-user notification preferences (Req 17.2).
 * Dispatches email for payment_failed events (Req 17.3).
 */

import nodemailer from 'nodemailer';
import prisma from './prisma';

export type NotificationType =
  | 'recipe_approved'
  | 'recipe_rejected'
  | 'comment_approved'
  | 'comment_rejected'
  | 'new_follower'
  | 'post_liked'
  | 'post_commented'
  | 'subscription_activated'
  | 'subscription_cancelled'
  | 'payment_failed'
  | 'new_lesson';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  payload?: Record<string, unknown>;
}

// ─── Email transport ──────────────────────────────────────────────────────────

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

async function sendPaymentFailedEmail(email: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const transporter = createTransport();
    const from = process.env.SMTP_FROM || 'noreply@globalculinarycompass.com';
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Action required: Your payment failed',
      text: [
        'Hi,',
        '',
        'We were unable to process your subscription payment for Global Culinary Compass.',
        payload.paymentId ? `Payment ID: ${payload.paymentId}` : '',
        '',
        'Please update your payment method to continue enjoying premium features.',
        '',
        'If you have any questions, please contact our support team.',
        '',
        'The Global Culinary Compass Team',
      ]
        .filter((l) => l !== undefined)
        .join('\n'),
      html: `
        <p>Hi,</p>
        <p>We were unable to process your subscription payment for <strong>Global Culinary Compass</strong>.</p>
        ${payload.paymentId ? `<p>Payment ID: <code>${payload.paymentId}</code></p>` : ''}
        <p>Please update your payment method to continue enjoying premium features.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>The Global Culinary Compass Team</p>
      `,
    });
    console.info('[notifications] payment_failed email sent to', email);
  } catch (err) {
    console.error('[notifications] Failed to send payment_failed email:', (err as Error).message);
  }
}

// ─── Preference check ─────────────────────────────────────────────────────────

/**
 * Returns true if the user has this notification type enabled (default: true).
 * Preferences are stored as a JSON object on the user row where keys are
 * NotificationType values and values are booleans.
 * A missing key means the preference is enabled (opt-out model).
 */
function isNotificationEnabled(
  preferences: Record<string, unknown> | null | undefined,
  type: NotificationType
): boolean {
  if (!preferences) return true;
  const pref = preferences[type];
  if (typeof pref === 'boolean') return pref;
  return true; // default: enabled
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Insert a notification row for the given user, respecting their preferences.
 * For payment_failed, also dispatches an email (Req 17.3).
 * Silently swallows errors so that notification failures never break the main flow.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    // Fetch user preferences (and email for payment_failed)
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { notificationPreferences: true, email: true },
    });

    const prefs = user?.notificationPreferences as Record<string, unknown> | null | undefined;

    // Respect notification preferences (Req 17.2)
    if (!isNotificationEnabled(prefs, input.type)) {
      console.info(`[notifications] Skipping ${input.type} for user ${input.userId} (preference disabled)`);
      return;
    }

    // Insert in-app notification (Req 17.1)
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: (input.payload ?? {}) as any,
        isRead: false,
      },
    });

    // For payment_failed, also send email within the same call (Req 17.3)
    if (input.type === 'payment_failed' && user?.email) {
      await sendPaymentFailedEmail(user.email, input.payload ?? {});
    }
  } catch (err) {
    console.error('[notifications] Failed to create notification:', (err as Error).message);
  }
}
