'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Conversation {
  id: string;
  title: string;
  preview: string | null;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  starred: boolean;
  platform: 'web' | 'whatsapp' | 'telegram' | 'slack';
  botId: string;
  botName: string;
  botType: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortOption = 'recent' | 'messages' | 'starred';

const platformIcons: Record<string, { icon: string; label: string }> = {
  web: { icon: '🌐', label: 'Web' },
  whatsapp: { icon: '📱', label: 'WhatsApp' },
  telegram: { icon: '✈️', label: 'Telegram' },
  slack: { icon: '💼', label: 'Slack' },
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'messages', label: 'Most messages' },
  { value: 'starred', label: 'Starred' },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort,
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/conversations?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setConversations(data.conversations);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sort, search]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Debounced search
  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStar = async (id: string, currentStarred: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !currentStarred }),
      });
      if (res.ok) {
        setConversations(prev =>
          prev.map(c => c.id === id ? { ...c, starred: !currentStarred } : c)
        );
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 Clawer.ai
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all your AI conversations across platforms
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSort(option.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sort === option.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && conversations.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {search ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              {search
                ? `No conversations matching "${search}". Try a different search term.`
                : 'Start chatting with your AI assistant to see your conversations here.'}
            </p>
            {!search && (
              <Link
                href="/chat/assistant"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Start a conversation
              </Link>
            )}
          </div>
        )}

        {/* Conversations List */}
        {!loading && conversations.length > 0 && (
          <div className="space-y-3">
            {conversations.map((convo) => (
              <div
                key={convo.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group relative"
              >
                {/* Delete Confirmation Overlay */}
                {deleteConfirm === convo.id && (
                  <div className="absolute inset-0 bg-white/95 rounded-2xl z-10 flex items-center justify-center gap-3 px-4">
                    <p className="text-sm text-gray-700 font-medium">Delete this conversation?</p>
                    <button
                      onClick={() => handleDelete(convo.id)}
                      disabled={actionLoading === convo.id}
                      className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === convo.id ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                  {/* Platform Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {platformIcons[convo.platform]?.icon || '🌐'}
                  </div>

                  {/* Content - Clickable */}
                  <button
                    onClick={() => router.push(`/chat/${convo.botType || 'assistant'}?conversation=${convo.id}`)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {convo.starred && (
                        <span className="text-yellow-500 text-sm">★</span>
                      )}
                      <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                        {convo.title}
                      </h3>
                      <span className="hidden sm:inline-flex items-center text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                        {platformIcons[convo.platform]?.label || 'Web'}
                      </span>
                    </div>
                    {convo.preview && (
                      <p className="text-sm text-gray-500 line-clamp-1 mb-1.5">
                        {convo.preview}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{convo.messageCount} messages</span>
                      <span>•</span>
                      <span>{timeAgo(convo.lastMessageAt)}</span>
                      <span>•</span>
                      <span>{convo.botName}</span>
                    </div>
                  </button>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Star */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStar(convo.id, convo.starred);
                      }}
                      disabled={actionLoading === convo.id}
                      className={`p-2 rounded-lg transition-colors ${
                        convo.starred
                          ? 'text-yellow-500 hover:bg-yellow-50'
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                      }`}
                      title={convo.starred ? 'Unstar' : 'Star'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(convo.id);
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
