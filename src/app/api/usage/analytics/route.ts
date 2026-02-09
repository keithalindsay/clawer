/**
 * GET /api/usage/analytics
 * 
 * Returns comprehensive usage analytics for the authenticated user:
 * - Daily message counts (last 30 days)
 * - Model usage breakdown
 * - Tier distribution (SIMPLE/MEDIUM/COMPLEX/REASONING)
 * - Platform breakdown (Web/WhatsApp/Telegram/Slack)
 * - Average response latency
 * - Billing period info
 * - Cost estimates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { 
  requestLog, weeklyUsage, conversations, messages, users, 
  TOKEN_LIMITS 
} from '@/lib/db/schema';
import { eq, and, gte, desc, sql, count, avg } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        tier: true,
        monthlyMessageCount: true,
        monthlyResetAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Daily message counts (last 30 days) from request_log
    const dailyMessages = await db
      .select({
        date: sql<string>`to_char(${requestLog.timestamp}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(requestLog)
      .where(
        and(
          eq(requestLog.userId, userId),
          gte(requestLog.timestamp, thirtyDaysAgo)
        )
      )
      .groupBy(sql`to_char(${requestLog.timestamp}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${requestLog.timestamp}, 'YYYY-MM-DD')`);

    // 2. Model usage breakdown from messages table
    const modelUsage = await db
      .select({
        model: messages.model,
        count: count(),
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(
        and(
          eq(conversations.userId, userId),
          eq(messages.role, 'assistant'),
          gte(messages.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(messages.model);

    // 3. Tier distribution from request_log (parsed from routeDecision JSON)
    const tierDistribution = await db
      .select({
        tier: sql<string>`
          COALESCE(
            (${requestLog.routeDecision})::jsonb->>'tier',
            (${requestLog.routeDecision})::jsonb->>'intent',
            'UNKNOWN'
          )
        `,
        count: count(),
      })
      .from(requestLog)
      .where(
        and(
          eq(requestLog.userId, userId),
          gte(requestLog.timestamp, thirtyDaysAgo)
        )
      )
      .groupBy(sql`COALESCE(
        (${requestLog.routeDecision})::jsonb->>'tier',
        (${requestLog.routeDecision})::jsonb->>'intent',
        'UNKNOWN'
      )`);

    // 4. Platform breakdown from conversations metadata
    const platformBreakdown = await db
      .select({
        platform: sql<string>`
          CASE
            WHEN (${conversations.metadata})::jsonb->>'platform' IS NOT NULL 
              THEN (${conversations.metadata})::jsonb->>'platform'
            WHEN (${conversations.metadata})::jsonb->>'source' = 'whatsapp' 
              OR (${conversations.metadata})::jsonb->>'whatsapp' IS NOT NULL
              THEN 'whatsapp'
            WHEN (${conversations.metadata})::jsonb->>'source' = 'telegram'
              OR (${conversations.metadata})::jsonb->>'telegram' IS NOT NULL
              THEN 'telegram'
            WHEN (${conversations.metadata})::jsonb->>'source' = 'slack'
              OR (${conversations.metadata})::jsonb->>'slack' IS NOT NULL
              THEN 'slack'
            ELSE 'web'
          END
        `,
        messageCount: sql<number>`SUM(${conversations.messageCount})::int`,
        conversationCount: count(),
      })
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, userId),
          gte(conversations.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`
        CASE
          WHEN (${conversations.metadata})::jsonb->>'platform' IS NOT NULL 
            THEN (${conversations.metadata})::jsonb->>'platform'
          WHEN (${conversations.metadata})::jsonb->>'source' = 'whatsapp' 
            OR (${conversations.metadata})::jsonb->>'whatsapp' IS NOT NULL
            THEN 'whatsapp'
          WHEN (${conversations.metadata})::jsonb->>'source' = 'telegram'
            OR (${conversations.metadata})::jsonb->>'telegram' IS NOT NULL
            THEN 'telegram'
          WHEN (${conversations.metadata})::jsonb->>'source' = 'slack'
            OR (${conversations.metadata})::jsonb->>'slack' IS NOT NULL
            THEN 'slack'
          ELSE 'web'
        END
      `);

    // 5. Average response latency
    const latencyResult = await db
      .select({
        avgLatency: avg(requestLog.latencyMs),
        p50Latency: sql<number>`percentile_cont(0.5) WITHIN GROUP (ORDER BY ${requestLog.latencyMs})`,
        p95Latency: sql<number>`percentile_cont(0.95) WITHIN GROUP (ORDER BY ${requestLog.latencyMs})`,
        totalRequests: count(),
      })
      .from(requestLog)
      .where(
        and(
          eq(requestLog.userId, userId),
          gte(requestLog.timestamp, thirtyDaysAgo)
        )
      );

    // 6. Current billing period (weekly usage)
    const currentWeekUsage = await db.query.weeklyUsage.findFirst({
      where: eq(weeklyUsage.userId, userId),
    });

    const tierLimits = TOKEN_LIMITS[user.tier] || TOKEN_LIMITS.free;

    // 7. Cost estimate from request_log
    const costResult = await db
      .select({
        totalCost: sql<string>`COALESCE(SUM(${requestLog.estimatedCostUsd}::numeric), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${requestLog.totalTokens}), 0)`,
      })
      .from(requestLog)
      .where(
        and(
          eq(requestLog.userId, userId),
          gte(requestLog.timestamp, thirtyDaysAgo)
        )
      );

    // Calculate billing period info
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + diff);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);
    const daysRemaining = Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Fill in the 30-day chart with zeros for missing days
    const dailyChart: { date: string; count: number }[] = [];
    const messageMap = new Map(dailyMessages.map(d => [d.date, Number(d.count)]));
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyChart.push({
        date: dateStr,
        count: messageMap.get(dateStr) || 0,
      });
    }

    const latency = latencyResult[0];
    const cost = costResult[0];

    return NextResponse.json({
      dailyMessages: dailyChart,
      modelUsage: modelUsage
        .filter(m => m.model)
        .map(m => ({
          model: m.model || 'unknown',
          count: Number(m.count),
        })),
      tierDistribution: tierDistribution.map(t => ({
        tier: t.tier || 'UNKNOWN',
        count: Number(t.count),
      })),
      platformBreakdown: platformBreakdown.map(p => ({
        platform: p.platform || 'web',
        messageCount: Number(p.messageCount) || 0,
        conversationCount: Number(p.conversationCount),
      })),
      latency: {
        avg: Math.round(Number(latency?.avgLatency) || 0),
        p50: Math.round(Number(latency?.p50Latency) || 0),
        p95: Math.round(Number(latency?.p95Latency) || 0),
        totalRequests: Number(latency?.totalRequests) || 0,
      },
      billing: {
        tier: user.tier,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        daysRemaining,
        tokensUsed: currentWeekUsage?.totalOet || 0,
        tokenLimit: tierLimits.weeklyOet,
        percentUsed: currentWeekUsage
          ? Math.round(((currentWeekUsage.totalOet || 0) / tierLimits.weeklyOet) * 10000) / 100
          : 0,
        requestCount: currentWeekUsage?.requestCount || 0,
        monthlyMessageCount: user.monthlyMessageCount || 0,
        monthlyResetAt: user.monthlyResetAt?.toISOString() || null,
      },
      cost: {
        estimated30d: parseFloat(String(cost?.totalCost) || '0'),
        totalTokens30d: Number(cost?.totalTokens) || 0,
        estimatedCostUsd: currentWeekUsage?.estimatedCostUsd
          ? parseFloat(String(currentWeekUsage.estimatedCostUsd))
          : 0,
      },
    });
  } catch (error: any) {
    console.error('Usage analytics API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
