/**
 * GET    /api/launch-engine/campaigns/[id]  — Single campaign with content item count
 * PATCH  /api/launch-engine/campaigns/[id]  — Update campaign
 * DELETE /api/launch-engine/campaigns/[id]  — Delete campaign (must be draft or archived)
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, contentItems } from '@/lib/db/schema/launch-engine';
import { eq, and, count } from 'drizzle-orm';
import { unauthorized, notFound, badRequest, serverError } from '@/lib/api-errors';

const VALID_STATUSES = ['draft', 'active', 'paused', 'completed', 'archived'] as const;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/launch-engine/campaigns/[id]
 * Returns the campaign plus a count of associated content items.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;

    const campaign = await db.query.campaigns.findFirst({
      where: and(eq(campaigns.id, id), eq(campaigns.workspaceId, userId)),
    });

    if (!campaign) return notFound('Campaign');

    // Get content item counts per status
    const [contentCount] = await db
      .select({ total: count() })
      .from(contentItems)
      .where(and(eq(contentItems.campaignId, id), eq(contentItems.workspaceId, userId)));

    return NextResponse.json({ campaign, contentItemCount: contentCount?.total ?? 0 });
  } catch (error) {
    console.error('[launch-engine] GET /campaigns/[id] error:', error);
    return serverError('Failed to fetch campaign');
  }
}

/**
 * PATCH /api/launch-engine/campaigns/[id]
 * Update campaign fields.
 * Body: { name?, brief?, goal?, target_persona?, content_pillars?, status?, start_date?, end_date? }
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;
    const body = await req.json();

    const existing = await db.query.campaigns.findFirst({
      where: and(eq(campaigns.id, id), eq(campaigns.workspaceId, userId)),
    });

    if (!existing) return notFound('Campaign');

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
        return badRequest('name cannot be empty');
      }
      updates.name = body.name.trim();
    }
    if (body.brief !== undefined) updates.brief = body.brief?.trim() || null;
    if (body.goal !== undefined) updates.goal = body.goal?.trim() || null;
    if (body.target_persona !== undefined) updates.targetPersona = body.target_persona || null;
    if (body.content_pillars !== undefined) updates.contentPillars = body.content_pillars || null;
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return badRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      updates.status = body.status;
    }
    if (body.start_date !== undefined) {
      updates.startDate = body.start_date ? String(body.start_date) : null;
    }
    if (body.end_date !== undefined) {
      updates.endDate = body.end_date ? String(body.end_date) : null;
    }

    const [updated] = await db
      .update(campaigns)
      .set(updates)
      .where(and(eq(campaigns.id, id), eq(campaigns.workspaceId, userId)))
      .returning();

    return NextResponse.json({ campaign: updated });
  } catch (error) {
    console.error('[launch-engine] PATCH /campaigns/[id] error:', error);
    return serverError('Failed to update campaign');
  }
}

/**
 * DELETE /api/launch-engine/campaigns/[id]
 * Delete a campaign. Only 'draft' or 'archived' campaigns can be deleted.
 * Active/paused/completed campaigns must be archived first.
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { id } = await params;

    const existing = await db.query.campaigns.findFirst({
      where: and(eq(campaigns.id, id), eq(campaigns.workspaceId, userId)),
    });

    if (!existing) return notFound('Campaign');

    if (!['draft', 'archived'].includes(existing.status)) {
      return badRequest(
        `Cannot delete a campaign with status '${existing.status}'. ` +
        `Archive it first, or only draft campaigns can be deleted directly.`
      );
    }

    await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.workspaceId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[launch-engine] DELETE /campaigns/[id] error:', error);
    return serverError('Failed to delete campaign');
  }
}
