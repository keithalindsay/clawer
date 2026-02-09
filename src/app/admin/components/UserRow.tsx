'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  stripeSubscriptionId: string | null;
  containerId: string | null;
  containerPort: number | null;
  containerStatus: string | null;
  whatsappConnected: number;
  telegramConnected: number;
  dailyMessageCount: number;
  monthlyMessageCount: number;
  updatedAt: string;
}

interface UserRowProps {
  user: User;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}

export function UserRow({ user, expanded, onToggle, onRefresh }: UserRowProps) {
  const [logs, setLogs] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (expanded && user.containerId) {
      fetchLogs();
    }
  }, [expanded, user.containerId]);

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/admin/container/logs?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || 'No logs available');
      } else {
        setLogs('Failed to load logs');
      }
    } catch (error) {
      setLogs('Error loading logs');
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleRestart() {
    if (!confirm(`Restart container for ${user.email}?`)) return;

    setRestarting(true);
    try {
      const res = await fetch(`/api/admin/container/${user.id}/restart`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('Container restarted successfully');
        onRefresh();
        if (expanded) {
          setTimeout(fetchLogs, 2000);
        }
      } else {
        alert('Failed to restart container');
      }
    } catch (error) {
      alert('Error restarting container');
    } finally {
      setRestarting(false);
    }
  }

  const containerStatusColor =
    user.containerStatus === 'running'
      ? 'text-green-600 bg-green-50'
      : user.containerStatus === 'stopped'
      ? 'text-yellow-600 bg-yellow-50'
      : 'text-gray-600 bg-gray-50';

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition"
        onClick={onToggle}
      >
        <td className="px-6 py-4">
          <div>
            <div className="font-medium text-gray-900">
              {user.email}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">
              {user.id.substring(0, 20)}...
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          {user.stripeSubscriptionId ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              {user.tier}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              free
            </span>
          )}
        </td>
        <td className="px-6 py-4">
          {user.containerId ? (
            <div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${containerStatusColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  user.containerStatus === 'running' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></span>
                {user.containerStatus}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                Port: {user.containerPort}
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">No container</span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {user.dailyMessageCount} today
            </div>
            <div className="text-gray-500 text-xs">
              {user.monthlyMessageCount} this month
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-600">
            {new Date(user.updatedAt).toLocaleString()}
          </div>
        </td>
        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {user.containerId && (
              <button
                onClick={handleRestart}
                disabled={restarting}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {restarting ? '...' : '🔄 Restart'}
              </button>
            )}
            <button
              onClick={onToggle}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition"
            >
              {expanded ? '▲ Collapse' : '▼ Expand'}
            </button>
          </div>
        </td>
      </tr>
      
      {/* Expanded Details */}
      {expanded && (
        <tr>
          <td colSpan={6} className="px-6 py-6 bg-gray-50 border-t border-gray-200">
            <div className="space-y-6">
              {/* Usage Stats */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Usage Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Daily Messages</div>
                    <div className="text-2xl font-bold text-gray-900">{user.dailyMessageCount}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Monthly Messages</div>
                    <div className="text-2xl font-bold text-gray-900">{user.monthlyMessageCount}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">WhatsApp</div>
                    <div className="text-2xl font-bold">
                      {user.whatsappConnected ? '✅' : '❌'}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Telegram</div>
                    <div className="text-2xl font-bold">
                      {user.telegramConnected ? '✅' : '❌'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Container Logs */}
              {user.containerId && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Container Logs (Last 100 lines)</h4>
                    <button
                      onClick={fetchLogs}
                      disabled={loadingLogs}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:opacity-50 transition"
                    >
                      {loadingLogs ? 'Loading...' : '🔄 Refresh Logs'}
                    </button>
                  </div>
                  <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                    {loadingLogs ? (
                      <div className="text-gray-500">Loading logs...</div>
                    ) : (
                      <pre className="whitespace-pre-wrap">{logs}</pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
