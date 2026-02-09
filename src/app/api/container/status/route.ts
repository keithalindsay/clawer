import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

/**
 * GET /api/container/status
 * Returns container health status for the authenticated user
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate uptime if container is running
    let uptimeSeconds = 0;
    if (user.containerCreatedAt && user.containerStatus === 'running') {
      const now = new Date();
      const created = new Date(user.containerCreatedAt);
      uptimeSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
    }

    // Determine model based on tier
    const modelMap: Record<string, string> = {
      free: 'Qwen3 14B',
      basic: 'Kimi Flash',
      pro: 'Claude Sonnet 4',
      enterprise: 'Claude Opus 4',
    };

    const model = modelMap[user.tier] || 'Unknown';

    // Return status
    return NextResponse.json({
      status: user.containerStatus || 'offline',
      model,
      uptime: uptimeSeconds,
      containerId: user.containerId,
      tier: user.tier,
    });
  } catch (error) {
    console.error('Container status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch container status' },
      { status: 500 }
    );
  }
}
