# Clawer.ai Codebase Audit

**Date:** February 2026  
**Branch:** `staging`  
**Auditor:** Claude Code (automated)  
**Scope:** Full codebase — security, architecture, duplications, brand, consistency, dead code

---

## 1. Executive Summary

**Overall Health Score: 5/10**

The codebase shows clear signs of multi-agent, multi-session development with no single coherent architectural vision. The core product works — auth is solid, Stripe webhooks are handled correctly, Drizzle ORM prevents SQL injection — but there are serious layering issues, a dangerous security hole in API key storage, and a shocking amount of dead/stub code that has accumulated without cleanup.

### Top Concerns (Priority Order)

1. **🔴 CRITICAL — API keys stored in plaintext** despite a column named `encryptedKey`. The word "encrypted" is a lie. If the DB is compromised, all user-provided OpenAI/Anthropic/Google/DeepSeek keys are exposed.
2. **🔴 CRITICAL — Slack events route** bypasses auth and forwards user messages to **Moonshot (api.moonshot.cn)**, a Chinese LLM, regardless of user's container setup. Inconsistent with every other integration and a data routing surprise.
3. **🟠 HIGH — Hardcoded fallback token** `'free_tier_shared_2026_clawer'` in `constants.ts` as a fallback if env var is missing. Leaked or guessed, this bypasses the free tier container.
4. **🟠 HIGH — Multiple stub/fake API routes** returning hardcoded mock data with TODO comments. These are advertised as real endpoints but return dummy responses.
5. **🟡 MEDIUM — Massive inconsistency** in API response patterns: 60 routes use `NextResponse.json()` directly, 18 use standardized helpers. You cannot maintain this at scale.

---

## 2. Critical Issues

### 🔴 API Keys Stored in Plaintext
**File:** `src/lib/db/schema/api-keys.ts:50`, `src/app/api/user/api-keys/route.ts:115,126`

```ts
// The column says "encrypted" but encryption is NOT implemented
encryptedKey: text('encrypted_key').notNull(),  // schema comment: "TODO: implement encryption"

// And the route just stores raw trimmed key:
encryptedKey: trimmedKey,  // NO encryption happening here
```

User-provided API keys for OpenAI, Anthropic, Google, and DeepSeek are stored verbatim in the `api_keys` table. If the database is compromised, every user's AI API keys are exposed. This is a GDPR/SOC2 compliance failure.

**Fix:** Implement AES-256-GCM encryption with a server-side master key before any more users add keys.

---

### 🔴 Slack Events Route — Moonshot AI Hardcoded
**File:** `src/app/api/slack/events/route.ts:15-130`

```ts
const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
// ...
const response = await fetch(MOONSHOT_API_URL, {
  body: JSON.stringify({
    model: 'moonshot-v1-8k',  // Hardcoded Chinese LLM
```

