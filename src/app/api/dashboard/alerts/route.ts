import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userAlerts, orchestratorAlerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/dashboard/alerts
 * 
 * List all alerts configured for the authenticated user
 * Returns user_alerts joined with orchestrator_alerts definitions
 */
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all user alerts with joined alert definitions
    const alerts = await db
      .select({
        // User alert fields
        id: userAlerts.id,
        userId: userAlerts.userId,
        alertId: userAlerts.alertId,
        enabled: userAlerts.enabled,
        thresholdOverrides: userAlerts.thresholdOverrides,
        permissionLevel: userAlerts.permissionLevel,
        createdAt: userAlerts.createdAt,
        // Alert definition fields
        alertName: orchestratorAlerts.name,
        alertDescription: orchestratorAlerts.description,
        alertSchedule: orchestratorAlerts.schedule,
        alertAction: orchestratorAlerts.action,
        alertSeverity: orchestratorAlerts.severity,
        alertEnabled: orchestratorAlerts.enabled,
      })
      .from(userAlerts)
      .leftJoin(orchestratorAlerts, eq(userAlerts.alertId, orchestratorAlerts.id))
      .where(eq(userAlerts.userId, userId))
      .orderBy(orchestratorAlerts.severity, orchestratorAlerts.name);

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error('Dashboard get alerts error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch alerts' 
    }, { status: 500 });
  }
}
