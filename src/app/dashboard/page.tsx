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
  const FREE_MESSAGE_LIMIT = 50;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <DiagnoseButton variant="icon" />
            <Link
              href="/dashboard/api-keys"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="API Keys"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              href="/dashboard/settings"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </Link>
            <span className="hidden sm:inline text-sm text-gray-600">
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
            {/* Container Status Widget - only for paid users */}
            {isSubscribed && <ContainerStatusWidget />}

            {/* Main Grid: Stats + Actions */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
              {/* Usage Stats Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Usage Today</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-blue-600">
                        {user?.dailyMessageCount || 0}
                      </span>
                      <span className="text-sm text-gray-500">messages today</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {isSubscribed ? 'Unlimited on your plan' : `${Math.max(0, FREE_MESSAGE_LIMIT - freeMessagesUsed)} free messages remaining`}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">This month:</span>
                      <span className="font-medium text-gray-900">
                        {user?.monthlyMessageCount || 0}
                      </span>
                    </div>
                    {isFreeTrial && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Free trial:</span>
                        <span className="font-medium text-blue-600">
                          {freeMessagesUsed} / {FREE_MESSAGE_LIMIT}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <QuickActions />
              </div>
            </div>

            {/* Recent Conversations */}
            {recentConversations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Conversations</h3>
                  <Link
                    href="/dashboard/conversations"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentConversations.map((convo) => (
                    <Link
                      key={convo.id}
                      href={`/chat/assistant?conversation=${convo.id}`}
                      className="block p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">💬</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {convo.title}
                            </h4>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(convo.lastMessageAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">
                            {convo.lastUserMessage || 'No messages yet'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {convo.messageCount} messages
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {convo.botName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Connections */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Connect Your Platforms
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* WhatsApp */}
                <Link
                  href="/dashboard/whatsapp"
                  className={`p-4 rounded-xl border-2 transition-all ${
                    user?.whatsappConnected
                      ? 'border-green-300 bg-green-50 hover:bg-green-100'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-2xl mb-2">📱</div>
                  <h4 className="font-semibold text-gray-900 mb-1">WhatsApp</h4>
                  <p className="text-xs text-gray-600 mb-2">Chat from your phone</p>
                  {user?.whatsappConnected ? (
                    <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      ✓ Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                      Click to setup
                    </span>
                  )}
                </Link>

                {/* Telegram */}
                <Link
                  href="/dashboard/telegram"
                  className={`p-4 rounded-xl border-2 transition-all ${
                    user?.telegramConnected
                      ? 'border-green-300 bg-green-50 hover:bg-green-100'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-2xl mb-2">✈️</div>
                  <h4 className="font-semibold text-gray-900 mb-1">Telegram</h4>
                  <p className="text-xs text-gray-600 mb-2">Chat from anywhere</p>
                  {user?.telegramConnected ? (
                    <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      ✓ Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                      Click to setup
                    </span>
                  )}
                </Link>

                {/* Slack */}
                <Link
                  href="/dashboard/slack"
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <div className="text-2xl mb-2">💼</div>
                  <h4 className="font-semibold text-gray-900 mb-1">Slack</h4>
                  <p className="text-xs text-gray-600 mb-2">For work teams</p>
                  <span className="inline-flex items-center text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
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
                className="text-sm text-gray-600 hover:text-gray-900 underline"
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
