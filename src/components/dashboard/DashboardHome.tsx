'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { MemoryCard, type MemoryStats } from '@/components/dashboard/MemoryCard';
import { SystemHealthPill } from '@/components/dashboard/SystemHealthPill';
import { TodayStatsBar } from '@/components/dashboard/TodayStatsBar';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TeamStatusPanel } from '@/components/dashboard/TeamStatusPanel';
import { MorningBriefingCard } from '@/components/dashboard/MorningBriefingCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { trackEvent } from '@/lib/analytics';
import { FREE_DAILY_LIMIT, PAID_DAILY_LIMIT } from '@/lib/constants';

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
  memoryStats?: MemoryStats;
}

function Greeting({ userName }: { userName?: string }) {
  const [greeting, setGreeting] = useState('Hello');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {greeting}{userName ? `, ${userName}` : ''} 👋
      </h1>
      <p className="text-sm text-gray-500 mt-0.5">Here&apos;s what your team has been up to.</p>
    </div>
  );
}

export function DashboardHome({
  userName,
  userEmail,
  teamName,
  teamDescription,
  teamMembers,
  isSubscribed,
  freeMessagesUsed,
  memoryStats,
}: DashboardHomeProps) {
  const dailyLimit = isSubscribed ? PAID_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const usagePercent = Math.min((freeMessagesUsed / dailyLimit) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Upgrade banner */}
        <UpgradeBanner isSubscribed={isSubscribed} />

        {/* Row 1: Greeting + System Health pill */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <Greeting userName={userName} />
          <div className="sm:flex-shrink-0">
            <SystemHealthPill />
          </div>
        </div>

        {/* Row 2: Stats bar */}
        <TodayStatsBar />

        {/* Row 3: Two-column layout — Activity (60%) + Right panel (40%) */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

          {/* LEFT — Activity feed (3/5 width on xl) */}
          <div className="xl:col-span-3 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <ActivityFeed />
          </div>

          {/* RIGHT — Team status + Morning briefing + Quick actions (2/5 width on xl) */}
          <div className="xl:col-span-2 flex flex-col gap-5">

            {/* Team status */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <TeamStatusPanel />
            </div>

            {/* Morning briefing (conditionally rendered by MorningBriefingCard itself) */}
            <MorningBriefingCard />

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <QuickActions />
            </div>

            {/* Plan status card — collapsed version, links to settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">Usage</h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isSubscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isSubscribed ? 'Pro' : 'Free'}
                </span>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Daily messages</span>
                  <span className="font-medium text-gray-900">{freeMessagesUsed} / {dailyLimit}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${usagePercent > 80 ? 'bg-orange-500' : 'bg-blue-500'}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
              {!isSubscribed && (
                <Link
                  href="/dashboard/settings"
                  className="mt-3 block text-center text-xs font-medium text-orange-600 hover:text-orange-700 border border-orange-200 rounded-lg py-1.5 hover:bg-orange-50 transition-colors"
                  onClick={() => trackEvent('funnel_upgrade_click', { source: 'command_center_usage_card' })}
                >
                  Upgrade to Pro →
                </Link>
              )}
            </div>

            {/* Memory card */}
            {memoryStats ? (
              <MemoryCard stats={memoryStats} />
            ) : null}

          </div>
        </div>

        {/* Row 4: Team overview — collapsed quick-access grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">{teamName}</h2>
            {teamDescription && (
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">{teamDescription}</p>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {teamMembers.map(member => (
              <Link
                key={member.id}
                href={`/dashboard/chat?agent=${member.id}`}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
              >
                <span className="text-xl flex-shrink-0">{member.emoji || '🤖'}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-700 transition-colors">
                    {member.name}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">{member.role}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>

      {/* ── Mobile bottom tab bar ─────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex md:hidden z-30"
        aria-label="Mobile navigation"
      >
        {[
          { href: '/dashboard',       icon: '🏠', label: 'Home'  },
          { href: '/dashboard/chat',  icon: '💬', label: 'Chat'  },
          { href: '/dashboard/tasks', icon: '📋', label: 'Tasks' },
          { href: '/dashboard/files', icon: '📁', label: 'Files' },
        ].map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 hover:text-orange-600 transition-colors"
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        ))}
      </nav>
      {/* Bottom padding for mobile tab bar */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
