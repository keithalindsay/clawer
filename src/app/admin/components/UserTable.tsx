'use client';

import { useEffect, useState } from 'react';
import { UserRow } from './UserRow';

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
  createdAt: string;
  updatedAt: string;
}

export function UserTable({ onRefresh }: { onRefresh: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm">
        <div className="text-center text-gray-400">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600 text-sm mt-1">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                fetchUsers();
                onRefresh();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Subscription
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Container
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Messages
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Last Active
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                expanded={expandedUser === user.id}
                onToggle={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                onRefresh={() => {
                  fetchUsers();
                  onRefresh();
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No users found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}
