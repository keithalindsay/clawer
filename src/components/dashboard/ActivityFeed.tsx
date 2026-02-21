'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface AgentEvent {
  id: string;
  eventType: string;
  agentName: string;
  agentEmoji: string | null;
  summary: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const EVENT_STYLE: Record<string, { bg: string; border: string }> = {
  delegation:     { bg: 'bg-blue-50',   border: 'border-blue-100' },
  task_complete:  { bg: 'bg-green-50',  border: 'border-green-100' },
  cron_run:       { bg: 'bg-gray-50',   border: 'border-gray-200' },
  error:          { bg: 'bg-red-50',    border: 'border-red-100' },
  file_created:   { bg: 'bg-purple-50', border: 'border-purple-100' },
  agent_spawn:    { bg: 'bg-blue-50',   border: 'border-blue-100' },
  agent_complete: { bg: 'bg-green-50',  border: 'border-green-100' },
  default:        { bg: 'bg-gray-50',   border: 'border-gray-200' },
};

function getStyle(type: string) {
  return EVENT_STYLE[type] ?? EVENT_STYLE.default;
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function ActivitySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading activity">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Event row ──────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: AgentEvent }) {
  const style = getStyle(event.eventType);
  const taskId = (event.details as any)?.taskId as string | undefined;

  return (
    <div className={`flex gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-base leading-none shadow-sm">
        {event.agentEmoji || '🤖'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 leading-snug">{event.summary}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{relativeTime(event.createdAt)}</span>
          {taskId && (
            <Link
              href={`/dashboard/tasks`}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium"
            >
              View task →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ActivityFeed() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/activity');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    } catch {
      // Leave existing events displayed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const id = setInterval(fetchActivity, 30_000);
    return () => clearInterval(id);
  }, [fetchActivity]);

  const visible = events.slice(0, page * PAGE_SIZE);
  const hasMore = events.length > visible.length;

  return (
    <section aria-label="Activity feed">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Activity Feed</h2>
        <span className="text-xs text-gray-400">Auto-refreshes every 30s</span>
      </div>

      {loading ? (
        <ActivitySkeleton />
      ) : events.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-3xl mb-3">⚡</p>
          <p className="text-sm font-medium text-gray-700">No activity yet</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Your agents haven&apos;t logged any activity yet. Send a message to get started!
          </p>
          <Link
            href="/dashboard/chat"
            className="inline-block mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-colors"
          >
            Chat with team
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(event => (
            <EventRow key={event.id} event={event} />
          ))}

          {hasMore && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </section>
  );
}
