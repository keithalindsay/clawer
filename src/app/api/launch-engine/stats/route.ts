/**
 * GET /api/launch-engine/stats
 * Dashboard stats for the Launch Engine home screen.
 * Returns counts by status, this week's metrics, campaign summary, pillar breakdown.
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems, campaigns, contentMetrics } from '@/lib/db/schema/launch-engine';
import { eq, and, gte, sum, count, sql } from 'drizzle-orm';
import { unauthorized, serverError } from '@/lib/api-errors';

/**
 * GET /api/launch-engine/stats
 * Aggregated dashboard statistics for the current user's workspace.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return unauthorized();

    const now = new Date();

    // Start of this week (Monday 00:00:00 UTC)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setUTCDate(now.getUTCDate() + diffToMonday);
    startOfWeek.setUTCHours(0, 0, 0, 0);

    // Start of today
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);

    // ─── Content counts by status ────────────────────────────────────────────
    const statusCounts = await db
      .select({
        status: contentItems.status,
        total: count(),
      })
      .from(contentItems)
      .where(eq(contentItems.workspaceId, userId))
      .groupBy(contentItems.status);

    const countByStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      countByStatus[row.status] = Number(row.total);
    }

    // ─── Pillar breakdown (all time, non-killed/generated) ───────────────────
    const pillarRows = await db
      .select({
        pillar: contentItems.contentPillar,
        total: count(),
      })
      .from(contentItems)
      .where(
        and(
          eq(contentItems.workspaceId, userId),
          sql`${contentItems.status} NOT IN ('killed', 'generating', 'failed-gate')`
        )
      )
      .groupBy(contentItems.contentPillar);

    const pillarBreakdown: Record<string, number> = {};
    for (const row of pillarRows) {
      if (row.pillar) {
        pillarBreakdown[row.pillar] = Number(row.total);
      }
    }

    // ─── Content published this week ─────────────────────────────────────────
    const [publishedThisWeek] = await db
      .select({ total: count() })
      .from(contentItems)
      .where(
        and(
          eq(contentItems.workspaceId, userId),
          eq(contentItems.status, 'published'),
          gte(contentItems.publishedAt, startOfWeek)
        )
      );

    // ─── Scheduled today ─────────────────────────────────────────────────────
    const [scheduledToday] = await db
      .select({ total: count() })
      .from(contentItems)
      .where(
        and(
          eq(contentItems.workspaceId, userId),
          eq(contentItems.status, 'scheduled'),
          gte(contentItems.scheduledAt, startOfToday)
        )
      );

    // ─── This week's engagement metrics (from content_metrics) ───────────────
    const weekMetrics = await db
      .select({
        totalImpressions: sum(contentMetrics.impressions),
        totalLikes: sum(contentMetrics.likes),
        totalRetweets: sum(contentMetrics.retweets),
        totalClicks: sum(contentMetrics.clicks),
        totalSignups: sum(contentMetrics.signups),
      })
      .from(contentMetrics)
      .innerJoin(contentItems, eq(contentMetrics.contentId, contentItems.id))
      .where(
        and(
          eq(contentItems.workspaceId, userId),
          gte(contentMetrics.fetchedAt, startOfWeek)
        )
      );

    const metrics = weekMetrics[0] ?? {
      totalImpressions: 0,
      totalLikes: 0,
      totalRetweets: 0,
      totalClicks: 0,
      totalSignups: 0,
    };

    // ─── Active campaigns ────────────────────────────────────────────────────
    const [activeCampaignCount] = await db
      .select({ total: count() })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.workspaceId, userId),
          eq(campaigns.status, 'active')
        )
      );

    // ─── Awaiting review (queued + gate-review) ───────────────────────────────
    const awaitingReview =
      (countByStatus['queued'] || 0) + (countByStatus['gate-review'] || 0);

    return NextResponse.json({
      // Queue health
      counts: {
        draft: countByStatus['queued'] || 0,
        awaitingReview,
        approved: countByStatus['approved'] || 0,
        scheduled: countByStatus['scheduled'] || 0,
        published: countByStatus['published'] || 0,
        killed: countByStatus['killed'] || 0,
        generating: countByStatus['generating'] || 0,
        failedGate: countByStatus['failed-gate'] || 0,
      },

      // Today/this-week activity
      today: {
        scheduledCount: Number(scheduledToday?.total ?? 0),
      },

      thisWeek: {
        published: Number(publishedThisWeek?.total ?? 0),
        impressions: Number(metrics.totalImpressions ?? 0),
        likes: Number(metrics.totalLikes ?? 0),
        retweets: Number(metrics.totalRetweets ?? 0),
        clicks: Number(metrics.totalClicks ?? 0),
        signups: Number(metrics.totalSignups ?? 0),
      },

      // Campaigns
      campaigns: {
        active: Number(activeCampaignCount?.total ?? 0),
      },

      // Content balance
      pillarBreakdown,

      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('[launch-engine] GET /stats error:', error);
    return serverError('Failed to fetch dashboard stats');
  }
}
