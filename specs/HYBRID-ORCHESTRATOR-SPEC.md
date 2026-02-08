# Hybrid Orchestrator Architecture Specification

**Version:** 1.0  
**Created:** 2026-02-07  
**Status:** Draft  

## Overview

A two-tier AI architecture that delivers high-quality personal assistant experiences while maintaining healthy margins. A smart "Orchestrator" model handles intent understanding, planning, and synthesis, while cost-efficient "Worker" models execute bulk tasks like search processing, summarization, and data extraction.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     TOKEN GATEWAY (Rate Limiter)                     │
│  • Check weekly token budget                                         │
│  • Reject if over limit (with friendly message)                      │
│  • Track usage by model tier                                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR                                 │
│  Model: Gemini 3 Flash ($0.50/$3.00 per 1M)                         │
│                                                                      │
│  Responsibilities:                                                   │
│  • Parse user intent                                                 │
│  • Decompose complex tasks into subtasks                            │
│  • Route subtasks to appropriate workers                            │
│  • Synthesize worker outputs into final response                    │
│  • Handle conversation context and memory                           │
│                                                                      │
│  Token Budget: ~10% of user's allocation                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   WORKER: Search    │ │  WORKER: Document   │ │   WORKER: Code      │
│                     │ │                     │ │                     │
│ Gemini 2.0 Flash-   │ │ Gemini 2.0 Flash-   │ │ Grok 4.1 Fast       │
│ Lite                │ │ Lite                │ │                     │
│ $0.05/$0.20 per 1M  │ │ $0.05/$0.20 per 1M  │ │ $0.20/$0.50 per 1M  │
│                     │ │                     │ │                     │
│ • Process search    │ │ • Summarize docs    │ │ • Generate code     │
│   results           │ │ • Extract data      │ │ • Debug/explain     │
│ • Rank relevance    │ │ • Parse files       │ │ • Run analysis      │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                    │             │             │
                    └─────────────┼─────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSE SYNTHESIZER                              │
│  (Orchestrator generates final user-facing response)                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     TOKEN LOGGER                                     │
│  • Record tokens used (input/output by model)                        │
│  • Update weekly running total                                       │
│  • Emit usage event for analytics                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Token Budget System

### Weekly Limits by Tier

| Tier | Weekly Token Limit | Monthly Equivalent | Price |
|------|-------------------|-------------------|-------|
| **Basic** | 3,750,000 | ~15M | $49/mo |
| **Pro** | 10,000,000 | ~40M | $99/mo |
| **Enterprise** | 25,000,000 | ~100M | $249/mo |

### Token Accounting

All tokens are normalized to "Orchestrator Equivalent Tokens" (OET) for simple user-facing limits:

```typescript
interface TokenUsage {
  userId: string;
  weekStart: Date;          // Monday 00:00 UTC
  weekEnd: Date;            // Sunday 23:59 UTC
  
  // Raw counts by model
  orchestratorInputTokens: number;
  orchestratorOutputTokens: number;
  workerInputTokens: number;
  workerOutputTokens: number;
  
  // Normalized OET (what user sees)
  totalOET: number;
  
  // Cost tracking (internal)
  estimatedCostUsd: number;
}
```

### OET Conversion Formula

Since workers are ~10x cheaper than orchestrator, we normalize:

```typescript
function calculateOET(usage: RawUsage): number {
  const ORCHESTRATOR_WEIGHT = 1.0;
  const WORKER_WEIGHT = 0.15;  // Workers are cheap, count less against limit
  
  const orchestratorOET = (usage.orchestratorInput + usage.orchestratorOutput) * ORCHESTRATOR_WEIGHT;
  const workerOET = (usage.workerInput + usage.workerOutput) * WORKER_WEIGHT;
  
  return orchestratorOET + workerOET;
}
```

This means:
- 1M orchestrator tokens = 1M OET
- 1M worker tokens = 150K OET
- Users get more "bang for their buck" when tasks route to workers

