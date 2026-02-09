'use client';

import { useEffect, useState } from 'react';

interface ContainerStatus {
  status: 'running' | 'provisioning' | 'stopped' | 'offline' | 'error';
  model: string;
  uptime: number;
  containerId?: string;
  tier: string;
}

export function ContainerStatusWidget() {
  const [status, setStatus] = useState<ContainerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/container/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch container status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getStatusConfig = (st: string) => {
    switch (st) {
      case 'running':
        return {
          icon: '✅',
          text: 'Your AI is online',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
        };
      case 'provisioning':
        return {
          icon: '⏳',
          text: 'Starting up...',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
        };
      case 'stopped':
      case 'offline':
        return {
          icon: '❌',
          text: 'AI is offline',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
        };
      case 'error':
        return {
          icon: '⚠️',
          text: 'Error detected',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
        };
      default:
        return {
          icon: '❓',
          text: 'Unknown status',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 sm:mb-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!status) return null;

  const config = getStatusConfig(status.status);

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-6 mb-6 sm:mb-8`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{config.icon}</span>
            <h2 className={`text-xl font-semibold ${config.textColor}`}>
              {config.text}
            </h2>
          </div>
          <div className="space-y-1">
            <p className={`text-sm ${config.textColor} opacity-90`}>
              Running <span className="font-medium">{status.model}</span>
            </p>
            {status.uptime > 0 && (
              <p className={`text-sm ${config.textColor} opacity-75`}>
                Uptime: {formatUptime(status.uptime)}
              </p>
            )}
          </div>
        </div>
        
        {/* Status indicator dot */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            status.status === 'running' ? 'bg-green-500 animate-pulse' : 
            status.status === 'provisioning' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`}></div>
          <span className={`text-xs font-medium ${config.textColor} uppercase tracking-wide`}>
            {status.status}
          </span>
        </div>
      </div>
    </div>
  );
}
