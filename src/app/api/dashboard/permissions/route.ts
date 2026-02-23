import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { permissionRequests } from '@/lib/db/schema';
import { eq, desc, and, or, lt } from 'drizzle-orm';

/**
 * GET /api/dashboard/permissions
 * 
 * List permission requests for the authenticated user
 * Returns pending requests by default, optionally include all statuses
 * 
 * Query params:
 *   - status: Filter by status (pending|approved|denied|expired|all)
 *   - limit: Max results (default 50, max 200)
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    // Auto-expire requests that have passed their expiry time
    await db
      .update(permissionRequests)
      .set({ status: 'expired' })
      .where(
        and(
          eq(permissionRequests.userId, userId),
          eq(permissionRequests.status, 'pending'),
          lt(permissionRequests.expiresAt, new Date())
        )
      );

    // Build query conditions
    const conditions = [eq(permissionRequests.userId, userId)];
    
    if (statusFilter !== 'all') {
      conditions.push(eq(permissionRequests.status, statusFilter));
    }

    const requests = await db
      .select()
      .from(permissionRequests)
      .where(and(...conditions))
      .orderBy(desc(permissionRequests.createdAt))
      .limit(limit);

    return NextResponse.json({ 
      requests,
      total: requests.length,
    });
  } catch (error: any) {
    console.error('Dashboard permissions error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch permission requests' 
    }, { status: 500 });
  }
}
