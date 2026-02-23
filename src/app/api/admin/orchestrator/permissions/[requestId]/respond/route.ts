import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { permissionRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/admin/orchestrator/permissions/[requestId]/respond
 * 
 * Approve or deny a permission request (admin only)
 * 
 * Body: {
 *   action: 'approve' | 'deny'
 * }
 */
export async function POST(
  req: Request,
  { params }: { params: { requestId: string } }
) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await req.json();
    const { requestId } = params;

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "deny"' },
        { status: 400 }
      );
    }

    // Check if request exists and is pending
    const [request] = await db
      .select()
      .from(permissionRequests)
      .where(eq(permissionRequests.id, requestId))
      .limit(1);

    if (!request) {
      return NextResponse.json(
        { error: 'Permission request not found' },
        { status: 404 }
      );
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: `Request already ${request.status}` },
        { status: 400 }
      );
    }

    // Update request status
    await db
      .update(permissionRequests)
      .set({
        status: action === 'approve' ? 'approved' : 'denied',
        respondedAt: new Date(),
      })
      .where(eq(permissionRequests.id, requestId));

    return NextResponse.json({ 
      success: true,
      message: `Request ${action}d successfully`,
      status: action === 'approve' ? 'approved' : 'denied',
    });
  } catch (error: any) {
    console.error('Admin respond to permission error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to respond to permission request' 
    }, { status: 500 });
  }
}
