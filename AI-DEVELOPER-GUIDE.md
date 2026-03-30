# AI Developer Guide — Clawer.ai Codebase Audit

> **Generated:** 2026-03-05  
> **Purpose:** Make this codebase safe and efficient for AI agents to work on without breaking things.  
> **Scope:** Full audit of `/home/keith/projects/clawer/`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Codebase Map](#3-codebase-map)
4. [Database Schema](#4-database-schema)
5. [Environment Variables](#5-environment-variables)
6. [Module Boundaries & Coupling](#6-module-boundaries--coupling)
7. [God Files (Files That Do Too Much)](#7-god-files)
8. [Dependency Chains](#8-dependency-chains)
9. [Risk Assessment](#9-risk-assessment)
10. [Test Coverage Analysis](#10-test-coverage-analysis)
11. [Hardcoded Values & Magic Strings](#11-hardcoded-values--magic-strings)
12. [AI-Friendly Recommendations](#12-ai-friendly-recommendations)
13. [Recommended Test Plan](#13-recommended-test-plan)
14. [Changelog Discipline](#14-changelog-discipline)
15. [Pre-Commit / CI Checks](#15-pre-commit--ci-checks)

---

## 1. Project Overview

**Clawer.ai** is a SaaS platform that deploys AI agent teams (built on OpenClaw) across messaging platforms (WhatsApp, Telegram, Slack). Users get isolated Docker containers running OpenClaw instances, managed through a Next.js web dashboard.

### Key Numbers

| Metric | Count |
|--------|-------|
| Total TypeScript/TSX files (excl. node_modules) | ~432 |
| Total lines of code | ~83,000 |
| API route handlers | 131 (+ 4 duplicates/variants) |
| Page components | 60 |
| Dashboard components | 26 |
| Library modules (src/lib) | 94 files, ~20,000 lines |
| Test files | 43 |
| Database schema tables | 22 |
| Blog pages | 19 (static SEO content) |
| Docker/deployment configs | ~40 markdown + config files |

### Architecture (High Level)

```
[User Browser] → [Next.js App on Vercel] → [PostgreSQL (Neon/remote)]
                                          → [Production Server via SSH]
                                              → [Docker containers per user]
                                                  → [OpenClaw instances]
                                          → [Redis (optional, rate limiting)]
                                          → [Stripe (billing)]
                                          → [Clerk (auth)]
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | React | 19.2.3 |
| Language | TypeScript | ^5 |
| Database | PostgreSQL via `postgres` driver | ^3.4.8 |
| ORM | Drizzle ORM | ^0.45.1 |
| Auth | Clerk (`@clerk/nextjs`) | ^6.37.3 |
| Billing | Stripe | ^20.3.1 |
| Messaging | Telegram (`node-telegram-bot-api`), Slack (`@slack/bolt`) | |
| Cache | Redis (`ioredis`) | ^5.9.2 |
| CSS | Tailwind CSS v4 | ^4 |
| Animation | Framer Motion | ^12.34.0 |
| Validation | Zod | ^4.3.6 |
| Testing | Vitest | ^4.0.18 |
| CI | GitHub Actions (type-check + unit tests) | |
| Hosting | Vercel (web app), bare-metal server (containers) | |
| Deployment | Vercel for frontend; SSH to prod server for Docker ops | |

---

## 3. Codebase Map

### Directory Structure (src/ only — the important stuff)

```
src/
├── app/                          # Next.js App Router pages + API
│   ├── api/                      # 131 API route handlers
│   │   ├── admin/                # Admin panel APIs (containers, users, health, orchestrator)
│   │   ├── agent/                # Agent file management
│   │   ├── agents/               # Agent thread management
│   │   ├── bot/                  # Bot settings
│   │   ├── bots/                 # Bot CRUD
│   │   ├── briefing/             # Morning briefing settings
│   │   ├── chat/                 # Core chat (route.ts is THE critical path)
│   │   ├── container/            # Container management (status, restart, messaging integrations)
│   │   ├── conversations/        # Conversation CRUD (partially deprecated)
│   │   ├── cron/                 # Cron jobs (nudges)
│   │   ├── dashboard/            # Dashboard data APIs (stats, sync, crons, hooks, memory)
│   │   ├── diagnose/             # Diagnostic endpoint
│   │   ├── engagement/           # Onboarding engagement sequence
│   │   ├── feedback/             # User feedback
│   │   ├── files/                # File browser API
│   │   ├── health/               # Health check
│   │   ├── launch-engine/        # Content marketing engine
│   │   ├── maintenance/          # Message purge/summarize
│   │   ├── memory/               # Memory stats
│   │   ├── messages/             # Message CRUD
│   │   ├── models/               # Model configuration
│   │   ├── mombrain/             # MomBrain vertical (family management)
│   │   ├── onboarding/           # Onboarding flow
│   │   ├── stripe/               # Stripe checkout/portal
│   │   ├── tasks/                # Task board CRUD + execution
│   │   ├── team/                 # Team management
│   │   ├── teams/                # Team template selection
│   │   ├── usage/                # Usage tracking/analytics
│   │   ├── user/                 # User settings/notifications
│   │   ├── webhooks/             # Clerk + Stripe webhooks
│   │   └── __tests__/            # 18 API test files
│   │
│   ├── (auth)/                   # Auth pages (sign-in, sign-up)
│   ├── admin/                    # Admin dashboard pages
│   ├── blog/                     # 19 SEO blog pages (static, low risk)
│   ├── chat/                     # Chat UI page
│   ├── dashboard/                # Main user dashboard (14 sub-pages)
│   ├── onboarding/               # Onboarding wizard page
│   ├── pricing/                  # Pricing page
│   └── page.tsx                  # Landing page
│
├── components/                   # React components
│   ├── dashboard/                # 26 dashboard widgets/panels
│   ├── files/                    # File browser components
│   ├── landing/                  # Landing page sections
│   ├── launch-engine/            # Content marketing components
│   ├── onboarding/               # Onboarding components
│   ├── ui/                       # Shared UI primitives (GlassCard, StatusBadge, etc.)
│   └── [top-level]               # OnboardingFlow, FeedbackWidget, CheckoutButton, etc.
│
├── lib/                          # Core business logic
│   ├── db/                       # Database (Drizzle ORM)
│   │   ├── index.ts              # DB connection singleton
│   │   ├── schema/               # 22 schema definition files
│   │   └── queries/              # Reusable query functions
│   ├── api/                      # API response helpers
│   ├── container/                # Container provisioning helpers
│   ├── diagnostics/              # System diagnostics
│   ├── email/                    # Email templates
│   ├── engagement/               # Engagement scheduler
│   ├── launch-engine/            # Content quality gate, X service
│   ├── maintenance/              # Health checking, remediation
│   ├── rate-limit/               # Redis-based rate limiting
│   ├── router/                   # Smart model router (14-dim scoring)
│   ├── tokens/                   # Token tracking, weekly reset
│   └── [top-level]               # admin, analytics, constants, container-client, provisioner, ssh, stripe, teams, etc.
│
├── middleware.ts                  # Clerk auth middleware (route protection)
└── types/index.ts                # Shared TypeScript interfaces (569 lines)
```

### Non-Source Directories

| Directory | Purpose | Risk Level |
|-----------|---------|------------|
| `docker/` | Container images, templates, team configs, skills | Medium — changes affect all new user containers |
| `drizzle/` | Migration snapshots | Low — auto-generated |
| `scripts/` | Maintenance, testing, X/Twitter automation | Low |
| `engagement-dashboard/` | Separate Next.js app for engagement queue | Low — isolated |
| `archive/` | Old code/reports | None |
| `docs/`, `specs/`, `launch/`, `intel/` | Documentation only | None |

---

## 4. Database Schema

**22 tables** defined in `src/lib/db/schema/`:

### Core Tables (touch these carefully)
| Table | File | Purpose |
|-------|------|---------|
| `users` | `users.ts` | Central user table (Clerk-synced). Has container info (port, status, gateway token), subscription tier, Stripe IDs |
| `bots` | `bots.ts` | Bot instances per user |
| `conversations` | `conversations.ts` | **DEPRECATED** for chat. Kept for metadata only |
| `messages` | `messages.ts` | Chat messages (linked to conversations) |
| `tasks` | `tasks.ts` | Kanban task board |
| `weekly_usage` | `weekly-usage.ts` | Token tracking per week |
| `usage_records` | `usage.ts` | Detailed usage for billing |

### Feature Tables
| Table | File | Purpose |
|-------|------|---------|
| `integrations` | `integrations.ts` | OAuth connections (Gmail, Slack, WhatsApp, etc.) |
| `model_configs` | `model-configs.ts` | User's selected AI models |
| `bot_settings` | `bot-settings.ts` | Bot personality customization |
| `custom_agents` | `custom-agents.ts` | User-created team members |
| `agent_events` | `agent-events.ts` | Activity log from containers |
| `cron_job_status` | `cron-job-status.ts` | Cron health per container |
| `feedback` | `feedback.ts` | User feedback/feature requests |
| `engagement_messages` | `engagement-messages.ts` | Day 1-7 onboarding sequence |
| `admin_settings` | `admin-settings.ts` | Global admin config |
| `orchestrator_alerts` | `orchestrator.ts` | Container monitoring alerts |

### Vertical Tables (MomBrain)
| Table | File | Purpose |
|-------|------|---------|
| `family_members` | `mombrain.ts` | Children profiles |
| `grocery_items` | `mombrain.ts` | Grocery lists |
| `calendar_events` | `mombrain.ts` | Family calendar |
| `meal_plans` | `mombrain.ts` | Meal planning |
| `nudges` | `mombrain.ts` | Nudge system |
| `mom_preferences` | `mombrain.ts` | User preferences |

### Launch Engine Tables
| Table | File | Purpose |
|-------|------|---------|
| `content_pieces` | `launch-engine.ts` | Marketing content items |
| `campaigns` | `launch-engine.ts` | Marketing campaigns |

### Migration State
- **5 migrations** tracked in `drizzle/meta/_journal.json`
- Migrations managed via `drizzle-kit generate` / `drizzle-kit push`
- ⚠️ Gap in migration numbering: 0000-0003, then jumps to 0011

---

## 5. Environment Variables

### Required for Production
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe billing |
| `STRIPE_PRICE_ID` | Subscription price |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth client-side |
| `CLERK_SECRET_KEY` | Clerk auth server-side |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook verification |
| `FREE_TIER_TOKEN` | Gateway token for shared free-tier container |
| `FREE_TIER_PORT` | Port for free-tier container (default: 4000) |

### Optional / Feature-Specific
| Variable | Purpose | Default |
|----------|---------|---------|
| `REDIS_URL` | Rate limiting (stubbed if missing) | None |
| `CONTAINER_HOST` | Docker host | `localhost` |
| `CONTAINER_IMAGE` | Docker image for user containers | `clawer-openclaw:v2026.2.19` |
| `CONTAINER_PREFIX` | Container name prefix | `clawer_user_` |
| `PORT_RANGE_START` | First port for containers | `4010` |
| `PORT_RANGE_END` | Last port for containers | `5000` |
| `USERDATA_PATH` | Container data directory | `/opt/clawer/userdata` |
| `DOCKER_NETWORK` | Docker network name | None |
| `PRODUCTION_SERVER` | SSH target for container ops | `root@YOUR_DOCKER_HOST` |
| `ADMIN_EMAILS` | Comma-separated admin emails | `vavier@gmail.com,vavize@gmail.com` |
| `MOONSHOT_API_KEY` | Kimi/Moonshot AI API key | |
| `DISCORD_ENCRYPTION_KEY` | Discord bot encryption | |
| `WHATSAPP_ENCRYPTION_KEY` | WhatsApp encryption | |
| `MAINTENANCE_SECRET` | Maintenance endpoint auth | |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Analytics | |
| `NEXT_PUBLIC_UMAMI_URL` | Analytics URL | |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | |
| `STRIPE_ANNUAL_PRICE_ID` | Annual plan price | Falls back to monthly |

### ⚠️ SECURITY NOTE
The `.env.local` file contains **live production secrets** (Stripe live keys, Clerk live keys, database password, encryption keys). While `.gitignore` correctly excludes `.env.local`, any agent with file access can read these. Consider:
- Moving secrets to a vault (e.g., Vercel env vars only)
- Using `.env.example` with placeholder values for development

---

## 6. Module Boundaries & Coupling

### High Coupling Areas

#### 1. `container-client.ts` → Everything
**35+ files** import from `container-client.ts`. This is the central hub for all container communication. Any change to its API signature ripples through:
- All messaging integration routes (WhatsApp, Telegram, Slack)
- Chat route
- Dashboard APIs (sync, health, crons, hooks, memory, agents)
- Task execution
- Onboarding
- Maintenance routes
- MomBrain routes

#### 2. `db/index.ts` + `db/schema/` → 99 API routes
Nearly every API route imports the database directly. The `db` singleton and schema types are the most coupled module in the codebase.

#### 3. `provisioner.ts` ↔ `ssh.ts` ↔ `container/provision-team.ts`
Tight triangle:
- `provisioner.ts` calls `sshExec` from `ssh.ts` to manage Docker containers
- `provisioner.ts` calls `provisionFullTeam` from `container/provision-team.ts`
- Both depend on `db` for user records

#### 4. `teams.ts` → Chat route + Dashboard
Hardcoded team configurations (470 lines) are imported by the chat route and team-related dashboard APIs. Changes here affect agent routing and display.

#### 5. `middleware.ts` → All protected routes
The Clerk middleware route matcher list must be kept in sync with actual route paths. Adding a new protected API route requires updating middleware.

### Loose Coupling (Good)
- Blog pages are completely independent static components
- Landing page components are self-contained
- The `engagement-dashboard/` is a separate Next.js app
- `launch-engine/` is relatively isolated (own types, own quality gate)
- `diagnostics/` module is well-encapsulated with its own types

---

## 7. God Files (Files That Do Too Much)

### 🔴 Critical — Split These

| File | Lines | Problem |
|------|-------|---------|
| `src/lib/container-client.ts` | 720 | Does HTTP requests, CLI wrappers (docker exec), gateway auth, cron management, hook management, agent listing, memory search — should be 4-5 modules |
| `src/app/api/chat/route.ts` | ~250+ | The critical path. Handles auth, rate limiting, user lookup, agent routing, free tier logic, model selection, container communication, task creation — needs decomposition |
| `src/lib/teams.ts` | 470 | Hardcoded configs for 8+ team templates with all member data — should be JSON/YAML files |
| `src/types/index.ts` | 569 | Single file for ALL TypeScript types — should be split by domain |
| `src/lib/design-system.ts` | 590 | Inline design tokens — could be Tailwind config or CSS variables |

### 🟡 Watch List

| File | Lines | Problem |
|------|-------|---------|
| `src/components/dashboard/TaskBoard.tsx` | 1,030 | Large component with inline logic |
| `src/app/dashboard/agent/page.tsx` | 1,000 | Agent page with heavy inline UI + data fetching |
| `src/app/dashboard/settings/page.tsx` | 957 | Settings page with lots of inline forms |
| `src/app/chat/[botId]/page.tsx` | 852 | Chat page with message handling |
| `src/components/OnboardingFlow.tsx` | 821 | Multi-step wizard with lots of state |
| `src/lib/launch-engine/quality-gate.ts` | 701 | Content scoring rules inline |
| `src/components/dashboard/DashboardWorkspace.tsx` | 645 | Layout wrapper with routing logic |
| `src/components/dashboard/CreateAgentDialog.tsx` | 537 | Complex dialog with form logic |

---

## 8. Dependency Chains

### Critical Chains (Changing X Breaks Y and Z)

```
users schema → EVERYTHING
  ├── Every API route that does auth lookup
  ├── provisioner (container allocation)
  ├── container-client (auth)
  ├── all dashboard routes
  └── billing (Stripe)

container-client.ts → 35+ API routes
  ├── chat/route.ts (core chat)
  ├── dashboard/sync (data sync)
  ├── container/telegram/* (Telegram)
  ├── container/slack/* (Slack)  
  ├── container/whatsapp/* (WhatsApp)
  ├── tasks/* (task execution)
  └── mombrain/* (MomBrain features)

provisioner.ts → subscription flow
  ├── webhooks/stripe (on subscription)
  ├── container/whatsapp/qr (auto-provision)
  ├── container/restart
  └── admin/container/*

api-errors.ts → all API routes
  └── Change error shape = update all clients

middleware.ts → route protection
  └── Missing route = unprotected endpoint
  └── Wrong pattern = auth errors
```

### Shared State / Singletons

| Singleton | File | Scope |
|-----------|------|-------|
| `db` | `src/lib/db/index.ts` | PostgreSQL connection pool (10 connections) |
| `redis` | `src/lib/rate-limit/index.ts` | Redis client (lazy, null if no REDIS_URL) |
| `stripe` | `src/lib/stripe.ts` | Stripe SDK instance |

---

## 9. Risk Assessment

### 🔴 DANGER LEVEL: CRITICAL (Change = High Breakage Risk)

| File | Why |
|------|-----|
| `src/lib/db/schema/users.ts` | Central to all auth, billing, containers. Adding/removing columns affects 99+ routes |
| `src/lib/container-client.ts` | 35+ dependents. Any API change cascades everywhere |
| `src/lib/provisioner.ts` | Controls container lifecycle. Bug = users can't get containers |
| `src/app/api/chat/route.ts` | THE core product feature. Bug = chat broken for all users |
| `src/middleware.ts` | Route protection. Bug = unprotected endpoints or broken auth |
| `src/lib/db/index.ts` | DB singleton. Bug = nothing works |
| `src/app/api/webhooks/stripe/route.ts` | Handles subscription events. Bug = billing broken |
| `src/app/api/webhooks/clerk/route.ts` | User sync. Bug = new users can't be created |
| `src/lib/constants.ts` | Free tier limits. Wrong values = wrong billing enforcement |

### 🟡 DANGER LEVEL: HIGH (Change = Moderate Breakage Risk)

| File | Why |
|------|-----|
| `src/lib/ssh.ts` | All container ops go through SSH. Change timeout/host = broken provisioning |
| `src/lib/api-errors.ts` | Error response shape used by all API routes |
| `src/lib/teams.ts` | Team configs affect chat routing and dashboard |
| `src/lib/rate-limit/index.ts` | Rate limiting. Bug = DoS or blocked legitimate users |
| `src/lib/stripe.ts` | Stripe config. Bug = broken checkout |
| `src/lib/admin.ts` | Admin auth. Bug = unauthorized access or locked-out admins |
| `src/types/index.ts` | Shared types. Type change = TypeScript errors across codebase |
| `src/app/api/container/status/route.ts` | Container health. Bug = wrong container status displayed |
| `src/lib/container-auth.ts` | Container-to-web auth. Bug = containers can't callback |

### 🟢 DANGER LEVEL: LOW (Safe to Edit)

| Category | Files |
|----------|-------|
| Blog pages | All 19 `src/app/blog/*/page.tsx` — static, no shared state |
| Landing page | `src/components/landing/*` — isolated UI |
| Docs/specs/launch | All `.md` files outside `src/` |
| UI primitives | `src/components/ui/*` (if changes are additive) |
| Analytics | `src/lib/analytics.ts` — fire-and-forget events |
| Diagnostics | `src/lib/diagnostics/*` — read-only analysis |

---

## 10. Test Coverage Analysis

### Test Summary
- **43 test files** covering various areas
- **3 failing tests** in `quality-gate.test.ts` (scoring threshold issues)
- **3 failing tests** in `agent-files.test.ts`
- **1 failing test** in `tokens.test.ts`
- **1 failing test** in `provisioner.test.ts` (60s timeout — integration-ish)
- CI runs: TypeScript type-check + Vitest unit tests

### ✅ Files WITH Test Coverage

| Area | Test File | Tests |
|------|-----------|-------|
| Chat API | `__tests__/chat.test.ts` | 573 lines |
| Messages API | `__tests__/messages.test.ts` | 581 lines |
| Tasks API | `__tests__/tasks.test.ts` | 563 lines |
| Provisioner | `lib/__tests__/provisioner.test.ts` | 1,043 lines (most thorough) |
| Files API | `__tests__/files.test.ts` | ✅ |
| Onboarding | `__tests__/onboarding.test.ts` + `onboarding-context.test.ts` + `onboarding-first-deliverable.test.ts` | ✅ |
| Stripe Webhook | `__tests__/stripe-webhook.test.ts` | ✅ |
| Clerk Webhook | `__tests__/clerk-webhook.test.ts` | ✅ |
| Container Status | `__tests__/container-status.test.ts` | ✅ |
| Conversations | `__tests__/conversations.test.ts` | ✅ |
| Feedback | `__tests__/feedback.test.ts` | ✅ |
| Health | `__tests__/health.test.ts` | ✅ |
| Teams | `__tests__/teams.test.ts` | ✅ |
| Agent Chat/Thread | `__tests__/agent-chat.test.ts`, `agent-thread.test.ts` | ✅ |
| Crons | `__tests__/crons.test.ts` | ✅ |
| Container Client | `lib/__tests__/container-client.test.ts` | ✅ |
| Rate Limiter | `lib/__tests__/rate-limit.test.ts` | ✅ |
| API Errors | `lib/__tests__/api-errors.test.ts` | ✅ |
| Router | `lib/router/__tests__/router.test.ts` | ✅ |
| Tokens | `lib/__tests__/tokens.test.ts`, `tokens/__tests__/weekly-reset.test.ts` | ✅ |
| Quality Gate | `launch-engine/__tests__/quality-gate.test.ts` | ✅ (3 failing) |
| Engagement Scheduler | `engagement/__tests__/scheduler.test.ts` | 514 lines |
| Skills API | `container/skills/__tests__/skills-api.test.ts` | ✅ |
| Dashboard APIs | Various `__tests__/` | ✅ |
| UI Components | StatusBadge, GettingStartedCard, SkillsLibrary, SecuritySetup | ✅ |

### ❌ Files WITHOUT Test Coverage (Danger Zone)

| File | Lines | Risk | Priority |
|------|-------|------|----------|
| `src/lib/ssh.ts` | 73 | 🔴 Critical — all container ops | P0 |
| `src/lib/admin.ts` | ~40 | 🟡 High — admin auth | P1 |
| `src/lib/container-auth.ts` | ~50 | 🟡 High — container auth | P1 |
| `src/lib/container/provision-team.ts` | ~100 | 🔴 Critical — team provisioning | P0 |
| `src/lib/container/provision-custom-agent.ts` | ~120 | 🟡 High — custom agent creation | P1 |
| `src/lib/container/generate-soul.ts` | ~80 | 🟢 Low | P2 |
| `src/lib/teams.ts` | 470 | 🟡 High — team routing | P1 |
| `src/lib/stripe.ts` | ~80 | 🟡 High — billing | P1 |
| `src/lib/cron/nudge-sender.ts` | ~60 | 🟢 Low | P3 |
| `src/lib/email/*` | ~100 | 🟢 Low | P3 |
| `src/lib/maintenance/*` | ~300 | 🟢 Low | P3 |
| `src/lib/design-system.ts` | 590 | 🟢 Low — just config | P3 |
| `src/lib/analytics.ts` | ~80 | 🟢 Low | P3 |
| `src/middleware.ts` | 58 | 🔴 Critical — auth boundary | P0 |
| All `mombrain/` API routes | ~400+ | 🟡 Medium — new vertical | P2 |
| All `launch-engine/` API routes | ~500+ | 🟢 Low — marketing tool | P3 |
| Most dashboard page components | ~5,600 | 🟡 Medium | P2 |

---

## 11. Hardcoded Values & Magic Strings

### Hardcoded Server/Config

| Location | Value | Risk |
|----------|-------|------|
| `src/lib/ssh.ts` | `root@YOUR_DOCKER_HOST` (fallback) | 🟡 Should be env-only |
| `src/lib/admin.ts` | `vavier@gmail.com,vavize@gmail.com` (fallback) | 🟡 Should be env-only |
| `src/lib/provisioner.ts` | `clawer-openclaw:v2026.2.19` (fallback image) | 🟡 Pinned version |
| `src/lib/stripe.ts` | `price_1SxtZMKtZGLqQJF6DYKV6Cup` (fallback price ID) | 🔴 Live Stripe price ID in code |
| `src/lib/stripe.ts` | `2026-01-28.clover` (API version) | 🟡 Pinned Stripe API version |
| `src/lib/constants.ts` | `FREE_MESSAGE_LIMIT = 100`, `FREE_DAILY_LIMIT = 25`, etc. | 🟢 OK — clearly defined |
| `src/lib/rate-limit/index.ts` | Redis retry config | 🟢 OK |

### Hardcoded Team Data
`src/lib/teams.ts` contains 470 lines of hardcoded team member configs, roles, descriptions, triggers, and quick prompts. This should be externalized to JSON/YAML files (matching the pattern already in `docker/openclaw-user/teams/`).

### Brand-Specific Strings
`src/lib/launch-engine/brand-config.ts` — hardcoded brand voice, banned phrases, preferred vocabulary. Currently marked with a comment acknowledging this.

### TODOs / Incomplete Work
- `launch-engine/content/generate/route.ts` — "TODO Phase 1: Dispatch async AI generation job here"
- `launch-engine/content/*/route.ts` — "TODO Phase 1: Log to content_decisions audit table"
- `webhooks/stripe/route.ts` — "TODO: Add sendPaymentFailedEmail template"
- `tokens/weekly-reset.ts` — "TODO: Calculate from daily logs if needed"
- `SkillsLibrary.tsx` — "TODO: Replace with actual API call"

---

## 12. AI-Friendly Recommendations

### Recommendation 1: Create CODEBASE-MAP.md ✅
See the generated `CODEBASE-MAP.md` at the project root. This is the <2000 token cheat sheet for AI agents.

### Recommendation 2: Split God Files

**`container-client.ts` → 5 files:**
```
src/lib/container/
├── client.ts           # Core HTTP client (containerRequest, getContainerApiUrl)
├── auth.ts             # Gateway token lookup (already exists as container-auth.ts, merge)
├── cli.ts              # CLI wrappers (listCrons, enableCron, disableCron, etc.)
├── agents.ts           # Agent listing, memory search
└── types.ts            # Container-related type definitions
```

**`types/index.ts` → domain files:**
```
src/types/
├── api.ts              # ApiResponse, ApiError, ApiMeta
├── chat.ts             # ChatInput, Message types
├── container.ts        # Container types
├── user.ts             # User, Subscription types
├── team.ts             # Team, Agent types
└── index.ts            # Re-exports everything
```

**`teams.ts` → JSON + loader:**
```
src/lib/teams/
├── configs/            # JSON files per team template
│   ├── lifeos.json
│   ├── ecommerce.json
│   ├── mom.json
│   └── ...
├── loader.ts           # getTeamConfig(), getAgentFromTeam()
├── types.ts            # TeamConfig, TeamMember interfaces
└── index.ts            # Re-exports
```

### Recommendation 3: Add Integration Tests

**Priority 1 — Critical Path Tests:**
1. `chat/route.ts` end-to-end: auth → rate limit → container routing → response
2. `webhooks/stripe/route.ts`: subscription.created → provision → container running
3. `webhooks/clerk/route.ts`: user.created → DB record
4. `middleware.ts`: protected routes return 401, public routes pass through

**Priority 2 — Container Lifecycle:**
5. Provisioning flow: allocate port → create container → update DB → provision team
6. Container restart/stop: SSH commands → DB status update
7. Integration connect/disconnect: Telegram, WhatsApp, Slack flows

**Priority 3 — Dashboard Data:**
8. Dashboard sync: container data → DB persistence
9. Usage tracking: message → token count → weekly aggregation

### Recommendation 4: Middleware Route Sync Check

Add a CI check that verifies all `route.ts` files under protected paths are included in `middleware.ts`'s `isProtectedRoute` matcher. Currently this is manual — a new API route could be accidentally unprotected.

### Recommendation 5: Decompose chat/route.ts

The core chat endpoint handles too many concerns. Extract:
```
src/app/api/chat/
├── route.ts            # Thin handler: validate → authorize → route → respond
├── _auth.ts            # Auth + rate limit logic
├── _agent-router.ts    # Agent selection + team config lookup
├── _free-tier.ts       # Free tier limit enforcement
└── _container-proxy.ts # Container communication
```

### Recommendation 6: Database Schema Validation

Add a migration test that:
1. Runs `drizzle-kit generate` and verifies no pending changes
2. Catches schema drift between code and DB

---

## 13. Recommended Test Plan

### Tier 1 — Write These First (Highest Risk, No Coverage)

| # | Test Target | File to Create | What to Test |
|---|------------|----------------|--------------|
| 1 | `middleware.ts` | `src/__tests__/middleware.test.ts` | Protected routes require auth, public routes pass through, webhook routes excluded |
| 2 | `ssh.ts` | `src/lib/__tests__/ssh.test.ts` | Timeout behavior, error handling, command sanitization |
| 3 | `provision-team.ts` | `src/lib/container/__tests__/provision-team.test.ts` | Full team provisioning, error recovery, container accessibility check |
| 4 | `container-auth.ts` | `src/lib/__tests__/container-auth.test.ts` | Token extraction, user lookup, invalid token handling |
| 5 | `admin.ts` | `src/lib/__tests__/admin.test.ts` | Admin email check, requireAdmin returns correct responses |

### Tier 2 — High Value, Moderate Risk

| # | Test Target | What to Test |
|---|------------|--------------|
| 6 | `teams.ts` | getTeamConfig returns correct team, getAgentFromTeam matching |
| 7 | `stripe.ts` | Checkout session creation, price ID resolution |
| 8 | `provision-custom-agent.ts` | Custom agent creation, agent registration |
| 9 | `mombrain/_helpers.ts` | Shared helper functions |
| 10 | Dashboard sync route | Data transformation from container to DB |

### Tier 3 — Regression Prevention

| # | Test Target | What to Test |
|---|------------|--------------|
| 11 | Fix 3 failing quality-gate tests | Scoring threshold adjustments |
| 12 | Fix 3 failing agent-files tests | File operation edge cases |
| 13 | Fix 1 failing tokens test | Token calculation edge case |
| 14 | Fix 1 failing provisioner test | 60s timeout issue (likely needs better mocking) |

---

## 14. Changelog Discipline

### Recommended Format

Create `CHANGELOG.md` at project root:

```markdown
# Changelog

## [Unreleased]

### Added
- New API route: `/api/foo/bar` — does X
- New component: `FooWidget` in `src/components/dashboard/`

### Changed
- Modified `container-client.ts` — added timeout parameter to containerRequest
- Updated `users` schema — added `newColumn` field

### Fixed
- Fixed rate limiter returning wrong reset time

### Database
- Migration 0012: Added `new_table` table
- Modified `users` table: added `new_column` (nullable, no breaking change)

### Breaking
- Changed `ApiResponse` type signature — update all callers
```

### Rules for AI Agents
1. **Every PR must update CHANGELOG.md** under `[Unreleased]`
2. **Schema changes MUST be flagged** in the `Database` section
3. **Breaking changes** get their own section
4. **Include file paths** so other agents can assess blast radius

---

## 15. Pre-Commit / CI Checks

### Current CI (GitHub Actions)
- ✅ TypeScript type-check (`tsc --noEmit`)
- ✅ Unit tests (`vitest run`)

### Recommended Additions

#### 1. Route Protection Audit (New)
```bash
# Check that all API routes under protected paths are in middleware
find src/app/api -name "route.ts" | grep -v webhooks | grep -v health | \
  while read f; do
    route=$(echo $f | sed 's|src/app||' | sed 's|/route.ts||')
    if ! grep -q "$route" src/middleware.ts; then
      echo "UNPROTECTED: $route"
    fi
  done
```

#### 2. Schema Drift Check (New)
```bash
npx drizzle-kit generate --dry-run 2>&1 | grep -c "No schema changes"
# Should output 1 (no pending changes)
```

#### 3. Build Check (Add to CI)
```bash
npm run build
# Catches runtime import errors that tsc misses
```

#### 4. Test Coverage Threshold (Recommended)
```bash
npx vitest run --coverage --coverage.thresholds.lines=50
# Start low, increase as coverage improves
```

#### 5. Secrets Scanner (Recommended)
```bash
# Prevent accidental secret commits
grep -rn "sk_live_\|sk_test_\|whsec_\|pk_live_" src/ --include="*.ts" --include="*.tsx"
# Should return 0 results
```

---

## Appendix: File Count by Directory

| Directory | Files | Lines |
|-----------|-------|-------|
| `src/app/api/` | 157 | 21,890 |
| `src/app/blog/` | 20 | 14,087 |
| `src/app/dashboard/` | 30 | 5,696 |
| `src/app/admin/` | 14 | 2,146 |
| `src/components/` | 66 | 13,824 |
| `src/lib/` | 94 | 20,065 |
| `src/types/` | 1 | 569 |
| **Total src/** | **~382** | **~78,277** |
