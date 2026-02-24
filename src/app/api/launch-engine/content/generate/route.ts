/**
 * POST /api/launch-engine/content/generate
 * Trigger AI content generation.
 * Creates a content_item with status 'generating' and returns it immediately.
 * The actual AI generation will be wired in a later phase.
 *
 * Body: {
 *   content_type: 'tweet' | 'blog' | 'thread' | 'reddit' | 'linkedin' | 'newsletter' | 'email',
 *   voice: 'founder' | 'brand',
 *   pillar?: string,
 *   topic?: string,          — topic keyword/phrase
 *   brief?: string,          — detailed brief for the AI
 *   source_type?: string,    — what inspired this (trending, blog-promo, etc.)
 *   campaign_id?: string,
 *   target_channel?: string,
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema/launch-engine';
import { randomUUID } from 'crypto';
import { unauthorized, badRequest, serverError } from '@/lib/api-errors';

const VALID_CONTENT_TYPES = [
  'tweet', 'blog', 'thread', 'reddit', 'linkedin', 'newsletter', 'email',
] as const;

const VALID_VOICES = ['founder', 'brand'] as const;

const VALID_SOURCE_TYPES = [
  'trending', 'blog-promo', 'build-in-public', 'competitor', 'community', 'campaign', 'manual',
] as const;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const body = await req.json();
    const {
      content_type,
      voice,
      pillar,
      topic,
      brief,
      source_type,
      campaign_id,
      target_channel,
    } = body;

    // Validate required fields
    if (!content_type || !VALID_CONTENT_TYPES.includes(content_type)) {
      return badRequest(`content_type is required and must be one of: ${VALID_CONTENT_TYPES.join(', ')}`);
    }
    if (!voice || !VALID_VOICES.includes(voice)) {
      return badRequest(`voice is required and must be one of: ${VALID_VOICES.join(', ')}`);
    }
    if (!topic && !brief) {
      return badRequest('Either topic or brief is required to generate content');
    }

    // Build a generation brief that will be used when the AI generation is wired
    const generationBrief = brief || `Generate a ${content_type} about: ${topic}`;

    const [item] = await db
      .insert(contentItems)
      .values({
        id: randomUUID(),
        workspaceId: userId,
        campaignId: campaign_id || null,
        contentType: content_type,
        voice,
        contentPillar: pillar || null,
        sourceType: (source_type && VALID_SOURCE_TYPES.includes(source_type))
          ? source_type
          : 'manual',
        sourceRef: topic ? { topic } : null,

        // Title will be set when generation completes
        title: topic ? `[Generating] ${topic}` : '[Generating...]',

        // Body is empty — will be filled when AI generation completes
        bodyMd: generationBrief,
        bodyPlatform: null,
        mediaUrls: null,

        // Status: 'generating' — waiting for AI to fill content
        status: 'generating',
        scheduledAt: null,
        publishedAt: null,
        publishedUrl: null,

        gateScore: null,
        gateScores: null,
        gateFlags: null,
        gatePassed: null,
        gateReviewedAt: null,

        wordCount: null,
        charCount: null,
        seoKeywords: null,
        targetChannel: target_channel || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // TODO Phase 1: Dispatch async AI generation job here
    // e.g. await enqueueGenerationJob({ contentItemId: item.id, brief: generationBrief, voice, pillar })

    return NextResponse.json(
      {
        content: item,
        message: 'Content generation queued. The item will be updated when AI generation completes.',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('[launch-engine] POST /content/generate error:', error);
    return serverError('Failed to queue content generation');
  }
}
