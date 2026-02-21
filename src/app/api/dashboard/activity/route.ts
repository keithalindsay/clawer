import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agentEvents } from '@/lib/db/schema/agent-events';
import { eq, and, desc, gte } from 'drizzle-orm';

/**
 * GET /api/dashboard/activity
 *
 * Returns the last 50 agent events for the authenticated user, newest first.
 * Supports incremental fetching via ?since=ISO_DATE query param.
 *
 * Response: { events: AgentEvent[] }
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since');

  // Build where clause — always filter by user, optionally filter by date
  const where = since
    ? and(eq(agentEvents.userId, userId), gte(agentEvents.createdAt, new Date(since)))
    : eq(agentEvents.userId, userId);

  const events = await db
    .select()
    .from(agentEvents)
    .where(where)
    .orderBy(desc(agentEvents.createdAt))
    .limit(50);

  return NextResponse.json({ events });
}
