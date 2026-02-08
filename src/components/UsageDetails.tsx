'use client';

import { useEffect, useState } from 'react';

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
  history: {
    week: string;
    tokensUsed: number;
  }[];
  resetDate: string;
  tier: 'basic' | 'pro' | 'enterprise';
}

interface RequestLog {
  id: string;
  timestamp: string;
  intent: string;
  tokensUsed: number;
  workers: string[];
  latencyMs: number;
}

interface RequestLogsResponse {
  requests: RequestLog[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}

export function UsageDetails() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page: number) => {
    setLogsLoading(true);
    try {
      const response = await fetch(`/api/usage/details?page=${page}&perPage=10`);
      if (response.ok) {
        const data: RequestLogsResponse = await response.json();
        setLogs(data.requests);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    fetchLogs(1);
  }, []);

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(2)}M`;
    } else if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="bg-gray-200 h-32 rounded-2xl"></div>
        <div className="bg-gray-200 h-64 rounded-2xl"></div>
        <div className="bg-gray-200 h-96 rounded-2xl"></div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-800">Failed to load usage data</p>
      </div>
    );
  }

  const { current, breakdown, history } = usage;
  const totalOrchestrator = breakdown.orchestrator.input + breakdown.orchestrator.output;
  const totalWorkers = breakdown.workers.input + breakdown.workers.output;
  const orchestratorPercent = totalOrchestrator > 0 ? (totalOrchestrator / current.tokensUsed) * 100 : 0;
  const workersPercent = totalWorkers > 0 ? (totalWorkers / current.tokensUsed) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Current Period Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Week</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Tokens Used</p>
            <p className="text-2xl font-bold text-gray-900">{formatTokens(current.tokensUsed)}</p>
            <p className="text-sm text-gray-500">of {formatTokens(current.tokenLimit)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Usage</p>
            <p className="text-2xl font-bold text-gray-900">{current.percentUsed.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">of weekly limit</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estimated Cost</p>
            <p className="text-2xl font-bold text-gray-900">${current.estimatedCost.toFixed(2)}</p>
            <p className="text-sm text-gray-500">this week</p>
          </div>
        </div>
      </div>

      {/* Orchestrator vs Workers Split */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Breakdown</h2>
        
        {/* Orchestrator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Orchestrator (Premium)</span>
            <span className="text-sm font-medium text-gray-900">{formatTokens(totalOrchestrator)}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: `${orchestratorPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Input: {formatTokens(breakdown.orchestrator.input)}</span>
            <span>Output: {formatTokens(breakdown.orchestrator.output)}</span>
          </div>
        </div>

        {/* Workers */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Workers (Efficient)</span>
            <span className="text-sm font-medium text-gray-900">{formatTokens(totalWorkers)}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${workersPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Input: {formatTokens(breakdown.workers.input)}</span>
            <span>Output: {formatTokens(breakdown.workers.output)}</span>
          </div>
        </div>
      </div>

      {/* 4-Week History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Last 4 Weeks</h2>
        <div className="flex items-end gap-4 h-32">
          {history.map((week, index) => {
            const maxTokens = Math.max(...history.map(w => w.tokensUsed));
            const heightPercent = maxTokens > 0 ? (week.tokensUsed / maxTokens) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end justify-center h-24">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${heightPercent}%`, minHeight: heightPercent > 0 ? '4px' : '0' }}
                    title={`${formatTokens(week.tokensUsed)} tokens`}
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">{formatDate(week.week)}</p>
                  <p className="text-xs font-medium text-gray-900">{formatTokens(week.tokensUsed)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Request Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Requests</h2>
        
        {logsLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No requests yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Intent</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Workers</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Tokens</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.intent}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {log.workers.length > 0 ? (
                          <div className="flex gap-1">
                            {log.workers.map((worker, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {worker}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Direct</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                        {formatTokens(log.tokensUsed)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">
                        {log.latencyMs}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.perPage && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.perPage) + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} requests
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLogs(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchLogs(pagination.page + 1)}
                    disabled={pagination.page * pagination.perPage >= pagination.total}
                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
