/**
 * Launch Engine — Content Scheduler
 *
 * Finds due content items and executes scheduled posts via x-service.
 * Called by the /api/launch-engine/schedule/check route (cron or manual trigger).
 */

import { db } from '@/lib/db';
import { contentItems, threadItems } from '@/lib/db/schema/launch-engine';
import { eq, and, lte, gte, asc } from 'drizzle-orm';
import type { ContentItem } from '@/lib/launch-engine/types';
import { postTweet, postThread } from '@/lib/launch-engine/x-service';
import type { Voice } from '@/lib/launch-engine/types';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ScheduleCheckResult {
  /** Items that were successfully published in this run */
  published: PublishRecord[];
  /** Items that failed to publish */
  failed: FailRecord[];
  /** Total items found that were due */
  totalDue: number;
}

export interface PublishRecord {
  contentId: string;
  contentType: string;
  voice: string;
  tweetUrl: string;
  publishedAt: Date;
}

export interface FailRecord {
  contentId: string;
  contentType: string;
  error: string;
}

// ─── Scheduler ─────────────────────────────────────────────────────────────

/**
 * Find all content items that are due to be posted.
 *
 * Criteria:
 *   - status = 'scheduled'
 *   - scheduled_at <= NOW()
 *
 * Returns items ordered by scheduled_at ascending (oldest-due first).
 */
export async function checkSchedule(): Promise<ContentItem[]> {
  const now = new Date();

  const rows = await db
    .select()
    .from(contentItems)
    .where(
      and(
        eq(contentItems.status, 'scheduled'),
        lte(contentItems.scheduledAt, now),
      ),
    )
    .orderBy(asc(contentItems.scheduledAt));

  // Cast to our TypeScript interface
  return rows.map(rowToContentItem);
}

/**
 * Execute a scheduled content item: post it, then update DB.
 *
 * Supports:
 *   - content_type = 'tweet'  → postTweet()
 *   - content_type = 'thread' → fetch thread_items + postThread()
 *
 * After successful posting:
 *   - status → 'published'
 *   - published_at → now
 *   - published_url → first tweet URL
 *
 * On failure:
 *   - status → 'scheduled' (unchanged — will retry next run)
 *   - Logs error
 */
export async function executeScheduled(item: ContentItem): Promise<void> {
  const account = resolveAccount(item.voice);

  try {
    if (item.contentType === 'tweet') {
      const text = item.bodyMd ?? '';
      if (!text.trim()) {
        throw new Error('Content body is empty');
      }

      const result = await postTweet(text, account);
      if (!result.success || !result.tweetUrl) {
        throw new Error(result.error ?? 'postTweet returned no URL');
      }

      await markPublished(item.id, result.tweetUrl);
    } else if (item.contentType === 'thread') {
      // Fetch ordered thread items
      const threads = await db
        .select()
        .from(threadItems)
        .where(eq(threadItems.contentId, item.id))
        .orderBy(asc(threadItems.position));

      if (!threads.length) {
        throw new Error('Thread has no thread_items');
      }

      const tweetTexts = threads.map((t) => t.body);
      const result = await postThread(tweetTexts, account);

      if (!result.success || !result.threadUrl) {
        throw new Error(result.error ?? 'postThread returned no URL');
      }

      await markPublished(item.id, result.threadUrl);
    } else {
      // Other content types (blog, linkedin, reddit…) not yet implemented
      console.warn(`[scheduler] executeScheduled: unsupported content_type "${item.contentType}" for item ${item.id} — skipping`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[scheduler] executeScheduled FAILED for ${item.id}:`, message);
    throw err; // Re-throw so the caller (route) records the failure
  }
}

/**
 * Return upcoming scheduled content within the next N hours.
 *
 * Useful for preview panels and the content calendar.
 *
 * @param hours - How many hours ahead to look (e.g. 24 = next 24 hours)
 */
export async function getUpcoming(hours: number): Promise<ContentItem[]> {
  const now = new Date();
  const ceiling = new Date(now.getTime() + hours * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(contentItems)
    .where(
      and(
        eq(contentItems.status, 'scheduled'),
        gte(contentItems.scheduledAt, now),
        lte(contentItems.scheduledAt, ceiling),
      ),
    )
    .orderBy(asc(contentItems.scheduledAt));

  return rows.map(rowToContentItem);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Map 'voice' enum to bird account string.
 * Defaults to 'founder' if voice is not set.
 */
function resolveAccount(voice: Voice | null | undefined): 'founder' | 'brand' {
  if (voice === 'brand') return 'brand';
  return 'founder';
}

/** Write published status + URL + timestamp to DB */
async function markPublished(id: string, url: string): Promise<void> {
  const now = new Date();
  await db
    .update(contentItems)
    .set({
      status: 'published',
      publishedAt: now,
      publishedUrl: url,
      updatedAt: now,
    })
    .where(eq(contentItems.id, id));

  console.log(`[scheduler] markPublished: ${id} → ${url}`);
}

/**
 * Convert a Drizzle `contentItems` row to our `ContentItem` interface.
 * Handles null → undefined coercion and type casts.
 */
function rowToContentItem(row: typeof contentItems.$inferSelect): ContentItem {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    campaignId: row.campaignId ?? undefined,
    contentType: row.contentType,
    voice: (row.voice ?? 'founder') as Voice,
    contentPillar: row.contentPillar ?? undefined,
    sourceType: row.sourceType ?? 'manual',
    sourceRef: (row.sourceRef as ContentItem['sourceRef']) ?? undefined,
    title: row.title ?? undefined,
    bodyMd: row.bodyMd ?? '',
    bodyPlatform: row.bodyPlatform as Record<string, string> | undefined,
    mediaUrls: row.mediaUrls as string[] | undefined,
    status: row.status,
    scheduledAt: row.scheduledAt ?? undefined,
    publishedAt: row.publishedAt ?? undefined,
    publishedUrl: row.publishedUrl ?? undefined,
    gateScore: row.gateScore ? Number(row.gateScore) : undefined,
    gateScores: row.gateScores as ContentItem['gateScores'],
    gateFlags: row.gateFlags as ContentItem['gateFlags'],
    gatePassed: row.gatePassed ?? undefined,
    gateReviewedAt: row.gateReviewedAt ?? undefined,
    wordCount: row.wordCount ?? undefined,
    charCount: row.charCount ?? undefined,
    seoKeywords: row.seoKeywords as string[] | undefined,
    targetChannel: row.targetChannel ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