Every Slack message from every user is forwarded to Moonshot (Kimi AI, operated in China) using a **global platform API key** (`process.env.MOONSHOT_API_KEY`), not the user's own container. This is:
- Architecturally inconsistent (every other integration proxies through the user's container)
- A data privacy issue (user messages going to a third-party the user didn't consent to)
- A cost leak (platform pays for all Slack AI responses)
- Also: the `SLACK_SIGNING_SECRET` check is **opt-in only** — if env var is missing, ALL webhook requests are accepted unverified (see lines 31-46)

---

### 🔴 Stub Routes Returning Fake Data in Production
Multiple API routes are completely unimplemented and return hardcoded mock data:

**`src/app/api/bots/[botId]/route.ts`** — GET bot details
```ts
// TODO: Fetch bot from database
// For now, return mock data
const bot = {
  id: botId,
  type: 'email',
  name: 'My Email Bot',   // Hardcoded! Not from DB!
  status: 'active',
  integrationStatuses: { gmail: 'connected' },  // Always says connected
```

**`src/app/api/bots/[botId]/activate/route.ts`** — Activate bot
```ts
// TODO: Activate bot in database
// For now, return mock success response
const activatedBot = { id: botId, status: 'active' };  // Never writes to DB
```

**`src/app/api/user/usage/route.ts`** — Usage statistics
```ts
// TODO: Fetch usage from database
// For now, return mock data
const usage = {
  summary: { totalMessages: 0, totalCost: 0, byModel: {} },  // Always zeros
```

**`src/app/chat/[botId]/page.tsx:194`**
```ts
const [isFreeTier, setIsFreeTier] = useState(true); // TODO: Get from user context
```
Every user visiting `/chat/*` is treated as free tier due to hardcoded `true`.

---

### 🟠 Hardcoded Fallback Token
**File:** `src/lib/constants.ts:2`

```ts
export const FREE_TIER_TOKEN = process.env.FREE_TIER_TOKEN || 'free_tier_shared_2026_clawer';
```

If `FREE_TIER_TOKEN` env var is not set (misconfiguration, deployment error), the fallback value is a plaintext string committed to source. Anyone who finds this token can make requests to the free-tier container as if authenticated.

---

### 🟠 Account Deletion Not Implemented (GDPR Risk)
**File:** `src/app/dashboard/settings/page.tsx:963`

```ts
// TODO: wire up actual account deletion
```

The "Delete Account" button exists in the UI but does nothing. Users cannot exercise their GDPR right to erasure.

---

## 3. Duplications Found

### 3.1 Telegram Routes — Two Complete Implementations

| Old Pattern (BYOB) | New Pattern (Container-Proxy) |
|---|---|
| `src/app/api/telegram/connect/route.ts` | `src/app/api/container/telegram/connect/route.ts` |
| `src/app/api/telegram/disconnect/route.ts` | `src/app/api/container/telegram/disconnect/route.ts` |
| `src/app/api/telegram/status/route.ts` | `src/app/api/container/telegram/status/route.ts` |

The old pattern directly calls Telegram API and stores bot tokens in the DB. The new pattern proxies through the user's container. Both exist simultaneously. The UI should only use one. Old routes should be deleted after confirming the container-proxy pattern is live.

### 3.2 Slack Routes — Two Complete Implementations

| Old Pattern | New Pattern |
|---|---|
| `src/app/api/slack/connect/route.ts` | `src/app/api/container/slack/connect/route.ts` |
| (no disconnect) | `src/app/api/container/slack/disconnect/route.ts` |
| (in same file) | `src/app/api/container/slack/status/route.ts` |

Old `src/app/api/slack/connect/route.ts` handles GET/POST/DELETE in one file with different field names (`botToken` only) vs the new route which requires `botToken + appToken + signingSecret`. The Slack events webhook (`/api/slack/events/`) is ALSO a third, completely separate implementation using Moonshot.

### 3.3 ContainerStatus — Two Duplicate Components

Both poll `/api/container/status`, neither is imported anywhere:

- `src/components/ContainerStatus.tsx` — polls every 30s, shows 4 status states
- `src/components/ContainerStatusWidget.tsx` — polls every 10s, shows 5 different status states with `uptime`, `model`, `tier` fields that the API doesn't return in the same shape

### 3.4 QuickActions — Two Incompatible Implementations

- `src/components/QuickActions.tsx` — has `whatsappConnected`, `telegramConnected`, `containerRunning` props, links to `/chat/assistant`, **0 imports** (dead)
- `src/components/dashboard/QuickActions.tsx` — static list, no props, links to dashboard pages, **used by DashboardHome**

### 3.5 Chat UI — Three Separate Implementations

1. `src/components/dashboard/DashboardShell.tsx` — Full chat UI with sidebar, multi-agent switching, history loading. **0 imports — dead code.**
2. `src/components/dashboard/DashboardWorkspace.tsx` — Full chat UI with sidebar, multi-agent switching, history loading. Used by `/dashboard/chat`.
3. `src/app/chat/[botId]/page.tsx` — Full chat page with voice input, bot settings modal, starter prompts. Used for `/chat/*`.

DashboardShell and DashboardWorkspace are near-identical in structure (both have same `useEffect` patterns, same message loading logic, same auto-scroll). One is dead.

### 3.6 Navigation — Repeated in Every Dashboard Component

Every major dashboard component has its own hardcoded nav:
- `src/components/dashboard/DashboardHome.tsx:73-93` — Full top nav
- `src/components/dashboard/DashboardWorkspace.tsx` — Has its own sidebar nav  
- `src/components/files/FilesPage.tsx:90-105` — Has its own top nav
- `src/components/dashboard/TaskBoard.tsx:628` — Has its own top nav

There is no shared `DashboardNav` or `DashboardLayout` component. Every nav update requires editing 4+ files.

### 3.7 Upgrade/Trial Banner — Two Overlapping Components

- `src/components/UpgradeBanner.tsx` — Simple banner for subscribed users. Used by DashboardHome.
- `src/components/FreeTrialBanner.tsx` — Progressive banner + full-screen modal. **0 imports — dead code.**

Both exist to convert free → paid. FreeTrialBanner is more sophisticated but completely unused. UpgradeBanner is simpler and actually in use.

---

## 4. Inconsistencies

### 4.1 API Response Patterns — Major Split

```
Routes using NextResponse.json() directly:    60 files
Routes using apiSuccess/apiErrors helpers:    18 files
```

Some routes mix both patterns within the same file. The helpers in `src/lib/api/response.ts` are good (consistent shapes, proper status codes) but adoption is ~23%. Every new route an agent wrote defaulted to the raw pattern.

**Examples of inconsistency:**
- `src/app/api/dashboard/stats/route.ts` — uses `NextResponse.json()` (old)
- `src/app/api/dashboard/briefing/route.ts` — uses `NextResponse.json()` (old)
- `src/app/api/agent/files/route.ts` — uses `apiSuccess/apiErrors` (new)
- `src/app/api/files/content/route.ts` — uses `apiSuccess/apiErrors` (new)

### 4.2 Middleware Protected Routes — Incomplete List

`src/middleware.ts` explicitly lists routes requiring auth protection. These routes are **missing from the list** despite requiring auth:

```
/api/tasks          (src/app/api/tasks/route.ts — has auth() internally)
/api/files          (src/app/api/files/route.ts — has auth() internally)
/api/dashboard      (src/app/api/dashboard/* — has auth() internally)
/api/team           (src/app/api/team/route.ts — has auth() internally)
/api/agent          (src/app/api/agent/* — has auth() internally)
/api/memory         (src/app/api/memory/* — has auth() internally)
/api/briefing       (src/app/api/briefing/* — has auth() internally)
/api/maintenance    (no Clerk auth — uses MAINTENANCE_SECRET header)
/api/engagement     (uses CRON_SECRET or Clerk — partial coverage)
```

Routes still return 401 via internal auth() checks, so they're not exploitable. But the middleware list is the documented contract of what's protected, and it's wrong/incomplete.

### 4.3 API Route Naming — Singular vs Plural Chaos

```
/api/bot/settings       (singular)
/api/bots               (plural)
/api/bots/[botId]       (plural)
/api/agent/files        (singular)  
/api/agents/[agentId]   (plural)
/api/team               (singular)
/api/teams/current      (plural)
/api/message            (singular — empty directory, no route file)
/api/messages           (plural — actual route)
```

No consistent convention. Singular routes coexist with plural routes for the same resource.

### 4.4 TypeScript `any` Usage

Despite `strict: true` in tsconfig, there are numerous `as any` casts indicating the types don't fully model the data:

```ts
// src/app/dashboard/page.tsx:47
const teamTemplate = (user as any)?.teamTemplate || 'lifeos';

// src/app/dashboard/page.tsx:132-133
whatsappConnected={!!(user as any)?.whatsappConnected}
telegramConnected={!!(user as any)?.telegramConnected}

// src/app/api/conversations/route.ts:77-78
const aStarred = (a.metadata as any)?.starred ? 1 : 0;
const bStarred = (b.metadata as any)?.starred ? 1 : 0;

// src/app/api/dashboard/sync/route.ts:61
if (activityData && Array.isArray((activityData as any).events)) {

// src/app/api/dashboard/health/route.ts:90
const healthData = data as any;
```

The `user as any` on the dashboard page is particularly bad — fields exist in the DB schema but aren't included in the Clerk user type or the DB query return type. Fix the query to include these fields explicitly.

### 4.5 Error Handling — Inconsistent Patterns

```ts
// Pattern A — generic
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });

// Pattern B — detailed  
return NextResponse.json({ error: error.message || 'Failed to connect Telegram bot' }, { status: 500 });

// Pattern C — helper
return apiErrors.internalError();

// Pattern D — catch and return 200 (Slack requirement but done everywhere)
return NextResponse.json({ ok: true });  // Even on actual errors
```

No standard. Debugging production errors is painful when error messages are inconsistent.

### 4.6 Data Fetching Patterns

Dashboard pages mix:
- Server components with `db.query.*` calls (`src/app/dashboard/page.tsx`)
- Client components with `useEffect` + `fetch()` (DashboardHome, DashboardWorkspace)
- No SWR usage (not installed)
- No React Query usage

The split is mostly correct (server → client boundary), but the client-side fetch patterns are not memoized or deduplicated when multiple components poll the same endpoint.

---

## 5. Dead Code

### 5.1 Unused Components (0 imports, confirmed)

| File | Lines | Notes |
|---|---|---|
| `src/components/ContainerStatus.tsx` | ~80 | Duplicate of ContainerStatusWidget |
| `src/components/ContainerStatusWidget.tsx` | ~100 | Neither is used |
| `src/components/DiagnoseButton.tsx` | ~60 | Has a stub TODO for auto-fix |
| `src/components/FreeTrialBanner.tsx` | ~280 | Large component with TESTS but 0 usage |
| `src/components/TelegramCard.tsx` | ~40 | Imports TelegramConnectModal which also dies with it |
| `src/components/TelegramConnectModal.tsx` | ~80 | Only used by dead TelegramCard |
| `src/components/UsageWidget.tsx` | ~60 | Unclear what this was for |
| `src/components/WelcomeToast.tsx` | ~30 | Never shown |
| `src/components/QuickActions.tsx` (root) | ~60 | Shadowed by dashboard version |
| `src/components/dashboard/DashboardShell.tsx` | ~400 | Full chat UI, never imported |

**Total dead component code: ~1,190 lines**

### 5.2 Deprecated Library Files

- `src/lib/orchestrator.local.ts.deprecated` — 322 lines, explicitly `.deprecated` in name. Should be deleted.

### 5.3 Dead API Routes (superseded)

- `src/app/api/telegram/connect/route.ts` — Superseded by `/api/container/telegram/connect`
- `src/app/api/telegram/disconnect/route.ts` — Superseded by `/api/container/telegram/disconnect`
- `src/app/api/telegram/status/route.ts` — Superseded by `/api/container/telegram/status`
- `src/app/api/slack/connect/route.ts` — Superseded by `/api/container/slack/connect`
- `src/app/api/message/` directory — Empty, no route file, appears to be a placeholder

### 5.4 Stub Routes (implemented but return fake data)

- `src/app/api/bots/[botId]/route.ts` — Returns hardcoded mock bot
- `src/app/api/bots/[botId]/activate/route.ts` — Returns mock success without DB write
- `src/app/api/user/usage/route.ts` — Returns all zeros with TODO

---

## 6. Recommended Refactors (Prioritized)

### Priority 1 — Security (Do Now)

**[P1-A] Encrypt API keys** — Effort: Medium (2-3 days)
- Add AES-256-GCM encryption in `src/app/api/user/api-keys/route.ts` before storing
- Add decryption when fetching keys for container use
- Rotate all existing stored keys (notify users to re-enter them)

**[P1-B] Fix Slack events route** — Effort: Small (1 day)
- Remove Moonshot dependency from `src/app/api/slack/events/route.ts`
- Route Slack messages through user's container (same pattern as `/api/container/slack/*`)
- Make `SLACK_SIGNING_SECRET` mandatory (crash if not set, not silently skip)

**[P1-C] Remove hardcoded fallback token** — Effort: Tiny (30 min)
- `src/lib/constants.ts:2` — Throw at startup if `FREE_TIER_TOKEN` env var is not set

### Priority 2 — Functionality (This Sprint)

**[P2-A] Implement account deletion** — Effort: Medium (1-2 days)
- `src/app/dashboard/settings/page.tsx:963`
- Must delete: user record, containers, messages, conversations, API keys
- Wire up the existing button

**[P2-B] Implement or remove stub routes** — Effort: Medium (2-3 days)
- Either implement `src/app/api/bots/[botId]/route.ts` for real or remove the entire `/bots/*` tree
- Either implement `src/app/api/user/usage/route.ts` or redirect to `/api/usage/analytics`
- Fix `src/app/chat/[botId]/page.tsx:194` hardcoded `isFreeTier: true`

### Priority 3 — Dead Code Removal (Next Sprint)

**[P3-A] Delete unused components** — Effort: Small (2-3 hours)
Delete all 10 files listed in section 5.1. Confirm by running `grep -rn "ComponentName" src/` first.

**[P3-B] Delete deprecated lib file** — Effort: Tiny (5 min)
`rm src/lib/orchestrator.local.ts.deprecated`

**[P3-C] Delete superseded telegram/slack routes** — Effort: Small (1-2 hours)
Remove `/api/telegram/*` and the old `/api/slack/connect` route after confirming container routes are in use.

### Priority 4 — Architecture (Quarter Goal)

**[P4-A] Create shared DashboardNav component** — Effort: Medium (1 day)
Extract the nav from DashboardHome, DashboardWorkspace, FilesPage, TaskBoard into a single `src/components/dashboard/DashboardNav.tsx` with an `activeSection` prop.

**[P4-B] Standardize API response pattern** — Effort: Large (1-2 weeks)
Migrate all 60 routes using `NextResponse.json()` to use `apiSuccess/apiErrors` from `src/lib/api/response.ts`. Do it route by route, prioritize high-traffic routes.

**[P4-C] Fix middleware route list** — Effort: Small (1 hour)
Add all missing routes to `src/middleware.ts` isProtectedRoute list for documentation correctness.

**[P4-D] Consolidate chat implementations** — Effort: Large (2-3 days)
Merge DashboardWorkspace and DashboardShell (after deleting DashboardShell). Decide whether `/chat/[botId]` should remain a separate surface or be unified with the dashboard chat.

**[P4-E] Fix TypeScript `any` casts** — Effort: Medium (2-3 days)
Start with `src/app/dashboard/page.tsx` user type — add `teamTemplate`, `whatsappConnected`, `telegramConnected` to the Drizzle query select list.

### Priority 5 — Testing (Ongoing)

**[P5-A] Delete FreeTrialBanner test** — Effort: Tiny (5 min)
`src/components/__tests__/FreeTrialBanner.test.tsx` tests a dead component. Either restore the component to use or delete the test.

**[P5-B] Add tests for untested routes** — Effort: Large (1 week)
Currently untested:
- `/api/dashboard/*` (5 routes, 0 tests)
- `/api/usage/*` (3 routes, 0 tests)
- `/api/admin/*` (6 routes, 0 tests)
- `/api/engagement/*` (3 routes, 0 tests)
- `/api/team`, `/api/teams/*`
- `src/app/chat/[botId]/page.tsx` (complex, stateful, 0 tests)

---

## 7. Architecture Notes

### What's Good

- **Drizzle ORM** is used throughout — no raw SQL, no injection risk
- **Three-layer path traversal protection** in `src/lib/files.ts:validatePath()` — null byte, `..` resolution, symlink checks. Well done.
- **Admin routes all use `isAdmin()`** — no privilege escalation possible from regular Clerk auth
- **Stripe webhook signature verification** is correctly mandatory (crashes if `STRIPE_WEBHOOK_SECRET` not set)
- **TypeScript strict mode** is enabled (`tsconfig.json`)
- **Rate limiting** implemented via Redis in `src/lib/rate-limit/`
- **API keys masked** in GET responses (first 6 + last 4) — just need actual encryption

### What's Messy

- **No shared layout for dashboard** — every section manages its own nav, header, and layout. Adding a new nav item means 4+ file edits.
- **Two generations of integrations coexist** — the old BYOB model (store bot tokens in DB, call APIs directly) and the new container-proxy model (proxy everything through user's container). The codebase is mid-migration and the old routes are still live.
- **The `FreeTrialBanner` problem** — 280+ lines of progressive trial UI exists, has tests, but is never rendered. Someone built this, wrote tests for it, then presumably replaced it with `UpgradeBanner` without deleting it.
- **`src/app/page.tsx` is a client component** — The landing page is `'use client'` to use Framer Motion. This prevents RSC server-side rendering for the landing page, hurting SEO. Consider splitting the nav motion into a separate client component while keeping the page itself a server component.
- **`src/lib/design-system.ts`** — Framer Motion variants file exists but unclear how widely adopted. Motion decisions made per-component ad hoc in most places.
- **`/api/message/` empty directory** — Placeholder directory with no route file. Either add a route or delete it.
- **`src/app/api/slack/events/route.ts` uses `event: any`** at line 89 — the Slack event type is not modeled.

### Circular Dependency Risk

No circular dependencies found in lib-to-lib imports. The graph is mostly linear:
- `routes → lib/container-client → lib/db`
- `routes → lib/provisioner → lib/db, lib/ssh`
- `routes → lib/tokens → lib/db`

### Server vs Client Boundaries

Generally correct. Server components fetch from DB. Client components fetch via API. The main landing page `src/app/page.tsx` being `'use client'` is the notable exception (see above).

---

## Appendix: Files Audited

- 78 API route files
- 55+ component files
- 20+ lib files
- 2 test suites checked (api and components)
- `middleware.ts`, `tsconfig.json`, `constants.ts`

**Most urgent single file to review:** `src/app/api/slack/events/route.ts` — it's a security and architecture disaster in 135 lines.

**Most urgent table to fix:** `api_keys.encrypted_key` — it's not encrypted.
