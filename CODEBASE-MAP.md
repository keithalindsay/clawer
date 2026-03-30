# CODEBASE-MAP.md — Quick Reference for AI Agents

> **Read this FIRST before touching any code.** ~1500 tokens.

## What Is This?

SaaS platform (Next.js 16 + App Router) that deploys AI agent teams via Docker containers. Users chat with agents through a web dashboard or messaging apps (WhatsApp, Telegram, Slack).

## Tech Stack

Next.js 16 · React 19 · TypeScript 5 · Drizzle ORM · PostgreSQL · Clerk (auth) · Stripe (billing) · Redis (rate limit) · Tailwind v4 · Vitest

## Architecture

```
Browser → Vercel (Next.js) → PostgreSQL (users, billing, config)
                            → SSH → Prod Server → Docker containers (one per user)
                            → Redis (rate limiting, optional)
                            → Stripe (subscriptions)
                            → Clerk (authentication)
```

## Critical Files (DO NOT edit without running tests)

| File | Why Critical |
|------|-------------|
| `src/lib/db/schema/users.ts` | Central schema — 99+ routes depend on it |
| `src/lib/container-client.ts` | 35+ files import this — container communication hub |
| `src/lib/provisioner.ts` | Container lifecycle (create/stop/restart via SSH) |
| `src/app/api/chat/route.ts` | Core product — the chat endpoint |
| `src/middleware.ts` | Auth boundary — protects all routes |
| `src/app/api/webhooks/stripe/route.ts` | Billing events handler |
| `src/app/api/webhooks/clerk/route.ts` | User creation/sync |
| `src/lib/constants.ts` | Free tier limits |

## Safe to Edit (Low Risk)

- `src/app/blog/*` — Static SEO pages, no shared state
- `src/components/landing/*` — Landing page UI
- `src/components/ui/*` — Additive changes only
- `src/lib/analytics.ts` — Fire-and-forget tracking
- `src/lib/diagnostics/*` — Read-only analysis
- All `.md` files outside `src/`

## Key Directories

| Path | What | Files |
|------|------|-------|
| `src/app/api/` | API routes | 131 handlers |
| `src/app/dashboard/` | Dashboard pages | 14 pages |
| `src/components/dashboard/` | Dashboard widgets | 26 components |
| `src/lib/db/schema/` | DB schema (Drizzle) | 22 tables |
| `src/lib/router/` | Smart model routing | 4 files |
| `src/lib/launch-engine/` | Content marketing | 5 files |

## Database

22 tables. Key ones: `users` (central), `tasks`, `weekly_usage`, `model_configs`, `custom_agents`, `agent_events`. Schema in `src/lib/db/schema/`. Migrations via `drizzle-kit`.

⚠️ `conversations` table is **DEPRECATED** for chat — chat history lives in OpenClaw sessions.

## Environment

Required: `DATABASE_URL`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `FREE_TIER_TOKEN`  
Optional: `REDIS_URL`, `CONTAINER_HOST`, `PRODUCTION_SERVER`  
See `AI-DEVELOPER-GUIDE.md` §5 for full list.

## Running

```bash
npm run dev          # Local dev server
npm run test:run     # Unit tests (vitest)
npm run build        # Production build
npm run db:generate  # Generate migrations
npm run db:push      # Push schema to DB
```

## CI Pipeline

GitHub Actions on PR/push to main:
1. TypeScript type-check (`tsc --noEmit`)
2. Unit tests (`vitest run`)

## Before You Edit

1. **Check this map** — is the file critical or safe?
2. **Run `npm run test:run`** after changes
3. **Update CHANGELOG.md** with what you changed
4. **If touching schema** — run `npm run db:generate` to create migration
5. **If adding API route** — check if it needs adding to `middleware.ts`

## Known Issues

- 7 failing tests (quality-gate thresholds, agent-files, tokens, provisioner timeout)
- `teams.ts` has 470 lines of hardcoded config (should be JSON)
- `container-client.ts` is a god file (720 lines, 35+ dependents)
- Migration journal has gap (0003 → 0011)
