import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { getContainerStatus } from '@/lib/orchestrator';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerPort: true,
        containerStatus: true,
        containerId: true,
        whatsappConnected: true,
        telegramConnected: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no container provisioned yet
    if (!user.containerPort || !user.containerId) {
      return NextResponse.json({
        status: 'not_provisioned',
        port: null,
        whatsappConnected: false,
        telegramConnected: false,
      });
    }

    // Get live container status
    const liveStatus = await getContainerStatus(userId);

    return NextResponse.json({
      status: liveStatus,
      port: user.containerPort,
      whatsappConnected: user.whatsappConnected === 1,
      telegramConnected: user.telegramConnected === 1,
    });

  } catch (error) {
    console.error('Failed to get container status:', error);
    return NextResponse.json(
      { error: 'Failed to get container status' },
      { status: 500 }
    );
  }
}
