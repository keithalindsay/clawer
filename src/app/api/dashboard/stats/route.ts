import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema/tasks';
import { agentEvents } from '@/lib/db/schema/agent-events';
import { users } from '@/lib/db/schema/users';
import { getTeamConfig } from '@/lib/teams';
import { eq, and, gte, count } from 'drizzle-orm';

/**
 * GET /api/dashboard/stats
 *
 * Returns today's operational stats for the authenticated user.
 *
 * Response: { messagesToday, tasksCompleted, eventsToday, activeAgents }
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Start of today (midnight UTC)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  let messagesToday = 0;
  let tasksCompleted = 0;
  let eventsToday = 0;
  let activeAgents = 0;

  try {
    // Messages today — use dailyMessageCount from user record (already tracked + reset at midnight)
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        dailyMessageCount: true,
        dailyResetAt: true,
        teamTemplate: true,
      },
    });

    // Only count if the daily reset happened today (guard against stale counts)
    const resetAt = user?.dailyResetAt ? new Date(user.dailyResetAt) : null;
    messagesToday =
      resetAt && resetAt >= todayStart ? (user?.dailyMessageCount ?? 0) : 0;

    // Active agents — derived from the user's configured team template
    const teamTemplate = user?.teamTemplate ?? 'lifeos';
    const teamConfig = getTeamConfig(teamTemplate);
    activeAgents = teamConfig?.members?.length ?? 0;
  } catch {
    // Non-fatal — return zeros for this stat
  }

  try {
    // Tasks completed today
    const result = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.status, 'done'),
          gte(tasks.completedAt, todayStart)
        )
      );
    tasksCompleted = result[0]?.count ?? 0;
  } catch {
    // Non-fatal
  }

  try {
    // Agent events today
    const result = await db
      .select({ count: count() })
      .from(agentEvents)
      .where(
        and(
          eq(agentEvents.userId, userId),
          gte(agentEvents.createdAt, todayStart)
        )
      );
    eventsToday = result[0]?.count ?? 0;
  } catch {
    // Non-fatal
  }

  return NextResponse.json({
    messagesToday,
    tasksCompleted,
    eventsToday,
    activeAgents,
  });
}
