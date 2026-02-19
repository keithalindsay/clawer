# Clawer.ai — Comprehensive Test Plan

**Generated:** 2026-02-19  
**Status:** Ready for execution via sub-agents  
**Framework:** Vitest + @testing-library/react  
**Config:** `vitest.config.ts` (environment: `node`, globals: `true`, alias: `@/` → `src/`)

---

## Table of Contents

1. [Codebase Audit](#1-codebase-audit)
2. [Existing Test Patterns](#2-existing-test-patterns)
3. [Test Suites — Priority P0 (Critical)](#3-test-suites--priority-p0-critical)
4. [Test Suites — Priority P1 (High)](#4-test-suites--priority-p1-high)
5. [Test Suites — Priority P2 (Medium)](#5-test-suites--priority-p2-medium)
6. [Test Suites — Priority P3 (Low)](#6-test-suites--priority-p3-low)
7. [CI Integration Spec](#7-ci-integration-spec)
8. [Sub-Agent Tasks](#8-sub-agent-tasks)

---

## 1. Codebase Audit

### API Routes (all under `src/app/api/`)

| Route | Method(s) | Auth Required | File |
|-------|-----------|---------------|------|
| `/api/agent/files` | GET, PUT | Yes | `agent/files/route.ts` |
| `/api/agent/files/reset` | POST | Yes | `agent/files/reset/route.ts` |
| `/api/agents/[agentId]/thread` | GET | Yes | `agents/[agentId]/thread/route.ts` |
| `/api/bots` | GET | Yes | `bots/route.ts` |
| `/api/bots/[botId]` | GET, PUT, DELETE | Yes | `bots/[botId]/route.ts` |
| `/api/bots/[botId]/activate` | POST | Yes | `bots/[botId]/activate/route.ts` |
| `/api/bot/settings` | GET, PUT | Yes | `bot/settings/route.ts` |
| `/api/chat` | POST | Yes | `chat/route.ts` |
| `/api/container/status` | GET | Yes | `container/status/route.ts` |
| `/api/container/restart` | POST | Yes | `container/restart/route.ts` |
| `/api/container/slack/connect` | POST | Yes | `container/slack/connect/route.ts` |
| `/api/container/slack/disconnect` | POST | Yes | `container/slack/disconnect/route.ts` |
| `/api/container/slack/status` | GET | Yes | `container/slack/status/route.ts` |
| `/api/container/telegram/connect` | POST | Yes | `container/telegram/connect/route.ts` |
| `/api/container/telegram/disconnect` | POST | Yes | `container/telegram/disconnect/route.ts` |
| `/api/container/telegram/status` | GET | Yes | `container/telegram/status/route.ts` |
| `/api/container/whatsapp/*` | Various | Yes | `container/whatsapp/*.ts` |
| `/api/conversations` | GET, POST | Yes | `conversations/route.ts` |
| `/api/conversations/[id]` | GET, DELETE | Yes | `conversations/[id]/route.ts` |
| `/api/diagnose` | POST | Yes | `diagnose/route.ts` |
| `/api/feedback` | POST | Yes | `feedback/route.ts` |
| `/api/health` | GET | No | `health/route.ts` |
| `/api/maintenance/purge-messages` | POST | Admin | `maintenance/purge-messages/route.ts` |
| `/api/maintenance/summarize-messages` | POST | Admin | `maintenance/summarize-messages/route.ts` |
| `/api/messages` | GET, POST, DELETE | Yes | `messages/route.ts` |
| `/api/models` | GET | Yes | `models/route.ts` |
| `/api/models/configure` | POST | Yes | `models/configure/route.ts` |
| `/api/models/preview` | POST | Yes | `models/preview/route.ts` |
| `/api/onboarding` | POST | Yes | `onboarding/route.ts` |
| `/api/slack/connect` | POST | Yes | `slack/connect/route.ts` |
| `/api/slack/events` | POST | No (Slack sig) | `slack/events/route.ts` |
| `/api/stripe/checkout` | GET, POST | Yes | `stripe/checkout/route.ts` |
| `/api/stripe/portal` | POST | Yes | `stripe/portal/route.ts` |
| `/api/tasks` | GET, POST | Yes | `tasks/route.ts` |
| `/api/tasks/[id]` | GET, PUT, DELETE | Yes | `tasks/[id]/route.ts` |
| `/api/tasks/[id]/run` | POST | Yes | `tasks/[id]/run/route.ts` |
| `/api/team` | GET, PUT | Yes | `team/route.ts` |
| `/api/teams/current` | GET | Yes | `teams/current/route.ts` |
| `/api/telegram/connect` | POST | Yes | `telegram/connect/route.ts` |
| `/api/usage` | GET | Yes | `usage/route.ts` |
| `/api/usage/analytics` | GET | Yes | `usage/analytics/route.ts` |
| `/api/usage/details` | GET | Yes | `usage/details/route.ts` |
| `/api/user` | GET | Yes | `user/route.ts` |
| `/api/user/api-keys` | GET, POST, DELETE | Yes | `user/api-keys/route.ts` |
| `/api/user/api-keys/test` | POST | Yes | `user/api-keys/test/route.ts` |
| `/api/user/notifications` | GET, PUT | Yes | `user/notifications/route.ts` |
| `/api/user/settings` | GET, PUT | Yes | `user/settings/route.ts` |
| `/api/user/usage` | GET | Yes | `user/usage/route.ts` |
| `/api/webhooks/clerk` | POST | No (Svix sig) | `webhooks/clerk/route.ts` |
| `/api/webhooks/stripe` | POST | No (Stripe sig) | `webhooks/stripe/route.ts` |
| `/api/admin/*` | Various | Admin | `admin/*.ts` |

### Lib Modules (all under `src/lib/`)

| Module | Key Exports | Location |
|--------|-------------|----------|
| `provisioner` | `provisionContainer`, `stopContainer`, `restartContainer`, `getContainerStatus` | `provisioner.ts` |
| `teams` | `TEAM_CONFIGS`, `getTeamConfig`, `getAgentFromTeam`, `buildAgentSystemPrompt` | `teams.ts` |
| `rate-limit` | `checkRateLimit`, `checkUserRateLimit`, `checkMessageQuota`, `trackDailyUsage`, `checkDailyLimit`, `getDailyUsageCount` | `rate-limit/index.ts` |
| `tokens` | `calculateOET`, `getTokenLimit`, `calculateCost`, `trackTokenUsage`, `getWeeklyUsage`, `checkRateLimit`, `getUserTier` | `tokens/index.ts` |
| `tokens/constants` | `TOKEN_LIMITS`, `RATE_LIMITS`, `OET_WEIGHTS`, `MODEL_PRICING`, `UserTier` | `tokens/constants.ts` |
| `tokens/weekly-reset` | `getCurrentWeekBoundaries`, `getNextMonday`, `isNewWeek` | `tokens/weekly-reset.ts` |
| `router` | `routeRequest`, `classifyByRules`, `estimateTokens`, `analyzeTierDistribution` | `router/index.ts` |
| `router/rules` | `classifyByRules`, `estimateTokens` | `router/rules.ts` |
| `container-client` | `containerApi.chat`, `containerApi.*` | `container-client.ts` |
| `api/response` | `apiSuccess`, `apiError`, `apiErrors.*` | `api/response.ts` |
| `api/errors` | error types/helpers | `api/errors.ts` |
| `api/validate` | validation helpers | `api/validate.ts` |
| `stripe` | `createCheckoutSession`, `stripe` client | `stripe.ts` |
| `ssh` | `sshExec` | `ssh.ts` |
| `admin` | admin utilities | `admin.ts` |
| `alerts` | `alertPaymentFailure` | `alerts.ts` |
| `email` | `sendWelcomeEmail` | `email/index.ts` |
| `maintenance/health-checker` | `HealthChecker` class | `maintenance/health-checker.ts` |
| `maintenance/remediation` | `Remediation` class | `maintenance/remediation.ts` |
| `diagnostics` | `DiagnosticsCollector`, `DiagnosticsAnalyzer` | `diagnostics/index.ts` |
| `constants` | `FREE_MESSAGE_LIMIT`, `FREE_DAILY_LIMIT`, `FREE_TIER_PORT`, `MAX_MESSAGE_LENGTH`, etc. | `constants.ts` |
| `db/queries/users` | user DB queries | `db/queries/users.ts` |
| `db/queries/bots` | bot DB queries | `db/queries/bots.ts` |
| `db/queries/usage` | usage DB queries | `db/queries/usage.ts` |

### Dashboard Pages

| Page | Route | File |
|------|-------|------|
| Dashboard Home | `/dashboard` | `dashboard/page.tsx` |
| Agent Page | `/dashboard/agent` | `dashboard/agent/page.tsx` |
| API Keys | `/dashboard/api-keys` | `dashboard/api-keys/page.tsx` |
| Chat | `/dashboard/chat` | `dashboard/chat/page.tsx` |
| Conversations | `/dashboard/conversations` | `dashboard/conversations/page.tsx` |
| Employee Detail | `/dashboard/employees/[id]` | `dashboard/employees/[id]/page.tsx` |
| Settings | `/dashboard/settings` | `dashboard/settings/page.tsx` |
| Slack | `/dashboard/slack` | `dashboard/slack/page.tsx` |
| Tasks | `/dashboard/tasks` | `dashboard/tasks/page.tsx` |
| Telegram | `/dashboard/telegram` | `dashboard/telegram/page.tsx` |
| Usage | `/dashboard/usage` | `dashboard/usage/page.tsx` |
| WhatsApp | `/dashboard/whatsapp` | `dashboard/whatsapp/page.tsx` |
| Onboarding | `/onboarding` | `onboarding/page.tsx` |

---

## 2. Existing Test Patterns

**Location:** `src/app/api/__tests__/` (566 lines across 4 files)

### Style Guide (match these patterns in new tests)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk at module level
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  checkUserRateLimit: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { checkUserRateLimit } from '@/lib/rate-limit';

describe('Suite Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do X', async () => {
    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (checkUserRateLimit as any).mockResolvedValue({
      allowed: true,
      remaining: 99,
      limit: 100,
      resetAt: new Date(Date.now() + 3600000),
    });

    const mockRequest = new Request('http://localhost:3000/api/...', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    });

    const response = await Handler(mockRequest, { params: Promise.resolve({ id: '...' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### Key Patterns Observed

1. **Auth mocking:** `vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }))` — returns `{ userId: null }` for unauth tests
2. **Rate limit mocking:** Always mock `checkUserRateLimit` from `@/lib/rate-limit`
3. **Request construction:** Use `new Request(url, { method, headers, body })` for Next.js route handlers
4. **Params as Promise:** Dynamic route params are `{ params: Promise.resolve({ id: '...' }) }`
5. **Response shape:** `apiSuccess` responses have `{ success: true, data: {...}, meta: {...} }`. Older routes use `{ error: string }` pattern.
6. **DB mocking:** NOT yet done in existing tests (bots.test.ts doesn't mock Prisma/Drizzle — works because bot list is static). New tests WILL need `vi.mock('@/lib/db', ...)`.
7. **Coverage format:** Tests in `src/app/api/__tests__/` but can also be co-located as `*.test.ts` beside the source

---

## 3. Test Suites — Priority P0 (Critical)

### 3.1 Provisioner

**File to create:** `src/lib/__tests__/provisioner.test.ts`  
**What it tests:** `src/lib/provisioner.ts` — container lifecycle via SSH  
**Priority:** P0 | **Complexity:** Complex  

**Mocking strategy:**
```typescript
vi.mock('@/lib/ssh', () => ({ sshExec: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    query: { users: { findFirst: vi.fn() } },
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn() })) })),
  },
}));
```

**Test cases:**
```
provisionContainer()
  ✓ validates userId format — rejects malformed IDs (no "user_" prefix, special chars)
  ✓ reuses existing container — when containerExists() returns true, starts it and returns existing DB record
  ✓ allocates next available port — reads max port from DB, adds 2
  ✓ allocates BASE_PORT when no containers exist
  ✓ creates container with correct docker run flags — security options, resource limits, port binding
  ✓ generates 64-char hex gateway token
  ✓ reads API keys from server .env.local via sshExec
  ✓ updates DB on successful provision — containerId, containerPort, containerStatus='running', gatewayToken
  ✓ updates DB containerStatus='error' on SSH failure
  ✓ patches api-server if nonce bug detected
  ✓ skips api-server patch for v2026.2.16 image (no nonce string)
  ✓ returns success=false with error message on any exception
  ✓ patchApiServerIfNeeded() — calls sshExec with correct docker exec commands
  
stopContainer()
  ✓ validates userId format
  ✓ stops container via docker stop SSH command
  ✓ updates DB containerStatus='stopped'
  ✓ returns false on SSH failure

restartContainer()
  ✓ validates userId format  
  ✓ restarts container via docker restart
  ✓ updates DB containerStatus='running'
  ✓ returns false on failure

getContainerStatus()
  ✓ validates userId format
  ✓ returns 'running' when docker ps shows running state
  ✓ returns 'stopped' for exited state
  ✓ returns 'not_found' when docker ps output is empty
  ✓ returns 'error' on SSH exception
  
allocatePort() (internal — test via provisionContainer)
  ✓ returns BASE_PORT (4010) when no existing containers
  ✓ returns maxPort + 2 when containers exist
  ✓ respects MAX_PORT ceiling (5000)
```

---

### 3.2 Auth Middleware

**File to create:** `src/__tests__/middleware.test.ts`  
**What it tests:** `src/middleware.ts` — Clerk route protection  
**Priority:** P0 | **Complexity:** Medium  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: vi.fn((handler) => handler),
  createRouteMatcher: vi.fn((patterns) => {
    // Return a function that matches patterns
    return (req: Request) => patterns.some(p => req.url.includes(p.replace('(.*)', '')));
  }),
}));
```

**Test cases:**
```
isProtectedRoute matcher
  ✓ matches /dashboard/* routes
  ✓ matches /onboarding/* routes  
  ✓ matches /chat/* routes
  ✓ matches /admin/* routes
  ✓ matches /api/chat/*
  ✓ matches /api/bots/*
  ✓ matches /api/messages/*
  ✓ matches /api/user/*
  ✓ matches /api/stripe/checkout/*
  ✓ matches /api/stripe/portal/*
  ✓ matches /api/agents/*
  ✓ matches /api/teams/*
  ✓ does NOT match /api/webhooks/stripe (public)
  ✓ does NOT match /api/webhooks/clerk (public)
  ✓ does NOT match /api/slack/events (public)
  ✓ does NOT match /api/health (public)

middleware behavior
  ✓ calls auth.protect() for protected routes
  ✓ does NOT call auth.protect() for public routes
  ✓ passes through static assets (_next, .css, .js, images)
```

---

### 3.3 Billing — Stripe Checkout

**File to create:** `src/app/api/__tests__/stripe-checkout.test.ts`  
**What it tests:** `src/app/api/stripe/checkout/route.ts`  
**Priority:** P0 | **Complexity:** Medium  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));
vi.mock('@/lib/stripe', () => ({
  createCheckoutSession: vi.fn(),
}));
```

**Test cases:**
```
POST /api/stripe/checkout
  ✓ requires authentication — returns 401 when userId is null
  ✓ requires email — returns 400 when user has no email address
  ✓ defaults to monthly plan
  ✓ uses annual plan when ?plan=annual
  ✓ creates Stripe session with correct userId, email, success/cancel URLs
  ✓ returns { url } on success
  ✓ returns 500 on Stripe API error

GET /api/stripe/checkout  
  ✓ redirects to Stripe checkout URL on success
  ✓ returns 401 when unauthenticated
  ✓ returns 500 when no URL generated
```

---

### 3.4 Billing — Stripe Webhook

**File to create:** `src/app/api/__tests__/stripe-webhook.test.ts`  
**What it tests:** `src/app/api/webhooks/stripe/route.ts`  
**Priority:** P0 | **Complexity:** Complex  

**Mocking strategy:**
```typescript
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));
vi.mock('@/lib/stripe', () => ({ stripe: { webhooks: { constructEvent: vi.fn() } } }));
vi.mock('@/lib/db', () => ({ db: { query: {...}, update: vi.fn(), insert: vi.fn() } }));
vi.mock('@/lib/provisioner', () => ({
  provisionContainer: vi.fn(),
  stopContainer: vi.fn(),
}));
vi.mock('@/lib/email', () => ({ sendWelcomeEmail: vi.fn() }));
vi.mock('@/lib/alerts', () => ({ alertPaymentFailure: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
```

**Test cases:**
```
Signature verification
  ✓ returns 400 when stripe-signature header missing
  ✓ returns 500 when STRIPE_WEBHOOK_SECRET not configured
  ✓ returns 400 when signature verification fails
  ✓ processes event when signature is valid

checkout.session.completed
  ✓ updates user tier to 'pro'
  ✓ saves stripeCustomerId and stripeSubscriptionId
  ✓ calls provisionContainer with user's teamTemplate
  ✓ calls sendWelcomeEmail
  ✓ does NOT fail if container provisioning fails (non-blocking)
  ✓ does NOT fail if welcome email fails (non-blocking)

customer.subscription.deleted
  ✓ finds user by stripeCustomerId
  ✓ downgrades user to 'free' tier
  ✓ clears stripeSubscriptionId
  ✓ calls stopContainer for the user
  ✓ continues if stopContainer fails

customer.subscription.updated with past_due
  ✓ calls alertPaymentFailure with customerId

invoice.payment_failed
  ✓ calls alertPaymentFailure with customerId

unhandled event types
  ✓ logs and returns { received: true } without error
```

---

### 3.5 Messages API

**File to create:** `src/app/api/__tests__/messages.test.ts`  
**What it tests:** `src/app/api/messages/route.ts`  
**Priority:** P0 | **Complexity:** Complex  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      bots: { findFirst: vi.fn() },
      conversations: { findFirst: vi.fn() },
    },
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn() })) })) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn() })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
  },
}));
```

**Test cases:**
```
GET /api/messages
  ✓ returns 401 when unauthenticated
  ✓ creates default assistant bot if none exists
  ✓ creates new conversation if none exists
  ✓ returns existing conversation messages (ordered by createdAt ASC)
  ✓ respects ?limit param (max 100)
  ✓ uses ?conversationId param to fetch specific conversation
  ✓ handles ?agentId param — returns agent-specific conversation messages
  ✓ returns empty messages array when no agent conversation exists yet
  ✓ formats messages with { id, role, content, timestamp } shape

POST /api/messages
  ✓ returns 401 when unauthenticated
  ✓ returns 400 when role or content missing
  ✓ returns 400 for invalid role (not user/assistant/system)
  ✓ saves message to existing conversation (by conversationId)
  ✓ creates new conversation if conversationId not provided or not found
  ✓ updates conversation messageCount and lastMessageAt
  ✓ returns { id, conversationId, role, content, timestamp }
  ✓ estimates tokenCount as ceil(content.length / 4)

DELETE /api/messages
  ✓ returns 401 when unauthenticated
  ✓ returns 400 when conversationId missing
  ✓ returns 404 when conversation not found or belongs to different user
  ✓ deletes all messages in conversation
  ✓ resets conversation messageCount and totalTokens to 0
  ✓ returns { success: true }
```

---

### 3.6 Agent Files API

**File to create:** `src/app/api/__tests__/agent-files.test.ts`  
**What it tests:** `src/app/api/agent/files/route.ts` and `agent/files/reset/route.ts`  
**Priority:** P0 | **Complexity:** Medium  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: { query: { users: { findFirst: vi.fn() } } },
}));
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    stat: vi.fn(),
    mkdir: vi.fn(),
  },
}));
import fs from 'fs/promises';
```

**Test cases:**
```
GET /api/agent/files
  ✓ returns 401 when unauthenticated
  ✓ returns { files: [], containerReady: false } when container not running
  ✓ returns all 5 files (SOUL.md, AGENTS.md, USER.md, IDENTITY.md, MEMORY.md)
  ✓ returns file content when file exists
  ✓ returns exists=false with empty content when file missing
  ✓ includes lastModified from fs.stat
  ✓ includes description for each known file
  ✓ constructs correct path: /opt/clawer/userdata/clawer_user_{userId}/clawd/{filename}
  ✓ returns 404 when user not found in DB

PUT /api/agent/files
  ✓ returns 401 when unauthenticated
  ✓ returns 400 for invalid filename (not in ALLOWED_FILES)
  ✓ returns 400 for disallowed filename (e.g., 'WORKSPACE.md')
  ✓ returns 400 when content is not a string
  ✓ returns 400 when content exceeds 500KB (500,000 chars)
  ✓ creates directory recursively before writing
  ✓ writes file to correct path
  ✓ returns { filename, lastModified, size } on success
  ✓ returns 404 when user not found

POST /api/agent/files/reset
  ✓ returns 401 when unauthenticated
  ✓ returns 400 for invalid filename
  ✓ reads default content from /opt/defaults/{filename}
  ✓ falls back to empty string if no default file exists
  ✓ writes default content to user's clawd directory
  ✓ returns { filename, content, lastModified, resetToDefault: true }
  ✓ returns 404 when user not found
```

---

### 3.7 Rate Limiting

**File to create:** `src/lib/__tests__/rate-limit.test.ts`  
**What it tests:** `src/lib/rate-limit/index.ts`  
**Priority:** P0 | **Complexity:** Medium  

**Mocking strategy:**
```typescript
// Mock Redis to control behavior
vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    pipeline: vi.fn(() => ({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    })),
    zadd: vi.fn(),
    expire: vi.fn(),
    quit: vi.fn(),
    on: vi.fn(),
  })),
}));
```

**Test cases:**
```
checkUserRateLimit()
  ✓ allows request when under limit
  ✓ blocks request when at or over limit
  ✓ uses correct limits per tier (free=20/min, basic=60/min, pro=120/min, enterprise=300/min)
  ✓ returns { allowed, limit, remaining, resetAt }
  ✓ fails open when Redis is unavailable (returns allowed=true)

checkDailyLimit() [in-memory, no Redis]
  ✓ returns true (allowed) when no previous usage
  ✓ returns true when under the daily limit
  ✓ returns false when at or over the daily limit
  ✓ resets after midnight UTC (expired record)

trackDailyUsage()
  ✓ initializes count to 1 for new user
  ✓ increments count for existing user
  ✓ resets counter after midnight UTC

getDailyUsageCount()
  ✓ returns 0 for unknown user
  ✓ returns correct count for tracked user
  ✓ returns 0 after expiry

checkIPLimit() / trackIPSignups()
  ✓ tracks signup count per IP
  ✓ blocks after 3 signups within 24h
  ✓ resets after 24h

RATE_LIMITS constants
  ✓ free tier: 20 rpm, 100 msg/day
  ✓ basic tier: 60 rpm, 500 msg/day
  ✓ pro tier: 120 rpm, 2000 msg/day
  ✓ enterprise tier: 300 rpm, -1 (unlimited) msg/day
```

---

### 3.8 Token Tracking

**File to create:** `src/lib/__tests__/tokens.test.ts`  
**What it tests:** `src/lib/tokens/index.ts` and `tokens/constants.ts`  
**Priority:** P0 | **Complexity:** Medium  

**Mocking strategy:**
```typescript
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn() })) })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn() })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn() })) })) })),
    delete: vi.fn(() => ({ where: vi.fn() })),
  },
}));
```

**Test cases:**
```
calculateOET()
  ✓ orchestrator tokens have weight 1.0
  ✓ worker tokens have weight 0.15
  ✓ formula: orchestratorTokens * 1.0 + workerTokens * 0.15
  ✓ rounds to integer

getTokenLimit()
  ✓ returns 500,000 for 'free' tier
  ✓ returns 3,750,000 for 'basic' tier
  ✓ returns 10,000,000 for 'pro' tier
  ✓ returns 25,000,000 for 'enterprise' tier
  ✓ falls back to free limit for unknown tier

calculateCost()
  ✓ calculates orchestrator cost using $0.50/$3.00 per 1M pricing
  ✓ calculates worker cost using $0.05/$0.20 per 1M pricing

checkRateLimit() (token-based)
  ✓ returns allowed=true when under 80% threshold
  ✓ returns warning when between 80% and 100%
  ✓ returns allowed=false when at or over 100%
  ✓ includes percentUsed, tokensUsed, tokenLimit, resetDate

TOKEN_LIMITS constants integrity
  ✓ all tiers have weeklyOet > 0
  ✓ free tier has lowest limit
  ✓ enterprise has highest limit

RATE_LIMITS constants integrity
  ✓ warningThreshold is 0.80
  ✓ hardLimit is 1.00
  ✓ maxTokensPerRequest is 100,000
```

---

### 3.9 Clerk Webhook

**File to create:** `src/app/api/__tests__/clerk-webhook.test.ts`  
**What it tests:** `src/app/api/webhooks/clerk/route.ts`  
**Priority:** P0 | **Complexity:** Medium  

**Mocking strategy:**
```typescript
vi.mock('svix', () => ({
  Webhook: vi.fn(() => ({ verify: vi.fn() })),
}));
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn(() => ({ onConflictDoNothing: vi.fn() })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    query: { users: { findFirst: vi.fn() } },
  },
}));
```

**Test cases:**
```
Signature verification
  ✓ returns 500 when CLERK_WEBHOOK_SECRET not configured
  ✓ returns 400 when svix-id header missing
  ✓ returns 400 when svix-timestamp header missing
  ✓ returns 400 when svix-signature header missing
  ✓ returns 400 when Svix.verify() throws
  ✓ processes event when verification passes

user.created
  ✓ inserts new user into DB with correct id, email, name, tier='basic'
  ✓ extracts primary email from email_addresses array
  ✓ concatenates first_name + last_name for name
  ✓ uses onConflictDoNothing for idempotency
  ✓ falls back to {id}@clerk.user when no email

user.updated
  ✓ updates email and name in DB
  ✓ sets updatedAt to current time

user.deleted
  ✓ soft deletes by setting deletedAt timestamp (does NOT hard delete)

unhandled event types
  ✓ logs and returns { received: true } without error
```

---

## 4. Test Suites — Priority P1 (High)

### 4.1 Chat API — Free/Paid Tier Logic

**File to create:** `src/app/api/__tests__/chat.test.ts`  
**What it tests:** `src/app/api/chat/route.ts` (core logic)  
**Priority:** P1 | **Complexity:** Complex  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { query: {...}, update: vi.fn(), insert: vi.fn() } }));
vi.mock('@/lib/rate-limit', () => ({
  checkUserRateLimit: vi.fn(),
  trackDailyUsage: vi.fn(),
  checkDailyLimit: vi.fn(),
}));
vi.mock('@/lib/container-client', () => ({
  containerApi: { chat: vi.fn() },
}));
vi.mock('@/lib/router', () => ({
  routeRequest: vi.fn(() => ({ tier: 'SIMPLE', model: 'worker-model', confidence: 0.9, signals: [] })),
}));
vi.mock('@/lib/teams', () => ({
  getTeamConfig: vi.fn(),
  getAgentFromTeam: vi.fn(),
  buildAgentSystemPrompt: vi.fn(),
}));
```

**Test cases:**
```
Authentication & input validation
  ✓ returns 401 when unauthenticated
  ✓ returns 400 when message is missing
  ✓ returns 400 when message is not a string
  ✓ returns 400 when message exceeds MAX_MESSAGE_LENGTH (32,768 chars)
  ✓ strips null bytes from message before processing

Rate limiting
  ✓ returns 429 when checkUserRateLimit returns allowed=false
  ✓ includes Retry-After header in rate limit response
  ✓ passes user tier to rate limiter

Free tier caps
  ✓ returns 403 with 'free_trial_exceeded' when freeMessagesUsed >= 200
  ✓ returns 429 with 'daily_limit_exceeded' when daily limit hit
  ✓ increments freeMessagesUsed counter on successful free-tier message
  ✓ routes to FREE_TIER_PORT for free users

Paid tier routing
  ✓ returns 503 when user has no containerPort
  ✓ returns 503 when containerStatus != 'running'
  ✓ routes to user's containerPort for paid users

Agent routing (agentId provided)
  ✓ returns 404 when team template not found
  ✓ returns 404 when agentId not in user's team
  ✓ builds agent system prompt via buildAgentSystemPrompt
  ✓ creates new agent conversation if none exists
  ✓ uses existing agent conversation if found
  ✓ saves both user and assistant messages to DB after response

Smart router
  ✓ calls routeRequest with sanitized message and system prompt
  ✓ passes routing.model to containerApi.chat

Success response
  ✓ returns { content, conversationId, routing } on success
  ✓ returns container error with original status code
```

---

### 4.2 Team Template Switching

**File to create:** `src/app/api/__tests__/team-switch.test.ts`  
**What it tests:** `src/app/api/team/route.ts` + team switching logic  
**Priority:** P1 | **Complexity:** Medium  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { query: {...}, update: vi.fn() } }));
```

**Test cases:**
```
GET /api/team
  ✓ returns 401 when unauthenticated
  ✓ returns current user teamTemplate
  ✓ returns full team config for current template

PUT /api/team
  ✓ returns 401 when unauthenticated
  ✓ returns 400 for invalid team template name
  ✓ updates user's teamTemplate in DB
  ✓ returns updated team config
  ✓ all 8 template keys are valid: lifeos, solopreneur, ecommerce, content-creator, mom, fitness, finance, growth-ops

getTeamConfig() — already tested in teams.test.ts
buildAgentSystemPrompt()
  ✓ includes agent name and role
  ✓ includes team context with user's name
  ✓ lists other team members (but not the agent itself)
  ✓ handles missing user name gracefully
```

---

### 4.3 Container Status & Health

**File to create:** `src/app/api/__tests__/container-status.test.ts`  
**What it tests:** `src/app/api/container/status/route.ts`  
**Priority:** P1 | **Complexity:** Simple  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { query: { users: { findFirst: vi.fn() } } } }));
```

**Test cases:**
```
GET /api/container/status
  ✓ returns 401 when unauthenticated
  ✓ returns 404 when user not in DB
  ✓ returns containerStatus from DB
  ✓ calculates uptime correctly from containerCreatedAt
  ✓ returns uptime=0 when container not running
  ✓ maps tier to correct model name:
      free → 'Qwen3 14B'
      basic → 'Kimi Flash'
      pro → 'Claude Sonnet 4'
      enterprise → 'Claude Opus 4'
  ✓ returns { status, model, uptime, containerId, tier }
```

---

### 4.4 HealthChecker

**File to create:** `src/lib/maintenance/__tests__/health-checker.test.ts`  
**What it tests:** `src/lib/maintenance/health-checker.ts`  
**Priority:** P1 | **Complexity:** Complex  

**Mocking strategy:**
```typescript
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));
// Or mock execAsync directly via vi.mock('util', ...)
// Better: spy on the private dockerExec by mocking child_process.exec
```

**Test cases:**
```
getAllContainers()
  ✓ parses docker ps output: "id|clawer_user_abc|running"
  ✓ extracts userId from container name (strips "clawer_user_")
  ✓ calls getContainerPort for each container
  ✓ returns empty array when docker command fails
  ✓ filters only clawer_user_* containers

checkContainerHealth()
  ✓ returns state='HEALTHY' when running + API responsive + no issues
  ✓ returns state='DEAD' when container not running
  ✓ returns state='UNHEALTHY' when running but API unresponsive
  ✓ returns state='DEGRADED' when memory > 90%
  ✓ returns state='DEGRADED' when CPU > 90%
  ✓ includes issues array describing problems
  ✓ includes { containerRunning, apiResponsive, memoryUsage, cpuUsage } in checks

determineState()
  ✓ DEAD when not running
  ✓ UNHEALTHY when running but API down
  ✓ DEGRADED for high memory/CPU
  ✓ HEALTHY when all checks pass
```

---

### 4.5 Onboarding API

**File to create:** `src/app/api/__tests__/onboarding.test.ts`  
**What it tests:** `src/app/api/onboarding/route.ts`  
**Priority:** P1 | **Complexity:** Simple  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { query: { botSettings: { findFirst: vi.fn() } }, insert: vi.fn(), update: vi.fn() } }));
```

**Test cases:**
```
POST /api/onboarding
  ✓ returns 401 when unauthenticated
  ✓ creates botSettings record when none exists (INSERT)
  ✓ updates botSettings when record already exists (UPDATE)
  ✓ maps communicationStyle to personality description:
      casual → 'friendly, relaxed, uses emojis, approachable'
      professional → 'clear, polished, business-appropriate, concise'
      technical → 'precise, detailed, technical, no fluff'
  ✓ defaults botName to 'Assistant' when not provided
  ✓ defaults botAvatar to '🤖' when no emoji provided
  ✓ saves teamTemplate to users table when provided
  ✓ sets onboardingCompleted=1 in users table
  ✓ stores channels array in additionalSettings
  ✓ returns { success: true }
  ✓ returns 500 on DB error
```

---

### 4.6 Smart Router

**File to create:** `src/lib/router/__tests__/router.test.ts`  
**What it tests:** `src/lib/router/index.ts` and `router/rules.ts`  
**Priority:** P1 | **Complexity:** Medium  

**Mocking strategy:** None needed (pure functions)

**Test cases:**
```
routeRequest()
  ✓ routes SIMPLE prompts to worker model
  ✓ routes COMPLEX prompts to orchestrator model
  ✓ routes REASONING prompts to orchestrator model
  ✓ uses userOrchestratorModel when routing to orchestrator
  ✓ uses userWorkerModel when routing to worker
  ✓ returns { model, tier, confidence, signals, costEstimate, savings, useOrchestrator }
  ✓ confidence is between 0 and 1
  ✓ savings is between 0 and 1
  ✓ costEstimate is a non-negative number

classifyByRules()
  ✓ "What is 2+2?" → SIMPLE
  ✓ "Analyze this contract and identify legal risks" → COMPLEX or REASONING
  ✓ "Write a 1000-word essay" → MEDIUM or COMPLEX
  ✓ returns { tier, confidence, signals }
  ✓ signals array is non-empty

estimateTokens()
  ✓ empty string → 0
  ✓ 4-char string → ~1 token
  ✓ 400-char string → ~100 tokens

analyzeTierDistribution()
  ✓ all prompts are classified
  ✓ percentages sum to ~100%
  ✓ counts match tier distribution
```

---

### 4.7 API Response Helpers

**File to create:** `src/lib/api/__tests__/response.test.ts`  
**What it tests:** `src/lib/api/response.ts`  
**Priority:** P1 | **Complexity:** Simple  

**Mocking strategy:** None (pure utility)

**Test cases:**
```
apiSuccess()
  ✓ returns NextResponse with status 200 by default
  ✓ returns { success: true, data, meta: { requestId, timestamp } }
  ✓ accepts custom status code
  ✓ meta.timestamp is a valid ISO 8601 string
  ✓ meta.requestId starts with 'req_'

apiError()
  ✓ returns { success: false, error: { code, message }, meta }
  ✓ returns 400 status by default
  ✓ accepts custom status code
  ✓ includes details when provided

apiErrors helpers
  ✓ .unauthorized() → 401, code='UNAUTHORIZED'
  ✓ .forbidden() → 403, code='FORBIDDEN'
  ✓ .notFound('User') → 404, code='NOT_FOUND', message includes 'User'
  ✓ .validationError({...}) → 400, code='VALIDATION_ERROR'
  ✓ .rateLimited(100, '...') → 429, code='RATE_LIMITED'
  ✓ .quotaExceeded() → 429, code='QUOTA_EXCEEDED'
  ✓ .internalError() → 500, code='INTERNAL_ERROR'
  ✓ .integrationRequired('slack') → 400, code='INTEGRATION_REQUIRED'
  ✓ .modelError({...}) → 502, code='MODEL_ERROR'
```

---

## 5. Test Suites — Priority P2 (Medium)

### 5.1 Dashboard Pages — Smoke Tests

**File to create:** `src/app/dashboard/__tests__/pages.test.tsx`  
**What it tests:** That dashboard pages render without crashing  
**Priority:** P2 | **Complexity:** Medium  

**Mocking strategy:**
```typescript
// Mock Clerk for server components
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'user_test123' })),
  currentUser: vi.fn(() => Promise.resolve({ id: 'user_test123', firstName: 'Test' })),
}));
vi.mock('@/lib/db', () => ({ db: { query: { users: { findFirst: vi.fn() } } } }));
// For client components, use @testing-library/react
```

**Test cases:**
```
Dashboard home (/dashboard)
  ✓ renders without throwing
  ✓ shows loading state

Settings page (/dashboard/settings)
  ✓ renders without throwing
  ✓ contains settings form elements

Usage page (/dashboard/usage)
  ✓ renders without throwing

API Keys page
  ✓ renders without throwing
  ✓ shows "Create API key" button or equivalent
```

---

### 5.2 FreeTrialBanner Component

**File to create:** `src/components/__tests__/FreeTrialBanner.test.tsx`  
**What it tests:** `src/components/FreeTrialBanner.tsx`  
**Priority:** P2 | **Complexity:** Simple  

**Mocking strategy:** `@testing-library/react` render

**Test cases:**
```
  ✓ renders upgrade prompt when messages used > 0
  ✓ shows correct count: "X of 200 free messages used"
  ✓ shows upgrade button linking to /pricing
  ✓ renders banner when freeMessagesUsed = 0 (new user)
  ✓ shows 'limit reached' state when freeMessagesUsed >= 200
```

---

### 5.3 UpgradeBanner Component

**File to create:** `src/components/__tests__/UpgradeBanner.test.tsx`  
**What it tests:** `src/components/UpgradeBanner.tsx`  
**Priority:** P2 | **Complexity:** Simple  

**Test cases:**
```
  ✓ renders without crashing
  ✓ contains link to /pricing
  ✓ accepts and displays custom message prop
```

---

### 5.4 StatusBadge Component

**File to create:** `src/components/ui/__tests__/StatusBadge.test.tsx`  
**What it tests:** `src/components/ui/StatusBadge.tsx`  
**Priority:** P2 | **Complexity:** Simple  

**Test cases:**
```
  ✓ renders 'running' with green indicator
  ✓ renders 'stopped' with red indicator
  ✓ renders 'error' state
  ✓ renders 'provisioning' / loading state
  ✓ applies custom className
```

---

### 5.5 Conversations API

**File to create:** `src/app/api/__tests__/conversations.test.ts`  
**What it tests:** `src/app/api/conversations/route.ts` and `conversations/[id]/route.ts`  
**Priority:** P2 | **Complexity:** Medium  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { query: {...}, select: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
```

**Test cases:**
```
GET /api/conversations
  ✓ returns 401 when unauthenticated
  ✓ returns list of user's conversations
  ✓ does not return other users' conversations (userId filter)
  ✓ excludes soft-deleted conversations (deletedAt is not null)

GET /api/conversations/[id]
  ✓ returns 404 when conversation not found
  ✓ returns 403 when conversation belongs to different user
  ✓ returns conversation with messages

DELETE /api/conversations/[id]
  ✓ soft deletes by setting deletedAt
  ✓ returns 404 when not found
  ✓ prevents cross-user deletion
```

---

### 5.6 Weekly Reset Utility

**File to create:** `src/lib/tokens/__tests__/weekly-reset.test.ts`  
**What it tests:** `src/lib/tokens/weekly-reset.ts`  
**Priority:** P2 | **Complexity:** Simple  

**Mocking strategy:** Mock `Date.now()` using vi.setSystemTime()

**Test cases:**
```
getCurrentWeekBoundaries()
  ✓ weekStart is always Monday 00:00:00 UTC
  ✓ weekEnd is next Monday 00:00:00 UTC
  ✓ today within boundaries (weekStart <= now < weekEnd)

getNextMonday()
  ✓ returns next Monday for mid-week date
  ✓ returns current Monday if called on Monday
  ✓ time component is 00:00:00 UTC

isNewWeek()
  ✓ returns true when weekStart is before current Monday
  ✓ returns false when weekStart is current Monday
```

---

### 5.7 Health Check Endpoint

**File to create:** `src/app/api/__tests__/health.test.ts`  
**What it tests:** `src/app/api/health/route.ts`  
**Priority:** P2 | **Complexity:** Simple  

**Test cases:**
```
GET /api/health
  ✓ returns 200 with { status: 'ok' } or similar
  ✓ does not require authentication
  ✓ responds quickly (no heavy DB/external calls)
```

---

### 5.8 Feedback API

**File to create:** `src/app/api/__tests__/feedback.test.ts`  
**What it tests:** `src/app/api/feedback/route.ts`  
**Priority:** P2 | **Complexity:** Simple  

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { insert: vi.fn() } }));
```

**Test cases:**
```
POST /api/feedback
  ✓ returns 401 when unauthenticated
  ✓ returns 400 when message/type missing
  ✓ saves feedback to DB
  ✓ returns { success: true }
```

---

## 6. Test Suites — Priority P3 (Low)

### 6.1 Landing Page Components

**File to create:** `src/components/landing/__tests__/landing.test.tsx`  
**What it tests:** `HeroSection`, `FeatureCards`, `PricingSection` components  
**Priority:** P3 | **Complexity:** Simple  

**Test cases:**
```
  ✓ HeroSection renders without crashing
  ✓ HeroSection contains primary CTA button
  ✓ FeatureCards renders feature list
  ✓ PricingSection renders 3 tier cards (free, basic/pro, enterprise)
  ✓ PricingSection checkout buttons link to /api/stripe/checkout
```

---

### 6.2 Static Pages

**File to create:** `src/app/__tests__/static-pages.test.tsx`  
**What it tests:** Terms, Privacy pages  
**Priority:** P3 | **Complexity:** Simple  

**Test cases:**
```
  ✓ /terms renders without crashing
  ✓ /privacy renders without crashing
  ✓ pages contain required legal text sections
```

---

## 7. CI Integration Spec

### Current CI Pipeline (`/.github/workflows/ci.yml`)

```yaml
# CURRENT (only type-check, no tests):
jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Type check
        run: npx tsc --noEmit
        continue-on-error: true   # ← THIS IS A PROBLEM — should fail on type errors
```

### Required Changes to `ci.yml`

Replace the current file with:

```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  type-check:
    name: TypeScript Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npx tsc --noEmit
        # REMOVED continue-on-error — type errors should fail CI

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    env:
      # Vitest needs these to not crash — use dummy values for testing
      NODE_ENV: test
      # Prevent Clerk from trying to contact auth servers
      CLERK_SECRET_KEY: sk_test_placeholder
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_placeholder
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npx vitest run --reporter=verbose
      
      # Optional: generate coverage report (add after tests are stable)
      # - name: Run tests with coverage
      #   run: npx vitest run --coverage
      # 
      # - name: Upload coverage report
      #   uses: codecov/codecov-action@v4
      #   with:
      #     files: ./coverage/coverage-final.json
      #   if: always()

  # Optional future job: enforce coverage thresholds
  # coverage-gate:
  #   name: Coverage Gate
  #   runs-on: ubuntu-latest
  #   needs: test
  #   steps:
  #     - name: Check coverage threshold
  #       run: npx vitest run --coverage --reporter=json
  #       # Add to vitest.config.ts: coverage.thresholds: { lines: 60, branches: 50 }
```

### Changes Summary

| Change | Reason |
|--------|--------|
| Remove `continue-on-error: true` from type-check | Type errors should block PRs |
| Add `test` job running `vitest run` | Enforce tests pass on every PR |
| Use `npm ci` instead of `npm install` | Deterministic installs in CI |
| Add `cache: 'npm'` to node setup | Faster CI runs |
| Add `NODE_ENV: test` | Prevent production behavior in tests |
| Add dummy Clerk env vars | Prevent auth SDK from crashing during tests |

### `vitest.config.ts` Recommended Updates

Add coverage thresholds after the test suite is established:

```typescript
// vitest.config.ts additions:
test: {
  // ... existing config ...
  coverage: {
    reporter: ['text', 'json', 'html'],
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    exclude: [
      'src/**/*.test.ts',
      'src/**/__tests__/**',
      'src/app/(auth)/**',       // Clerk-handled pages
      'src/app/blog/**',         // Static content
      'src/app/terms/**',        // Static content
      'src/app/privacy/**',      // Static content
    ],
    // Uncomment once test coverage reaches these levels:
    // thresholds: {
    //   lines: 60,
    //   branches: 50,
    //   functions: 60,
    //   statements: 60,
    // },
  },
},
```

---

## 8. Sub-Agent Tasks

Each task below is self-contained and can be dispatched to a sub-agent independently.  
Tasks within the same batch can run **in parallel**.

---

### Batch 1 — Critical API Tests (P0)

Run these first. Block deployment until all pass.

---

#### Task 1.1 — Provisioner Tests

```
Create the test file `src/lib/__tests__/provisioner.test.ts` for the Clawer.ai project at `/home/keith/projects/clawer/`.

**What to test:** `src/lib/provisioner.ts`
This module provisions Docker containers for users via SSH. It exports:
- `provisionContainer(userId, teamTemplate)` → ProvisionResult
- `stopContainer(userId)` → boolean
- `restartContainer(userId)` → boolean
- `getContainerStatus(userId)` → 'running' | 'stopped' | 'error' | 'not_found'

**Mocking strategy:**
- `vi.mock('@/lib/ssh', () => ({ sshExec: vi.fn() }))` — simulate SSH commands returning stdout
- `vi.mock('@/lib/db', ...)` — mock Drizzle ORM db.query.users.findFirst, db.update().set().where(), db.insert().values().returning()
- Do NOT use real SSH or database connections

**Test cases to implement:**

provisionContainer():
1. Throws for invalid userId format (e.g., 'invalid', 'user_!@#$')
2. Accepts valid userId format 'user_abc123'
3. When container already exists (sshExec docker ps returns container name): starts it, returns existing DB data
4. When container doesn't exist: allocates port (DB max port + 2, or 4010 if none)
5. Generates 64-character hex gateway token
6. Calls sshExec with docker run command including --memory=2g, --cpus=1, --security-opt=no-new-privileges
7. Updates DB with containerId, containerPort, containerStatus='running', gatewayToken on success
8. Updates DB with containerStatus='error' on sshExec failure
9. Returns { success: false, error: string } on any exception
10. Returns { success: true, containerId, port, gatewayToken } on success
11. patchApiServerIfNeeded: does NOT patch when grep returns empty (no nonce bug)
12. patchApiServerIfNeeded: patches when grep finds 'connectNonce'

stopContainer():
1. Validates userId format (throws for invalid)
2. Calls sshExec with 'docker stop clawer_user_{userId}'
3. Updates DB containerStatus to 'stopped'
4. Returns false when sshExec throws

restartContainer():
1. Validates userId format
2. Calls sshExec with 'docker restart clawer_user_{userId}'
3. Updates DB containerStatus to 'running'
4. Returns false on failure

getContainerStatus():
1. Validates userId format
2. Returns 'running' when docker ps output is 'running'
3. Returns 'stopped' when output is 'exited'
4. Returns 'not_found' when output is empty
5. Returns 'error' on sshExec exception

**Style guide:** Follow patterns from existing tests in `src/app/api/__tests__/bots.test.ts`:
- Use `vi.mock()` at top level
- Use `vi.clearAllMocks()` in beforeEach
- Import mocked functions after vi.mock calls
- Use `(mockFn as any).mockResolvedValue({...})` pattern

**Expected file location:** `src/lib/__tests__/provisioner.test.ts`
**Framework:** Vitest (already configured in vitest.config.ts)
**Path alias:** `@/` maps to `src/`
```

---

#### Task 1.2 — Messages API Tests

```
Create the test file `src/app/api/__tests__/messages.test.ts` for the Clawer.ai project at `/home/keith/projects/clawer/`.

**What to test:** `src/app/api/messages/route.ts`
This route handles GET/POST/DELETE for chat message persistence. It uses Clerk auth + Drizzle ORM.

**Read these files first:**
- `src/app/api/messages/route.ts` — full source
- `src/app/api/__tests__/bots.test.ts` — existing test style to match

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
// Mock drizzle-orm operations via the db module
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      bots: { findFirst: vi.fn() },
      conversations: { findFirst: vi.fn() },
    },
    // Chain-able mock for .select().from().where().orderBy().limit()
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
```

**Test cases:**

GET /api/messages (import GET from '../messages/route'):
1. Returns 401 when auth().userId is null
2. Creates default assistant bot (type: 'assistant') if bots.findFirst returns null
3. Creates new conversation if conversations.findFirst returns null
4. Returns { conversationId, messages: [...] } shape
5. Each message has { id, role, content, timestamp } (timestamp is ISO string from createdAt)
6. Respects limit param (default 50, max 100; ?limit=200 should use 100)
7. With ?agentId param: finds conversation where agentId matches; returns empty messages [] if no conversation
8. With ?conversationId param: finds that specific conversation (verify userId ownership check)

POST /api/messages (import POST):
1. Returns 401 when unauthenticated
2. Returns 400 when body.role is missing
3. Returns 400 when body.content is missing
4. Returns 400 for role='invalid' (only user/assistant/system allowed)
5. Uses conversationId from body if provided (verify ownership)
6. Creates new conversation when conversationId not provided
7. Inserts message with role, content, tokenCount = ceil(content.length / 4)
8. Updates conversation messageCount + 1 and lastMessageAt
9. Returns { id, conversationId, role, content, timestamp }

DELETE /api/messages:
1. Returns 401 when unauthenticated
2. Returns 400 when ?conversationId param missing
3. Returns 404 when conversation not found or belongs to different user
4. Deletes all messages in conversation (db.delete where conversationId)
5. Resets conversation messageCount=0 and totalTokens=0
6. Returns { success: true }

**Expected file:** `src/app/api/__tests__/messages.test.ts`
**Framework:** Vitest
```

---

#### Task 1.3 — Agent Files API Tests

```
Create the test file `src/app/api/__tests__/agent-files.test.ts` for the Clawer.ai project at `/home/keith/projects/clawer/`.

**What to test:**
1. `src/app/api/agent/files/route.ts` — GET and PUT endpoints
2. `src/app/api/agent/files/reset/route.ts` — POST endpoint

**Read these files first:**
- `src/app/api/agent/files/route.ts`
- `src/app/api/agent/files/reset/route.ts`
- `src/app/api/__tests__/bots.test.ts` — style guide

**Key constants:** ALLOWED_FILES = ['SOUL.md', 'AGENTS.md', 'USER.md', 'IDENTITY.md', 'MEMORY.md']
Container path pattern: `/opt/clawer/userdata/clawer_user_{userId}/clawd`

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: { query: { users: { findFirst: vi.fn() } } },
}));
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    stat: vi.fn(() => Promise.resolve({ mtime: new Date(), size: 100 })),
    mkdir: vi.fn(),
  },
}));
```

**Test cases:**

GET /api/agent/files (import GET from '../agent/files/route'):
1. Returns 401 when unauthenticated
2. Returns { files: [], containerReady: false } when user.containerId is null AND containerStatus != 'running'
3. Returns containerReady: true and all 5 files when container is running
4. Each file object has { filename, description, content, lastModified, exists }
5. exists: true when fs.readFile succeeds; exists: false when it throws
6. content is empty string when file doesn't exist
7. Constructs correct path: /opt/clawer/userdata/clawer_user_{userId}/clawd/{filename}
8. Returns 404 (apiErrors.notFound) when user not in DB

PUT /api/agent/files (import PUT):
1. Returns 401 when unauthenticated
2. Returns 400 (INVALID_FILENAME) for filename='../../etc/passwd' (path traversal attempt)
3. Returns 400 (INVALID_FILENAME) for filename='README.md' (not in ALLOWED_FILES)
4. Returns 400 (VALIDATION_ERROR) when content is not a string (e.g., content: 123)
5. Returns 400 (CONTENT_TOO_LARGE) when content.length > 500,000
6. Calls fs.mkdir with recursive: true before writing
7. Calls fs.writeFile with correct path and content
8. Returns { filename, lastModified, size } on success
9. Returns 404 when user not in DB

POST /api/agent/files/reset (import POST from '../agent/files/reset/route'):
1. Returns 401 when unauthenticated
2. Returns 400 for invalid filename
3. Reads default from /opt/defaults/{filename} via fs.readFile
4. Falls back to empty string when default file doesn't exist (readFile throws)
5. Writes content to user's clawd directory
6. Returns { filename, content, lastModified, resetToDefault: true }
7. Returns 404 when user not in DB

**Response format:** These routes use apiSuccess/apiError from @/lib/api/response:
- Success: { success: true, data: {...}, meta: { requestId, timestamp } }
- Error: { success: false, error: { code, message }, meta: {...} }

**Expected file:** `src/app/api/__tests__/agent-files.test.ts`
```

---

#### Task 1.4 — Stripe Webhook Tests

```
Create the test file `src/app/api/__tests__/stripe-webhook.test.ts` for the Clawer.ai project at `/home/keith/projects/clawer/`.

**What to test:** `src/app/api/webhooks/stripe/route.ts`
This webhook handles Stripe subscription events: checkout.session.completed, customer.subscription.deleted, customer.subscription.updated (past_due), invoice.payment_failed.

**Read these files first:**
- `src/app/api/webhooks/stripe/route.ts` — full source

**Mocking strategy:**
```typescript
import { vi } from 'vitest';

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));
vi.mock('@/lib/db', () => ({
  db: {
    query: { users: { findFirst: vi.fn() } },
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
  },
}));
vi.mock('@/lib/provisioner', () => ({
  provisionContainer: vi.fn(),
  stopContainer: vi.fn(),
}));
vi.mock('@/lib/email', () => ({ sendWelcomeEmail: vi.fn() }));
vi.mock('@/lib/alerts', () => ({ alertPaymentFailure: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => name === 'stripe-signature' ? 'test-sig' : null),
  })),
}));

// Helper to build mock request
function buildRequest(body: string, sig = 'test-sig') {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': sig },
  });
}
```

**Test cases (import POST from '../webhooks/stripe/route'):**

Signature verification:
1. Returns 400 when stripe-signature header is missing (mock headers.get to return null)
2. Returns 500 when process.env.STRIPE_WEBHOOK_SECRET is undefined
3. Returns 400 when constructEvent throws (bad signature)
4. Calls constructEvent with (body, signature, webhookSecret)

checkout.session.completed:
5. Updates user tier='pro' and saves stripeCustomerId/stripeSubscriptionId
6. Calls provisionContainer with userId and user's teamTemplate (fetches from DB)
7. Calls sendWelcomeEmail with user's email and name
8. Still returns { received: true } even when provisionContainer throws
9. Still returns { received: true } even when sendWelcomeEmail throws
10. Skips provisioning when userId (client_reference_id) is null

customer.subscription.deleted:
11. Finds user by stripeCustomerId
12. Downgrades user to tier='free' and clears stripeSubscriptionId
13. Calls stopContainer with the user's id
14. Returns { received: true } even when stopContainer throws

customer.subscription.updated with status='past_due':
15. Calls alertPaymentFailure with customerId and message about past_due

invoice.payment_failed:
16. Calls alertPaymentFailure with customerId

unknown event type:
17. Returns { received: true } with 200 status (no error)

**Expected file:** `src/app/api/__tests__/stripe-webhook.test.ts`
```

---

#### Task 1.5 — Clerk Webhook + Rate Limit + Token Tests

```
Create THREE test files for the Clawer.ai project at `/home/keith/projects/clawer/`:

---

FILE 1: `src/app/api/__tests__/clerk-webhook.test.ts`
Tests: `src/app/api/webhooks/clerk/route.ts`

Mocks:
```typescript
vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn(),
  })),
}));
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({ values: vi.fn(() => ({ onConflictDoNothing: vi.fn() })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
  },
}));
```

Test cases:
1. Returns 500 when CLERK_WEBHOOK_SECRET env var not set (process.env.CLERK_WEBHOOK_SECRET = undefined)
2. Returns 400 when any of svix-id, svix-timestamp, svix-signature headers missing
3. Returns 400 when Webhook.verify() throws
4. user.created: inserts user with id, email (from primary email), name (first+last), tier='basic'
5. user.created: uses {id}@clerk.user as email fallback when no email_addresses
6. user.created: uses onConflictDoNothing for idempotency (safe to replay)
7. user.updated: updates email and name in DB by userId
8. user.deleted: soft deletes by setting deletedAt timestamp (does NOT delete row)
9. Unknown event type: returns { received: true } with 200

Helper for request:
```typescript
function buildClerkRequest(eventType: string, data: object, sig = 'valid-sig') {
  const body = JSON.stringify({ type: eventType, data });
  return new Request('http://localhost/api/webhooks/clerk', {
    method: 'POST',
    body,
    headers: {
      'content-type': 'application/json',
      'svix-id': 'msg_123',
      'svix-timestamp': '1234567890',
      'svix-signature': sig,
    },
  });
}
```

---

FILE 2: `src/lib/__tests__/rate-limit.test.ts`
Tests: `src/lib/rate-limit/index.ts` — the in-memory functions (no Redis needed)

Focus on pure in-memory functions (no Redis mocking needed for these):

Test cases for checkDailyLimit():
1. Returns true for unknown userId (no previous usage)
2. Returns true when usage count < limit
3. Returns false when usage count >= limit
4. Returns true after record expires (mock Date.now to be past resetAt)

Test cases for trackDailyUsage():
1. Creates new record for unknown userId with count=1
2. Increments count for existing user
3. Creates new record when existing record is expired (resetAt in past)

Test cases for getDailyUsageCount():
1. Returns 0 for unknown userId
2. Returns current count for known user
3. Returns 0 when record has expired

Test cases for checkIPLimit() + trackIPSignups():
1. New IP: returns true (allowed)
2. After 3 signups: returns false (blocked)
3. After expiry (24h): returns true again

Test cases for RATE_LIMITS constants (just data integrity):
1. free.requestsPerMinute === 20
2. basic.requestsPerMinute === 60
3. pro.requestsPerMinute === 120
4. enterprise.requestsPerMinute === 300
5. enterprise.messagesPerDay === -1 (unlimited)

---

FILE 3: `src/lib/__tests__/tokens.test.ts`
Tests: `src/lib/tokens/index.ts` and `src/lib/tokens/constants.ts`

Test pure calculation functions (no DB needed):

calculateOET():
1. calculateOET(1000, 0) === 1000 (orchestrator weight = 1.0)
2. calculateOET(0, 1000) === 150 (worker weight = 0.15)
3. calculateOET(1000, 1000) === 1150
4. Result is always an integer (Math.round)

getTokenLimit():
1. 'free' → 500_000
2. 'basic' → 3_750_000
3. 'pro' → 10_000_000
4. 'enterprise' → 25_000_000
5. Unknown tier → falls back to free limit (500_000)

calculateCost():
1. Orchestrator: 1M input tokens at $0.50/1M = $0.50
2. Orchestrator: 1M output tokens at $3.00/1M = $3.00
3. Worker: 1M input at $0.05/1M = $0.05
4. Worker: 1M output at $0.20/1M = $0.20
5. Zero tokens → $0 cost

TOKEN_LIMITS constants:
1. All tiers have weeklyOet > 0
2. free < basic < pro < enterprise ordering

OET_WEIGHTS:
1. orchestrator === 1.0
2. worker === 0.15

RATE_LIMITS:
1. warningThreshold === 0.80
2. hardLimit === 1.00
3. maxTokensPerRequest === 100_000

**Expected files:**
- `src/app/api/__tests__/clerk-webhook.test.ts`
- `src/lib/__tests__/rate-limit.test.ts`
- `src/lib/__tests__/tokens.test.ts`
```

---

### Batch 2 — Integration Tests (P1)

Run after Batch 1. Tests the higher-level flows.

---

#### Task 2.1 — Chat API Tests

```
Create the test file `src/app/api/__tests__/chat.test.ts` for the Clawer.ai project at `/home/keith/projects/clawer/`.

**What to test:** `src/app/api/chat/route.ts` — the main chat endpoint

**Read these files first:**
- `src/app/api/chat/route.ts` — full source (long, read carefully)
- `src/lib/constants.ts` — FREE_MESSAGE_LIMIT=200, FREE_DAILY_LIMIT=25, MAX_MESSAGE_LENGTH=32768

**Mocking strategy:**
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({
  checkUserRateLimit: vi.fn(),
  trackDailyUsage: vi.fn(),
  checkDailyLimit: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      bots: { findFirst: vi.fn() },
      conversations: { findFirst: vi.fn() },
    },
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn() })) })),
  },
}));
vi.mock('@/lib/container-client', () => ({
  containerApi: {
    chat: vi.fn(),
  },
}));
vi.mock('@/lib/router', () => ({
  routeRequest: vi.fn(() => ({
    tier: 'SIMPLE',
    model: 'google/gemini-2.0-flash-lite',
    confidence: 0.95,
    signals: ['simple_greeting'],
  })),
}));
vi.mock('@/lib/teams', () => ({
  getTeamConfig: vi.fn(),
  getAgentFromTeam: vi.fn(),
  buildAgentSystemPrompt: vi.fn(() => 'You are Scout, a research agent...'),
}));
```

**Test cases (import POST from '../chat/route'):**

Auth & validation:
1. Returns 401 when auth returns userId=null
2. Returns 400 when body has no message field
3. Returns 400 when message is not a string (e.g., message: 123)
4. Returns 400 when message.length > 32768 (MAX_MESSAGE_LENGTH)
5. Strips null bytes: message = "hello\0world" → sanitized to "helloworld"

Rate limiting:
6. Returns 429 with error='rate_limited' when checkUserRateLimit returns allowed=false
7. Response includes Retry-After header when rate limited
8. Response includes X-RateLimit-Limit and X-RateLimit-Remaining headers

Free tier — total message cap:
9. Returns 403 with error='free_trial_exceeded' when user.freeMessagesUsed >= 200 (FREE_MESSAGE_LIMIT)
10. Response includes upgradeUrl='/pricing' and freeMessagesUsed/freeMessageLimit fields

Free tier — daily limit:
11. Returns 429 with error='daily_limit_exceeded' when checkDailyLimit returns false
12. Calls trackDailyUsage when daily limit not hit
13. Routes free users to FREE_TIER_PORT (4000 by default)
14. Increments user's freeMessagesUsed by 1 on successful message

Paid tier:
15. Returns 503 with 'Container not provisioned' when user.containerPort is null
16. Returns 503 when user.containerStatus !== 'running'
17. Routes to user.containerPort for paid users

Agent routing:
18. Returns 404 when agentId provided but getTeamConfig returns null
19. Returns 404 when agentId provided but getAgentFromTeam returns null
20. Calls buildAgentSystemPrompt with (agent, teamConfig, user.name)
21. Creates new conversation when none exists for the agentId
22. Uses existing conversation when found
23. Saves both user and assistant messages to DB after successful response

Success path:
24. Calls containerApi.chat with (port, sanitizedMessage, context, botSettings, token)
25. Returns { content, conversationId, routing } on success
26. Returns container error response when result.error is set
27. Routing object includes { tier, model, confidence }

**Expected file:** `src/app/api/__tests__/chat.test.ts`
```

