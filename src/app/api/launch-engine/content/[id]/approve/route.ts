/**
 * POST /api/launch-engine/content/[id]/approve
 * Approve a content item — sets status to 'approved'.
 * Only content in 'queued', 'gate-review', or 'failed-gate' states can be approved.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema/launch-engine';
import { eq, and } from 'drizzle-orm';
import { unauthorized, notFound, badRequest, serverError } from '@/lib/api-errors';

const APPROVABLE_STATUSES = ['queued', 'gate-review', 'failed-gate', 'approved'] as const;

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

    if (!APPROVABLE_STATUSES.includes(item.status as typeof APPROVABLE_STATUSES[number])) {
      return badRequest(
        `Cannot approve content with status '${item.status}'. ` +
        `Must be one of: ${APPROVABLE_STATUSES.join(', ')}`
      );
    }

    // Parse optional note from body
    let note: string | undefined;
    try {
      const body = await req.json();
      note = body?.note;
    } catch {
      // Body is optional
    }

    const [updated] = await db
      .update(contentItems)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)))
      .returning();

    // TODO Phase 1: Log to content_decisions audit table when schema is extended

    return NextResponse.json({ content: updated, action: 'approved' });
  } catch (error) {
    console.error('[launch-engine] POST /content/[id]/approve error:', error);
    return serverError('Failed to approve content item');
  }
}
