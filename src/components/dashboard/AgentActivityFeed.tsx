'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface AgentActivity {
  id: string;
  timestamp: string;
  fromAgent: string;
  toAgent: string;
  action: 'delegate' | 'complete' | 'collaborate';
  summary: string;
  details?: string;
}

interface AgentActivityFeedProps {
  limit?: number;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export function AgentActivityFeed({
  limit = 20,
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 5000,
}: AgentActivityFeedProps) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/team/activity?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch agent activity');
      }
      const data = await response.json();
      setActivities(data.activities || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();

    if (autoRefresh) {
      const interval = setInterval(fetchActivity, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [limit, autoRefresh, refreshInterval]);

  const getAgentEmoji = (agentId: string): string => {
    const emojiMap: Record<string, string> = {
      'chief-of-staff': '📋',
      'goal-tracker': '🎯',
      'researcher': '🔍',
      'executor': '⚡',
      'wellness': '💪',
    };
    return emojiMap[agentId] || '🤖';
  };

  const getAgentName = (agentId: string): string => {
    const nameMap: Record<string, string> = {
      'chief-of-staff': 'Max',
      'goal-tracker': 'North',
      'researcher': 'Scout',
      'executor': 'Dash',
      'wellness': 'Zen',
    };
    return nameMap[agentId] || agentId;
  };

  const getActionColor = (action: AgentActivity['action']): string => {
    switch (action) {
      case 'delegate':
        return 'text-blue-600 bg-blue-50';
      case 'complete':
        return 'text-green-600 bg-green-50';
      case 'collaborate':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionIcon = (action: AgentActivity['action']): string => {
    switch (action) {
      case 'delegate':
        return '→';
      case 'complete':
        return '✓';
      case 'collaborate':
        return '↔';
      default:
        return '•';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <div className="animate-spin mr-2">⚙️</div>
        <span>Loading agent activity...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-semibold">Error loading activity</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg">No agent activity yet</p>
        <p className="text-sm mt-2">Your team's collaboration will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Agent Activity</h3>
        {autoRefresh && (
          <div className="flex items-center text-xs text-gray-500">
            <div className="animate-pulse mr-1">●</div>
            <span>Live</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* From Agent */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {getAgentEmoji(activity.fromAgent)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {getAgentName(activity.fromAgent)}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)} {activity.action}
                  </span>

                  <span className="text-gray-900">→</span>

                  <span className="font-semibold text-gray-900">
                    {getAgentName(activity.toAgent)}
                  </span>

                  <span className="text-xs text-gray-500 ml-auto">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>

                <p className="text-sm text-gray-700">{activity.summary}</p>

                {activity.details && showDetails && (
                  <button
                    onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    {expandedId === activity.id ? 'Hide details' : 'Show details'}
                  </button>
                )}

                {expandedId === activity.id && activity.details && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 whitespace-pre-wrap">
                    {activity.details}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
