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
 * Returns container health, model connectivity, and cron job status.
 * Container health is fetched live; cron status is served from DB
 * (populated by /api/dashboard/sync).
 *
 * Response:
 * {
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

  return NextResponse.json({
    container: containerHealth,
    crons,
    models,
  });
}
