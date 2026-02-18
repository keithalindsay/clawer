/**
 * POST /api/maintenance/purge-messages
 *
 * Hard-deletes messages older than 3 days to keep the DB lean.
 * Summarization should run first so old messages are already digested.
 *
 * Cron: daily at 3 AM
 *   0 3 * * *   curl -X POST https://clawer.ai/api/maintenance/purge-messages \
 *                    -H "x-maintenance-key: $MAINTENANCE_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages } from '@/lib/db/schema/messages';
import { lt } from 'drizzle-orm';

function authCheck(req: NextRequest): boolean {
  const key = req.headers.get('x-maintenance-key');
  const secret = process.env.MAINTENANCE_SECRET;
  if (!secret) return false;
  return key === secret;
}

export async function POST(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const deleted = await db
    .delete(messages)
    .where(lt(messages.createdAt, cutoff))
    .returning({ id: messages.id });

  return NextResponse.json({ deleted: deleted.length });
}
