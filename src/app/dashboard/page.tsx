import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { botSettings } from '@/lib/db/schema/bot-settings';
import { eq } from 'drizzle-orm';
import { getTeamConfig } from '@/lib/teams';
import { DashboardHome } from '@/components/dashboard/DashboardHome';

export default async function DashboardPage() {
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
  }

  // Redirect to onboarding if not completed
  if (!user?.onboardingCompleted) {
    redirect('/onboarding');
  }

  const isSubscribed = user?.stripeSubscriptionId !== null;
  const freeMessagesUsed = user?.freeMessagesUsed ?? 0;

  const teamTemplate = (user as any)?.teamTemplate || 'lifeos';
  const teamConfig = getTeamConfig(teamTemplate);
  const teamMembers = [...(teamConfig?.members || [])];

  // Override primary agent (first member) with user's custom bot name/emoji from onboarding
  const userBotSettings = await db.query.botSettings.findFirst({
    where: eq(botSettings.userId, userId),
  });
  if (userBotSettings && teamMembers.length > 0) {
    const customName = userBotSettings.botName;
    const customEmoji = userBotSettings.botAvatar;
    if (customName && customName !== 'Assistant') {
      teamMembers[0] = { ...teamMembers[0], name: customName };
    }
    if (customEmoji) {
      teamMembers[0] = { ...teamMembers[0], emoji: customEmoji };
    }
  }

  return (
    <DashboardHome
      userName={user?.name || clerkUser?.firstName || undefined}
      userEmail={userEmail}
      teamName={teamConfig?.name || 'Life OS'}
      teamDescription={teamConfig?.description}
      teamMembers={teamMembers}
      isSubscribed={isSubscribed}
      freeMessagesUsed={freeMessagesUsed}
      whatsappConnected={!!(user as any)?.whatsappConnected}
      telegramConnected={!!(user as any)?.telegramConnected}
    />
  );
}
