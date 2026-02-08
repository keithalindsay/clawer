# Usage Widget - Key Code Snippets

## 1. UsageWidget.tsx - Dashboard Widget

### State Management & Data Fetching
```typescript
const [usage, setUsage] = useState<UsageData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const fetchUsage = async () => {
  try {
    const response = await fetch('/api/usage');
    if (!response.ok) throw new Error('Failed to fetch usage data');
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
```

### Dynamic Color Scheme Based on Usage
```typescript
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
```

### Progress Bar with Percentage
```tsx
<div className="relative w-full h-6 bg-gray-100 rounded-full overflow-hidden mb-3">
  <div
    className={`h-full ${colors.bar} transition-all duration-500`}
    style={{ width: `${Math.min(percentUsed, 100)}%` }}
  />
</div>

<div className="flex items-center justify-between mb-4">
  <span className={`text-lg font-medium ${colors.text}`}>
    {formatTokens(current.tokensUsed)} / {formatTokens(current.tokenLimit)} tokens
  </span>
  <span className={`text-lg font-semibold ${colors.text}`}>
    {percentUsed.toFixed(0)}%
  </span>
</div>
```

### Warning Messages
```tsx
{percentUsed >= 95 && (
  <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300">
    <p className="text-sm font-medium text-red-900">🛑 Weekly limit reached</p>
    <p className="text-sm text-red-800 mt-1">
      Your token budget resets {getDaysUntilReset().toLowerCase()}.
    </p>
  </div>
)}

{percentUsed >= 80 && percentUsed < 95 && (
  <div className="mb-4 p-3 rounded-lg bg-yellow-100 border border-yellow-300">
    <p className="text-sm font-medium text-yellow-900">⚠️ Approaching weekly limit</p>
    <p className="text-sm text-yellow-800 mt-1">
      Consider upgrading for more capacity.
    </p>
  </div>
)}
```

## 2. UsageDetails.tsx - Full Breakdown Panel

### Orchestrator vs Workers Visualization
```tsx
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
```

### 4-Week History Bar Chart
```tsx
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
```

### Request Log Table with Worker Badges
```tsx
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
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
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
```

### Pagination Controls
```tsx
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
```

## 3. Usage Page - Full Page Integration

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UsageDetails } from '@/components/UsageDetails';

export default async function UsagePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Usage Details</h1>
          </div>
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 CLAWER<span className="text-blue-600">.AI</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <UsageDetails />
      </main>
    </div>
  );
}
```

## 4. Dashboard Integration

```tsx
// Added import
import { UsageWidget } from '@/components/UsageWidget';

// In the main component, after ContainerStatus:
{/* Container Status */}
{isSubscribed && <ContainerStatus />}

{/* Usage Widget */}
{isSubscribed && <UsageWidget />}

{/* Chat Connections */}
// ... rest of dashboard
```

## Helper Functions

### Token Formatting
```typescript
const formatTokens = (tokens: number) => {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  } else if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
};
```

### Days Until Reset Calculation
```typescript
const getDaysUntilReset = () => {
  const reset = new Date(resetDate);
  const now = new Date();
  const diffTime = reset.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Resets today';
  if (diffDays === 1) return 'Resets tomorrow';
  return `Resets in ${diffDays} days`;
};
```

### Date/Time Formatting
```typescript
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
};
```

## TypeScript Interfaces

```typescript
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
```
