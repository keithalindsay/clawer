import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { agentEvents } from '@/lib/db/schema/agent-events';
import { botSettings } from '@/lib/db/schema/bot-settings';
import { eq, desc, and } from 'drizzle-orm';
import { getTeamConfig } from '@/lib/teams';
import { containerApi } from '@/lib/container-client';

export interface TeamMemberStatus {
  id: string;
  name: string;
  role: string;
  emoji: string;
  /** 'active' = container online OR events in last 15 min; 'idle' = events today; 'offline' = container down */
  status: 'active' | 'idle' | 'offline';
  lastActivityAt: string | null;
  lastActivitySummary: string | null;
}

/**
 * GET /api/dashboard/team-status
 *
 * Returns team member list enriched with live activity status.
 * Status is primarily based on container health (all agents share one container).
 * If container is online, agents show as 'active'. Events provide secondary details.
 *
 * Response: { members: TeamMemberStatus[] }
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Load user for team template + container port
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { teamTemplate: true, containerPort: true },
  });

  const templateName = (user as any)?.teamTemplate || 'lifeos';
  const teamConfig = getTeamConfig(templateName);
  const members = teamConfig?.members || [];

  // Check container health - all agents share one container
  let containerOnline = false;
  if (user?.containerPort) {
    const { data, error } = await containerApi.health(user.containerPort);
    containerOnline = !error && !!data;
  }

  // Load custom bot name/emoji from onboarding
  const userBotSettings = await db.query.botSettings.findFirst({
    where: eq(botSettings.userId, userId),
  });

  // Override first member with custom settings if set
  const enrichedMembers = members.map((m, idx) => {
    if (idx === 0 && userBotSettings) {
      return {
        ...m,
        name: (userBotSettings.botName && userBotSettings.botName !== 'Assistant')
          ? userBotSettings.botName
          : m.name,
        emoji: userBotSettings.botAvatar || m.emoji || '🤖',
      };
    }
    return { ...m, emoji: m.emoji || '🤖' };
  });

  // Get last event per agent name for activity details
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  // Fetch last event per team member (filtered by userId!)
  const statuses: TeamMemberStatus[] = await Promise.all(
    enrichedMembers.map(async (member) => {
      // Targeted query per agent - now correctly filtered by userId
      const agentLastEvent = await db
        .select({
          summary: agentEvents.summary,
          createdAt: agentEvents.createdAt,
        })
        .from(agentEvents)
        .where(and(
          eq(agentEvents.userId, userId),
          eq(agentEvents.agentName, member.name)
        ))
        .orderBy(desc(agentEvents.createdAt))
        .limit(1);

      const lastActivity = agentLastEvent[0] ?? null;
      const lastAt = lastActivity ? new Date(lastActivity.createdAt) : null;

      // Primary status based on container health
      // If container is online, all agents are available (they share one container)
      let status: 'active' | 'idle' | 'offline' = containerOnline ? 'active' : 'offline';

      // Secondary refinement: if container is online but no recent activity, show as 'idle'
      // This provides more nuanced info when we have event data
      if (containerOnline && lastAt) {
        if (lastAt >= fifteenMinAgo) {
          status = 'active';
        } else if (lastAt >= todayStart) {
          status = 'idle';
        }
        // If events exist but are old, still show as 'active' since container is up
        // (agent is available even if not recently used)
      }

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        emoji: member.emoji,
        status,
        lastActivityAt: lastAt ? lastAt.toISOString() : null,
        lastActivitySummary: lastActivity?.summary ?? null,
      };
    })
  );

  return NextResponse.json({ members: statuses });
}
