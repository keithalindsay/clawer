import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { desc } from 'drizzle-orm';
import { RestartButton, ViewLogsButton } from './actions';

export default async function AdminUsersPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Get all users
  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);

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
            <Link href="/admin/users" className="text-white font-medium">
              Users
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
              Exit Admin →
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Users ({allUsers.length})</h1>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">User</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Container</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Connections</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {allUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-100">
                        {user.email || user.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {user.id.slice(0, 16)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.stripeSubscriptionId ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Subscribed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        Free
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.containerId ? (
                      <div className="text-sm">
                        <div className={`inline-flex items-center gap-1 ${
                          user.containerStatus === 'running' 
                            ? 'text-green-400' 
                            : 'text-yellow-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            user.containerStatus === 'running'
                              ? 'bg-green-400'
                              : 'bg-yellow-400'
                          }`}></span>
                          {user.containerStatus || 'unknown'}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          Port: {user.containerPort}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Not provisioned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className={user.whatsappConnected === 1 ? 'text-green-400' : 'text-gray-500'}>
                        💬 {user.whatsappConnected === 1 ? '✓' : '–'}
                      </span>
                      <span className={user.telegramConnected === 1 ? 'text-green-400' : 'text-gray-500'}>
                        ✈️ {user.telegramConnected === 1 ? '✓' : '–'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.containerId && (
                        <>
                          <RestartButton userId={user.id} />
                          <ViewLogsButton userId={user.id} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