---

#### Task 2.2 — Container Status + Onboarding Tests

```
Create TWO test files for the Clawer.ai project at `/home/keith/projects/clawer/`:

---

FILE 1: `src/app/api/__tests__/container-status.test.ts`
Tests: `src/app/api/container/status/route.ts`

**Read:** `src/app/api/container/status/route.ts`

Mocks:
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: { query: { users: { findFirst: vi.fn() } } },
}));
```

Test cases (import GET from '../container/status/route'):
1. Returns 401 when unauthenticated
2. Returns 404 when user not found in DB
3. Returns user.containerStatus as status field (e.g., 'running', 'stopped', 'error', null → 'offline')
4. Calculates uptime: when containerCreatedAt is 1 hour ago and status='running' → uptime ≈ 3600 seconds
5. uptime is 0 when containerStatus is NOT 'running'
6. uptime is 0 when containerCreatedAt is null
7. Model mapping:
   - tier='free' → model='Qwen3 14B'
   - tier='basic' → model='Kimi Flash'
   - tier='pro' → model='Claude Sonnet 4'
   - tier='enterprise' → model='Claude Opus 4'
   - unknown tier → model='Unknown'
8. Returns { status, model, uptime, containerId, tier }
9. Returns 500 on unexpected error

---

FILE 2: `src/app/api/__tests__/onboarding.test.ts`
Tests: `src/app/api/onboarding/route.ts`