### Weekly Reset Schedule

```typescript
// Reset every Monday at 00:00 UTC
const RESET_CRON = '0 0 * * 1';  // Monday midnight UTC

async function weeklyReset() {
  // Archive current week's usage to history
  await db.insert(usageHistory).values(
    await db.select().from(weeklyUsage)
  );
  
  // Reset all active users
  await db.update(weeklyUsage)
    .set({
      orchestratorInputTokens: 0,
      orchestratorOutputTokens: 0,
      workerInputTokens: 0,
      workerOutputTokens: 0,
      totalOET: 0,
      estimatedCostUsd: 0,
      weekStart: getNextMonday(),
    });
}
```

## Rate Limiting

### Soft Limits (Warning)

At 80% of weekly limit:
```typescript
const WARNING_THRESHOLD = 0.80;

if (usage.totalOET >= limit * WARNING_THRESHOLD) {
  // Inject warning into response
  response.systemNote = `⚠️ You've used ${percent}% of your weekly token budget. ` +
    `Resets Monday. Consider upgrading for more capacity.`;
}
```

### Hard Limits (Block)

At 100% of weekly limit:
```typescript
const HARD_LIMIT = 1.0;

if (usage.totalOET >= limit * HARD_LIMIT) {
  throw new TokenLimitExceededError({
    message: "Weekly token limit reached. Your budget resets Monday at midnight UTC.",
    currentUsage: usage.totalOET,
    limit: limit,
    resetDate: getNextMonday(),
    upgradeUrl: "/pricing"
  });
}
```

### Burst Protection

Prevent single request from consuming excessive tokens:

```typescript
const MAX_SINGLE_REQUEST_TOKENS = 100_000;  // 100K per request
const MAX_REQUESTS_PER_MINUTE = 20;
const MAX_REQUESTS_PER_HOUR = 200;

interface RateLimits {
  perRequest: number;
  perMinute: number;
  perHour: number;
}
```

## Orchestrator Routing Logic

### Route Decision Prompt

The orchestrator receives a system prompt that guides routing:

```typescript
const ORCHESTRATOR_SYSTEM_PROMPT = `
You are a routing orchestrator. Your job is to:
1. Understand the user's intent
2. Break complex tasks into subtasks
3. Route each subtask to the appropriate worker
4. Synthesize results into a coherent response

Available workers:
- SEARCH: Process web search results, rank relevance
- DOCUMENT: Summarize documents, extract data, parse files  
- CODE: Generate code, debug, explain technical concepts
- DIRECT: Handle yourself (simple Q&A, conversation)

Respond with a JSON routing plan:
{
  "intent": "brief description",
  "subtasks": [
    {"worker": "SEARCH", "query": "..."},
    {"worker": "DOCUMENT", "action": "summarize", "content": "..."}
  ],
  "directResponse": null  // or string if handling directly
}

EFFICIENCY RULES:
- Route to workers whenever possible (they're 10x cheaper)
- Only use DIRECT for simple greetings, clarifications, or synthesis
- Batch related subtasks together
- Never repeat the user's full message back to them
`;
```

### Routing Decision Tree

```
User Request
    │
    ├─► Simple greeting/chat? ──────────► DIRECT (orchestrator handles)
    │
    ├─► Needs web information? ─────────► SEARCH worker
    │
    ├─► Has document/file attached? ────► DOCUMENT worker
    │
    ├─► Code/technical task? ───────────► CODE worker
    │
    └─► Complex multi-step? ────────────► DECOMPOSE into multiple workers
