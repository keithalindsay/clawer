/**
 * CLI-based Agents Management API
 * 
 * Uses OpenClaw CLI inside containers to list agents.
 * Provides agent list from the container.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { listAgents } from '@/lib/container-client';

/**
 * GET /api/dashboard/agents/cli
 * 
 * Returns agents from the container via OpenClaw CLI.
 * 
 * Response:
 * {
 *   agents: OpenClawAgent[],
 *   error?: string
 * }
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { agents, error } = await listAgents(userId);

  return NextResponse.json({
    agents,
    error: error || undefined,
  });
}