**Read:** `src/app/api/onboarding/route.ts`

Mocks:
```typescript
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      botSettings: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({ values: vi.fn() })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
  },
}));
```

Test cases (import POST from '../onboarding/route'):
1. Returns 401 when unauthenticated
2. INSERT botSettings when botSettings.findFirst returns null (new user)
3. UPDATE botSettings when record already exists
4. personality mapping:
   - communicationStyle='casual' → 'friendly, relaxed, uses emojis, approachable'
   - communicationStyle='professional' → 'clear, polished, business-appropriate, concise'
   - communicationStyle='technical' → 'precise, detailed, technical, no fluff'
   - unknown style → 'helpful and friendly'
5. botName defaults to 'Assistant' when not provided
6. botAvatar defaults to '🤖' when no emoji provided
7. Saves teamTemplate to users table when provided (string)
8. Ignores teamTemplate when not a string (type safety)
9. Sets onboardingCompleted=1 in users table
10. Stores channels array in additionalSettings JSON
11. Returns { success: true } with 200 status
12. Returns 500 when DB throws

**Expected files:**
- `src/app/api/__tests__/container-status.test.ts`
- `src/app/api/__tests__/onboarding.test.ts`
```

---

#### Task 2.3 — Smart Router + API Response Helper Tests

```
Create TWO test files for the Clawer.ai project at `/home/keith/projects/clawer/`:

