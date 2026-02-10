import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { restartContainer } from '@/lib/provisioner';

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || 'user_39PgWfJYYrb2T36BqfnRgtwlsfM').split(',');

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: userId } = await params;
    
    // Validate userId is safe (Clerk format: user_XXXXX with alphanumeric)
    if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }
    const success = await restartContainer(userId);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Container restarted' });
    } else {
      return NextResponse.json({ error: 'Failed to restart container' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Admin restart error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to restart container' 
    }, { status: 500 });
  }
}
