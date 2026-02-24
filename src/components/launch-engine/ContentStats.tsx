'use client';

import type { QueueStats, WeekStats, ContentPillar } from './types';

// ────────────────────────────────────────────────────────────
// Pillar config
// ────────────────────────────────────────────────────────────

const PILLAR_META: Record<ContentPillar, { label: string; icon: string; color: string; bar: string }> = {
  security: { label: 'Security', icon: '🔐', color: 'text-red-600', bar: 'bg-red-500' },
  ease: { label: 'Ease & Speed', icon: '⚡', color: 'text-yellow-600', bar: 'bg-yellow-400' },
  'ai-teams': { label: 'AI Teams', icon: '🤖', color: 'text-blue-600', bar: 'bg-blue-500' },
  'use-cases': { label: 'Use Cases', icon: '💡', color: 'text-green-600', bar: 'bg-green-500' },
  education: { label: 'Education', icon: '📚', color: 'text-purple-600', bar: 'bg-purple-500' },
};

const PILLAR_ORDER: ContentPillar[] = ['security', 'ease', 'ai-teams', 'use-cases', 'education'];

// ────────────────────────────────────────────────────────────
// PillarBalanceBar — used in both Queue and Dashboard
// ────────────────────────────────────────────────────────────

interface PillarBalanceBarProps {
  balance: Record<ContentPillar, number>;
  compact?: boolean;
}

export function PillarBalanceBar({ balance, compact = false }: PillarBalanceBarProps) {
  return (
    <div className="space-y-1.5">
      {PILLAR_ORDER.map((pillar) => {
        const pct = balance[pillar] ?? 0;
        const meta = PILLAR_META[pillar];
        return (
          <div key={pillar} className="flex items-center gap-2 text-sm">
            <span className="w-5 text-center text-base leading-none" title={meta.label}>
              {meta.icon}
            </span>
            {!compact && (
              <span className="w-20 text-xs text-gray-500 hidden sm:block">{meta.label}</span>
            )}
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${meta.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-gray-500">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// QueueStatsBar — shown at bottom of tweet queue
// ────────────────────────────────────────────────────────────

interface QueueStatsBarProps {
  stats: QueueStats;
}

export function QueueStatsBar({ stats }: QueueStatsBarProps) {
  return (
    <div className="border-t border-gray-100 pt-4 space-y-3">
      {/* Numbers */}
      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
        <span>
          Queue:{' '}
          <strong className="text-gray-900">{stats.totalDrafts} drafts</strong>
        </span>
        <span>·</span>
        <span>
          <strong className="text-green-700">{stats.approved}</strong> approved
        </span>
        <span>·</span>
        <span>
          <strong className="text-blue-700">{stats.scheduledToday}</strong> scheduled today
        </span>
      </div>
      {/* Pillar balance */}
      <div>
        <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Pillar balance</p>
        <PillarBalanceBar balance={stats.pillarBalance} compact />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// WeekStatsPanel — shown on dashboard
// ────────────────────────────────────────────────────────────

interface WeekStatsPanelProps {
  stats: WeekStats;
}

export function WeekStatsPanel({ stats }: WeekStatsPanelProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {/* Left: numbers + pillar balance */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Published" value={String(stats.contentPublished)} unit="posts" />
          <StatBox label="Engagement" value={`${stats.engagementRate}%`} unit="avg" />
          <StatBox label="Signups" value={String(stats.signups)} unit="attributed" />
          <StatBox
            label="Top post"
            value={`${stats.topPerformer.engagement}%`}
            unit="engagement"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Pillar balance</p>
          <PillarBalanceBar balance={stats.pillarBalance} />
        </div>
      </div>

      {/* Right: top performer + insight */}
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-green-50 border border-green-100">
          <p className="text-xs text-green-600 font-medium mb-1">🏆 Top performer this week</p>
          <p className="text-sm text-gray-800 font-medium">{stats.topPerformer.text}</p>
          <p className="text-xs text-gray-500 mt-0.5">{stats.topPerformer.engagement}% engagement</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-600 font-medium mb-1">💡 AI Insight</p>
          <p className="text-sm text-gray-800">{stats.insight}</p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-400">{unit}</p>
    </div>
  );
}
