import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { conversations } from '@/lib/db/schema/conversations';
import { botSettings } from '@/lib/db/schema/bot-settings';
import { eq, and, isNull } from 'drizzle-orm';
import { getTeamConfig } from '@/lib/teams';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { resolveUserFilesDir, listFiles } from '@/lib/files';
import type { MemoryStats } from '@/components/dashboard/MemoryCard';
import fs from 'fs/promises';

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

  // ── Memory stats ──────────────────────────────────────────────────────────
  let memoryStats: MemoryStats | undefined;
  try {
    const daysSinceSignup = Math.max(
      0,
      Math.floor((Date.now() - new Date(user!.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    );

    // Conversation count
    const allConvs = await db.query.conversations.findMany({
      where: and(eq(conversations.userId, userId), isNull(conversations.deletedAt)),
      columns: { id: true },
    });

    // File count
    let fileCount = 0;
    let containerAvailable = false;
    try {
      const baseDir = await resolveUserFilesDir(userId);
      const tree = await listFiles(baseDir);
      fileCount = tree.totalFiles;
      containerAvailable = true;
    } catch {
      // Container not provisioned yet
    }

    // MEMORY.md facts
    let memoryFacts = 0;
    let memoryTopics: string[] = [];
    try {
      const containerName = `clawer_user_${userId}`;
      const memPath = `/opt/clawer/userdata/${containerName}/clawd/MEMORY.md`;
      const memContent = await fs.readFile(memPath, 'utf-8');
      const lines = memContent.split('\n');
      const nonBlank = lines.filter((l) => l.trim().length > 0);
      memoryFacts = nonBlank.length;
      memoryTopics = nonBlank
        .filter((l) => l.trimStart().startsWith('#'))
        .map((l) => l.replace(/^#+\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 10);
    } catch {
      // MEMORY.md doesn't exist yet
    }

    memoryStats = {
      daysSinceSignup,
      conversationCount: allConvs.length,
      fileCount,
      memoryFacts,
      memoryTopics,
      containerAvailable,
    };
  } catch {
    // Non-fatal — dashboard still works without memory stats
  }

  return (
    <DashboardHome
      userName={user?.name || clerkUser?.firstName || undefined}
      userEmail={userEmail}
      teamName={teamConfig?.name || 'Personal Assistant'}
      teamDescription={teamConfig?.description}
      teamMembers={teamMembers}
      isSubscribed={isSubscribed}
      freeMessagesUsed={freeMessagesUsed}
      whatsappConnected={!!(user as any)?.whatsappConnected}
      telegramConnected={!!(user as any)?.telegramConnected}
      memoryStats={memoryStats}
    />
  );
}
