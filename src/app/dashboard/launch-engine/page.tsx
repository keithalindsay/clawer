'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WeekStatsPanel } from '@/components/launch-engine/ContentStats';
import { MOCK_TODAY_SUMMARY, MOCK_WEEK_STATS } from '@/components/launch-engine/mockData';
import type { TodaySummary, WeekStats } from '@/components/launch-engine/types';

// ────────────────────────────────────────────────────────────
// Data fetching
// ────────────────────────────────────────────────────────────

async function fetchDashboardData(): Promise<{ today: TodaySummary; week: WeekStats }> {
  try {
    const [todayRes, weekRes] = await Promise.all([
      fetch('/api/launch-engine/content/today-summary'),
      fetch('/api/launch-engine/content/week-stats'),
    ]);
    if (!todayRes.ok || !weekRes.ok) throw new Error('API not ready');
    return { today: await todayRes.json(), week: await weekRes.json() };
  } catch {
    // Fall back to mock data while API is being built
    return { today: MOCK_TODAY_SUMMARY, week: MOCK_WEEK_STATS };
  }
}

// ────────────────────────────────────────────────────────────
// Quick Actions
// ────────────────────────────────────────────────────────────

function QuickActions({ draftsCount }: { draftsCount: number }) {
  const actions = [
    {
      href: '/dashboard/launch-engine/tweets',
      label: `Review Tweet Queue${draftsCount > 0 ? ` (${draftsCount})` : ''}`,
      icon: '🐦',
      highlight: draftsCount > 0,
    },
    {
      href: '/dashboard/launch-engine/blog',
      label: 'Blog Pipeline (1 ready)',
      icon: '📝',
      highlight: false,
    },
    {
      href: '/dashboard/launch-engine/campaigns',
      label: 'New Campaign',
      icon: '🎯',
      highlight: false,
    },
    {
      href: '/dashboard/launch-engine/calendar',
      label: 'View Calendar',
      icon: '📅',
      highlight: false,
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all font-medium text-sm ${
            a.highlight
              ? 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100 shadow-sm'
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <span className="text-lg">{a.icon}</span>
          <span>{a.label}</span>
          {a.highlight && (
            <span className="ml-auto w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          )}
        </Link>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Today card
// ────────────────────────────────────────────────────────────

function TodayCard({ summary }: { summary: TodaySummary }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Today</h3>

      <div className="space-y-1.5">
        <Row icon="📝" text={`${summary.draftsAwaitingReview} drafts awaiting review`} />
        <Row
          icon="📅"
          text={`${summary.scheduledToday} post${summary.scheduledToday !== 1 ? 's' : ''} scheduled today (${summary.scheduledItems.join(', ')})`}
        />
        <Row
          icon="📊"
          text={`Yesterday: ${(summary.yesterdayReach / 1000).toFixed(1)}K reach, ${summary.yesterdayEngagement}% engagement`}
        />
        {summary.activeCampaign && (
          <Row
            icon="🎯"
            text={`Active campaign: ${summary.activeCampaign.name} (Day ${summary.activeCampaign.day}/${summary.activeCampaign.totalDays})`}
          />
        )}
      </div>
    </div>
  );
}

function Row({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-700">
      <span className="mt-0.5 text-base leading-none">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function LaunchEnginePage() {
  const [today, setToday] = useState<TodaySummary>(MOCK_TODAY_SUMMARY);
  const [week, setWeek] = useState<WeekStats>(MOCK_WEEK_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData()
      .then(({ today: t, week: w }) => {
        setToday(t);
        setWeek(w);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing HQ</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          AI content pipeline for Clawer.ai — generate, review, distribute.
        </p>
      </div>

      {/* Today summary + quick actions side by side on larger screens */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Today card */}
        {loading ? (
          <div className="h-36 rounded-xl border border-gray-100 bg-gray-50 animate-pulse" />
        ) : (
          <TodayCard summary={today} />
        )}

        {/* Quick actions */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <QuickActions draftsCount={today.draftsAwaitingReview} />
        </div>
      </div>

      {/* This week */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          This Week
        </h3>
        {loading ? (
          <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
        ) : (
          <WeekStatsPanel stats={week} />
        )}
      </div>

      {/* API note */}
      <p className="text-xs text-gray-400 text-center">
        ⚡ Data from mock while API is being built · refresh once{' '}
        <code className="font-mono">/api/launch-engine/content/</code> is live
      </p>
    </div>
  );
}
