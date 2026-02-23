'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hook {
  name: string;
  enabled: boolean;
  description?: string;
}

interface HooksData {
  hooks: Hook[];
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading hooks">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Hook card ─────────────────────────────────────────────────────────────────

function HookCard({ 
  hook, 
  onToggle 
}: { 
  hook: Hook; 
  onToggle: (name: string, enabled: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    await onToggle(hook.name, !hook.enabled);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 font-mono">
            {hook.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {hook.description || 'No description'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
            hook.enabled ? 'bg-orange-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              hook.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HooksPanel() {
  const [data, setData] = useState<HooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard/hooks/cli');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HooksData = await res.json();
      setData(json);
      setError(json.error || null);
      setLastRefreshed(new Date());
    } catch (err) {
      setError('Failed to load hooks. Make sure your container is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleToggle = useCallback(async (hookName: string, enabled: boolean) => {
    const action = enabled ? 'enable' : 'disable';
    try {
      const res = await fetch(`/api/dashboard/hooks/cli/${action}/${encodeURIComponent(hookName)}`, {
        method: 'POST',
      });
      if (res.ok) {
        // Refresh data after toggle
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed to toggle hook:', err);
    }
  }, [fetchData]);

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

  const hooks = data?.hooks ?? [];

  return (
    <div className="space-y-8">
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

      {/* Hooks list */}
      {hooks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-3">🪝</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hooks yet</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-4 leading-relaxed">
            Hooks let your AI automatically react to events — like responding to messages 
            or running tasks when files change.
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Think of them as "if this, then that" rules for your assistant.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-lg mx-auto text-left">
            <p className="text-xs font-medium text-gray-700 mb-2">💡 To add hooks:</p>
            <ol className="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
              <li>Configure hooks in your agent's workspace</li>
              <li>Edit the <code className="bg-gray-200 px-1 rounded font-mono">openclaw.json</code> file</li>
              <li>Define event triggers and actions</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {hooks.map((hook) => (
            <HookCard 
              key={hook.name} 
              hook={hook} 
              onToggle={handleToggle} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
