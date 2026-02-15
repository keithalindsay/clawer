/**
 * Dashboard - Main user interface after login
 * 
 * Features:
 * - Container status widget with live polling
 * - Usage statistics
 * - Quick action buttons
 * - Recent conversations
 * - Platform connection cards
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { conversations } from '@/lib/db/schema/conversations';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { LogoutButton } from '@/components/LogoutButton';
import { DiagnoseButton } from '@/components/DiagnoseButton';
import { ContainerStatusWidget } from '@/components/ContainerStatusWidget';
import { QuickActions } from '@/components/QuickActions';
import { FreeTrialBanner } from '@/components/FreeTrialBanner';
import { WelcomeToast } from '@/components/WelcomeToast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EmployeeCard } from '@/components/dashboard/EmployeeCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Suspense } from 'react';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

  // Get user from database
  let user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // Fallback: lookup by email if ID not found
  if (!user && userEmail) {
    user = await db.query.users.findFirst({
      where: eq(users.email, userEmail),
    });
    
    if (user) {
      await db.update(users).set({ id: userId }).where(eq(users.email, userEmail));
    }
  }

  // Create user if doesn't exist
  if (!user) {
    const userName = `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || undefined;
    await db.insert(users).values({
      id: userId,
      email: userEmail || 'unknown@clawer.ai',
      name: userName,
      tier: 'free',
    }).onConflictDoNothing();
    
    user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    redirect('/onboarding');
  }

  const isSubscribed = user?.stripeSubscriptionId !== null;
  const freeMessagesUsed = user?.freeMessagesUsed ?? 0;
  const FREE_MESSAGE_LIMIT = 200;
  const isFreeTrial = !isSubscribed;
  const hasFreeTrial = isFreeTrial && freeMessagesUsed < FREE_MESSAGE_LIMIT;

  // Fetch recent conversations with messages
  let recentConversations: any[] = [];
  if (isSubscribed || hasFreeTrial) {
    const convos = await db.query.conversations.findMany({
      where: and(
        eq(conversations.userId, userId),
        isNull(conversations.deletedAt)
      ),
      orderBy: [desc(conversations.lastMessageAt)],
      limit: 5,
    });

    // Map conversations to display format
    recentConversations = convos.map((convo) => ({
      id: convo.id,
      title: convo.title || 'Untitled conversation',
      lastMessageAt: convo.lastMessageAt,
      botName: 'Assistant',
      lastUserMessage: '',
      messageCount: convo.messageCount,
    }));
  }

  // Mock employee data for demonstration (replace with actual data from DB)
  const mockEmployees = recentConversations.map((convo, index) => ({
    id: convo.id,
    name: convo.title,
    status: index === 0 ? 'active' : index === 1 ? 'provisioning' : 'stopped',
    tier: 'Pro',
    lastActive: new Date(convo.lastMessageAt),
    messageCount: convo.messageCount || 0,
    channels: ['telegram', 'whatsapp'] as Array<'telegram' | 'whatsapp' | 'slack'>,
  }));

  return (
    <div className="min-h-screen" style={{ background: '#07080a' }}>
      {/* Header */}
      <header className="border-b" style={{ 
        background: 'rgba(255, 255, 255, 0.02)', 
        borderColor: 'rgba(255, 255, 255, 0.06)' 
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold" style={{ color: '#e0e1e3' }}>
            🦞 CLAWER<span className="text-blue-500">.AI</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <DiagnoseButton variant="icon" />
            <Link
              href="/dashboard/api-keys"
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#9ca0a8' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#e0e1e3';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca0a8';
                e.currentTarget.style.background = 'transparent';
              }}
              title="API Keys"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              href="/dashboard/settings"
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#9ca0a8' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#e0e1e3';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9ca0a8';
                e.currentTarget.style.background = 'transparent';
              }}
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </Link>
            <span className="hidden sm:inline text-sm" style={{ color: '#9ca0a8' }}>
              {clerkUser?.emailAddresses[0]?.emailAddress}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Toast */}
        <Suspense fallback={null}>
          <WelcomeToast />
        </Suspense>

        {/* Free Trial Banner (for users without subscription) */}
        {isFreeTrial && (
          <FreeTrialBanner
            freeMessagesUsed={freeMessagesUsed}
            freeMessageLimit={FREE_MESSAGE_LIMIT}
          />
        )}

        {(isSubscribed || hasFreeTrial) && (
          <>
            {/* Dashboard Header with Stats and Search */}
            <DashboardHeader
              userName={user?.name || clerkUser?.firstName || undefined}
              stats={{
                totalAgents: mockEmployees.length,
                activeAgents: mockEmployees.filter(e => e.status === 'active').length,
                messagesToday: user?.dailyMessageCount || 0,
              }}
            />

            {/* Employee Cards or Empty State */}
            {mockEmployees.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4 mb-8">
                {mockEmployees.map((employee, index) => (
                  <EmployeeCard key={employee.id} employee={employee} index={index} />
                ))}
              </div>
            )}

            {/* Legacy: Empty State Welcome Card (keep for fallback) */}
            {recentConversations.length === 0 && mockEmployees.length === 0 && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-6">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-3xl font-bold mb-2">👋 Welcome! Your AI assistant is ready.</h2>
                  <p className="text-blue-100 mb-6">Start chatting to unlock the power of AI for your work</p>
                  
                  <Link
                    href="/chat/assistant"
                    className="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-blue-50 transition-colors mb-8"
                  >
                    Start Chatting →
                  </Link>

                  {/* Suggested First Tasks */}
                  <div className="grid sm:grid-cols-3 gap-3 mb-6">
                    <Link
                      href="/chat/assistant?prompt=Draft%20an%20email"
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-colors text-left"
                    >
                      <div className="text-2xl mb-2">✍️</div>
                      <div className="font-semibold">Draft an email</div>
                      <div className="text-sm text-blue-100">Professional emails in seconds</div>
                    </Link>
                    <Link
                      href="/chat/assistant?prompt=Research%20a%20topic"
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-colors text-left"
                    >
                      <div className="text-2xl mb-2">🔍</div>
                      <div className="font-semibold">Research a topic</div>
                      <div className="text-sm text-blue-100">Deep insights on any subject</div>
                    </Link>
                    <Link
                      href="/chat/assistant?prompt=Brainstorm%20ideas"
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-colors text-left"
                    >
                      <div className="text-2xl mb-2">💡</div>
                      <div className="font-semibold">Brainstorm ideas</div>
                      <div className="text-sm text-blue-100">Creative solutions instantly</div>
                    </Link>
                  </div>

                  {/* Platform Connections Suggestion */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Link
                      href="/dashboard/whatsapp"
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-colors flex items-center gap-3"
                    >
                      <span className="text-3xl">📱</span>
                      <div>
                        <div className="font-semibold">Connect WhatsApp</div>
                        <div className="text-sm text-blue-100">Chat from your phone</div>
                      </div>
                    </Link>
                    <Link
                      href="/dashboard/telegram"
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-colors flex items-center gap-3"
                    >
                      <span className="text-3xl">✈️</span>
                      <div>
                        <div className="font-semibold">Connect Telegram</div>
                        <div className="text-sm text-blue-100">Chat from anywhere</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Content now handled by DashboardHeader and EmployeeCard components */}

            {/* Container Status Widget - only for paid users */}
            {isSubscribed && (
              <div className="mb-6">
                <ContainerStatusWidget />
              </div>
            )}

            {/* Platform Connections */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#e0e1e3' }}>
                Connect Your Platforms
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* WhatsApp */}
                <Link
                  href="/dashboard/whatsapp"
                  className={`p-4 rounded-xl border-2 transition-all ${
                    user?.whatsappConnected
                      ? 'border-green-500/30 hover:border-green-500/50'
                      : 'border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                  style={user?.whatsappConnected ? { background: 'rgba(34, 197, 94, 0.05)' } : { background: 'rgba(255, 255, 255, 0.02)' }}
                >
                  <div className="text-2xl mb-2">📱</div>
                  <h4 className="font-semibold mb-1" style={{ color: '#e0e1e3' }}>WhatsApp</h4>
                  <p className="text-xs mb-2" style={{ color: '#9ca0a8' }}>Chat from your phone</p>
                  {user?.whatsappConnected ? (
                    <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)' }}>
                      ✓ Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{ color: '#60a5fa', background: 'rgba(96, 165, 250, 0.15)' }}>
                      Click to setup
                    </span>
                  )}
                </Link>

                {/* Telegram */}
                <Link
                  href="/dashboard/telegram"
                  className={`p-4 rounded-xl border-2 transition-all ${
                    user?.telegramConnected
                      ? 'border-green-500/30 hover:border-green-500/50'
                      : 'border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                  style={user?.telegramConnected ? { background: 'rgba(34, 197, 94, 0.05)' } : { background: 'rgba(255, 255, 255, 0.02)' }}
                >
                  <div className="text-2xl mb-2">✈️</div>
                  <h4 className="font-semibold mb-1" style={{ color: '#e0e1e3' }}>Telegram</h4>
                  <p className="text-xs mb-2" style={{ color: '#9ca0a8' }}>Chat from anywhere</p>
                  {user?.telegramConnected ? (
                    <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)' }}>
                      ✓ Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{ color: '#60a5fa', background: 'rgba(96, 165, 250, 0.15)' }}>
                      Click to setup
                    </span>
                  )}
                </Link>

                {/* Slack */}
                <Link
                  href="/dashboard/slack"
                  className="p-4 rounded-xl border-2 border-white/[0.06] hover:border-purple-500/30 transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                >
                  <div className="text-2xl mb-2">💼</div>
                  <h4 className="font-semibold mb-1" style={{ color: '#e0e1e3' }}>Slack</h4>
                  <p className="text-xs mb-2" style={{ color: '#9ca0a8' }}>For work teams</p>
                  <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.15)' }}>
                    Coming soon
                  </span>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Manage Subscription (if subscribed) */}
        {isSubscribed && (
          <div className="mt-8 text-center">
            <form action="/api/stripe/portal" method="POST" className="inline">
              <button
                type="submit"
                className="text-sm underline transition-colors"
                style={{ color: '#9ca0a8' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#e0e1e3'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca0a8'}
              >
                Manage subscription
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
