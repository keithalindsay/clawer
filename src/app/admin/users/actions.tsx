'use client';

import { useState } from 'react';

export function RestartButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleRestart = async () => {
    if (!confirm('Restart this user\'s container?')) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/container/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        alert('Container restarted');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to restart');
      }
    } catch (error) {
      alert('Error restarting container');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRestart}
      disabled={loading}
      className="px-3 py-1.5 text-xs bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Restart'}
    </button>
  );
}

export function ViewLogsButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string | null>(null);

  const handleViewLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/container/logs?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to get logs');
      }
    } catch (error) {
      alert('Error fetching logs');
    } finally {
      setLoading(false);
    }
  };

  if (logs) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="font-medium">Container Logs</h3>
            <button
              onClick={() => setLogs(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <pre className="p-4 overflow-auto max-h-[60vh] text-xs text-gray-300 font-mono">
            {logs}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleViewLogs}
      disabled={loading}
      className="px-3 py-1.5 text-xs bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50"
    >
      {loading ? '...' : 'Logs'}
    </button>
  );
}
