/**
 * CLI-based Hook Management API
 * 
 * Handles enable/disable operations on hooks.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { enableHook, disableHook } from '@/lib/container-client';

interface RouteParams {
  params: Promise<{
    action: string;
    hookId: string;
  }>;
}

/**
 * POST /api/dashboard/hooks/cli/[action]/[hookId]
 * 
 * Actions:
 * - enable: Enable a hook
 * - disable: Disable a hook
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

  const { action, hookId } = await params;

  // Validate action
  if (!['enable', 'disable'].includes(action)) {
    return NextResponse.json({ 
      error: `Invalid action: ${action}. Must be enable or disable` 
    }, { status: 400 });
  }

  // Validate hookId
  if (!hookId) {
    return NextResponse.json({ 
      error: 'Missing hookId parameter' 
    }, { status: 400 });
  }

  let result: { success: boolean; error: string | null };

  try {
    switch (action) {
      case 'enable':
        result = await enableHook(userId, hookId);
        break;
      case 'disable':
        result = await disableHook(userId, hookId);
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
