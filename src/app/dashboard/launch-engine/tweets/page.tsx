'use client';

import { useEffect, useState, useMemo } from 'react';
import { TweetCard } from '@/components/launch-engine/TweetCard';
import { QueueStatsBar } from '@/components/launch-engine/ContentStats';
import { MOCK_TWEETS, MOCK_QUEUE_STATS } from '@/components/launch-engine/mockData';
import type {
  TweetDraft,
  QueueStats,
  ContentVoice,
  ContentPillar,
  SourceType,
} from '@/components/launch-engine/types';

// ────────────────────────────────────────────────────────────
// API helpers
// ────────────────────────────────────────────────────────────

async function fetchTweets(): Promise<TweetDraft[]> {
  try {
    const res = await fetch('/api/launch-engine/content/tweets?status=queued,approved,scheduled');
    if (!res.ok) throw new Error('Not ready');
    const data = await res.json();
    return data.items as TweetDraft[];
  } catch {
    return MOCK_TWEETS;
  }
}

async function fetchQueueStats(): Promise<QueueStats> {
  try {
    const res = await fetch('/api/launch-engine/content/tweets/stats');
    if (!res.ok) throw new Error('Not ready');
    return await res.json();
  } catch {
    return MOCK_QUEUE_STATS;
  }
}

async function apiApprove(id: string): Promise<void> {
  try {
    await fetch(`/api/launch-engine/content/${id}/approve`, { method: 'POST' });
  } catch {
    // Optimistic update handled client-side
  }
}

async function apiKill(id: string): Promise<void> {
  try {
    await fetch(`/api/launch-engine/content/${id}/kill`, { method: 'POST' });
  } catch {
    // Optimistic update handled client-side
  }
}

