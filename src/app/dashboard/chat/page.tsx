import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { botSettings } from '@/lib/db/schema/bot-settings';
import { customAgents } from '@/lib/db/schema/custom-agents';
import { eq } from 'drizzle-orm';
import { getTeamConfig } from '@/lib/teams';
import { DashboardWorkspace } from '@/components/dashboard/DashboardWorkspace';
import { FREE_MESSAGE_LIMIT } from '@/lib/constants';

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ agent?: string; prompt?: string }> }) {
  const { agent: initialAgentId, prompt: initialPrompt } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

  let user = await db.query.users.findFirst({ where: eq(users.id, userId) });

  if (!user && userEmail) {
    user = await db.query.users.findFirst({ where: eq(users.email, userEmail) });
    if (user) await db.update(users).set({ id: userId }).where(eq(users.email, userEmail));
  }

  if (!user) {
    const userName = `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || undefined;
    await db.insert(users).values({
      id: userId,
      email: userEmail || 'unknown@clawer.ai',
      name: userName,
      tier: 'free',
    }).onConflictDoNothing();
    user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    redirect('/onboarding');
  }

  const isSubscribed = user?.stripeSubscriptionId !== null;
  const freeMessagesUsed = user?.freeMessagesUsed ?? 0;

  const teamTemplate = (user as any)?.teamTemplate || 'lifeos';
  const teamConfig = getTeamConfig(teamTemplate);
  const teamMembers = [...(teamConfig?.members || [])];

  // Override primary agent with user's custom bot name/emoji
  const userBotSettings = await db.query.botSettings.findFirst({
    where: eq(botSettings.userId, userId),
  });
  if (userBotSettings && teamMembers.length > 0) {
    if (userBotSettings.botName && userBotSettings.botName !== 'Assistant') {
      teamMembers[0] = { ...teamMembers[0], name: userBotSettings.botName };
    }
    if (userBotSettings.botAvatar) {
      teamMembers[0] = { ...teamMembers[0], emoji: userBotSettings.botAvatar };
    }
  }

  // Fetch and add custom agents to the team members list
  const userCustomAgents = await db.query.customAgents.findMany({
    where: eq(customAgents.userId, userId),
    orderBy: (agents, { desc }) => [desc(agents.createdAt)],
  });
  
  // Add custom agents to teamMembers
  for (const agent of userCustomAgents) {
    teamMembers.push({
      id: agent.agentId,
      name: agent.name,
      role: agent.role || 'Assistant',
      emoji: agent.emoji || '🤖',
      description: agent.personality || '',
      triggers: agent.triggers || [],
      quickPrompts: agent.quickPrompts || [],
    });
  }

  return (
    <DashboardWorkspace
      userName={user?.name || clerkUser?.firstName || undefined}
      userEmail={userEmail}
      teamName={teamConfig?.name || 'Personal Assistant'}
      teamDescription={teamConfig?.description}
      teamMembers={teamMembers}
      whatsappConnected={!!(user as any)?.whatsappConnected}
      telegramConnected={!!(user as any)?.telegramConnected}
      isSubscribed={isSubscribed}
      freeMessagesUsed={freeMessagesUsed}
      freeMessageLimit={FREE_MESSAGE_LIMIT}
      initialAgentId={initialAgentId}
      initialPrompt={initialPrompt}
      teamTemplate={teamTemplate}
    />
  );
}
