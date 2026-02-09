'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  dailyMessages: { date: string; count: number }[];
  modelUsage: { model: string; count: number }[];
  tierDistribution: { tier: string; count: number }[];
  platformBreakdown: { platform: string; messageCount: number; conversationCount: number }[];
  latency: { avg: number; p50: number; p95: number; totalRequests: number };
  billing: {
    tier: string;
    weekStart: string;
    weekEnd: string;
    daysRemaining: number;
    tokensUsed: number;
    tokenLimit: number;
    percentUsed: number;
    requestCount: number;
    monthlyMessageCount: number;
    monthlyResetAt: string | null;
  };
  cost: {
    estimated30d: number;
    totalTokens30d: number;
    estimatedCostUsd: number;
  };
}

// Color palettes
const MODEL_COLORS: Record<string, string> = {
  'gpt-4o': '#6366f1',       // indigo
  'gpt-4o-mini': '#3b82f6',  // blue
  'gemini-3-flash': '#10b981', // emerald
  'gemini-2.0-flash': '#14b8a6', // teal
  'gemini-2.0-flash-lite': '#06b6d4', // cyan
  'grok-4.1-fast': '#f59e0b', // amber
  'qwen3': '#8b5cf6',        // violet
};

const TIER_COLORS: Record<string, string> = {
  'SIMPLE': '#10b981',     // green
  'MEDIUM': '#3b82f6',     // blue
  'COMPLEX': '#f59e0b',    // amber
  'REASONING': '#ef4444',  // red
  'UNKNOWN': '#9ca3af',    // gray
};

const PLATFORM_COLORS: Record<string, string> = {
  'web': '#3b82f6',
  'whatsapp': '#22c55e',
  'telegram': '#0ea5e9',
  'slack': '#e11d48',
};

