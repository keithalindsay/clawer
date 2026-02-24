/**
 * POST /api/launch-engine/content/[id]/kill
 * Kill a content item — sets status to 'killed'.
 * Content that is already 'published' or 'killed' cannot be killed again.
 * Body: { reason? } — optional kill reason/note
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema/launch-engine';
import { eq, and } from 'drizzle-orm';
import { unauthorized, notFound, badRequest, serverError } from '@/lib/api-errors';

const UNKILLABLE_STATUSES = ['killed', 'published'] as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;

    const item = await db.query.contentItems.findFirst({
      where: and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)),
    });

    if (!item) return notFound('Content item');

    if (UNKILLABLE_STATUSES.includes(item.status as typeof UNKILLABLE_STATUSES[number])) {
      return badRequest(`Content is already '${item.status}' and cannot be killed`);
    }

    // Parse optional reason from body
    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body?.reason;
    } catch {
      // Body is optional
    }

    const [updated] = await db
      .update(contentItems)
      .set({ status: 'killed', updatedAt: new Date() })
      .where(and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)))
      .returning();

    // TODO Phase 1: Log to content_decisions audit table when schema is extended

    return NextResponse.json({ content: updated, action: 'killed' });
  } catch (error) {
    console.error('[launch-engine] POST /content/[id]/kill error:', error);
    return serverError('Failed to kill content item');
  }
}
