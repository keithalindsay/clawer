'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UsageData {
  current: {
    weekStart: string;
    weekEnd: string;
    tokensUsed: number;
    tokenLimit: number;
    percentUsed: number;
    estimatedCost: number;
  };
  breakdown: {
    orchestrator: { input: number; output: number };
    workers: { input: number; output: number };
  };
  resetDate: string;
  tier: 'basic' | 'pro' | 'enterprise';
}

export function UsageWidget() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      const data = await response.json();
      setUsage(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
      setError('Unable to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchUsage, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="flex gap-4">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-red-800 font-medium">{error || 'Failed to load usage'}</span>
        </div>
      </div>
    );
  }

  const { current, resetDate, tier } = usage;
  const percentUsed = current.percentUsed;
  
  // Determine color scheme based on usage
  const getColorScheme = () => {
    if (percentUsed >= 95) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        bar: 'bg-red-500',
        text: 'text-red-800',
        secondaryText: 'text-red-700'
      };
    } else if (percentUsed >= 80) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        bar: 'bg-yellow-500',
        text: 'text-yellow-800',
        secondaryText: 'text-yellow-700'
      };
    } else {
      return {
        bg: 'bg-white',
        border: 'border-gray-200',
        bar: 'bg-blue-500',
        text: 'text-gray-900',
        secondaryText: 'text-gray-600'
      };
    }
  };

  const colors = getColorScheme();
  
  // Calculate days until reset
  const getDaysUntilReset = () => {
    const reset = new Date(resetDate);
    const now = new Date();
    const diffTime = reset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Resets today';
    if (diffDays === 1) return 'Resets tomorrow';
    return `Resets in ${diffDays} days`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(2)}M`;
    } else if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  return (
    <div className={`rounded-2xl border p-6 mb-8 ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-semibold ${colors.text}`}>
          Weekly Usage
        </h2>
        <span className={`text-sm ${colors.secondaryText}`}>
          {getDaysUntilReset()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-6 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${colors.bar} transition-all duration-500`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>

      {/* Token count */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-lg font-medium ${colors.text}`}>
          {formatTokens(current.tokensUsed)} / {formatTokens(current.tokenLimit)} tokens
        </span>
        <span className={`text-lg font-semibold ${colors.text}`}>
          {percentUsed.toFixed(0)}%
        </span>
      </div>

      {/* Warning messages */}
      {percentUsed >= 95 && (
        <div className={`mb-4 p-3 rounded-lg bg-red-100 border border-red-300`}>
          <p className="text-sm font-medium text-red-900">
            🛑 Weekly limit reached
          </p>
          <p className="text-sm text-red-800 mt-1">
            Your token budget resets {getDaysUntilReset().toLowerCase()}.
          </p>
        </div>
      )}
      {percentUsed >= 80 && percentUsed < 95 && (
        <div className={`mb-4 p-3 rounded-lg bg-yellow-100 border border-yellow-300`}>
          <p className="text-sm font-medium text-yellow-900">
            ⚠️ Approaching weekly limit
          </p>
          <p className="text-sm text-yellow-800 mt-1">
            Consider upgrading for more capacity.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <Link
          href="/dashboard/usage"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
        >
          View Details
        </Link>
        {tier === 'basic' && (
          <Link
            href="/pricing"
            className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
          >
            Upgrade →
          </Link>
        )}
      </div>
    </div>
  );
}
