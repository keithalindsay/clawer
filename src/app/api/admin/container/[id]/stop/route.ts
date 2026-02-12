import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { stopContainer } from '@/lib/provisioner';

import { isAdmin } from '@/lib/admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: userId } = await params;
    
    // Validate userId is safe (Clerk format: user_XXXXX with alphanumeric)
    if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }
    const success = await stopContainer(userId);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Container stopped' });
    } else {
      return NextResponse.json({ error: 'Failed to stop container' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Admin stop error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to stop container' 
    }, { status: 500 });
  }
}
