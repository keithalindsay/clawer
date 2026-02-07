import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { sql } from 'drizzle-orm';

export default async function AdminPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Get stats
  const [
    totalUsers,
    subscribedUsers,
    activeContainers,
    whatsappConnected,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users).then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` }).from(users).where(sql`stripe_subscription_id IS NOT NULL`).then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` }).from(users).where(sql`container_status = 'running'`).then(r => r[0]?.count || 0),
    db.select({ count: sql<number>`count(*)` }).from(users).where(sql`whatsapp_connected = 1`).then(r => r[0]?.count || 0),
  ]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold">
              🦞 CLAWER<span className="text-blue-400">.AI</span>
            </Link>
            <span className="text-xs bg-red-600 px-2 py-1 rounded font-medium">
              ADMIN
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="text-gray-300 hover:text-white">
              Overview
            </Link>
            <Link href="/admin/users" className="text-gray-300 hover:text-white">
              Users
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
              Exit Admin →
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Users"
            value={totalUsers}
            icon="👥"
          />
          <StatCard
            title="Subscribed"
            value={subscribedUsers}
            icon="💳"
            color="green"
          />
          <StatCard
            title="Active Containers"
            value={activeContainers}
            icon="🐳"
            color="blue"
          />
          <StatCard
            title="WhatsApp Connected"
            value={whatsappConnected}
            icon="💬"
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Users
            </Link>
            <button
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Restart All Containers
            </button>
            <button
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              View Logs
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <StatusRow label="Docker" status="running" />
            <StatusRow label="Database" status="connected" />
            <StatusRow label="Stripe Webhooks" status="active" />
            <StatusRow label="Moonshot API" status="ok" />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'gray' 
}: { 
  title: string; 
  value: number; 
  icon: string;
  color?: 'gray' | 'green' | 'blue' | 'purple';
}) {
  const colors = {
    gray: 'bg-gray-800 border-gray-700',
    green: 'bg-green-900/50 border-green-700',
    blue: 'bg-blue-900/50 border-blue-700',
    purple: 'bg-purple-900/50 border-purple-700',
  };

  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-gray-400 text-sm">{title}</div>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  const isGood = ['running', 'connected', 'active', 'ok'].includes(status.toLowerCase());
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
      <span className="text-gray-300">{label}</span>
      <span className={`text-sm font-medium ${isGood ? 'text-green-400' : 'text-red-400'}`}>
        {status}
      </span>
    </div>
  );
}
