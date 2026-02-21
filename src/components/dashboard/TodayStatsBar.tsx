'use client';

import { useState, useEffect, useCallback } from 'react';

interface StatsData {
  messagesToday: number;
  tasksCompleted: number;
  agentActivities: number;
  teamMembersActive: number;
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: string;
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
      <span className="text-2xl flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        {loading ? (
          <>
            <div className="h-6 w-10 animate-pulse bg-gray-200 rounded mb-1" />
            <div className="h-3 w-20 animate-pulse bg-gray-100 rounded" />
          </>
        ) : (
          <>
            <div className="text-xl font-bold text-gray-900 leading-none">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{label}</div>
          </>
        )}
      </div>
    </div>
  );
}

export function TodayStatsBar() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Leave null — show zeroes
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const s = stats ?? { messagesToday: 0, tasksCompleted: 0, agentActivities: 0, teamMembersActive: 0 };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard icon="💬" label="Messages today" value={s.messagesToday} loading={loading} />
      <StatCard icon="✅" label="Tasks completed" value={s.tasksCompleted} loading={loading} />
      <StatCard icon="⚡" label="Agent activities" value={s.agentActivities} loading={loading} />
      <StatCard icon="👥" label="Agents active" value={s.teamMembersActive} loading={loading} />
    </div>
  );
}
