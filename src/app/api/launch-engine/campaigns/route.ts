/**
 * GET  /api/launch-engine/campaigns  — List campaigns
 * POST /api/launch-engine/campaigns  — Create a campaign
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema/launch-engine';
import { eq, and, desc, SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { unauthorized, badRequest, serverError } from '@/lib/api-errors';

const VALID_STATUSES = ['draft', 'active', 'paused', 'completed', 'archived'] as const;

const VALID_TEMPLATES = [
  'security-week', 'product-launch', 'feature-spotlight', 'community-highlight',
] as const;

/**
 * GET /api/launch-engine/campaigns
 * List campaigns for the authenticated user's workspace.
 * Query params: status, limit, offset
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions: SQL[] = [eq(campaigns.workspaceId, userId)];

    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      conditions.push(eq(campaigns.status, status as typeof VALID_STATUSES[number]));
    }

    const rows = await db
      .select()
      .from(campaigns)
      .where(and(...conditions))
      .orderBy(desc(campaigns.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ campaigns: rows, limit, offset });
  } catch (error) {
    console.error('[launch-engine] GET /campaigns error:', error);
    return serverError('Failed to fetch campaigns');
  }
}

/**
 * POST /api/launch-engine/campaigns
 * Create a new campaign.
 * Body: { name, brief?, goal?, target_persona?, content_pillars?, template?, start_date?, end_date? }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const body = await req.json();
    const {
      name,
      brief,
      goal,
      target_persona,
      content_pillars,
      template,
      start_date,
      end_date,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return badRequest('name is required');
    }

    if (template && !VALID_TEMPLATES.includes(template)) {
      return badRequest(`template must be one of: ${VALID_TEMPLATES.join(', ')}`);
    }

    const [campaign] = await db
      .insert(campaigns)
      .values({
        id: randomUUID(),
        workspaceId: userId,
        name: name.trim(),
        brief: brief?.trim() || null,
        goal: goal?.trim() || null,
        targetPersona: target_persona || null,
        contentPillars: content_pillars || null,
        template: template || null,
        status: 'draft',
        startDate: start_date ? String(start_date) : null,
        endDate: end_date ? String(end_date) : null,
        totalReach: 0,
        totalEngagement: '0',
        totalSignups: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('[launch-engine] POST /campaigns error:', error);
    return serverError('Failed to create campaign');
  }
}
