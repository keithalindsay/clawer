import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { orchestratorAlerts } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

/**
 * GET /api/admin/orchestrator/alerts
 * 
 * List all alert definitions (admin only)
 * Returns all orchestrator alert templates and custom alerts
 */
export async function GET() {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const alerts = await db
      .select()
      .from(orchestratorAlerts)
      .orderBy(orchestratorAlerts.severity, orchestratorAlerts.name);

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error('Admin get alerts error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch alerts' 
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/orchestrator/alerts
 * 
 * Create or update an alert definition (admin only)
 * 
 * Body: {
 *   id?: string,  // If provided, updates existing; if omitted, creates new
 *   name: string,
 *   description?: string,
 *   checkScript: string,
 *   schedule: string,
 *   action?: 'notify' | 'auto' | 'approve',
 *   severity?: 'info' | 'warning' | 'critical',
 *   enabled?: boolean
 * }
 */
export async function POST(req: Request) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      name,
      description,
      checkScript,
      schedule,
      action = 'notify',
      severity = 'warning',
      enabled = true,
    } = body;

    // Validation
    if (!name || !checkScript || !schedule) {
      return NextResponse.json(
        { error: 'Missing required fields: name, checkScript, schedule' },
        { status: 400 }
      );
    }

    const alertId = id || nanoid();

    // Insert or update
    await db
      .insert(orchestratorAlerts)
      .values({
        id: alertId,
        name,
        description,
        checkScript,
        schedule,
        action,
        severity,
        enabled,
      })
      .onConflictDoUpdate({
        target: orchestratorAlerts.id,
        set: {
          name,
          description,
          checkScript,
          schedule,
          action,
          severity,
          enabled,
        },
      });

    return NextResponse.json({ 
      success: true, 
      alertId,
      message: id ? 'Alert updated' : 'Alert created'
    });
  } catch (error: any) {
    console.error('Admin create/update alert error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to save alert' 
    }, { status: 500 });
  }
}
