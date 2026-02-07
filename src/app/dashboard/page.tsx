/**
 * Dashboard - Main user interface after login
 * 
 * Shows:
 * - Subscription status
 * - Container status and management
 * - Chat connections (WhatsApp, Telegram)
 * - Manage subscription
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { TelegramCard } from '@/components/TelegramCard';
import { ContainerStatus } from '@/components/ContainerStatus';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Get user from database
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const clerkUser = await currentUser();
  const isSubscribed = user?.stripeSubscriptionId !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {clerkUser?.emailAddresses[0]?.emailAddress}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Subscription Status */}
        {!isSubscribed ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-yellow-800">
              Complete your subscription
            </h2>
            <p className="mt-2 text-yellow-700">
              You're signed up but haven't subscribed yet. Get started for $49/month.
            </p>
            <form action="/api/stripe/checkout" method="POST" className="mt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Subscribe Now — $49/month
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-green-800">
                  ✓ Subscription Active
                </h2>
                <p className="mt-1 text-green-700">
                  You have full access to all features.
                </p>
              </div>
              <ManageSubscriptionButton />
            </div>
          </div>
        )}

        {/* Container Status */}
        {isSubscribed && <ContainerStatus />}

        {/* Chat Connections */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Start Chatting
          </h2>
          <p className="mt-2 text-gray-600">
            Choose how you want to chat with your AI assistant.
          </p>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Web Chat - Always available */}
            <Link
              href="/chat/email-assistant"
              className={`p-4 rounded-xl border-2 transition-all ${
                isSubscribed 
                  ? 'border-blue-500 bg-blue-50 hover:bg-blue-100 cursor-pointer' 
                  : 'border-gray-200 bg-gray-50 opacity-50 pointer-events-none'
              }`}
            >
              <div className="text-2xl mb-2">🌐</div>
              <h3 className="font-semibold text-gray-900">Web Chat</h3>
              <p className="text-sm text-gray-600">Chat right here in your browser</p>
              <span className="inline-block mt-2 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                Ready to use
              </span>
            </Link>

            {/* WhatsApp */}
            <Link
              href={isSubscribed ? "/dashboard/whatsapp" : "#"}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSubscribed 
                  ? 'border-gray-200 hover:border-green-300 cursor-pointer' 
                  : 'border-gray-200 bg-gray-50 opacity-50 pointer-events-none'
              }`}
            >
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-gray-900">WhatsApp</h3>
              <p className="text-sm text-gray-600">Chat from your phone</p>
              {user?.whatsappConnected ? (
                <span className="inline-block mt-2 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Connected
                </span>
              ) : (
                <span className="inline-block mt-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Click to connect
                </span>
              )}
            </Link>

            {/* Telegram */}
            <Link
              href={isSubscribed ? "/dashboard/telegram" : "#"}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSubscribed 
                  ? 'border-gray-200 hover:border-blue-300 cursor-pointer' 
                  : 'border-gray-200 bg-gray-50 opacity-50 pointer-events-none'
              }`}
            >
              <div className="text-2xl mb-2">✈️</div>
              <h3 className="font-semibold text-gray-900">Telegram</h3>
              <p className="text-sm text-gray-600">Chat from anywhere</p>
              {user?.telegramConnected ? (
                <span className="inline-block mt-2 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Connected
                </span>
              ) : (
                <span className="inline-block mt-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Click to connect
                </span>
              )}
            </Link>

            {/* Slack */}
            <Link
              href={isSubscribed ? "/dashboard/slack" : "#"}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSubscribed 
                  ? 'border-gray-200 hover:border-purple-300 cursor-pointer' 
                  : 'border-gray-200 bg-gray-50 opacity-50 pointer-events-none'
              }`}
            >
              <div className="text-2xl mb-2">💼</div>
              <h3 className="font-semibold text-gray-900">Slack</h3>
              <p className="text-sm text-gray-600">For work teams</p>
              <span className="inline-block mt-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Click to setup
              </span>
            </Link>

            {/* Discord - Coming soon */}
            <div
              className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 opacity-75"
            >
              <div className="text-2xl mb-2">🎮</div>
              <h3 className="font-semibold text-gray-900">Discord</h3>
              <p className="text-sm text-gray-600">For communities</p>
              <span className="inline-block mt-2 text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                Coming soon
              </span>
            </div>

            {/* iMessage */}
            <div
              className={`p-4 rounded-xl border-2 transition-all ${
                isSubscribed 
                  ? 'border-gray-200 hover:border-gray-400 cursor-pointer' 
                  : 'border-gray-200 bg-gray-50 opacity-50'
              }`}
            >
              <div className="text-2xl mb-2">🍎</div>
              <h3 className="font-semibold text-gray-900">iMessage</h3>
              <p className="text-sm text-gray-600">For Apple users</p>
              <span className="inline-block mt-2 text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                Coming soon
              </span>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        {isSubscribed && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              What your AI can do
            </h2>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              {[
                { icon: '📧', title: 'Email Assistant', desc: 'Summarize, draft replies, find emails' },
                { icon: '📅', title: 'Calendar Manager', desc: 'Schedule, remind, prep for meetings' },
                { icon: '🔍', title: 'Research Helper', desc: 'Compare products, summarize articles' },
                { icon: '✍️', title: 'Writing Coach', desc: 'Edit, shorten, improve your writing' },
              ].map((bot) => (
                <div key={bot.title} className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl">{bot.icon}</div>
                  <h3 className="mt-2 font-medium text-gray-900">{bot.title}</h3>
                  <p className="text-sm text-gray-600">{bot.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Client component for manage subscription button
function ManageSubscriptionButton() {
  return (
    <form action="/api/stripe/portal" method="POST">
      <button
        type="submit"
        className="text-green-700 hover:text-green-800 text-sm font-medium underline"
      >
        Manage Subscription
      </button>
    </form>
  );
}
