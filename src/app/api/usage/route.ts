/**
 * GET /api/usage
 * 
 * Returns current weekly usage for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { weeklyUsage, usageHistory, TOKEN_LIMITS, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Get the start of the current week (Monday 00:00 UTC)
 */
function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get the end of the current week (Sunday 23:59 UTC)
 */
function getCurrentWeekEnd(): Date {
  const start = getCurrentWeekStart();
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/**
 * Get the next Monday (reset date)
 */
function getNextMonday(): Date {
  const weekEnd = getCurrentWeekEnd();
  const nextMonday = new Date(weekEnd);
  nextMonday.setUTCDate(weekEnd.getUTCDate() + 1);
  nextMonday.setUTCHours(0, 0, 0, 0);
  return nextMonday;
}

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user tier
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        tier: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get token limit based on tier
    const tierLimits = TOKEN_LIMITS[user.tier] || TOKEN_LIMITS.basic;
    const tokenLimit = tierLimits.weeklyOet;

    // Get current week's usage
    const weekStart = getCurrentWeekStart();
    const weekEnd = getCurrentWeekEnd();

    let currentUsage = await db.query.weeklyUsage.findFirst({
      where: eq(weeklyUsage.userId, userId),
    });

    // Initialize if doesn't exist
    if (!currentUsage) {
      [currentUsage] = await db
        .insert(weeklyUsage)
        .values({
          userId,
          weekStart,
          weekEnd,
          orchestratorInputTokens: 0,
          orchestratorOutputTokens: 0,
          workerInputTokens: 0,
          workerOutputTokens: 0,
          totalOet: 0,
          estimatedCostUsd: '0',
          requestCount: 0,
        })
        .returning();
    }

    // Get last 4 weeks from history
    const history = await db
      .select({
        weekStart: usageHistory.weekStart,
        tokensUsed: usageHistory.totalOet,
      })
      .from(usageHistory)
      .where(eq(usageHistory.userId, userId))
      .orderBy(desc(usageHistory.weekStart))
      .limit(4);

    // Calculate percentUsed
    const tokensUsed = currentUsage.totalOet || 0;
    const percentUsed = tokenLimit > 0 ? (tokensUsed / tokenLimit) * 100 : 0;

    // Build response
    const response = {
      current: {
        weekStart: currentUsage.weekStart.toISOString(),
        weekEnd: currentUsage.weekEnd.toISOString(),
        tokensUsed,
        tokenLimit,
        percentUsed: Math.round(percentUsed * 100) / 100, // Round to 2 decimals
        estimatedCost: parseFloat(currentUsage.estimatedCostUsd || '0'),
      },
      breakdown: {
        orchestrator: {
          input: currentUsage.orchestratorInputTokens || 0,
          output: currentUsage.orchestratorOutputTokens || 0,
        },
        workers: {
          input: currentUsage.workerInputTokens || 0,
          output: currentUsage.workerOutputTokens || 0,
        },
      },
      history: history.map((h) => ({
        week: h.weekStart.toISOString(),
        tokensUsed: h.tokensUsed || 0,
      })),
      resetDate: getNextMonday().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
