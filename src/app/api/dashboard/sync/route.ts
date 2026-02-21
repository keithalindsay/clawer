import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agentEvents } from '@/lib/db/schema/agent-events';
import { cronJobStatus } from '@/lib/db/schema/cron-job-status';
import { users } from '@/lib/db/schema/users';
import { eq, desc } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';
import { randomUUID } from 'crypto';

/**
 * POST /api/dashboard/sync
 *
 * Triggers a sync from the user's container:
 * - Fetches recent activity events → writes to agent_events
 * - Fetches cron job status → upserts into cron_job_status
 *
 * Called by the dashboard on load and every 30 seconds.
 *
 * Response: { synced: true, eventsAdded: number }
 */
export async function POST(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Load user — need containerPort to reach the container
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { containerPort: true, gatewayToken: true },
  });

  if (!user || !user.containerPort) {
    // No container yet — nothing to sync, but not an error
    return NextResponse.json({ synced: true, eventsAdded: 0 });
  }

  const port = user.containerPort;

  // ── Figure out last sync point ────────────────────────────────────────────
  // Use the most recent event in our DB as the "since" cursor so we only
  // pull incremental events on subsequent syncs.
  const [lastEvent] = await db
    .select({ createdAt: agentEvents.createdAt })
    .from(agentEvents)
    .where(eq(agentEvents.userId, userId))
    .orderBy(desc(agentEvents.createdAt))
    .limit(1);

  const since = lastEvent?.createdAt?.toISOString() ?? undefined;

  let eventsAdded = 0;

  // ── Pull activity events from container ───────────────────────────────────
  const { data: activityData } = await containerApi.activity(port, {
    since,
    limit: 100,
  });

  if (activityData && Array.isArray((activityData as any).events)) {
    const containerEvents: Array<{
      id?: string;
      type?: string;
      agentName?: string;
      agentEmoji?: string;
      summary?: string;
      title?: string;
      details?: Record<string, unknown>;
      occurredAt?: string;
      timestamp?: string;
    }> = (activityData as any).events;

    if (containerEvents.length > 0) {
      const rows = containerEvents.map((evt) => ({
        id: randomUUID(),
        userId,
        eventType: evt.type ?? 'unknown',
        agentName: evt.agentName ?? 'Unknown',
        agentEmoji: evt.agentEmoji ?? null,
        summary: evt.summary ?? evt.title ?? '',
        details: evt.details ?? null,
        createdAt: evt.occurredAt
          ? new Date(evt.occurredAt)
          : evt.timestamp
          ? new Date(evt.timestamp)
          : new Date(),
      }));

      await db.insert(agentEvents).values(rows).onConflictDoNothing();
      eventsAdded = rows.length;
    }
  }

  // ── Pull cron status from container ──────────────────────────────────────
  const { data: cronData } = await containerApi.cronStatus(port);

  if (cronData && Array.isArray((cronData as any).jobs)) {
    const containerCrons: Array<{
      id?: string;
      name?: string;
      schedule?: string;
      lastStatus?: string;
      lastRun?: string;
      lastRunAt?: string;
      lastDurationMs?: number;
      consecutiveErrors?: number;
    }> = (cronData as any).jobs;

    for (const job of containerCrons) {
      const jobName = job.id ?? job.name ?? 'unknown';
      const lastRunAt = job.lastRun ?? job.lastRunAt;

      await db
        .insert(cronJobStatus)
        .values({
          id: randomUUID(),
          userId,
          jobName,
          schedule: job.schedule ?? '',
          lastStatus: job.lastStatus ?? 'ok',
          lastRunAt: lastRunAt ? new Date(lastRunAt) : null,
          lastDurationMs: job.lastDurationMs ?? null,
          consecutiveErrors: job.consecutiveErrors ?? 0,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [cronJobStatus.userId, cronJobStatus.jobName],
          set: {
            schedule: job.schedule ?? '',
            lastStatus: job.lastStatus ?? 'ok',
            lastRunAt: lastRunAt ? new Date(lastRunAt) : null,
            lastDurationMs: job.lastDurationMs ?? null,
            consecutiveErrors: job.consecutiveErrors ?? 0,
            updatedAt: new Date(),
          },
        });
    }
  }

  return NextResponse.json({ synced: true, eventsAdded });
}
