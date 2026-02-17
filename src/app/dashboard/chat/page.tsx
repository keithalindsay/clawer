import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { getTeamConfig } from '@/lib/teams';
import { DashboardWorkspace } from '@/components/dashboard/DashboardWorkspace';

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
  const FREE_MESSAGE_LIMIT = 200;

  const teamTemplate = (user as any)?.teamTemplate || 'lifeos';
  const teamConfig = getTeamConfig(teamTemplate);
  const teamMembers = teamConfig?.members || [];

  return (
    <DashboardWorkspace
      userName={user?.name || clerkUser?.firstName || undefined}
      userEmail={userEmail}
      teamName={teamConfig?.name || 'Life OS'}
      teamDescription={teamConfig?.description}
      teamMembers={teamMembers}
      whatsappConnected={!!(user as any)?.whatsappConnected}
      telegramConnected={!!(user as any)?.telegramConnected}
      isSubscribed={isSubscribed}
      freeMessagesUsed={freeMessagesUsed}
      freeMessageLimit={FREE_MESSAGE_LIMIT}
      initialAgentId={initialAgentId}
      initialPrompt={initialPrompt}
    />
  );
}