const PLATFORM_ICONS: Record<string, string> = {
  'web': '🌐',
  'whatsapp': '💬',
  'telegram': '✈️',
  'slack': '💼',
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatModel(model: string): string {
  // Clean up model names like "openai/gpt-4o-mini" → "GPT-4o Mini"
  const name = model.replace(/^(openai|google|xai|anthropic)\//i, '');
  const map: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gemini-3-flash': 'Gemini 3 Flash',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-2.0-flash-lite': 'Flash Lite',
    'grok-4.1-fast': 'Grok Fast',
  };
  return map[name] || name;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">📊</div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return <EmptyState message="Data available after first conversations" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Last 30 days · {total} total requests</p>
      </div>
      <div className="flex items-end gap-[2px] h-40">
        {data.map((day, i) => {
          const height = max > 0 ? (day.count / max) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 group relative"
              style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
            >
              <div
                className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-colors cursor-default"
                style={{ height: `${height}%`, minHeight: day.count > 0 ? '2px' : '0' }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                  {formatDate(day.date)}: {day.count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-400">{formatDate(data[0]?.date || '')}</span>
        <span className="text-xs text-gray-400">{formatDate(data[data.length - 1]?.date || '')}</span>
      </div>
    </div>
  );
}

function DonutChart({ 
  segments, 
  colors, 
  labelFn 
}: { 
  segments: { label: string; value: number }[]; 
  colors: Record<string, string>;
  labelFn?: (label: string) => string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  
  if (total === 0) {
    return <EmptyState message="Data available after first conversations" />;
  }

  // Build conic gradient
  let accumulated = 0;
  const gradientParts: string[] = [];
  segments.forEach((seg) => {
    const pct = (seg.value / total) * 100;
    const color = colors[seg.label.toLowerCase()] || colors[seg.label] || '#9ca3af';
    gradientParts.push(`${color} ${accumulated}% ${accumulated + pct}%`);
    accumulated += pct;
  });

  return (
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div
        className="w-32 h-32 rounded-full shrink-0"
        style={{
          background: `conic-gradient(${gradientParts.join(', ')})`,
          WebkitMask: 'radial-gradient(circle at center, transparent 40%, black 41%)',
          mask: 'radial-gradient(circle at center, transparent 40%, black 41%)',
        }}
      />
      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-0">
        {segments.map((seg) => {
          const pct = ((seg.value / total) * 100).toFixed(1);
          const color = colors[seg.label.toLowerCase()] || colors[seg.label] || '#9ca3af';
          return (
            <div key={seg.label} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-gray-700 truncate">
                {labelFn ? labelFn(seg.label) : seg.label}
              </span>
              <span className="text-gray-400 ml-auto shrink-0">{pct}%</span>
              <span className="text-gray-500 shrink-0">({seg.value})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LatencyCard({ latency }: { latency: AnalyticsData['latency'] }) {
  if (latency.totalRequests === 0) {
    return <EmptyState message="Data available after first conversations" />;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{latency.avg}<span className="text-sm font-normal text-gray-500">ms</span></p>
        <p className="text-sm text-gray-500 mt-1">Average</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{latency.p50}<span className="text-sm font-normal text-gray-500">ms</span></p>
        <p className="text-sm text-gray-500 mt-1">Median (p50)</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{latency.p95}<span className="text-sm font-normal text-gray-500">ms</span></p>
        <p className="text-sm text-gray-500 mt-1">p95</p>
      </div>
    </div>
  );
}

function BillingCard({ billing }: { billing: AnalyticsData['billing'] }) {
  const usageBarWidth = Math.min(billing.percentUsed, 100);
  const barColor = billing.percentUsed > 80 
    ? 'bg-red-500' 
    : billing.percentUsed > 60 
      ? 'bg-amber-500' 
      : 'bg-blue-500';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Current Period</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(billing.weekStart)} – {formatDate(billing.weekEnd)}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 capitalize">
            {billing.tier}
          </span>
        </div>
      </div>

      {/* Usage bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Tokens: {formatNumber(billing.tokensUsed)} / {formatNumber(billing.tokenLimit)} OET</span>
          <span className="font-medium text-gray-900">{billing.percentUsed}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${usageBarWidth}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2">
        <div>
          <p className="text-2xl font-bold text-gray-900">{billing.requestCount}</p>
          <p className="text-sm text-gray-500">Requests this week</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{billing.daysRemaining}</p>
          <p className="text-sm text-gray-500">Days remaining</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{billing.monthlyMessageCount}</p>
          <p className="text-sm text-gray-500">Messages this month</p>
        </div>
      </div>
    </div>
  );
}

function CostCard({ cost }: { cost: AnalyticsData['cost'] }) {
  if (cost.totalTokens30d === 0) {
    return <EmptyState message="Cost data available after first conversations" />;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">${cost.estimated30d.toFixed(4)}</p>
        <p className="text-sm text-gray-500 mt-1">Est. API cost (30d)</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{formatNumber(cost.totalTokens30d)}</p>
        <p className="text-sm text-gray-500 mt-1">Total tokens (30d)</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">${cost.estimatedCostUsd.toFixed(4)}</p>
        <p className="text-sm text-gray-500 mt-1">This week's cost</p>
      </div>
    </div>
  );
}

function PlatformBars({ data }: { data: AnalyticsData['platformBreakdown'] }) {
  const totalMessages = data.reduce((sum, p) => sum + p.messageCount, 0);
  
  if (totalMessages === 0) {
    return <EmptyState message="Data available after first conversations" />;
  }

  const sorted = [...data].sort((a, b) => b.messageCount - a.messageCount);
  const max = sorted[0]?.messageCount || 1;

  return (
    <div className="space-y-3">
      {sorted.map((p) => {
        const pct = ((p.messageCount / totalMessages) * 100).toFixed(1);
        const barWidth = (p.messageCount / max) * 100;
        const color = PLATFORM_COLORS[p.platform] || '#9ca3af';
        const icon = PLATFORM_ICONS[p.platform] || '📱';
        return (
          <div key={p.platform}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700 capitalize">
                {icon} {p.platform}
              </span>
              <span className="text-gray-500">
                {p.messageCount} msgs · {p.conversationCount} convos · {pct}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${barWidth}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────

export function UsageAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/usage/analytics');
        if (!res.ok) {
          throw new Error(`Failed to fetch analytics: ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
            <div className="h-40 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-800">Failed to load analytics: {error || 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 6. Billing Period */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📅 Current Billing Period
        </h2>
        <BillingCard billing={data.billing} />
      </div>

      {/* 1. Daily Message Count Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📈 Daily Messages
        </h2>
        <DailyChart data={data.dailyMessages} />
      </div>

      {/* Row: Model + Tier side by side on desktop */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 2. Model Usage Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🤖 Model Usage
          </h2>
          <DonutChart
            segments={data.modelUsage.map(m => ({ label: m.model, value: m.count }))}
            colors={MODEL_COLORS}
            labelFn={formatModel}
          />
        </div>

        {/* 3. Tier Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            🎯 Complexity Tiers
          </h2>
          <DonutChart
            segments={data.tierDistribution.map(t => ({ label: t.tier, value: t.count }))}
            colors={TIER_COLORS}
          />
        </div>
      </div>

      {/* 4. Platform Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📱 Platform Breakdown
        </h2>
        <PlatformBars data={data.platformBreakdown} />
      </div>

      {/* Row: Latency + Cost side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 5. Response Time */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            ⚡ Response Latency
          </h2>
          <LatencyCard latency={data.latency} />
        </div>

        {/* 7. Cost Estimate */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            💰 Cost Estimate
          </h2>
          <CostCard cost={data.cost} />
        </div>
      </div>
    </div>
  );
}
