/**
 * CLI-based Cron Job Management API
 * 
 * Handles enable/disable/remove operations on individual cron jobs.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { enableCron, disableCron, removeCron } from '@/lib/container-client';

interface RouteParams {
  params: Promise<{
    action: string;
    cronId: string;
  }>;
}

/**
 * POST /api/dashboard/crons/cli/[action]/[cronId]
 * 
 * Actions:
 * - enable: Enable a cron job
 * - disable: Disable a cron job
 * - remove: Remove a cron job
 * 
 * Response:
 * {
 *   success: boolean,
 *   error?: string
 * }
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, cronId } = await params;

  // Validate action
  if (!['enable', 'disable', 'remove'].includes(action)) {
    return NextResponse.json({ 
      error: `Invalid action: ${action}. Must be enable, disable, or remove` 
    }, { status: 400 });
  }

  // Validate cronId
  if (!cronId) {
    return NextResponse.json({ 
      error: 'Missing cronId parameter' 
    }, { status: 400 });
  }

  let result: { success: boolean; error: string | null };

  try {
    switch (action) {
      case 'enable':
        result = await enableCron(userId, cronId);
        break;
      case 'disable':
        result = await disableCron(userId, cronId);
        break;
      case 'remove':
        result = await removeCron(userId, cronId);
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }

    if (result.error) {
      return NextResponse.json(result, { status: 200 }); // Graceful error
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
