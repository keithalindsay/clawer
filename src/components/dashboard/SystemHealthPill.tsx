'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface HealthData {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details: {
    containerStatus: string;
    modelConnected: boolean;
    lastSync: string;
  };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function SystemHealthPill() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch {
      // Silently degrade — don't crash the whole dashboard
      setHealth({
        status: 'warning',
        message: 'Health check unavailable',
        details: { containerStatus: 'unknown', modelConnected: false, lastSync: new Date().toISOString() },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 60_000); // refresh every 60s
    return () => clearInterval(id);
  }, [fetchHealth]);

  // Color config per status
  const cfg = {
    healthy: {
      dot: 'bg-green-500',
      pill: 'bg-green-50 border-green-200 text-green-700',
      label: '● System Healthy',
    },
    warning: {
      dot: 'bg-yellow-500',
      pill: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      label: '● Issues Detected',
    },
    error: {
      dot: 'bg-red-500',
      pill: 'bg-red-50 border-red-200 text-red-700',
      label: '● System Down',
    },
  };

  if (loading) {
    return (
      <div className="flex justify-end">
        <div className="h-7 w-40 animate-pulse bg-gray-200 rounded-full" />
      </div>
    );
  }

  const status = health?.status ?? 'warning';
  const colors = cfg[status];

  return (
    <div className="flex justify-end relative">
      <div className="relative">
        <button
          onClick={() => setExpanded(v => !v)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${colors.pill}`}
          aria-expanded={expanded}
          aria-label="System health status"
        >
          <span
            className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors.dot} ${status !== 'healthy' ? 'animate-pulse' : ''}`}
          />
          {health?.message ?? colors.label}
        </button>

        {/* Expanded dropdown */}
        {expanded && health && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-md z-20 p-4">
            <p className="text-xs font-semibold text-gray-900 mb-3">System Details</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Container</span>
                <span className={`font-medium capitalize ${
                  health.details.containerStatus === 'running' ? 'text-green-600' :
                  health.details.containerStatus === 'provisioning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {health.details.containerStatus || 'unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Model</span>
                <span className={`font-medium ${health.details.modelConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {health.details.modelConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Last sync</span>
                <span className="text-gray-700">{fmt(health.details.lastSync)}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link
                href="/dashboard/health"
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                onClick={() => setExpanded(false)}
              >
                View full health report →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop to close dropdown */}
      {expanded && (
        <div className="fixed inset-0 z-10" onClick={() => setExpanded(false)} />
      )}
    </div>
  );
}
