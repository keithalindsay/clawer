'use client';

import { useEffect, useState } from 'react';

interface CollaborationStatus {
  isActive: boolean;
  fromAgent: string;
  toAgent: string;
  task: string;
  startedAt: string;
}

interface AgentCollaborationIndicatorProps {
  agentId?: string; // If provided, only show activity for this agent
  className?: string;
}

export function AgentCollaborationIndicator({
  agentId,
  className = '',
}: AgentCollaborationIndicatorProps) {
  const [status, setStatus] = useState<CollaborationStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Poll for active collaboration status
    const checkStatus = async () => {
      try {
        const url = agentId
          ? `/api/agent/collaboration-status?agentId=${agentId}`
          : '/api/team/collaboration-status';

        const response = await fetch(url);
        if (!response.ok) return;

        const data = await response.json();

        if (data.isActive) {
          setStatus(data);
          setIsVisible(true);
        } else {
          setIsVisible(false);
          // Delay removing status to allow fade-out animation
          setTimeout(() => setStatus(null), 300);
        }
      } catch (error) {
        console.error('Failed to check collaboration status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [agentId]);

  if (!status || !isVisible) {
    return null;
  }

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

  return (
    <div
      className={`
        flex items-center gap-3 p-3 
        bg-gradient-to-r from-blue-50 to-purple-50 
        border border-blue-200 
        rounded-lg 
        shadow-sm
        animate-in fade-in slide-in-from-top-2
        duration-300
        ${className}
      `}
    >
      {/* Agent icons with animation */}
      <div className="flex items-center gap-1">
        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">
          {getAgentEmoji(status.fromAgent)}
        </div>
        
        <div className="relative">
          <div className="animate-pulse">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">
          {getAgentEmoji(status.toAgent)}
        </div>
      </div>

      {/* Status text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-900">
            {getAgentName(status.toAgent)} is working...
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-0.5 truncate">
          {status.task}
        </p>
      </div>

      {/* Spinner */}
      <div className="flex-shrink-0">
        <div className="animate-spin text-blue-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline collaboration indicator for chat messages
 * Shows when a specific delegation is in progress
 */
interface InlineCollaborationIndicatorProps {
  fromAgent: string;
  toAgent: string;
  task: string;
  onComplete?: () => void;
}

export function InlineCollaborationIndicator({
  fromAgent,
  toAgent,
  task,
  onComplete,
}: InlineCollaborationIndicatorProps) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // In real implementation, this would listen for completion events
    // For now, simulate completion after random time
    const timeout = setTimeout(() => {
      setIsComplete(true);
      onComplete?.();
    }, 3000 + Math.random() * 5000);

    return () => clearTimeout(timeout);
  }, [onComplete]);

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

  if (isComplete) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
        <span className="text-lg">{getAgentEmoji(toAgent)}</span>
        <span className="font-medium">{getAgentName(toAgent)} completed the task</span>
        <span>✓</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
      <span className="text-lg">{getAgentEmoji(toAgent)}</span>
      <span className="font-medium">{getAgentName(toAgent)} is working on this...</span>
      <div className="animate-spin">⚙️</div>
    </div>
  );
}
