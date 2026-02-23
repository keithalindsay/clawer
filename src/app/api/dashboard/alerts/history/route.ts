import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alertHistory, orchestratorAlerts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/dashboard/alerts/history
 * 
 * Get alert history for the authenticated user
 * 
 * Query params:
 *   - limit: Max results (default 50, max 200)
 *   - offset: Pagination offset (default 0)
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get alert history for this user, joined with alert definitions
    const history = await db
      .select({
        id: alertHistory.id,
        alertId: alertHistory.alertId,
        userId: alertHistory.userId,
        containerName: alertHistory.containerName,
        severity: alertHistory.severity,
        message: alertHistory.message,
        actionTaken: alertHistory.actionTaken,
        acknowledged: alertHistory.acknowledged,
        createdAt: alertHistory.createdAt,
        alertName: orchestratorAlerts.name,
        alertDescription: orchestratorAlerts.description,
      })
      .from(alertHistory)
      .leftJoin(orchestratorAlerts, eq(alertHistory.alertId, orchestratorAlerts.id))
      .where(eq(alertHistory.userId, userId))
      .orderBy(desc(alertHistory.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: alertHistory.id })
      .from(alertHistory)
      .where(eq(alertHistory.userId, userId));

    return NextResponse.json({ 
      history,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Dashboard alert history error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch alert history' 
    }, { status: 500 });
  }
}
