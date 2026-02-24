/**
 * GET  /api/launch-engine/content  — List content items (filterable)
 * POST /api/launch-engine/content  — Create a content item (manual draft)
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema/launch-engine';
import { eq, and, desc, SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { unauthorized, badRequest, serverError } from '@/lib/api-errors';

const VALID_CONTENT_TYPES = [
  'tweet', 'blog', 'thread', 'reddit', 'linkedin', 'newsletter', 'email',
] as const;

const VALID_VOICES = ['founder', 'brand'] as const;

const VALID_STATUSES = [
  'generating', 'gate-review', 'failed-gate', 'queued', 'approved',
  'scheduled', 'published', 'killed',
] as const;

/**
 * GET /api/launch-engine/content
 * List content items for the authenticated user's workspace.
 * Query params: status, content_type, voice, pillar, campaign_id, limit, offset
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const contentType = searchParams.get('content_type');
    const voice = searchParams.get('voice');
    const pillar = searchParams.get('pillar');
    const campaignId = searchParams.get('campaign_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions: SQL[] = [eq(contentItems.workspaceId, userId)];

    if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      conditions.push(eq(contentItems.status, status as typeof VALID_STATUSES[number]));
    }
    if (contentType && VALID_CONTENT_TYPES.includes(contentType as typeof VALID_CONTENT_TYPES[number])) {
      conditions.push(eq(contentItems.contentType, contentType as typeof VALID_CONTENT_TYPES[number]));
    }
    if (voice && VALID_VOICES.includes(voice as typeof VALID_VOICES[number])) {
      conditions.push(eq(contentItems.voice, voice as typeof VALID_VOICES[number]));
    }
    if (pillar) {
      conditions.push(eq(contentItems.contentPillar, pillar));
    }
    if (campaignId) {
      conditions.push(eq(contentItems.campaignId, campaignId));
    }

    const rows = await db
      .select()
      .from(contentItems)
      .where(and(...conditions))
      .orderBy(desc(contentItems.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ content: rows, limit, offset });
  } catch (error) {
    console.error('[launch-engine] GET /content error:', error);
    return serverError('Failed to fetch content items');
  }
}

/**
 * POST /api/launch-engine/content
 * Create a content item (manual draft).
 * Body: { content_type, voice, pillar?, campaign_id?, title?, body_md?, source_type? }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const body = await req.json();
    const {
      content_type,
      voice,
      pillar,
      campaign_id,
      title,
      body_md,
      source_type,
      source_ref,
      target_channel,
    } = body;

    if (!content_type || !VALID_CONTENT_TYPES.includes(content_type)) {
      return badRequest(`content_type must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
    }
    if (!voice || !VALID_VOICES.includes(voice)) {
      return badRequest(`voice must be one of: ${VALID_VOICES.join(', ')}`);
    }

    const bodyText: string = body_md || '';
    const charCount = bodyText.length;
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    const [item] = await db
      .insert(contentItems)
      .values({
        id: randomUUID(),
        workspaceId: userId,
        campaignId: campaign_id || null,
        contentType: content_type,
        voice,
        contentPillar: pillar || null,
        sourceType: source_type || 'manual',
        sourceRef: source_ref || null,
        title: title?.trim() || null,
        bodyMd: bodyText || null,
        bodyPlatform: null,
        mediaUrls: null,
        status: 'queued',
        scheduledAt: null,
        publishedAt: null,
        publishedUrl: null,
        gateScore: null,
        gateScores: null,
        gateFlags: null,
        gatePassed: null,
        gateReviewedAt: null,
        wordCount: wordCount || null,
        charCount: charCount || null,
        seoKeywords: null,
        targetChannel: target_channel || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ content: item }, { status: 201 });
  } catch (error) {
    console.error('[launch-engine] POST /content error:', error);
    return serverError('Failed to create content item');
  }
}
