'use client';

import Link from 'next/link';

export interface MemoryStats {
  daysSinceSignup: number;
  conversationCount: number;
  fileCount: number;
  memoryFacts: number;
  memoryTopics: string[];
  containerAvailable: boolean;
}

interface MemoryCardProps {
  stats: MemoryStats;
}

/**
 * MemoryCard — dashboard widget showing the agent's accumulated memory.
 *
 * Design: orange-tinted card with a ring progress indicator, stat rows,
 * and a "View details →" link to /dashboard/memory.
 */
export function MemoryCard({ stats }: MemoryCardProps) {
  const {
    daysSinceSignup,
    conversationCount,
    fileCount,
    memoryFacts,
  } = stats;

  // Progress ring: grows with days of context, caps at a "mature" 90 days
  const MAX_DAYS = 90;
  const pct = Math.min((daysSinceSignup / MAX_DAYS) * 100, 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 p-6 flex flex-col gap-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl" aria-hidden="true">🧠</span>
            <h2 className="font-semibold text-gray-900 text-base">Your Agent's Memory</h2>
          </div>
          <p className="text-xs text-gray-500">Accumulates over time — never resets</p>
        </div>

        {/* Progress ring */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <svg width="72" height="72" className="-rotate-90" aria-hidden="true">
            {/* Track */}
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke="#fed7aa"
              strokeWidth="5"
            />
            {/* Fill */}
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke="#f97316"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          {/* Day counter overlaid on ring */}
          <div
            className="absolute"
            style={{
              transform: 'translateY(-46px)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
            aria-label={`${daysSinceSignup} days of context`}
          >
            <span className="text-lg font-bold text-orange-600 block leading-none">
              {daysSinceSignup}
            </span>
            <span className="text-[10px] text-gray-500">days</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="divide-y divide-orange-100">
        <StatRow label="Conversations" value={conversationCount} />
        <StatRow label="Files created" value={fileCount} />
        <StatRow label="Memory facts" value={memoryFacts} />
      </div>

      {/* CTA */}
      <Link
        href="/dashboard/memory"
        className="mt-1 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
      >
        View memory details →
      </Link>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value.toLocaleString()}</span>
    </div>
  );
}
