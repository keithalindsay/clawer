/**
 * CLI-based Hooks Management API
 * 
 * Uses OpenClaw CLI inside containers instead of SSH or direct file access.
 * Provides hook list and enable/disable functionality.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { listHooks, enableHook, disableHook } from '@/lib/container-client';

/**
 * GET /api/dashboard/hooks/cli
 * 
 * Returns hooks from the container via OpenClaw CLI.
 * 
 * Response:
 * {
 *   hooks: OpenClawHook[],
 *   error?: string
 * }
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { hooks, error } = await listHooks(userId);

  return NextResponse.json({
    hooks,
    error: error || undefined,
  });
}