---

FILE 1: `src/lib/router/__tests__/router.test.ts`
Tests: `src/lib/router/index.ts` and `src/lib/router/rules.ts`

**Read:**
- `src/lib/router/index.ts`
- `src/lib/router/rules.ts`

No mocking needed — these are pure functions.

Test cases for routeRequest():
1. Simple greeting "Hi there!" → tier='SIMPLE' or 'MEDIUM', useOrchestrator=false
2. Complex request "Analyze the legal implications of this 5000-word contract for liability clauses" → tier='COMPLEX' or 'REASONING', useOrchestrator=true
3. Uses userWorkerModel when routing to worker
4. Uses userOrchestratorModel when routing to orchestrator
5. Returns { model, tier, confidence, signals, costEstimate, savings, useOrchestrator }
6. confidence is a number between 0 and 1 inclusive
7. costEstimate is a non-negative number
8. savings is between 0 and 1 inclusive
9. signals is a non-empty array of strings
10. All 4 tier values are possible: SIMPLE, MEDIUM, COMPLEX, REASONING

Test cases for estimateTokens():
1. estimateTokens('') === 0
2. estimateTokens('test') is approximately 1 (4 chars ≈ 1 token)
3. estimateTokens(400-char string) is approximately 100
4. Returns a non-negative integer

