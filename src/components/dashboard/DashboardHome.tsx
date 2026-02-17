'use client';

import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { FREE_DAILY_LIMIT, PAID_DAILY_LIMIT, FREE_TEAM_MEMBER_LIMIT, PAID_TEAM_MEMBER_LIMIT } from '@/lib/constants';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  emoji?: string;
  description?: string;
}

interface DashboardHomeProps {
  userName?: string;
  userEmail?: string;
  teamName: string;
  teamDescription?: string;
  teamMembers: (TeamMember & { quickPrompts?: string[] })[];
  isSubscribed: boolean;
  freeMessagesUsed: number;
  whatsappConnected?: boolean;
  telegramConnected?: boolean;
}

export function DashboardHome({
  userName,
  userEmail,
  teamName,
  teamDescription,
  teamMembers,
  isSubscribed,
  freeMessagesUsed,
  whatsappConnected,
  telegramConnected,
}: DashboardHomeProps) {
  const plan = isSubscribed ? 'Pro' : 'Free';
  const dailyLimit = isSubscribed ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const memberLimit = isSubscribed ? PAID_TEAM_MEMBER_LIMIT : FREE_TEAM_MEMBER_LIMIT;
  const usagePercent = Math.min((freeMessagesUsed / dailyLimit) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-gray-900">
              🦞 CLAWER
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
              <Link href="/dashboard/chat" className="text-gray-500 hover:text-gray-900">Chat</Link>
              <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-900">Settings</Link>
              {/* <Link href="/dashboard/api-keys" className="text-gray-500 hover:text-gray-900">API Keys</Link> */}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{userEmail}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{userName ? `, ${userName}` : ''} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your team overview and usage summary.</p>
        </div>

        <UpgradeBanner isSubscribed={isSubscribed} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Plan Status</h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                isSubscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {plan}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Daily messages</span>
                  <span className="text-gray-900 font-medium">{freeMessagesUsed} / {dailyLimit}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${usagePercent > 80 ? 'bg-orange-500' : 'bg-blue-500'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Team members</span>
                <span className="text-gray-900 font-medium">
                  {Math.min(teamMembers.length, memberLimit)} / {memberLimit}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Model</span>
                <span className="text-gray-900 font-medium">{isSubscribed ? 'Priority' : 'Basic'}</span>
              </div>
            </div>
            {!isSubscribed && (
              <Link
                href="/dashboard/settings"
                className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Upgrade to Pro →
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/dashboard/chat"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="text-xl">💬</span>
                <span className="text-sm font-medium text-gray-900">Chat with Team</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="text-xl">⚙️</span>
                <span className="text-sm font-medium text-gray-900">Settings</span>
              </Link>
              <Link
                href="/dashboard/whatsapp"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="text-xl">📱</span>
                <div>
                  <span className="text-sm font-medium text-gray-900">WhatsApp</span>
                  {whatsappConnected && <span className="ml-1 text-xs text-green-600">✓</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/telegram"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="text-xl">✈️</span>
                <div>
                  <span className="text-sm font-medium text-gray-900">Telegram</span>
                  {telegramConnected && <span className="ml-1 text-xs text-green-600">✓</span>}
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Team Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900">{teamName}</h2>
            {teamDescription && <p className="text-sm text-gray-500 mt-1">{teamDescription}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{member.emoji || '🤖'}</span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.role}</div>
                  </div>
                </div>
                {member.quickPrompts && member.quickPrompts.length > 0 && (
                  <div className="space-y-1.5">
                    {member.quickPrompts.map((prompt, j) => (
                      <Link
                        key={j}
                        href={`/dashboard/chat?agent=${member.id}&prompt=${encodeURIComponent(prompt)}`}
                        className="block text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-md transition-colors truncate"
                      >
                        → {prompt}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
