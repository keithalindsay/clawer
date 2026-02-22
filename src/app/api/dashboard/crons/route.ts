import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cronJobStatus } from '@/lib/db/schema/cron-job-status';
import { agentEvents } from '@/lib/db/schema/agent-events';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/dashboard/crons
 *
 * Returns all cron job statuses for the authenticated user.
 * Also includes the last 20 cron_run events for history timeline.
 *
 * Response:
 * {
 *   jobs: CronJobStatus[],
 *   history: AgentEvent[] (cron_run events, newest first),
 * }
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Cron job statuses from DB ─────────────────────────────────────────────
  const jobs = await db
    .select()
    .from(cronJobStatus)
    .where(eq(cronJobStatus.userId, userId))
    .orderBy(cronJobStatus.jobName);

  // ── Recent cron run history from agent_events ─────────────────────────────
  const history = await db
    .select()
    .from(agentEvents)
    .where(
      and(
        eq(agentEvents.userId, userId),
        eq(agentEvents.eventType, 'cron_run')
      )
    )
    .orderBy(desc(agentEvents.createdAt))
    .limit(20);

  return NextResponse.json({ jobs, history });
}
