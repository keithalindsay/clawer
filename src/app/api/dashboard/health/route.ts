import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cronJobStatus } from '@/lib/db/schema/cron-job-status';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { containerApi } from '@/lib/container-client';

/**
 * GET /api/dashboard/health
 *
 * Returns system health status for the SystemHealthPill component.
 *
 * Response:
 * {
 *   status: 'healthy' | 'warning' | 'error',
 *   message: string,
 *   details: { containerStatus, modelConnected, lastSync },
 *   container: { status, uptime, port },
 *   crons: CronStatus[],
 *   models: { primary, fallback, heartbeat }
 * }
 */
export async function GET(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Load user (need containerPort)
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { containerPort: true, containerStatus: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // ── Container health (live request) ──────────────────────────────────────
  let containerHealth: {
    status: 'online' | 'offline' | 'unknown';
    uptime: number | null;
    port: number | null;
  } = {
    status: 'unknown',
    uptime: null,
    port: user.containerPort ?? null,
  };

  if (user.containerPort) {
    const { data, error } = await containerApi.health(user.containerPort);

    if (data && !error) {
      containerHealth = {
        status: 'online',
        uptime: (data as any).uptime ?? null,
        port: user.containerPort,
      };
    } else {
      containerHealth = {
        status: 'offline',
        uptime: null,
        port: user.containerPort,
      };
    }
  }

  // ── Cron status from DB ───────────────────────────────────────────────────
  const crons = await db
    .select()
    .from(cronJobStatus)
    .where(eq(cronJobStatus.userId, userId));

  // ── Model connectivity ────────────────────────────────────────────────────
  // Read from container if available; otherwise surface defaults
  let models: {
    primary: string;
    fallback: string;
    heartbeat: string | null;
  } = {
    primary: 'anthropic/claude-sonnet-4-5',
    fallback: 'minimax/kimi',
    heartbeat: null,
  };

  if (user.containerPort) {
    const { data } = await containerApi.health(user.containerPort);
    if (data) {
      // Container may expose model info in the health response
      const healthData = data as any;
      if (healthData.models) {
        models = {
          primary: healthData.models.primary ?? models.primary,
          fallback: healthData.models.fallback ?? models.fallback,
          heartbeat: healthData.models.heartbeat ?? null,
        };
      }
    }
  }

  // ── Derive top-level status for SystemHealthPill component ────────────────
  // Container online = healthy; offline/unknown with port = warning; no port = error
  let status: 'healthy' | 'warning' | 'error' = 'healthy';
  let message = 'All systems operational';

  if (containerHealth.status === 'offline') {
    status = 'warning';
    message = 'Container offline';
  } else if (containerHealth.status === 'unknown') {
    if (!user.containerPort) {
      status = 'warning';
      message = 'Container not provisioned';
    } else {
      status = 'warning';
      message = 'Checking container status...';
    }
  }

  // Check for failed crons as an additional warning signal
  const failedCrons = crons.filter((c) => c.status === 'failed');
  if (failedCrons.length > 0 && status === 'healthy') {
    status = 'warning';
    message = `${failedCrons.length} cron job${failedCrons.length > 1 ? 's' : ''} failed`;
  }

  return NextResponse.json({
    // Fields expected by SystemHealthPill
    status,
    message,
    details: {
      containerStatus: containerHealth.status === 'online' ? 'running' : containerHealth.status,
      modelConnected: containerHealth.status === 'online',
      lastSync: new Date().toISOString(),
    },
    // Extended data for detailed views
    container: containerHealth,
    crons,
    models,
  });
}
