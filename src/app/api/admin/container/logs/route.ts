import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Admin user check
const ADMIN_USER_IDS = [process.env.ADMIN_USER_ID].filter(Boolean);

export async function GET(req: NextRequest) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = req.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const containerName = `clawer_user_${userId}`;
    
    const { stdout } = await execAsync(`docker logs --tail 100 ${containerName} 2>&1`);
    
    return NextResponse.json({ logs: stdout });
  } catch (error: any) {
    console.error('Admin logs error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get logs' 
    }, { status: 500 });
  }
}
