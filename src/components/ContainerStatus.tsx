'use client';

import { useEffect, useState } from 'react';

interface ContainerStatusData {
  status: 'running' | 'stopped' | 'error' | 'not_provisioned' | 'not_found';
  port: number | null;
  whatsappConnected: boolean;
  telegramConnected: boolean;
}

export function ContainerStatus() {
  const [status, setStatus] = useState<ContainerStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/container/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch container status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      const response = await fetch('/api/container/restart', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Wait a moment for container to restart
        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to restart container:', error);
    } finally {
      setRestarting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
          <span className="text-gray-600">Loading container status...</span>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const getStatusColor = () => {
    switch (status.status) {
      case 'running':
        return 'bg-green-50 border-green-200';
      case 'stopped':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
      case 'not_found':
        return 'bg-red-50 border-red-200';
      case 'not_provisioned':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIndicator = () => {
    switch (status.status) {
      case 'running':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'stopped':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      case 'error':
      case 'not_found':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case 'not_provisioned':
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'running':
        return 'Container Running';
      case 'stopped':
        return 'Container Stopped';
      case 'error':
        return 'Container Error';
      case 'not_found':
        return 'Container Not Found';
      case 'not_provisioned':
        return 'Container Not Provisioned';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className={`rounded-2xl border p-6 mb-8 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIndicator()}
          <div>
            <h3 className="font-semibold text-gray-900">{getStatusText()}</h3>
            {status.port && (
              <p className="text-sm text-gray-600">
                Port: {status.port}
              </p>
            )}
          </div>
        </div>

        {status.status !== 'not_provisioned' && (
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {restarting ? 'Restarting...' : 'Restart Container'}
          </button>
        )}
      </div>

      {status.status === 'not_provisioned' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Your container will be automatically provisioned when you connect your first chat app.
          </p>
        </div>
      )}

      {(status.status === 'error' || status.status === 'not_found') && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <p className="text-sm text-red-800">
            There's an issue with your container. Try restarting it or contact support if the problem persists.
          </p>
        </div>
      )}
    </div>
  );
}
