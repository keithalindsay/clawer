/**
 * POST /api/engagement/send/:id
 *
 * Marks an engagement message as sent.
 * Called by the cron worker after successfully delivering the message.
 *
 * Also supports manual triggering for testing / admin purposes.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { db } from '@/lib/db';
import { engagementMessages } from '@/lib/db/schema/engagement-messages';
import { markMessageSent, markMessageFailed } from '@/lib/engagement/scheduler';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Allow cron workers via secret header or Clerk auth
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!cronSecret || !expectedSecret || cronSecret !== expectedSecret) {
      const { userId } = await auth();
      if (!userId) return apiErrors.unauthorized();
    }

    const { id } = await params;

    // Verify message exists
    const msg = await db.query.engagementMessages.findFirst({
      where: eq(engagementMessages.id, id),
    });

    if (!msg) return apiErrors.notFound('Engagement message');

    // Only allow marking pending or failed messages as sent
    if (msg.status === 'sent') {
      return apiSuccess({ alreadySent: true, sentAt: msg.sentAt });
    }

    const body = await req.json().catch(() => ({}));
    const failed = (body as { failed?: boolean }).failed === true;

    if (failed) {
      await markMessageFailed(id);
      return apiSuccess({ marked: 'failed' });
    }

    await markMessageSent(id);

    return apiSuccess({ marked: 'sent', messageId: id });
  } catch (err) {
    console.error('[engagement/send POST]', err);
    return apiErrors.internalError();
  }
}
