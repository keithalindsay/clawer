/**
 * GET /api/engagement/pending
 *
 * Returns all pending engagement messages that are due to be sent.
 * Intended to be called by a cron job / worker every 5 minutes.
 *
 * Response includes skip-check results so the caller can decide
 * whether to actually send each message.
 *
 * Security: Protected by a CRON_SECRET header for worker calls,
 * or accessible to authenticated admin users.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import {
  getPendingMessages,
  checkSkipConditions,
  markMessageSkipped,
} from '@/lib/engagement/scheduler';

export async function GET(req: NextRequest) {
  try {
    // Allow cron workers to authenticate with a secret header
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!cronSecret || !expectedSecret || cronSecret !== expectedSecret) {
      // Fall back to Clerk auth for browser/admin access
      const { userId } = await auth();
      if (!userId) return apiErrors.unauthorized();
    }

    const pending = await getPendingMessages();

    // Run skip checks and auto-skip messages that should be suppressed
    const results = await Promise.all(
      pending.map(async (msg) => {
        const skipReason = await checkSkipConditions({
          userId: msg.userId,
          messageType: msg.messageType,
        });

        if (skipReason) {
          await markMessageSkipped(msg.id, skipReason);
          return { ...msg, action: 'skipped', skipReason } as const;
        }

        return { ...msg, action: 'send' } as const;
      })
    );

    const toSend = results.filter((r) => r.action === 'send');
    const skipped = results.filter((r) => r.action === 'skipped');

    return apiSuccess({
      total: results.length,
      toSend: toSend.length,
      skipped: skipped.length,
      messages: toSend,
    });
  } catch (err) {
    console.error('[engagement/pending GET]', err);
    return apiErrors.internalError();
  }
}
