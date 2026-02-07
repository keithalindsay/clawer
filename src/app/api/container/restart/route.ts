import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { restartContainer } from '@/lib/orchestrator';

export async function POST() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await restartContainer(userId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Container restarted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to restart container' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to restart container:', error);
    return NextResponse.json(
      { error: 'Failed to restart container' },
      { status: 500 }
    );
  }
}
