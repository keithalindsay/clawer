import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { unauthorized, notFound, serverError } from '@/lib/api-errors';

/**
 * GET /api/container/status
 * Returns container health status for the authenticated user
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return unauthorized();
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return notFound('User');
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
  } catch (error: any) {
    console.error('Container status error:', error);
    return serverError('Failed to fetch container status', error.message);
  }
}
