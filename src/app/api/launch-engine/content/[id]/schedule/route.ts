/**
 * POST /api/launch-engine/content/[id]/schedule
 * Schedule a content item — sets scheduled_at and status to 'scheduled'.
 * Body: { scheduled_at: ISO8601 string, target_channel? }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema/launch-engine';
import { eq, and } from 'drizzle-orm';
import { unauthorized, notFound, badRequest, serverError } from '@/lib/api-errors';

const SCHEDULABLE_STATUSES = ['queued', 'approved', 'scheduled'] as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const body = await req.json();
    const { scheduled_at, target_channel, note } = body;

    if (!scheduled_at) {
      return badRequest('scheduled_at is required (ISO8601 datetime string)');
    }

    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return badRequest('scheduled_at must be a valid ISO8601 datetime string');
    }

    if (scheduledDate < new Date()) {
      return badRequest('scheduled_at must be a future datetime');
    }

    const item = await db.query.contentItems.findFirst({
      where: and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)),
    });

    if (!item) return notFound('Content item');

    if (!SCHEDULABLE_STATUSES.includes(item.status as typeof SCHEDULABLE_STATUSES[number])) {
      return badRequest(
        `Cannot schedule content with status '${item.status}'. ` +
        `Must be one of: ${SCHEDULABLE_STATUSES.join(', ')}`
      );
    }

    const updateData: Record<string, unknown> = {
      status: 'scheduled',
      scheduledAt: scheduledDate,
      updatedAt: new Date(),
    };

    if (target_channel) {
      updateData.targetChannel = target_channel;
    }

    const [updated] = await db
      .update(contentItems)
      .set(updateData)
      .where(and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)))
      .returning();

    // TODO Phase 1: Log to content_decisions audit table when schema is extended

    return NextResponse.json({ content: updated, action: 'scheduled' });
  } catch (error) {
    console.error('[launch-engine] POST /content/[id]/schedule error:', error);
    return serverError('Failed to schedule content item');
  }
}
