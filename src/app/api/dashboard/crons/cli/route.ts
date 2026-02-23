/**
 * CLI-based Cron Management API
 * 
 * Uses OpenClaw CLI inside containers instead of SSH or direct file access.
 * Provides live cron job status and management from the container.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { 
  listCrons, 
  addCron, 
  enableCron, 
  disableCron, 
  removeCron,
  cronStatus 
} from '@/lib/container-client';

/**
 * GET /api/dashboard/crons/cli
 * 
 * Returns cron jobs from the container via OpenClaw CLI.
 * Also includes scheduler status.
 * 
 * Response:
 * {
 *   crons: OpenClawCron[],
 *   scheduler: { running: boolean, jobsCount: number },
 *   error?: string
 * }
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get cron jobs from container CLI
  const { crons, error: listError } = await listCrons(userId);
  
  if (listError) {
    return NextResponse.json({ 
      crons: [], 
      scheduler: { running: false, jobsCount: 0 },
      error: listError 
    }, { status: 200 }); // Return 200 with error info for graceful fallback
  }

  // Get scheduler status
  const { running, jobsCount, error: statusError } = await cronStatus(userId);

  return NextResponse.json({
    crons,
    scheduler: { running, jobsCount },
    error: statusError,
  });
}

/**
 * POST /api/dashboard/crons/cli
 * 
 * Add a new cron job.
 * Body: { schedule: string, command: string }
 * 
 * Response:
 * {
 *   success: boolean,
 *   error?: string
 * }
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { schedule, command } = body;

    if (!schedule || !command) {
      return NextResponse.json({ 
        error: 'Missing required fields: schedule, command' 
      }, { status: 400 });
    }

    const result = await addCron(userId, schedule, command);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
