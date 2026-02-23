import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userAlerts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/dashboard/alerts/[alertId]/toggle
 * 
 * Enable or disable an alert for the authenticated user
 * Toggles the current state (enabled <-> disabled)
 */
export async function POST(
  req: Request,
  { params }: { params: { alertId: string } }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { alertId } = params;

    // Find the user alert assignment
    const [userAlert] = await db
      .select()
      .from(userAlerts)
      .where(
        and(
          eq(userAlerts.userId, userId),
          eq(userAlerts.alertId, alertId)
        )
      )
      .limit(1);

    if (!userAlert) {
      return NextResponse.json(
        { error: 'Alert assignment not found for this user' },
        { status: 404 }
      );
    }

    // Toggle the enabled state
    const newEnabledState = !userAlert.enabled;

    await db
      .update(userAlerts)
      .set({ enabled: newEnabledState })
      .where(eq(userAlerts.id, userAlert.id));

    return NextResponse.json({ 
      success: true,
      enabled: newEnabledState,
      message: `Alert ${newEnabledState ? 'enabled' : 'disabled'}`,
    });
  } catch (error: any) {
    console.error('Dashboard toggle alert error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to toggle alert' 
    }, { status: 500 });
  }
}
