/**
 * POST /api/launch-engine/publish
 *
 * Manually publish a content item immediately, bypassing the schedule.
 *
 * Accepts a content_item UUID, loads it from the DB, and calls x-service
 * to post it right now. Works for both 'tweet' and 'thread' content types.
 *
 * Body:
 *   { content_id: string }
 *
 * Responses:
 *   201 { published: { content_id, tweet_url, published_at } }
 *   400 bad input / wrong status
 *   401 unauthenticated
 *   404 content not found / not owned
 *   500 internal error / post failed
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems, threadItems } from '@/lib/db/schema/launch-engine';
import { eq, and, asc } from 'drizzle-orm';
import { unauthorized, badRequest, notFound, serverError } from '@/lib/api-errors';
import { postTweet, postThread } from '@/lib/launch-engine/x-service';
import type { Voice } from '@/lib/launch-engine/types';

/** Statuses that permit immediate publish */
const PUBLISHABLE_STATUSES = new Set(['queued', 'approved', 'scheduled']);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return badRequest('Request body must be a JSON object');
    }

    const { content_id } = body as { content_id?: unknown };
    if (!content_id || typeof content_id !== 'string') {
      return badRequest('content_id (string) is required');
    }

    // ── Load content item ────────────────────────────────────────────────

    const item = await db.query.contentItems.findFirst({
      where: and(
        eq(contentItems.id, content_id),
        eq(contentItems.workspaceId, userId),
      ),
    });

    if (!item) return notFound('Content item');

    // Guard: only allow certain statuses
    if (!PUBLISHABLE_STATUSES.has(item.status)) {
      return badRequest(
        `Content item is "${item.status}" — only queued, approved, or scheduled items can be published immediately`,
      );
    }

    // Guard: only X-targeted content types are supported right now
    if (item.contentType !== 'tweet' && item.contentType !== 'thread') {
      return badRequest(
        `Immediate publish only supports content_type "tweet" or "thread" (got "${item.contentType}")`,
      );
    }

    const account: 'founder' | 'brand' =
      (item.voice as Voice) === 'brand' ? 'brand' : 'founder';

    // ── Post to X ────────────────────────────────────────────────────────

    let publishedUrl: string;

    if (item.contentType === 'tweet') {
      const text = item.bodyMd ?? '';
      if (!text.trim()) {
        return badRequest('Content body is empty');
      }

      const result = await postTweet(text, account);
      if (!result.success || !result.tweetUrl) {
        console.error('[publish] postTweet failed:', result.error);
        return serverError(result.error ?? 'Failed to post tweet');
      }
      publishedUrl = result.tweetUrl;
    } else {
      // thread
      const threads = await db
        .select()
        .from(threadItems)
        .where(eq(threadItems.contentId, item.id))
        .orderBy(asc(threadItems.position));

      if (!threads.length) {
        return badRequest('Thread has no thread_items — nothing to post');
      }

      const tweetTexts = threads.map((t) => t.body);
      const result = await postThread(tweetTexts, account);

      if (!result.success || !result.threadUrl) {
        console.error('[publish] postThread failed:', result.error);
        return serverError(result.error ?? 'Failed to post thread');
      }
      publishedUrl = result.threadUrl;
    }

    // ── Update DB ────────────────────────────────────────────────────────

    const publishedAt = new Date();
    await db
      .update(contentItems)
      .set({
        status: 'published',
        publishedAt,
        publishedUrl,
        updatedAt: publishedAt,
      })
      .where(eq(contentItems.id, item.id));

    console.log(`[publish] ✅ ${item.contentType} ${item.id} published → ${publishedUrl}`);

    return NextResponse.json(
      {
        published: {
          content_id: item.id,
          content_type: item.contentType,
          voice: item.voice,
          tweet_url: publishedUrl,
          published_at: publishedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('[launch-engine] POST /publish error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return serverError(`Failed to publish content: ${message}`);
  }
}