```

## Database Schema

### Weekly Usage Table

```sql
CREATE TABLE weekly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(clerk_id),
  
  -- Week boundaries
  week_start TIMESTAMP NOT NULL,
  week_end TIMESTAMP NOT NULL,
  
  -- Raw token counts
  orchestrator_input_tokens BIGINT DEFAULT 0,
  orchestrator_output_tokens BIGINT DEFAULT 0,
  worker_input_tokens BIGINT DEFAULT 0,
  worker_output_tokens BIGINT DEFAULT 0,
  
  -- Normalized count (what user sees)
  total_oet BIGINT DEFAULT 0,
  
  -- Cost tracking
  estimated_cost_usd DECIMAL(10, 4) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_usage_user ON weekly_usage(user_id);
CREATE INDEX idx_weekly_usage_week ON weekly_usage(week_start);
```

### Usage History Table

```sql
CREATE TABLE usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  
  -- Archived week data
  week_start TIMESTAMP NOT NULL,
  week_end TIMESTAMP NOT NULL,
  
  orchestrator_input_tokens BIGINT,
  orchestrator_output_tokens BIGINT,
  worker_input_tokens BIGINT,
  worker_output_tokens BIGINT,
  total_oet BIGINT,
  estimated_cost_usd DECIMAL(10, 4),
  
  -- Analytics
  request_count INTEGER,
  peak_daily_usage BIGINT,
  
  archived_at TIMESTAMP DEFAULT NOW()
);
```

### Request Log Table

```sql
CREATE TABLE request_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  
  -- Request metadata
  request_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Routing info
  route_decision JSONB,  -- {"intent": "...", "workers": ["SEARCH", "CODE"]}
  
  -- Token breakdown
  orchestrator_tokens JSONB,  -- {"input": 150, "output": 320}
  worker_tokens JSONB,        -- {"SEARCH": {"input": 2000, "output": 500}, ...}
  total_tokens INTEGER,
  
  -- Performance
  latency_ms INTEGER,
  
  -- Cost
  estimated_cost_usd DECIMAL(10, 6)
);

-- Partition by month for performance
CREATE INDEX idx_request_log_user_time ON request_log(user_id, timestamp DESC);
```

## API Endpoints

### GET /api/usage

Returns current usage for authenticated user:

```typescript
interface UsageResponse {
  current: {
    weekStart: string;      // ISO date
    weekEnd: string;
    tokensUsed: number;     // OET
    tokenLimit: number;     // OET
    percentUsed: number;
    estimatedCost: number;  // For transparency
  };
  breakdown: {
    orchestrator: { input: number; output: number };
    workers: { input: number; output: number };
  };
  history: {
    week: string;
    tokensUsed: number;
  }[];  // Last 4 weeks
  resetDate: string;        // Next Monday
}
```

### GET /api/usage/details

Detailed per-request breakdown (for power users):

```typescript
interface UsageDetailsResponse {
  requests: {
    id: string;
    timestamp: string;
    intent: string;
    tokensUsed: number;
    workers: string[];
    latencyMs: number;
  }[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}
```

## Cost Model

### Model Pricing (per 1M tokens)

| Model | Role | Input | Output |
|-------|------|-------|--------|
| Gemini 3 Flash | Orchestrator | $0.50 | $3.00 |
| Gemini 2.0 Flash-Lite | Search/Doc Worker | $0.05 | $0.20 |
| Grok 4.1 Fast | Code Worker | $0.20 | $0.50 |

### Projected Costs by Tier

Assuming 10% orchestrator / 90% worker split:

| Tier | Weekly Tokens | Monthly Cost | Price | Margin |
|------|---------------|--------------|-------|--------|
| Basic | 3.75M | ~$8 | $49 | **84%** |
| Pro | 10M | ~$21 | $99 | **79%** |
| Enterprise | 25M | ~$52 | $249 | **79%** |

### Cost Calculation Formula

```typescript
function calculateRequestCost(usage: RequestUsage): number {
  const PRICING = {
    orchestrator: { input: 0.50 / 1_000_000, output: 3.00 / 1_000_000 },
    searchWorker: { input: 0.05 / 1_000_000, output: 0.20 / 1_000_000 },
    codeWorker: { input: 0.20 / 1_000_000, output: 0.50 / 1_000_000 },
  };
  
  let cost = 0;
  
  // Orchestrator cost
  cost += usage.orchestrator.input * PRICING.orchestrator.input;
  cost += usage.orchestrator.output * PRICING.orchestrator.output;
  
  // Worker costs
  for (const [worker, tokens] of Object.entries(usage.workers)) {
    const pricing = PRICING[worker + 'Worker'] || PRICING.searchWorker;
    cost += tokens.input * pricing.input;
    cost += tokens.output * pricing.output;
  }
  
  return cost;
}
```

## User-Facing Dashboard

### Usage Widget

```
┌─────────────────────────────────────────────────┐
│  Weekly Usage                    Resets Mon     │
│  ████████████████░░░░░░░░░░░░░░  68%           │
│  2.55M / 3.75M tokens                          │
│                                                 │
│  Today: 380K  │  Avg: 365K/day                 │
│                                                 │
│  [View Details]              [Upgrade →]        │
└─────────────────────────────────────────────────┘
```

### Warning States

**80% Warning:**
```
⚠️ You're approaching your weekly limit (80%)
   Consider upgrading to Pro for 3x more capacity
```

**100% Limit Hit:**
```
🛑 Weekly limit reached
   Your token budget resets Monday at midnight UTC.
   
