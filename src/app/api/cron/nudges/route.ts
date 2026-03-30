/**
 * GET /api/cron/nudges
 *
 * Vercel Cron endpoint — fires every 10 minutes.
 * Reads pending nudges from each active MomBrain user's container,
 * sends them via Expo Push API, and updates their status to 'sent'.
 *
 * Security: Only accepts requests that carry the CRON_SECRET header.
 * Vercel Cron automatically adds `Authorization: Bearer <CRON_SECRET>`
 * when `vercel.json` defines the schedule; we also accept it via the
 * `x-cron-secret` header for local / manual testing.
 *
 * Vercel docs: https://vercel.com/docs/cron-jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { runNudgeSender } from '@/lib/cron/nudge-sender';

// Tell Next.js this route is always dynamic (no static generation)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron/nudges] CRON_SECRET env var is not set');
    return NextResponse.json(
      { success: false, error: 'Cron not configured' },
      { status: 500 }
    );
  }

  // Vercel sends: Authorization: Bearer <secret>
  const authHeader = req.headers.get('authorization');
  const xCronSecret = req.headers.get('x-cron-secret');

  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  const isAuthorized =
    (bearerToken && bearerToken === cronSecret) ||
    (xCronSecret && xCronSecret === cronSecret);

  if (!isAuthorized) {
    console.warn('[cron/nudges] Unauthorized cron request');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ── Run ───────────────────────────────────────────────────────────────────
  console.log('[cron/nudges] Starting nudge sender run…');

  let summary;
  try {
    summary = await runNudgeSender();
  } catch (err: any) {
    console.error('[cron/nudges] Unhandled error in nudge sender:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal error',
      },
      { status: 500 }
    );
  }

  // ── Response ──────────────────────────────────────────────────────────────
  const hadErrors = summary.errors.length > 0;

  return NextResponse.json(
    {
      success: true,
      summary: {
        ranAt: summary.ranAt,
        processedUsers: summary.processedUsers,
        totalNudgesSent: summary.totalNudgesSent,
        totalNudgesSkipped: summary.totalNudgesSkipped,
        errorCount: summary.errors.length,
        // Only surface per-user error messages in the response for observability;
        // detailed per-nudge data is logged server-side.
        errors: hadErrors ? summary.errors : undefined,
      },
    },
    { status: 200 }
  );
}
