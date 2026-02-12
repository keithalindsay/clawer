import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { sshExec } from '@/lib/ssh';

export async function GET(req: NextRequest) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    // Validate userId is safe (Clerk format: user_XXXXX with alphanumeric)
    if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const containerName = `clawer_user_${userId}`;
    
    const { stdout } = await sshExec(`docker logs --tail 100 ${containerName} 2>&1`);
    
    return NextResponse.json({ logs: stdout });
  } catch (error: any) {
    console.error('Admin logs error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get logs' 
    }, { status: 500 });
  }
}
