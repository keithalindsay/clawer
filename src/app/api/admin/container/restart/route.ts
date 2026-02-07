import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { restartContainer } from '@/lib/orchestrator';

// Admin user check
const ADMIN_USER_IDS = [process.env.ADMIN_USER_ID].filter(Boolean);

export async function POST(req: NextRequest) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const success = await restartContainer(userId);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Restart failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Admin restart error:', error);
    return NextResponse.json({ error: 'Failed to restart' }, { status: 500 });
  }
}
