import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { permissionRequests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/dashboard/permissions/[requestId]/respond
 * 
 * User approves or denies a permission request
 * 
 * Body: {
 *   action: 'approve' | 'deny'
 * }
 */
export async function POST(
  req: Request,
  { params }: { params: { requestId: string } }
) {
  const { userId } = await auth();
  
  if (!userId) {
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

    // Check if request exists, belongs to this user, and is pending
    const [request] = await db
      .select()
      .from(permissionRequests)
      .where(
        and(
          eq(permissionRequests.id, requestId),
          eq(permissionRequests.userId, userId)
        )
      )
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

    // Check if expired
    if (request.expiresAt && new Date() > request.expiresAt) {
      await db
        .update(permissionRequests)
        .set({ status: 'expired' })
        .where(eq(permissionRequests.id, requestId));

      return NextResponse.json(
        { error: 'Request has expired' },
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
    console.error('Dashboard respond to permission error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to respond to permission request' 
    }, { status: 500 });
  }
}
