'use client';

import { useEffect, useState } from 'react';

interface Container {
  id: string;
  name: string;
  status: string;
  image: string;
  ports: string;
  isRunning: boolean;
}

export function ContainerManagement() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContainers();
  }, []);

  async function fetchContainers() {
    try {
      const res = await fetch('/api/admin/containers');
      if (res.ok) {
        const data = await res.json();
        setContainers(data.containers);
      }
    } catch (error) {
      console.error('Failed to fetch containers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleContainerAction(containerId: string, action: 'restart' | 'stop') {
    const containerName = containers.find(c => c.id === containerId)?.name || containerId;
    
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} container ${containerName}?`)) {
      return;
    }

    // For direct container operations, we need the user ID from the container name
    // Format: clawer_user_{userId}
    const userIdMatch = containerName.match(/clawer_user_(.+)/);
    if (!userIdMatch) {
      alert('Cannot determine user ID from container name');
      return;
    }

    const userId = userIdMatch[1];

    try {
      const res = await fetch(`/api/admin/container/${userId}/${action}`, {
        method: 'POST',
      });
      
      if (res.ok) {
        alert(`Container ${action}ed successfully`);
        fetchContainers();
      } else {
        alert(`Failed to ${action} container`);
      }
    } catch (error) {
      alert(`Error ${action}ing container`);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm">
        <div className="text-center text-gray-400">Loading containers...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Container Management</h2>
            <p className="text-gray-600 text-sm mt-1">
              {containers.length} total containers ({containers.filter(c => c.isRunning).length} running)
            </p>
          </div>
          <button
            onClick={fetchContainers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Container List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Container ID
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Image
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Ports
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {containers.map((container) => (
              <tr key={container.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-mono text-xs text-gray-600">
                    {container.id.substring(0, 12)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">
                    {container.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    container.isRunning
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      container.isRunning ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                    {container.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {container.image}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 font-mono">
                    {container.ports || '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleContainerAction(container.id, 'restart')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                    >
                      🔄 Restart
                    </button>
                    {container.isRunning && (
                      <button
                        onClick={() => handleContainerAction(container.id, 'stop')}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                      >
                        ⏹ Stop
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {containers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No containers found
        </div>
      )}
    </div>
  );
}
