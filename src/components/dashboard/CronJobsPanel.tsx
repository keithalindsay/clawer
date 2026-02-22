'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CronJob {
  id: string;
  jobName: string;
  schedule: string;
  lastStatus: 'ok' | 'error' | 'running';
  lastRunAt: string | null;
  lastDurationMs: number | null;
  consecutiveErrors: number;
  updatedAt: string;
}

interface CronEvent {
  id: string;
  agentName: string;
  agentEmoji: string | null;
  summary: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface CronsData {
  jobs: CronJob[];
  history: CronEvent[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

/** Human-readable cron schedule (best-effort) */
function describeCron(expr: string): string {
  const known: Record<string, string> = {
    '0 2 * * *':  'Daily at 2:00 AM',
    '15 2 * * *': 'Daily at 2:15 AM',
    '0 7 * * *':  'Daily at 7:00 AM',
    '0 * * * *':  'Every hour',
    '*/15 * * * *': 'Every 15 minutes',
    '*/30 * * * *': 'Every 30 minutes',
    '0 0 * * *':  'Daily at midnight',
    '0 12 * * *': 'Daily at noon',
  };
  return known[expr] ?? expr;
}

/** Next scheduled run — approximate, UTC-naive best guess */
function nextRunApprox(schedule: string): string {
  // We only support the simple daily patterns; anything else is shown as '—'
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return '—';
  const [minute, hour, dom, month, dow] = parts;
  if (dom !== '*' || month !== '*' || dow !== '*') return '—';
  const m = parseInt(minute, 10);
  const h = parseInt(hour, 10);
  if (isNaN(m) || isNaN(h)) return '—';
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(h, m, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago' }) + ' CST tomorrow-ish';
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CFG = {
  ok:      { label: 'OK',      dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border border-green-200' },
  error:   { label: 'Error',   dot: 'bg-red-500',   badge: 'bg-red-50   text-red-700   border border-red-200'   },
  running: { label: 'Running', dot: 'bg-blue-500',  badge: 'bg-blue-50  text-blue-700  border border-blue-200'  },
} as const;

function StatusBadge({ status }: { status: CronJob['lastStatus'] }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.ok;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading cron jobs">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-4 w-44 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="h-2.5 w-16 bg-gray-100 rounded" />
                <div className="h-3.5 w-24 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: CronJob }) {
  const hasErrors = job.consecutiveErrors > 0;

  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm ${
        job.lastStatus === 'error' ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 font-mono">
            {job.jobName}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {describeCron(job.schedule)}{' '}
            <span className="font-mono text-gray-400">({job.schedule})</span>
          </p>
        </div>
        <StatusBadge status={job.lastStatus} />
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Last run" value={job.lastRunAt ? relativeTime(job.lastRunAt) : 'Never'} />
        <Stat label="Duration" value={formatDuration(job.lastDurationMs)} />
        <Stat label="Next run (approx)" value={nextRunApprox(job.schedule)} />
        <Stat
          label="Consecutive errors"
          value={String(job.consecutiveErrors)}
          valueClass={hasErrors ? 'text-red-600 font-semibold' : 'text-gray-700'}
        />
      </div>

      {/* Error callout */}
      {hasErrors && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
          ⚠ {job.consecutiveErrors} consecutive error{job.consecutiveErrors !== 1 ? 's' : ''} — check container logs
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = 'text-gray-700',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xs mt-0.5 ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── History timeline ─────────────────────────────────────────────────────────

function HistoryTimeline({ events }: { events: CronEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No cron run history yet. Events will appear here once jobs start running.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-gray-200 ml-2 space-y-4">
      {events.map((event) => {
        const isError = (event.details as any)?.status === 'error' || event.summary.toLowerCase().includes('error');
        return (
          <li key={event.id} className="ml-4">
            {/* Timeline dot */}
            <span
              className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${
                isError ? 'bg-red-400' : 'bg-green-400'
              }`}
            />

            <div className="flex items-start gap-2">
              <span className="text-base leading-none flex-shrink-0 mt-0.5">
                {event.agentEmoji ?? '⏱'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">{event.summary}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{relativeTime(event.createdAt)}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-500">{event.agentName}</span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Summary bar ─────────────────────────────────────────────────────────────

function SummaryBar({ jobs }: { jobs: CronJob[] }) {
  const total = jobs.length;
  const healthy = jobs.filter((j) => j.lastStatus === 'ok').length;
  const errored = jobs.filter((j) => j.lastStatus === 'error').length;
  const running = jobs.filter((j) => j.lastStatus === 'running').length;

  const overallColor =
    errored > 0
      ? 'text-red-600 bg-red-50 border-red-200'
      : running > 0
      ? 'text-blue-600 bg-blue-50 border-blue-200'
      : 'text-green-600 bg-green-50 border-green-200';

  const overallLabel =
    errored > 0 ? `${errored} failing` : running > 0 ? 'Jobs running' : 'All healthy';

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Overall pill */}
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${overallColor}`}>
        {errored > 0 ? '●' : running > 0 ? '●' : '✓'} {overallLabel}
      </span>

      {/* Stat chips */}
      <span className="text-xs text-gray-500">{total} job{total !== 1 ? 's' : ''} tracked</span>
      {healthy > 0 && <span className="text-xs text-green-600">✓ {healthy} healthy</span>}
      {errored > 0 && <span className="text-xs text-red-600">✗ {errored} errored</span>}
      {running > 0 && <span className="text-xs text-blue-600">⟳ {running} running</span>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CronJobsPanel() {
  const [data, setData] = useState<CronsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard/crons');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: CronsData = await res.json();
      setData(json);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Failed to load cron jobs. Make sure your container is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(false), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => fetchData(true)}
          className="mt-3 text-xs text-red-700 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const jobs = data?.jobs ?? [];
  const history = data?.history ?? [];

  return (
    <div className="space-y-8">
      {/* Summary */}
      {jobs.length > 0 && <SummaryBar jobs={jobs} />}

      {/* Refresh button + last updated */}
      <div className="flex items-center justify-between -mt-4 mb-2">
        <span className="text-xs text-gray-400">
          {lastRefreshed
            ? `Updated ${relativeTime(lastRefreshed.toISOString())}`
            : 'Refreshes every 30s'}
        </span>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="text-xs text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50 transition-colors"
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">⏱</div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No cron jobs tracked yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Cron jobs appear here once your container starts running them and syncs status.
            Trigger a sync from the Dashboard page to populate data.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* History timeline */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Execution History
          {history.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              (last {history.length} events)
            </span>
          )}
        </h2>
        <HistoryTimeline events={history} />
      </section>
    </div>
  );
}
