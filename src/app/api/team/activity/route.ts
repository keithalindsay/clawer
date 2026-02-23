import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { sshExec } from '@/lib/ssh';

interface AgentActivity {
  id: string;
  timestamp: string;
  fromAgent: string;
  toAgent: string;
  action: 'delegate' | 'complete' | 'collaborate';
  summary: string;
  details?: string;
}

/**
 * GET /api/team/activity
 * 
 * Returns recent inter-agent activity from container's session logs.
 * Parses OpenClaw session history for sessions_send/sessions_spawn calls
 * between team agents.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user's container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerId: true, containerStatus: true },
    });

    if (!user || !user.containerId) {
      return NextResponse.json(
        { error: 'Container not found' },
        { status: 404 }
      );
    }

    if (user.containerStatus !== 'running') {
      return NextResponse.json(
        { error: 'Container not running' },
        { status: 503 }
      );
    }

    // Read agent activity log from container
    // This file is written by the container's session monitoring system
    const activityLogPath = '/home/user/.openclaw/agent-activity.jsonl';

    const { stdout, stderr } = await sshExec(
      `docker exec ${user.containerId} sh -c 'if [ -f ${activityLogPath} ]; then tail -n ${limit} ${activityLogPath}; else echo "[]"; fi'`
    );

    if (stderr && !stderr.includes('No such file')) {
      console.error('Error reading agent activity:', stderr);
    }

    // Parse JSONL (one JSON object per line)
    const activities: AgentActivity[] = [];
    const lines = stdout.trim().split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const activity = JSON.parse(line);
        activities.push(activity);
      } catch (err) {
        console.error('Failed to parse activity line:', line, err);
      }
    }

    // Sort by timestamp descending (newest first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      activities: activities.slice(0, limit),
      count: activities.length,
    });

  } catch (error) {
    console.error('Failed to fetch agent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/activity
 * 
 * Log inter-agent activity (called by container's session hooks).
 * This is called automatically when agents use sessions_send/sessions_spawn.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const activity: AgentActivity = await request.json();

    // Validate activity structure
    if (!activity.fromAgent || !activity.toAgent || !activity.action || !activity.summary) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerId: true },
    });

    if (!user || !user.containerId) {
      return NextResponse.json(
        { error: 'Container not found' },
        { status: 404 }
      );
    }

    // Add timestamp and ID if not provided
    const activityRecord = {
      id: activity.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: activity.timestamp || new Date().toISOString(),
      ...activity,
    };

    // Append to activity log in container
    const activityLogPath = '/home/user/.openclaw/agent-activity.jsonl';
    const escapedJson = JSON.stringify(JSON.stringify(activityRecord));

    await sshExec(
      `docker exec ${user.containerId} sh -c 'echo ${escapedJson} >> ${activityLogPath}'`
    );

    return NextResponse.json({ success: true, id: activityRecord.id });

  } catch (error) {
    console.error('Failed to log agent activity:', error);
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
