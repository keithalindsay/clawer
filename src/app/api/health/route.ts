/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring.
 * Checks: database connectivity, production server reachability.
 * No auth required — used by uptime monitors.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
  const start = Date.now();

  // Check 1: Database connectivity
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (error: any) {
    checks.database = { ok: false, error: error.message || 'Database unreachable' };
  }

  // Check 2: Production server (optional, skip if not configured)
  if (process.env.PRODUCTION_SERVER) {
    try {
      const { sshExec } = await import('@/lib/ssh');
      const sshStart = Date.now();
      await sshExec('echo ok', 5000);
      checks.productionServer = { ok: true, latencyMs: Date.now() - sshStart };
    } catch (error: any) {
      checks.productionServer = { ok: false, error: error.message || 'SSH unreachable' };
    }
  }

  // Overall status
  const allOk = Object.values(checks).every(c => c.ok);
  const totalMs = Date.now() - start;

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      totalMs,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
