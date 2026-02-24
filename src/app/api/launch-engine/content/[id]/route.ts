/**
 * GET    /api/launch-engine/content/[id]  — Single content item (+ thread_items if thread)
 * PATCH  /api/launch-engine/content/[id]  — Update content (body, status, scheduled_at)
 * DELETE /api/launch-engine/content/[id]  — Delete content item
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems, threadItems } from '@/lib/db/schema/launch-engine';
import { eq, and, asc } from 'drizzle-orm';
import { unauthorized, notFound, badRequest, serverError } from '@/lib/api-errors';

const VALID_STATUSES = [
  'generating', 'gate-review', 'failed-gate', 'queued', 'approved',
  'scheduled', 'published', 'killed',
] as const;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/launch-engine/content/[id]
 * Returns the content item. If type is 'thread', also returns ordered thread_items.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;

    const item = await db.query.contentItems.findFirst({
      where: and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)),
    });

    if (!item) return notFound('Content item');

    // If this is a thread, fetch ordered thread items
    let threads: typeof threadItems.$inferSelect[] = [];
    if (item.contentType === 'thread') {
      threads = await db
        .select()
        .from(threadItems)
        .where(eq(threadItems.contentId, id))
        .orderBy(asc(threadItems.position));
    }

    return NextResponse.json({ content: item, threadItems: threads });
  } catch (error) {
    console.error('[launch-engine] GET /content/[id] error:', error);
    return serverError('Failed to fetch content item');
  }
}

/**
 * PATCH /api/launch-engine/content/[id]
 * Update content body, status, scheduled_at, or other metadata.
 * Body: { body_md?, title?, status?, scheduled_at?, target_channel?, pillar? }
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const body = await req.json();

    const existing = await db.query.contentItems.findFirst({
      where: and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)),
    });

    if (!existing) return notFound('Content item');

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title !== undefined) {
      updates.title = body.title ? String(body.title).trim() : null;
    }
    if (body.body_md !== undefined) {
      const text = body.body_md || '';
      updates.bodyMd = text || null;
      updates.charCount = text.length || null;
      updates.wordCount = text.split(/\s+/).filter(Boolean).length || null;
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return badRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      updates.status = body.status;
    }
    if (body.scheduled_at !== undefined) {
      updates.scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : null;
    }
    if (body.target_channel !== undefined) {
      updates.targetChannel = body.target_channel || null;
    }
    if (body.pillar !== undefined) {
      updates.contentPillar = body.pillar || null;
    }
    if (body.campaign_id !== undefined) {
      updates.campaignId = body.campaign_id || null;
    }
    if (body.media_urls !== undefined) {
      updates.mediaUrls = body.media_urls || null;
    }

    const [updated] = await db
      .update(contentItems)
      .set(updates)
      .where(and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)))
      .returning();

    return NextResponse.json({ content: updated });
  } catch (error) {
    console.error('[launch-engine] PATCH /content/[id] error:', error);
    return serverError('Failed to update content item');
  }
}

/**
 * DELETE /api/launch-engine/content/[id]
 * Permanently delete a content item (and its thread_items via cascade).
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;

    const existing = await db.query.contentItems.findFirst({
      where: and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)),
    });

    if (!existing) return notFound('Content item');

    await db
      .delete(contentItems)
      .where(and(eq(contentItems.id, id), eq(contentItems.workspaceId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[launch-engine] DELETE /content/[id] error:', error);
    return serverError('Failed to delete content item');
  }
}
