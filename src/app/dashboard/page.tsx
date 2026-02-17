import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
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
  const teamMembers = teamConfig?.members || [];

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