async function apiSchedule(id: string, scheduledAt: string): Promise<void> {
  try {
    await fetch(`/api/launch-engine/content/${id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt }),
    });
  } catch {
    // Optimistic update handled client-side
  }
}

async function apiEditBody(id: string, body: string): Promise<void> {
  try {
    await fetch(`/api/launch-engine/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
  } catch {
    // Optimistic update handled client-side
  }
}

// ────────────────────────────────────────────────────────────
// Filter bar
// ────────────────────────────────────────────────────────────

const VOICE_OPTIONS: Array<{ value: ContentVoice | 'all'; label: string }> = [
  { value: 'all', label: 'All Voices' },
  { value: 'founder', label: '🎭 Founder' },
  { value: 'brand', label: '🏢 Brand' },
];

const SOURCE_OPTIONS: Array<{ value: SourceType | 'all'; label: string }> = [
  { value: 'all', label: 'All Sources' },
  { value: 'trending-topic', label: 'Trending Topic' },
  { value: 'blog-promotion', label: 'Blog Promo' },
  { value: 'build-in-public', label: 'Build in Public' },
  { value: 'competitor-reaction', label: 'Competitor' },
  { value: 'community-engagement', label: 'Community' },
  { value: 'content-pillar', label: 'Content Pillar' },
  { value: 'campaign', label: 'Campaign' },
];

const PILLAR_OPTIONS: Array<{ value: ContentPillar | 'all'; label: string }> = [
  { value: 'all', label: 'All Pillars' },
  { value: 'security', label: '🔐 Security' },
  { value: 'ease', label: '⚡ Ease & Speed' },
  { value: 'ai-teams', label: '🤖 AI Teams' },
  { value: 'use-cases', label: '💡 Use Cases' },
  { value: 'education', label: '📚 Education' },
];

const GENERATE_OPTIONS: Array<{ pillar: ContentPillar; voice: ContentVoice; label: string }> = [
  { pillar: 'security', voice: 'founder', label: '🔐 Security · Founder voice' },
  { pillar: 'security', voice: 'brand', label: '🔐 Security · Brand voice' },
  { pillar: 'ease', voice: 'founder', label: '⚡ Ease & Speed · Founder' },
  { pillar: 'ease', voice: 'brand', label: '⚡ Ease & Speed · Brand' },
  { pillar: 'ai-teams', voice: 'founder', label: '🤖 AI Teams · Founder' },
  { pillar: 'ai-teams', voice: 'brand', label: '🤖 AI Teams · Brand' },
  { pillar: 'use-cases', voice: 'founder', label: '💡 Use Cases · Founder' },
  { pillar: 'use-cases', voice: 'brand', label: '💡 Use Cases · Brand' },
  { pillar: 'education', voice: 'brand', label: '📚 Education · Brand' },
];

interface FilterBarProps {
  voice: ContentVoice | 'all';
  source: SourceType | 'all';
  pillar: ContentPillar | 'all';
  onVoice: (v: ContentVoice | 'all') => void;
  onSource: (s: SourceType | 'all') => void;
  onPillar: (p: ContentPillar | 'all') => void;
}

function FilterBar({ voice, source, pillar, onVoice, onSource, onPillar }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center text-sm">
      <span className="text-gray-400 font-medium">Filter:</span>
      <Select
        value={voice}
        onChange={(v) => onVoice(v as ContentVoice | 'all')}
        options={VOICE_OPTIONS}
        aria-label="Voice filter"
      />
      <Select
        value={source}
        onChange={(v) => onSource(v as SourceType | 'all')}
        options={SOURCE_OPTIONS}
        aria-label="Source type filter"
      />
      <Select
        value={pillar}
        onChange={(v) => onPillar(v as ContentPillar | 'all')}
        options={PILLAR_OPTIONS}
        aria-label="Pillar filter"
      />
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  'aria-label'?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-700 cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ────────────────────────────────────────────────────────────
// Generate More dropdown
// ────────────────────────────────────────────────────────────

function GenerateMoreDropdown({ onGenerate }: { onGenerate: (pillar: ContentPillar, voice: ContentVoice) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (opt: (typeof GENERATE_OPTIONS)[number]) => {
    setOpen(false);
    setLoading(true);
    try {
      await fetch('/api/launch-engine/content/tweets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillar: opt.pillar, voice: opt.voice, count: 3 }),
      });
      onGenerate(opt.pillar, opt.voice);
    } catch {
      // Show user toast ideally; silently fail for now
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60"
      >
        {loading ? '⏳' : '⚡'} Generate More
        <span className="text-xs opacity-75">▾</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-1 overflow-hidden">
            <p className="text-xs text-gray-400 px-3 py-2 font-medium uppercase tracking-wide border-b border-gray-100">
              Select pillar + voice
            </p>
            {GENERATE_OPTIONS.map((opt) => (
              <button
                key={`${opt.pillar}-${opt.voice}`}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-800 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Bulk actions
// ────────────────────────────────────────────────────────────

function BulkActionsBar({ count, onApproveAll }: { count: number; onApproveAll: () => void }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm">
      <span className="text-orange-800">{count} draft{count !== 1 ? 's' : ''} in queue</span>
      <button
        type="button"
        onClick={onApproveAll}
        className="ml-auto text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        ✅ Approve All
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Empty state
// ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">🐦</p>
      <p className="font-medium text-gray-600">No drafts match your filters</p>
      <p className="text-sm mt-1">Try adjusting your filters or generate more content above.</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────

export default function TweetsPage() {
  const [tweets, setTweets] = useState<TweetDraft[]>(MOCK_TWEETS);
  const [stats, setStats] = useState<QueueStats>(MOCK_QUEUE_STATS);
  const [loading, setLoading] = useState(true);

  const [voiceFilter, setVoiceFilter] = useState<ContentVoice | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceType | 'all'>('all');
  const [pillarFilter, setPillarFilter] = useState<ContentPillar | 'all'>('all');

  // Load data
  useEffect(() => {
    Promise.all([fetchTweets(), fetchQueueStats()])
      .then(([t, s]) => {
        setTweets(t);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered list
  const visibleTweets = useMemo(() => {
    return tweets
      .filter((t) => t.status !== 'killed' && t.status !== 'published')
      .filter((t) => voiceFilter === 'all' || t.voice === voiceFilter)
      .filter((t) => sourceFilter === 'all' || t.sourceType === sourceFilter)
      .filter((t) => pillarFilter === 'all' || t.pillar === pillarFilter)
      .sort((a, b) => b.gateScore - a.gateScore);
  }, [tweets, voiceFilter, sourceFilter, pillarFilter]);

  const queuedCount = visibleTweets.filter((t) => t.status === 'queued').length;

  // ── Handlers ──

  const handleApprove = (id: string) => {
    setTweets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'approved' as const } : t)),
    );
    setStats((s) => ({ ...s, approved: s.approved + 1 }));
    void apiApprove(id);
  };

  const handleKill = (id: string) => {
    setTweets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'killed' as const } : t)),
    );
    setStats((s) => ({ ...s, totalDrafts: s.totalDrafts - 1 }));
    void apiKill(id);
  };

  const handleSchedule = (id: string, scheduledAt: string) => {
    setTweets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'scheduled' as const, scheduledAt } : t,
      ),
    );
    setStats((s) => ({ ...s, scheduledToday: s.scheduledToday + 1 }));
    void apiSchedule(id, scheduledAt);
  };

  const handleSaveEdit = async (id: string, newBody: string) => {
    setTweets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, body: newBody, charCount: newBody.length } : t,
      ),
    );
    await apiEditBody(id, newBody);
  };

  const handleApproveAll = () => {
    const ids = visibleTweets.filter((t) => t.status === 'queued').map((t) => t.id);
    setTweets((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, status: 'approved' as const } : t)),
    );
    setStats((s) => ({ ...s, approved: s.approved + ids.length }));
    ids.forEach((id) => void apiApprove(id));
  };

  const handleGenerateMore = (_pillar: ContentPillar, _voice: ContentVoice) => {
    // After API is ready, this triggers a refetch
    // For now, show a toast or banner — kept simple
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tweet Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            AI-drafted tweets ranked by engagement score. Approve, edit, or kill.
          </p>
        </div>
        <GenerateMoreDropdown onGenerate={handleGenerateMore} />
      </div>

      {/* Filter bar */}
      <FilterBar
        voice={voiceFilter}
        source={sourceFilter}
        pillar={pillarFilter}
        onVoice={setVoiceFilter}
        onSource={setSourceFilter}
        onPillar={setPillarFilter}
      />

      {/* Bulk actions */}
      <BulkActionsBar count={queuedCount} onApproveAll={handleApproveAll} />

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl border border-gray-100 bg-gray-50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Tweet list */}
      {!loading && (
        <>
          {visibleTweets.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {visibleTweets.map((draft) => (
                <TweetCard
                  key={draft.id}
                  draft={draft}
                  onApprove={handleApprove}
                  onKill={handleKill}
                  onSchedule={handleSchedule}
                  onSaveEdit={handleSaveEdit}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Queue stats */}
      {!loading && <QueueStatsBar stats={stats} />}

      {/* API note */}
      <p className="text-xs text-gray-400 text-center pt-2">
        ⚡ Using mock data · real data flows from{' '}
        <code className="font-mono">/api/launch-engine/content/</code>
      </p>
    </div>
  );
}