Test cases for analyzeTierDistribution():
1. Given 10 prompts, percentages sum to 100%
2. All counts are >= 0
3. Simple prompts classify into SIMPLE bucket
4. Output shape: { SIMPLE: { count, percentage }, MEDIUM: {...}, COMPLEX: {...}, REASONING: {...} }

---

FILE 2: `src/lib/api/__tests__/response.test.ts`
Tests: `src/lib/api/response.ts`

No mocking needed.

Test cases for apiSuccess():
1. Default status is 200
2. Response body has { success: true, data, meta }
3. meta.requestId starts with 'req_'
4. meta.timestamp is a valid ISO 8601 string
5. Custom status code is respected (e.g., 201)
6. Data is passed through unchanged

Test cases for apiError():
1. Default status is 400
2. Response body has { success: false, error: { code, message }, meta }
3. error.code and error.message match input
4. details is included when provided
5. Custom status code works (e.g., 503)

Test cases for apiErrors shortcuts:
1. apiErrors.unauthorized() → status 401, code='UNAUTHORIZED'
2. apiErrors.forbidden() → status 403, code='FORBIDDEN'
3. apiErrors.notFound('Widget') → status 404, code='NOT_FOUND', message contains 'Widget'
4. apiErrors.validationError({ field: 'x' }) → status 400, code='VALIDATION_ERROR', details present
5. apiErrors.rateLimited(100, 'reset-time') → status 429, code='RATE_LIMITED'
6. apiErrors.quotaExceeded() → status 429, code='QUOTA_EXCEEDED'
7. apiErrors.internalError() → status 500, code='INTERNAL_ERROR'
8. apiErrors.integrationRequired('slack') → status 400, code='INTEGRATION_REQUIRED', details.requiredIntegration='slack'
9. apiErrors.integrationExpired('telegram') → status 400, code='INTEGRATION_EXPIRED'
10. apiErrors.modelError({ model: 'gpt-4' }) → status 502, code='MODEL_ERROR'

