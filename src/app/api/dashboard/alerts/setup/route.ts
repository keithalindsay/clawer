import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userAlerts, orchestratorAlerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * GET /api/dashboard/alerts/setup/status
 * 
 * Check if user has completed security setup
 * Returns configuration status and alert counts
 */
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all user alerts
    const alerts = await db
      .select()
      .from(userAlerts)
      .where(eq(userAlerts.userId, userId));

    // Check if they have the recommended 5 default alerts
    const configured = alerts.length >= 5;

    return NextResponse.json({
      configured,
      alertCount: alerts.length,
      alerts: alerts.map(a => ({
        id: a.id,
        alertId: a.alertId,
        enabled: a.enabled,
        permissionLevel: a.permissionLevel,
      })),
    });
  } catch (error: any) {
    console.error('Dashboard get alert setup status error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to check setup status' 
    }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/alerts/setup
 * 
 * Enable all default alerts for the user during onboarding
 * Creates user_alert entries for all 5 default alerts with sensible defaults
 */
export async function POST() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the 5 default alerts
    const defaultAlerts = await db
      .select()
      .from(orchestratorAlerts)
      .where(eq(orchestratorAlerts.enabled, true))
      .limit(5);

    if (defaultAlerts.length === 0) {
      return NextResponse.json({
        error: 'No default alerts found. Database may not be seeded.',
      }, { status: 500 });
    }

    // Define permission levels for each alert type
    const permissionMap: Record<string, string> = {
      'ssh_bruteforce': 'auto',
      'disk_space': 'notify',
      'config_audit': 'notify',
      'container_health': 'auto',
      'unauthorized_access': 'auto',
    };

    // Check if user already has these alerts
    const existingAlerts = await db
      .select()
      .from(userAlerts)
      .where(eq(userAlerts.userId, userId));

    const existingAlertIds = new Set(existingAlerts.map(a => a.alertId));

    // Create user alert entries for any missing alerts
    const newAlerts = [];
    for (const alert of defaultAlerts) {
      if (!existingAlertIds.has(alert.id)) {
        newAlerts.push({
          id: nanoid(),
          userId,
          alertId: alert.id,
          enabled: true,
          permissionLevel: permissionMap[alert.id] || 'notify',
          thresholdOverrides: null,
        });
      }
    }

    if (newAlerts.length > 0) {
      await db.insert(userAlerts).values(newAlerts);
    }

    return NextResponse.json({
      success: true,
      alertsEnabled: defaultAlerts.length,
      newAlertsCreated: newAlerts.length,
      message: `${newAlerts.length} new alerts configured`,
    });
  } catch (error: any) {
    console.error('Dashboard setup alerts error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to setup alerts' 
    }, { status: 500 });
  }
}
