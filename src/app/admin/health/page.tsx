'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type CheckStatus = 'pass' | 'fail' | 'warning' | 'critical' | 'unknown' | 'no_port';

interface HealthCheck {
  status: CheckStatus;
  responseMs?: number;
  usagePercent?: number;
  hours?: number;
  restarts?: number;
  lastSeen?: string;
}

interface ContainerHealth {
  name: string;
  userId: string;
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    gateway: HealthCheck;
    config: HealthCheck;
    disk: HealthCheck;
    memory: HealthCheck;
    uptime: HealthCheck;
    heartbeat: HealthCheck;
  };
  issues: string[];
}

interface FleetHealth {
  timestamp: string;
  containers: ContainerHealth[];
  summary: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
  };
}

export default function HealthDashboardPage() {
  const [health, setHealth] = useState<FleetHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/health/fleet');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setHealth(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const toggleContainer = (name: string) => {
    const newExpanded = new Set(expandedContainers);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedContainers(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
      case 'fail':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'bg-green-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'critical':
      case 'fail':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <div className="text-gray-400">Checking fleet health...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold">
              🦞 Clawer.ai
            </Link>
            <span className="text-xs bg-red-600 px-2 py-1 rounded font-medium">
              ADMIN
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="text-gray-300 hover:text-white transition">
              Overview
            </Link>
            <Link href="/admin/users" className="text-gray-300 hover:text-white transition">
              Users
            </Link>
            <Link href="/admin/health" className="text-white font-medium">
              Health
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition">
              Exit Admin →
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Fleet Health Monitor</h1>
            {health && (
              <p className="text-gray-400 text-sm">
                Last updated: {formatTimestamp(health.timestamp)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (60s)
            </label>
            <button
              onClick={fetchHealth}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-600 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚠️</div>
              <div>
                <div className="font-bold text-red-400 mb-1">Health Check Failed</div>
                <div className="text-sm text-gray-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {health && (
          <>
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Total Containers</div>
                <div className="text-3xl font-bold">{health.summary.total}</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Healthy</div>
                <div className="text-3xl font-bold text-green-400">{health.summary.healthy}</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Warnings</div>
                <div className="text-3xl font-bold text-yellow-400">{health.summary.warning}</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-2">Critical</div>
                <div className="text-3xl font-bold text-red-400">{health.summary.critical}</div>
              </div>
            </div>

            {/* Container List */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
                <h2 className="text-xl font-bold">Containers</h2>
              </div>
              <div className="divide-y divide-gray-700">
                {health.containers.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-400">
                    No containers found
                  </div>
                ) : (
                  health.containers.map((container) => (
                    <div key={container.name} className="px-6 py-4">
                      {/* Container Header */}
                      <button
                        onClick={() => toggleContainer(container.name)}
                        className="w-full flex items-center justify-between hover:bg-gray-750 -mx-6 px-6 py-2 rounded transition"
                      >
                        <div className="flex items-center gap-4">
                          <span className={`w-3 h-3 rounded-full ${getStatusDot(container.status)}`}></span>
                          <div className="text-left">
                            <div className="font-medium">{container.name}</div>
                            <div className="text-xs text-gray-500 font-mono">
                              User: {container.userId}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className={`text-sm font-medium ${getStatusColor(container.status)}`}>
                            {container.status.toUpperCase()}
                          </div>
                          {container.issues.length > 0 && (
                            <div className="text-sm text-gray-400">
                              {container.issues.length} issue{container.issues.length !== 1 ? 's' : ''}
                            </div>
                          )}
                          <div className="text-gray-500">
                            {expandedContainers.has(container.name) ? '▼' : '▶'}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {expandedContainers.has(container.name) && (
                        <div className="mt-4 pl-7 space-y-3">
                          {/* Issues */}
                          {container.issues.length > 0 && (
                            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                              <div className="font-medium text-red-400 mb-2">Issues:</div>
                              <ul className="list-disc list-inside space-y-1">
                                {container.issues.map((issue, idx) => (
                                  <li key={idx} className="text-sm text-gray-300">{issue}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Health Checks Grid */}
                          <div className="grid grid-cols-3 gap-4">
                            {/* Gateway */}
                            <div className="bg-gray-750 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(container.checks.gateway.status)}`}></span>
                                <div className="font-medium text-sm">Gateway</div>
                              </div>
                              <div className="text-xs text-gray-400">
                                {container.checks.gateway.status === 'pass' 
                                  ? `Response: ${container.checks.gateway.responseMs}ms`
                                  : container.checks.gateway.status}
                              </div>
                            </div>

                            {/* Config */}
                            <div className="bg-gray-750 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(container.checks.config.status)}`}></span>
                                <div className="font-medium text-sm">Config</div>
                              </div>
                              <div className="text-xs text-gray-400">
                                {container.checks.config.status}
                              </div>
                            </div>

                            {/* Disk */}
                            <div className="bg-gray-750 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(container.checks.disk.status)}`}></span>
                                <div className="font-medium text-sm">Disk</div>
                              </div>
                              <div className="text-xs text-gray-400">
                                {container.checks.disk.usagePercent}% used
                              </div>
                            </div>

                            {/* Memory */}
                            <div className="bg-gray-750 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(container.checks.memory.status)}`}></span>
                                <div className="font-medium text-sm">Memory</div>
                              </div>
                              <div className="text-xs text-gray-400">
                                {container.checks.memory.usagePercent}% used
                              </div>
                            </div>

                            {/* Uptime */}
                            <div className="bg-gray-750 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(container.checks.uptime.status)}`}></span>
                                <div className="font-medium text-sm">Uptime</div>
                              </div>
                              <div className="text-xs text-gray-400">
                                {container.checks.uptime.hours}h | {container.checks.uptime.restarts} restarts
                              </div>
                            </div>

                            {/* Heartbeat */}
                            <div className="bg-gray-750 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${getStatusDot(container.checks.heartbeat.status)}`}></span>
                                <div className="font-medium text-sm">Activity</div>
                              </div>
                              <div className="text-xs text-gray-400">
                                {container.checks.heartbeat.lastSeen || 'unknown'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
