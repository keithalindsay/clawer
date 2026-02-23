import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { sshExec } from '@/lib/ssh';

/**
 * GET /api/team/collaboration-status
 * 
 * Returns current collaboration status across all team agents.
 * Checks for active sessions_send/sessions_spawn calls to determine
 * if agents are currently collaborating.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    // Get user's container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerId: true, containerStatus: true },
    });

    if (!user || !user.containerId) {
      return NextResponse.json(
        { isActive: false, message: 'Container not found' },
        { status: 404 }
      );
    }

    if (user.containerStatus !== 'running') {
      return NextResponse.json(
        { isActive: false, message: 'Container not running' },
        { status: 200 }
      );
    }

    // Check for active collaboration status file
    // This file is updated by the container's session monitoring hooks
    const statusPath = '/home/user/.openclaw/collaboration-status.json';

    const { stdout, stderr } = await sshExec(
      `docker exec ${user.containerId} sh -c 'if [ -f ${statusPath} ]; then cat ${statusPath}; else echo "{}"; fi'`
    );

    if (stderr && !stderr.includes('No such file')) {
      console.error('Error reading collaboration status:', stderr);
      return NextResponse.json({ isActive: false });
    }

    try {
      const status = JSON.parse(stdout || '{}');

      // If agentId provided, filter to that agent's activity
      if (agentId) {
        const agentStatus = status[agentId];
        if (!agentStatus || !agentStatus.isActive) {
          return NextResponse.json({ isActive: false });
        }
        return NextResponse.json(agentStatus);
      }

      // Return most recent active collaboration across all agents
      const activeCollaborations = Object.values(status).filter(
        (s: any) => s.isActive
      );

      if (activeCollaborations.length === 0) {
        return NextResponse.json({ isActive: false });
      }

      // Return the most recent one
      const mostRecent = activeCollaborations.sort(
        (a: any, b: any) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )[0];

      return NextResponse.json(mostRecent);

    } catch (parseError) {
      console.error('Failed to parse collaboration status:', parseError);
      return NextResponse.json({ isActive: false });
    }

  } catch (error) {
    console.error('Failed to fetch collaboration status:', error);
    return NextResponse.json(
      { isActive: false, error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
