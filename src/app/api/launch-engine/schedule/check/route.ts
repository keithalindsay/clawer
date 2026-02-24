/**
 * POST /api/launch-engine/schedule/check
 *
 * Trigger a scheduled content check — find all content_items with
 * status='scheduled' AND scheduled_at <= now, and post them to X.
 *
 * Intended to be called:
 *   - By a cron job (e.g. every 5 minutes via Vercel cron or system cron)
 *   - Manually from the UI for testing / immediate flush
 *
 * Requires authentication (userId used to scope DB queries).
 *
 * Optional body (JSON):
 *   { dry_run?: boolean }  — if true, finds due items but does NOT post them
 *
 * Response 200:
 *   {
 *     total_due: number,
 *     published: PublishRecord[],
 *     failed: FailRecord[],
 *     dry_run: boolean,
 *   }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema/launch-engine';
import { eq, and, lte } from 'drizzle-orm';
import { unauthorized, serverError } from '@/lib/api-errors';
import {
  checkSchedule,
  executeScheduled,
  type ScheduleCheckResult,
  type PublishRecord,
  type FailRecord,
} from '@/lib/launch-engine/scheduler';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    // Parse optional body
    let dryRun = false;
    try {
      const body = await req.json();
      dryRun = Boolean(body?.dry_run);
    } catch {
      // Body is optional — ignore parse errors
    }

    // ── Find due items (scoped to this user's workspace) ─────────────────
    //
    // checkSchedule() queries across all workspaces; we re-scope here
    // so authenticated users only operate on their own content.
    // The scheduler helper is also called directly by system crons (no auth),
    // which is why workspace filtering lives here rather than in the helper.

    const now = new Date();
    const dueRows = await db
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.workspaceId, userId),
          eq(contentItems.status, 'scheduled'),
          lte(contentItems.scheduledAt, now),
        ),
      );

    const totalDue = dueRows.length;
    const published: PublishRecord[] = [];
    const failed: FailRecord[] = [];

    if (dryRun) {
      console.log(`[schedule/check] dry_run=true — ${totalDue} items due, not posting`);
      return NextResponse.json({
        total_due: totalDue,
        published: [],
        failed: [],
        dry_run: true,
        due_items: dueRows.map((r) => ({
          content_id: r.id,
          content_type: r.contentType,
          voice: r.voice,
          scheduled_at: r.scheduledAt?.toISOString(),
        })),
      });
    }

    // ── Execute each due item ─────────────────────────────────────────────

    for (const row of dueRows) {
      // Convert DB row to ContentItem interface
      const item = {
        id: row.id,
        workspaceId: row.workspaceId,
        campaignId: row.campaignId ?? undefined,
        contentType: row.contentType,
        voice: row.voice ?? 'founder',
        contentPillar: row.contentPillar ?? undefined,
        sourceType: row.sourceType ?? 'manual',
        sourceRef: row.sourceRef as never,
        title: row.title ?? undefined,
        bodyMd: row.bodyMd ?? '',
        bodyPlatform: row.bodyPlatform as never,
        mediaUrls: row.mediaUrls as never,
        status: row.status,
        scheduledAt: row.scheduledAt ?? undefined,
        publishedAt: row.publishedAt ?? undefined,
        publishedUrl: row.publishedUrl ?? undefined,
        gateScore: row.gateScore ? Number(row.gateScore) : undefined,
        gateScores: row.gateScores as never,
        gateFlags: row.gateFlags as never,
        gatePassed: row.gatePassed ?? undefined,
        gateReviewedAt: row.gateReviewedAt ?? undefined,
        wordCount: row.wordCount ?? undefined,
        charCount: row.charCount ?? undefined,
        seoKeywords: row.seoKeywords as never,
        targetChannel: row.targetChannel ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      } as Parameters<typeof executeScheduled>[0];

      try {
        await executeScheduled(item);

        // Re-fetch to get the published_url written by executeScheduled
        const updated = await db.query.contentItems.findFirst({
          where: eq(contentItems.id, row.id),
        });

        published.push({
          contentId: row.id,
          contentType: row.contentType,
          voice: row.voice ?? 'founder',
          tweetUrl: updated?.publishedUrl ?? '',
          publishedAt: updated?.publishedAt ?? new Date(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        failed.push({
          contentId: row.id,
          contentType: row.contentType,
          error: message,
        });
      }
    }

    const result: ScheduleCheckResult = { published, failed, totalDue };

    console.log(
      `[schedule/check] run complete — due: ${totalDue}, published: ${published.length}, failed: ${failed.length}`,
    );

    return NextResponse.json({
      total_due: totalDue,
      published: published.map((p) => ({
        content_id: p.contentId,
        content_type: p.contentType,
        voice: p.voice,
        tweet_url: p.tweetUrl,
        published_at: p.publishedAt.toISOString(),
      })),
      failed: failed.map((f) => ({
        content_id: f.contentId,
        content_type: f.contentType,
        error: f.error,
      })),
      dry_run: false,
    });
  } catch (error: unknown) {
    console.error('[launch-engine] POST /schedule/check error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return serverError(`Schedule check failed: ${message}`);
  }
}
