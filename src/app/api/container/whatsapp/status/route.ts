import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user's container port
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerPort: true, whatsappConnected: true },
    });

    if (!user?.containerPort) {
      return NextResponse.json({
        linked: false,
        message: 'Container not provisioned',
      });
    }

    // Get status from container
    const { data, error } = await containerApi.whatsappStatus(user.containerPort);
    
    if (error) {
      return NextResponse.json({
        linked: false,
        message: error,
      });
    }

    // Update DB if connection status changed
    if (data?.linked && user.whatsappConnected !== 1) {
      await db
        .update(users)
        .set({ whatsappConnected: 1 })
        .where(eq(users.id, userId));
    } else if (!data?.linked && user.whatsappConnected === 1) {
      await db
        .update(users)
        .set({ whatsappConnected: 0 })
        .where(eq(users.id, userId));
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Failed to get WhatsApp status:', error);
    return NextResponse.json(
      { linked: false, error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