To test NextResponse objects, call `.json()` then `await response.json()` and check `.status` property.
The NextResponse mock: in vitest.config.ts the environment is 'node' — import from 'next/server'.
For status: `response.status` gives the HTTP status code directly.

**Expected files:**
- `src/lib/router/__tests__/router.test.ts`
- `src/lib/api/__tests__/response.test.ts`
```

---

### Batch 3 — UI Component Tests (P2)

Run after Batch 1. UI smoke tests.

---

#### Task 3.1 — Component Smoke Tests

```
Create TWO test files for the Clawer.ai project at `/home/keith/projects/clawer/`.

This project uses React + @testing-library/react. The vitest.config.ts uses environment: 'node' 
but needs 'jsdom' for component tests — you may need to add a comment at the top of each test:
`// @vitest-environment jsdom`

**Read these component files:**
- `src/components/FreeTrialBanner.tsx`
- `src/components/UpgradeBanner.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/GlassCard.tsx`

---

FILE 1: `src/components/__tests__/FreeTrialBanner.test.tsx`
Tests: `src/components/FreeTrialBanner.tsx`

Add at top: `// @vitest-environment jsdom`

Mocks: Mock next/navigation if component uses useRouter:
```typescript
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));
```

Test cases:
1. Renders without crashing when freeMessagesUsed=0
2. Shows message count: "X of 200 free messages used" (find the number in rendered output)
3. Has a link or button pointing to /pricing
4. When freeMessagesUsed >= 200: shows a distinct 'limit reached' state
5. Snapshot test (optional): toMatchSnapshot() for regression protection

