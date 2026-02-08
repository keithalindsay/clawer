/**
 * GET /api/usage/details
 * 
 * Returns detailed per-request breakdown for authenticated user
 * Query params: page (default 1), perPage (default 20)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { requestLog } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '20', 10)));
    const offset = (page - 1) * perPage;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(requestLog)
      .where(eq(requestLog.userId, userId));

    // Get paginated request logs
    const logs = await db
      .select({
        id: requestLog.id,
        requestId: requestLog.requestId,
        timestamp: requestLog.timestamp,
        routeDecision: requestLog.routeDecision,
        orchestratorTokens: requestLog.orchestratorTokens,
        workerTokens: requestLog.workerTokens,
        totalTokens: requestLog.totalTokens,
        latencyMs: requestLog.latencyMs,
        estimatedCostUsd: requestLog.estimatedCostUsd,
      })
      .from(requestLog)
      .where(eq(requestLog.userId, userId))
      .orderBy(desc(requestLog.timestamp))
      .limit(perPage)
      .offset(offset);

    // Parse and format request data
    const requests = logs.map((log) => {
      // Parse JSON fields
      let routeDecision: any = null;
      let orchestratorTokens: any = null;
      let workerTokens: any = null;
      let workers: string[] = [];

      try {
        if (log.routeDecision) {
          routeDecision = JSON.parse(log.routeDecision);
        }
        if (log.orchestratorTokens) {
          orchestratorTokens = JSON.parse(log.orchestratorTokens);
        }
        if (log.workerTokens) {
          workerTokens = JSON.parse(log.workerTokens);
          // Extract worker names
          workers = Object.keys(workerTokens);
        }
      } catch (parseError) {
        console.error('Error parsing request log JSON:', parseError);
      }

      return {
        id: log.id,
        requestId: log.requestId,
        timestamp: log.timestamp.toISOString(),
        intent: routeDecision?.intent || 'Unknown',
        tokensUsed: log.totalTokens || 0,
        workers,
        latencyMs: log.latencyMs || 0,
        estimatedCost: parseFloat(log.estimatedCostUsd || '0'),
        breakdown: {
          orchestrator: orchestratorTokens || { input: 0, output: 0 },
          workers: workerTokens || {},
        },
      };
    });

    // Build response
    const response = {
      requests,
      pagination: {
        page,
        perPage,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / perPage),
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Usage details API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage details' },
      { status: 500 }
    );
  }
}
