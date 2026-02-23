'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpenClawCron {
  id: string;
  schedule: string;
  command: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

interface CronsData {
  crons: OpenClawCron[];
  scheduler: {
    running: boolean;
    jobsCount: number;
  };
  error?: string;
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

function JobCard({ 
  job, 
  onToggle, 
  onRemove 
}: { 
  job: OpenClawCron; 
  onToggle: (id: string, enabled: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggle(job.id, !job.enabled);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove cron job "${job.command}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await onRemove(job.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-shadow hover:shadow-sm ${
        !job.enabled ? 'border-gray-200 opacity-60' : 'border-gray-200'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 font-mono truncate">
              {job.command}
            </h3>
            {!job.enabled && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                Disabled
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {describeCron(job.schedule)}{' '}
            <span className="font-mono text-gray-400">({job.schedule})</span>
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              job.enabled
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } disabled:opacity-50`}
            title={job.enabled ? 'Disable cron job' : 'Enable cron job'}
          >
            {loading ? '...' : job.enabled ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            title="Remove cron job"
          >
            {loading ? '...' : 'Remove'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Schedule ID" value={job.id} />
        <Stat label="Last run" value={job.lastRun ? relativeTime(job.lastRun) : 'Never'} />
        <Stat label="Next run (approx)" value={job.nextRun || nextRunApprox(job.schedule)} />
      </div>
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
      <p className={`text-xs mt-0.5 truncate ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── Add Cron Form ────────────────────────────────────────────────────────────

function AddCronForm({ onAdd }: { onAdd: (schedule: string, command: string) => Promise<void> }) {
  const [schedule, setSchedule] = useState('');
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule.trim() || !command.trim()) return;
    
    setLoading(true);
    try {
      await onAdd(schedule.trim(), command.trim());
      setSchedule('');
      setCommand('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Add New Cron Job</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Schedule (cron expression)
          </label>
          <input
            type="text"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="0 2 * * *"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">
            E.g., <code className="font-mono bg-gray-100 px-1 rounded">0 2 * * *</code> for daily at 2 AM
          </p>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Command
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="openclaw chat 'Good morning!'"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1">
            Command to execute (relative to container)
          </p>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading || !schedule.trim() || !command.trim()}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Adding...' : 'Add Cron Job'}
      </button>
    </form>
  );
}

// ─── Summary bar ─────────────────────────────────────────────────────────────

function SummaryBar({ crons, scheduler }: { crons: OpenClawCron[]; scheduler: { running: boolean; jobsCount: number } }) {
  const total = crons.length;
  const enabled = crons.filter((j) => j.enabled).length;
  const disabled = total - enabled;

  const overallColor = scheduler.running
    ? 'text-green-600 bg-green-50 border-green-200'
    : 'text-red-600 bg-red-50 border-red-200';

  const overallLabel = scheduler.running ? 'Scheduler running' : 'Scheduler stopped';

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Overall pill */}
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${overallColor}`}>
        {scheduler.running ? '✓' : '✗'} {overallLabel}
      </span>

      {/* Stat chips */}
      <span className="text-xs text-gray-500">{total} job{total !== 1 ? 's' : ''} configured</span>
      {enabled > 0 && <span className="text-xs text-green-600">✓ {enabled} enabled</span>}
      {disabled > 0 && <span className="text-xs text-gray-600">○ {disabled} disabled</span>}
      <span className="text-xs text-gray-400">({scheduler.jobsCount} loaded)</span>
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
      const res = await fetch('/api/dashboard/crons/cli');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: CronsData = await res.json();
      setData(json);
      if (json.error) {
        setError(json.error);
      } else {
        setError(null);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Failed to load cron jobs. Make sure your container is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    const action = enabled ? 'enable' : 'disable';
    try {
      const res = await fetch(`/api/dashboard/crons/cli/${action}/${id}`, { method: 'POST' });
      const result = await res.json();
      if (!result.success) {
        alert(`Failed to ${action} cron job: ${result.error || 'Unknown error'}`);
      } else {
        await fetchData(false);
      }
    } catch (err: any) {
      alert(`Failed to ${action} cron job: ${err.message}`);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/crons/cli/remove/${id}`, { method: 'POST' });
      const result = await res.json();
      if (!result.success) {
        alert(`Failed to remove cron job: ${result.error || 'Unknown error'}`);
      } else {
        await fetchData(false);
      }
    } catch (err: any) {
      alert(`Failed to remove cron job: ${err.message}`);
    }
  };

  const handleAdd = async (schedule: string, command: string) => {
    try {
      const res = await fetch('/api/dashboard/crons/cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule, command }),
      });
      const result = await res.json();
      if (!result.success) {
        alert(`Failed to add cron job: ${result.error || 'Unknown error'}`);
      } else {
        await fetchData(false);
      }
    } catch (err: any) {
      alert(`Failed to add cron job: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(false), 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) return <Skeleton />;

  if (error && !data) {
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

  const crons = data?.crons ?? [];
  const scheduler = data?.scheduler ?? { running: false, jobsCount: 0 };

  return (
    <div className="space-y-8">
      {/* Summary */}
      {crons.length > 0 && <SummaryBar crons={crons} scheduler={scheduler} />}

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
          ⚠ {error}
        </div>
      )}

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

      {/* Add Cron Form */}
      <AddCronForm onAdd={handleAdd} />

      {/* Job list */}
      {crons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">⏱</div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No cron jobs configured yet</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Add a cron job above to schedule recurring tasks in your container.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {crons.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              onToggle={handleToggle}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
