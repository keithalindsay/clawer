import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { agentEvents } from '@/lib/db/schema/agent-events';
import { eq, and, gte, desc, inArray } from 'drizzle-orm';

/**
 * GET /api/dashboard/briefing
 *
 * Returns whether morning briefing is enabled and today's briefing content (if any).
 * Briefings are stored as agent_events with eventType in ['briefing', 'morning_briefing'].
 *
 * Response: {
 *   enabled: boolean,
 *   briefing: { content: string; createdAt: string } | null
 * }
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if briefing is enabled for this user
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { briefingEnabled: true },
  });

  const enabled = Boolean(user?.briefingEnabled);

  if (!enabled) {
    return NextResponse.json({ enabled: false, briefing: null });
  }

  // Look for a briefing event from today
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const briefingEvent = await db
    .select({
      summary: agentEvents.summary,
      details: agentEvents.details,
      createdAt: agentEvents.createdAt,
    })
    .from(agentEvents)
    .where(
      and(
        eq(agentEvents.userId, userId),
        gte(agentEvents.createdAt, todayStart),
        inArray(agentEvents.eventType, ['briefing', 'morning_briefing', 'daily_briefing'])
      )
    )
    .orderBy(desc(agentEvents.createdAt))
    .limit(1);

  const event = briefingEvent[0] ?? null;

  let content: string | null = null;
  if (event) {
    // Prefer full content from details, fall back to summary
    const details = event.details as Record<string, unknown> | null;
    content = (details?.content as string) ?? (details?.body as string) ?? event.summary;
  }

  return NextResponse.json({
    enabled: true,
    briefing: content
      ? { content, createdAt: event!.createdAt.toISOString() }
      : null,
  });
}
