import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { desc } from 'drizzle-orm';

const ADMIN_USER_IDS = ['user_39PgWfJYYrb2T36BqfnRgtwlsfM'];

export async function GET() {
  const { userId: adminId } = await auth();
  
  if (!adminId || !ADMIN_USER_IDS.includes(adminId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        tier: users.tier,
        stripeSubscriptionId: users.stripeSubscriptionId,
        containerId: users.containerId,
        containerPort: users.containerPort,
        containerStatus: users.containerStatus,
        whatsappConnected: users.whatsappConnected,
        telegramConnected: users.telegramConnected,
        dailyMessageCount: users.dailyMessageCount,
        monthlyMessageCount: users.monthlyMessageCount,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.updatedAt))
      .limit(200);

    return NextResponse.json({ users: allUsers });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get users' 
    }, { status: 500 });
  }
}