---

FILE 2: `src/components/ui/__tests__/StatusBadge.test.tsx`  
Tests: `src/components/ui/StatusBadge.tsx`

Add at top: `// @vitest-environment jsdom`

Test cases:
1. Renders 'running' status without crashing
2. Renders 'stopped' status without crashing
3. Renders 'error' status without crashing
4. Renders 'offline' or null status without crashing
5. Applies different CSS classes or text for different statuses
6. Accepts custom className prop

---

**Note on @testing-library/react:** Run `npm list @testing-library/react` to verify it's installed.
If not, note in your output that it needs installing.

Pattern for component tests:
```typescript
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  it('renders without crashing', () => {
    const { container } = render(<ComponentName prop="value" />);
    expect(container).toBeTruthy();
  });
});
```

**Expected files:**
- `src/components/__tests__/FreeTrialBanner.test.tsx`
- `src/components/ui/__tests__/StatusBadge.test.tsx`
```

---

### Batch 4 — CI Pipeline Integration (P0)

Run this in parallel with Batch 1. One file change, no code reading needed.

---

#### Task 4.1 — Update GitHub Actions CI

```
Update the CI pipeline for the Clawer.ai project at `/home/keith/projects/clawer/`.

**File to modify:** `.github/workflows/ci.yml`

**Current contents:**
```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [main]

jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Type check
        run: npx tsc --noEmit
        continue-on-error: true
```