   [Upgrade Now]  [View Usage History]
```

## Implementation Phases

### Phase 1: Token Tracking (Week 1)
- [ ] Add weekly_usage table
- [ ] Implement token counting middleware
- [ ] Add /api/usage endpoint
- [ ] Dashboard usage widget

### Phase 2: Rate Limiting (Week 2)
- [ ] Implement soft limit warnings
- [ ] Implement hard limit blocking
- [ ] Add burst protection
- [ ] Weekly reset cron job

### Phase 3: Hybrid Routing (Week 3)
- [ ] Orchestrator routing prompt
- [ ] Worker model integration
- [ ] Routing decision logging
- [ ] A/B test routing efficiency

### Phase 4: Optimization (Week 4)
- [ ] Prompt caching integration
- [ ] Routing optimization based on logs
- [ ] Cost analytics dashboard
- [ ] Tier recommendation engine

## Monitoring & Alerts

### Key Metrics

```typescript
const METRICS = {
  // Cost health
  avgCostPerUser: 'gauge',
  marginByTier: 'gauge',
  
  // Usage patterns
  tokensPerRequest: 'histogram',
  orchestratorRatio: 'gauge',  // Should stay ~10%
  
  // Rate limiting
  usersAtWarning: 'gauge',     // >80% usage
  usersBlocked: 'gauge',       // Hit limit
  
  // Routing efficiency
  routingLatencyMs: 'histogram',
  workerUtilization: 'gauge',  // % routed to workers
};
```

### Alerts

| Condition | Severity | Action |
|-----------|----------|--------|
| Avg cost > $15/user/mo | Warning | Review routing efficiency |
| Orchestrator ratio > 20% | Warning | Tune routing prompts |
| >10% users blocked | Critical | Consider limit increase |
| Worker error rate > 5% | Critical | Check worker model health |

## Security Considerations

1. **Token count validation**: Verify token counts from model responses match expected ranges
2. **Abuse detection**: Flag users with unusual patterns (e.g., 10x normal usage)
3. **Cost caps**: Hard ceiling on per-request cost ($0.50 max)
4. **Audit logging**: Track all routing decisions for review

## Future Enhancements

1. **Rollover tokens**: Unused tokens partially roll to next week
2. **Burst packs**: Buy additional tokens mid-week
3. **Smart throttling**: Slow down instead of hard block at limit
4. **Model A/B testing**: Route to different workers to optimize cost/quality
5. **User preferences**: Let users choose quality vs. speed tradeoff
