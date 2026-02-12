'use client';

import { useState, useEffect } from 'react';

interface Feedback {
  id: number;
  userId: string | null;
  category: string;
  message: string;
  email: string | null;
  page: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'planned', label: 'Planned', color: 'bg-purple-100 text-purple-800' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' },
  { value: 'wont_fix', label: "Won't Fix", color: 'bg-gray-100 text-gray-800' },
];

const CATEGORY_LABELS: Record<string, string> = {
  feature_request: 'Feature Request',
  bug: 'Bug Report',
  skill_request: 'Skill Request',
  general: 'General',
};

export function FeedbackTable() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feedback');
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedbackList(data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      setUpdatingId(id);
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setFeedbackList(prev =>
        prev.map(item =>
          item.id === id ? { ...item, status: newStatus, updatedAt: new Date().toISOString() } : item
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading feedback...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">{error}</p>
        <button
          onClick={fetchFeedback}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (feedbackList.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No feedback submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User/Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feedbackList.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 transition cursor-pointer"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {CATEGORY_LABELS[item.category] || item.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {expandedId === item.id ? (
                      <div className="whitespace-pre-wrap">{item.message}</div>
                    ) : (
                      <div className="truncate max-w-md">
                        {item.message.length > 100
                          ? `${item.message.substring(0, 100)}...`
                          : item.message}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {item.userId ? (
                    <span className="text-blue-600 font-mono text-xs">{item.userId}</span>
                  ) : (
                    <span className="text-gray-500">{item.email || 'Anonymous'}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.page || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={item.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateStatus(item.id, e.target.value);
                    }}
                    disabled={updatingId === item.id}
                    className={`text-xs font-medium px-3 py-1.5 rounded border-0 cursor-pointer ${getStatusColor(
                      item.status
                    )} disabled:opacity-50`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Total: <span className="font-medium">{feedbackList.length}</span> feedback submissions
        </p>
      </div>
    </div>
  );
}