**Replace entirely with:**
```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  type-check:
    name: TypeScript Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit
        # Intentionally no continue-on-error — type errors should block PRs

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    env:
      NODE_ENV: test
      # Prevent Clerk SDK from making real auth calls during tests
      CLERK_SECRET_KEY: sk_test_placeholder_for_ci
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_placeholder_for_ci
      # Prevent Stripe from failing on missing env
      STRIPE_SECRET_KEY: sk_test_placeholder_for_ci
      STRIPE_WEBHOOK_SECRET: whsec_placeholder_for_ci
      CLERK_WEBHOOK_SECRET: whsec_placeholder_for_ci
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npx vitest run --reporter=verbose
```

**Also update `vitest.config.ts`** to exclude more non-testable paths:

Read the current vitest.config.ts first (`/home/keith/projects/clawer/vitest.config.ts`).

Add to the `coverage.exclude` array:
```
'src/app/(auth)/**',
'src/app/blog/**', 
'src/app/terms/**',
'src/app/privacy/**',
'src/app/about/**',
'src/app/sitemap.ts',
'src/app/robots.ts',
'src/lib/db/schema/**',
```

**Verify your changes compile:** Run `cd /home/keith/projects/clawer && npx tsc --noEmit 2>&1 | tail -20` to check.

**Run the tests:** `cd /home/keith/projects/clawer && npx vitest run 2>&1 | tail -30` to verify the existing 4 test files still pass.

Report:
1. Whether the type-check passes
2. Whether the existing tests pass
3. The path to the updated files
```

---

## Appendix: File Locations Quick Reference

```
Existing tests (do not modify):
  src/app/api/__tests__/agent-chat.test.ts      (teams + buildAgentSystemPrompt)
  src/app/api/__tests__/agent-thread.test.ts    (GET /api/agents/[agentId]/thread — stub)
  src/app/api/__tests__/bots.test.ts             (GET /api/bots, POST /api/bots/[botId]/activate)
  src/app/api/__tests__/teams.test.ts            (TEAM_CONFIGS, getTeamConfig, getAgentFromTeam)

New tests to create:
  Batch 1 (P0 — Critical):
    src/lib/__tests__/provisioner.test.ts
    src/app/api/__tests__/messages.test.ts
    src/app/api/__tests__/agent-files.test.ts
    src/app/api/__tests__/stripe-webhook.test.ts
    src/app/api/__tests__/clerk-webhook.test.ts
    src/lib/__tests__/rate-limit.test.ts
    src/lib/__tests__/tokens.test.ts
  
  Batch 2 (P1 — High):
    src/app/api/__tests__/chat.test.ts
    src/app/api/__tests__/container-status.test.ts
    src/app/api/__tests__/onboarding.test.ts
    src/lib/router/__tests__/router.test.ts
    src/lib/api/__tests__/response.test.ts
  
  Batch 3 (P2 — UI):
    src/components/__tests__/FreeTrialBanner.test.tsx
    src/components/ui/__tests__/StatusBadge.test.tsx
  
  Batch 4 (CI):
    .github/workflows/ci.yml          (UPDATE existing)
    vitest.config.ts                   (UPDATE existing)
```

---

*Document generated by codebase audit of `/home/keith/projects/clawer/` on 2026-02-19.*  
*Stack: Next.js 16 App Router, TypeScript, Clerk auth, Drizzle ORM, Stripe, Vitest.*
