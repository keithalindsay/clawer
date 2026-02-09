'use client';

import { useEffect, useState } from 'react';
import { UserTable } from './UserTable';
import { ContainerManagement } from './ContainerManagement';
import { SystemHealth } from './SystemHealth';

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  containersRunning: number;
  messagesToday: number;
  systemHealth: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    totalContainers: number;
  };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time monitoring and management</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          icon="💳"
          color="green"
        />
        <StatCard
          title="Containers Running"
          value={stats?.containersRunning || 0}
          icon="🐳"
          color="purple"
        />
        <StatCard
          title="Messages Today"
          value={stats?.messagesToday || 0}
          icon="💬"
          color="orange"
        />
      </div>

      {/* System Health */}
      {stats?.systemHealth && (
        <SystemHealth health={stats.systemHealth} />
      )}

      {/* User Management */}
      <UserTable onRefresh={fetchStats} />

      {/* Container Management */}
      <ContainerManagement />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${colors[color]} bg-white shadow-sm`}>
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</div>
      <div className="text-gray-600 text-sm mt-1 font-medium">{title}</div>
    </div>
  );
}
