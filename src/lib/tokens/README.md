# Token Tracking Service

Token tracking middleware for Clawer.ai's hybrid orchestrator system.

## Overview

This service tracks token usage across a two-tier AI architecture:
- **Orchestrator** (Gemini 3 Flash) - Intent parsing, planning, synthesis
- **Workers** (Flash-Lite, Grok) - Search, document processing, code generation

All tokens are normalized to **Orchestrator Equivalent Tokens (OET)** for user-facing limits.

## OET Formula

```typescript
OET = orchestrator_tokens * 1.0 + worker_tokens * 0.15
```

Since workers are ~10x cheaper, they count less against user limits.

## Usage

### Track Token Usage

```typescript
import { trackTokenUsage } from '@/lib/tokens';

await trackTokenUsage(
  userId,
  'orchestrator', // or 'worker'
  inputTokens,
  outputTokens,
  requestId // optional
);
```

### Check Rate Limits

```typescript
import { checkRateLimit } from '@/lib/tokens';

const result = await checkRateLimit(userId, 'pro');

if (!result.allowed) {
  throw new Error(result.warning);
}

if (result.warning) {
  // Show soft warning (80% threshold)
  console.warn(result.warning);
}
```

### Get Weekly Usage

```typescript
import { getWeeklyUsage } from '@/lib/tokens';

const usage = await getWeeklyUsage(userId);

console.log(`Tokens used: ${usage.totalOet}`);
console.log(`Cost: $${usage.estimatedCostUsd}`);
```

### Calculate OET

```typescript
import { calculateOET } from '@/lib/tokens';

const oet = calculateOET(
  1_000_000,  // orchestrator tokens
  10_000_000  // worker tokens
);
// Result: 2,500,000 OET (1M * 1.0 + 10M * 0.15)
```

### Get Token Limit

```typescript
import { getTokenLimit } from '@/lib/tokens';

const limit = getTokenLimit('pro'); // 10,000,000 OET
```

## Weekly Reset

The service automatically archives usage every Monday at 00:00 UTC.

### Manual Reset (Testing)

```typescript
import { weeklyReset, archiveUserWeek } from '@/lib/tokens/weekly-reset';

// Reset all users
await weeklyReset();

// Reset specific user
await archiveUserWeek(userId);
```

### Week Boundaries

```typescript
import { getCurrentWeekBoundaries, getNextMonday } from '@/lib/tokens/weekly-reset';

const { weekStart, weekEnd } = getCurrentWeekBoundaries();
const resetDate = getNextMonday();
```

## Rate Limits

### Tier Limits (Weekly OET)

| Tier | Weekly Limit | Monthly Equivalent |
|------|--------------|-------------------|
| Free | 500,000 | ~2M |
| Basic | 3,750,000 | ~15M |
| Pro | 10,000,000 | ~40M |
| Enterprise | 25,000,000 | ~100M |

### Thresholds

- **80% (Soft)** - Warning message injected into response
- **100% (Hard)** - Request blocked until Monday reset

### Per-Request Limits

- Max 100K tokens per request
- Max 20 requests per minute
- Max 200 requests per hour

## Database Schema

### Weekly Usage

```typescript
interface WeeklyUsage {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  orchestratorInputTokens: number;
  orchestratorOutputTokens: number;
  workerInputTokens: number;
  workerOutputTokens: number;
  totalOet: number;
  estimatedCostUsd: string;
  requestCount: number;
}
```

### Request Log

Detailed per-request logging for analytics:

```typescript
interface RequestLog {
  id: string;
  userId: string;
  requestId: string;
  timestamp: Date;
  routeDecision: string; // JSON
  orchestratorTokens: string; // JSON: {input, output}
  workerTokens: string; // JSON: {SEARCH: {input, output}}
  totalTokens: number;
  latencyMs: number;
  estimatedCostUsd: string;
}
```

### Usage History

Archived weekly usage for analytics (auto-populated on Monday):

```typescript
interface UsageHistory {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  // ... same fields as WeeklyUsage
  archivedAt: Date;
}
```

## Constants

See `constants.ts` for:
- Model pricing
- Tier limits
- Rate limit thresholds
- OET weights

## Cron Job Setup

Add to your scheduler (Vercel Cron, GitHub Actions, etc.):

```typescript
// app/api/cron/weekly-reset/route.ts
import { weeklyReset } from '@/lib/tokens/weekly-reset';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  try {
    const result = await weeklyReset();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
```

Schedule: `0 0 * * 1` (Every Monday at midnight UTC)

## Cost Tracking

The service automatically calculates cost based on model pricing:

| Model | Role | Input (per 1M) | Output (per 1M) |
|-------|------|----------------|-----------------|
| Gemini 3 Flash | Orchestrator | $0.50 | $3.00 |
| Flash-Lite | Search/Doc Worker | $0.05 | $0.20 |
| Grok 4.1 Fast | Code Worker | $0.20 | $0.50 |

Estimated margins:
- **Basic**: 84% ($8 cost / $49 price)
- **Pro**: 79% ($21 cost / $99 price)
- **Enterprise**: 79% ($52 cost / $249 price)

## Error Handling

The service handles:
- Missing weekly usage records (auto-creates)
- Week boundary transitions (detects stale records)
- Missing user tier (defaults to 'free')

All functions are defensive and log warnings for debugging.

## Testing

```typescript
// Create test usage
await trackTokenUsage('user_123', 'orchestrator', 5000, 10000);

// Check limits
const rateLimit = await checkRateLimit('user_123', 'free');
console.log(`Usage: ${rateLimit.percentUsed}%`);

// View usage
const usage = await getWeeklyUsage('user_123');
console.log(usage);
```

## Integration Example

```typescript
// In your API route
import { checkRateLimit, trackTokenUsage, getUserTier } from '@/lib/tokens';

export async function POST(request: Request) {
  const { userId } = await auth();
  const tier = await getUserTier(userId);
  
  // Check rate limit before processing
  const rateLimit = await checkRateLimit(userId, tier);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: rateLimit.warning },
      { status: 429 }
    );
  }
  
  // Process request with orchestrator
  const orchestratorResponse = await callOrchestrator(prompt);
  
  // Track orchestrator usage
  await trackTokenUsage(
    userId,
    'orchestrator',
    orchestratorResponse.usage.inputTokens,
    orchestratorResponse.usage.outputTokens,
    requestId
  );
  
  // Route to workers if needed
  const workerResponse = await callWorker(task);
  
  // Track worker usage
  await trackTokenUsage(
    userId,
    'worker',
    workerResponse.usage.inputTokens,
    workerResponse.usage.outputTokens,
    requestId
  );
  
  // Include warning in response if approaching limit
  return NextResponse.json({
    result: finalResponse,
    systemNote: rateLimit.warning,
  });
}
```

## Files

- **index.ts** - Main service functions
- **constants.ts** - Pricing, limits, thresholds
- **weekly-reset.ts** - Reset logic and week utilities
- **README.md** - This file
