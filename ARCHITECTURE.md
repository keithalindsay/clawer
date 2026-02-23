# Clawer.ai Architecture Guide

> **For Agents & Developers:** This document maps features to files for discovery before modifying code.

**Last Updated:** 2026-02-23

---

## Quick Reference

| What You Want | Where To Look |
|---------------|---------------|
| Chat with agents | `src/app/api/chat/route.ts`, `src/components/dashboard/DashboardWorkspace.tsx` |
| Create/manage tasks | `src/app/api/tasks/`, `src/components/dashboard/TaskBoard.tsx` |
| Team configurations | `src/lib/teams.ts` |
| Container provisioning | `src/lib/provisioner.ts`, `src/lib/container/provision-team.ts` |
| Container communication | `src/lib/container-client.ts` |
| Authentication | `src/middleware.ts`, `src/lib/admin.ts` |
| Billing | `src/lib/stripe.ts`, `src/app/api/webhooks/stripe/route.ts` |
| Database schema | `src/lib/db/schema/` |

---

## Directory Structure

```
src/
├── app/                          # Next.js App Router (pages + API)
│   ├── api/                      # API Routes
│   │   ├── admin/               # Admin management APIs
│   │   ├── chat/                # Chat endpoints
│   │   │   ├── route.ts         # POST: Send message to agent
│   │   │   ├── sessions/        # GET: List chat sessions
│   │   │   └── history/         # GET: Load chat history
│   │   ├── container/           # Container management
│   │   │   ├── status/          # GET: Container health
│   │   │   ├── crons/           # Cron job management
│   │   │   ├── skills/          # Skills library
│   │   │   └── files/           # File operations
│   │   ├── dashboard/           # Dashboard data APIs
│   │   │   ├── crons/           # Cron status & history
│   │   │   ├── memory/          # Memory search
│   │   │   ├── activity/        # Activity feed
│   │   │   └── stats/           # Usage statistics
│   │   ├── files/               # File browser API
│   │   ├── stripe/              # Billing
│   │   │   ├── checkout/        # Create checkout session
│   │   │   └── portal/          # Customer portal
│   │   ├── tasks/               # Task management
│   │   │   ├── route.ts         # CRUD operations
│   │   │   ├── execute/         # Execute task via agent
│   │   │   └── [id]/            # Single task operations
│   │   ├── team/                # Team/agent management
│   │   │   ├── provision/       # Provision team
│   │   │   └── agents/          # Custom agent CRUD
│   │   ├── onboarding/          # Onboarding flow
│   │   ├── webhooks/            # External webhooks
│   │   │   ├── clerk/           # Auth webhooks
│   │   │   └── stripe/          # Payment webhooks
│   │   └── user/                # User profile
│   ├── admin/                   # Admin pages
│   ├── dashboard/               # Dashboard pages
│   │   ├── page.tsx             # Home (command center)
│   │   ├── chat/                # Chat interface
│   │   ├── tasks/               # Task board
│   │   ├── files/               # File browser
│   │   ├── crons/               # Cron manager
│   │   └── settings/            # User settings
│   ├── onboarding/              # Onboarding pages
│   └── (auth)/                  # Auth pages (sign-in, sign-up)
│
├── components/                   # React Components
│   ├── dashboard/               # Dashboard UI
│   │   ├── DashboardWorkspace.tsx   # Main chat interface
│   │   ├── DashboardHome.tsx        # Command center
│   │   ├── TaskBoard.tsx            # Kanban board
│   │   ├── AgentSelector.tsx        # Agent picker
│   │   ├── ActivityFeed.tsx         # Event feed
│   │   ├── CronJobsPanel.tsx        # Cron management
│   │   ├── MemorySearch.tsx         # Memory search UI
│   │   └── ...                      # Other dashboard components
│   ├── chat/                    # Chat components
│   ├── files/                   # File browser components
│   ├── onboarding/              # Onboarding steps
│   ├── landing/                 # Landing page
│   └── ui/                      # Shared UI components
│
├── lib/                         # Shared Libraries
│   ├── db/                      # Database
│   │   ├── index.ts             # Drizzle client
│   │   └── schema/              # Table definitions
│   ├── container/               # Container utilities
│   │   ├── provision-team.ts    # Multi-agent provisioning
│   │   └── provision-custom-agent.ts
│   ├── email/                   # Email sending
│   │   ├── index.ts             # Email functions
│   │   └── templates.ts         # Email templates
│   ├── engagement/              # User engagement
│   ├── rate-limit/              # Rate limiting
│   ├── router/                  # Smart routing
│   ├── tokens/                  # Token management
│   ├── admin.ts                 # Admin authorization
│   ├── alerts.ts                # Alert system
│   ├── analytics.ts             # Event tracking
│   ├── agent-matcher.ts         # Auto-assign tasks to agents
│   ├── constants.ts             # Global constants
│   ├── container-client.ts      # Container API client
│   ├── files.ts                 # File operations
│   ├── provisioner.ts           # Container provisioning
│   ├── ssh.ts                   # SSH execution
│   ├── stripe.ts                # Stripe configuration
│   └── teams.ts                 # Team configurations
│
├── middleware.ts                # Auth middleware
└── styles/                      # Global styles
```

---

## Feature → Files Map

### Chat

**Purpose:** Send messages to AI agents, receive responses

| Component | File |
|-----------|------|
| Send message | `src/app/api/chat/route.ts` |
| Load history | `src/app/api/chat/history/route.ts` |
| List sessions | `src/app/api/chat/sessions/route.ts` |
| Main UI | `src/components/dashboard/DashboardWorkspace.tsx` |
| Agent picker | `src/components/dashboard/AgentSelector.tsx` |

**Data Flow:**
```
UI (DashboardWorkspace) 
  → POST /api/chat { message, agentId }
  → containerApi.chat() [container-client.ts]
  → HTTP to container port 8081
  → OpenClaw Gateway
  → Response
```

**Session Keys:** `agent:{agentId}:main` (template) or `custom-agent:{agentId}:main` (custom)

---

### Tasks

**Purpose:** Create, manage, and execute tasks via AI agents

| Component | File |
|-----------|------|
| CRUD operations | `src/app/api/tasks/route.ts` |
| Execute task | `src/app/api/tasks/execute/route.ts` |
| Single task | `src/app/api/tasks/[id]/route.ts` |
| Kanban UI | `src/components/dashboard/TaskBoard.tsx` |
| Agent matcher | `src/lib/agent-matcher.ts` |

**Database:** `tasks` table (`src/lib/db/schema/tasks.ts`)

**Statuses:** backlog → queued → running → done/failed

---

### AI Teams

**Purpose:** Multi-agent teams with specialized roles

| Component | File |
|-----------|------|
| Team configs | `src/lib/teams.ts` |
| Provision team | `src/lib/container/provision-team.ts` |
| Provision API | `src/app/api/team/provision/route.ts` |
| Custom agents | `src/app/api/team/agents/route.ts` |
| Agent dialog | `src/components/dashboard/CreateAgentDialog.tsx` |

**Team Templates:**
- `lifeos` - Personal productivity
- `solopreneur` - Business operations
- `ecommerce` - E-commerce
- `content-creator` - Content creation
- `mom` - Family management
- `fitness` - Health & fitness
- `finance` - Financial management

**Agent Workspace:** `/home/user/workspace-{agentName}` in container

---

### Container Orchestration

**Purpose:** Provision and manage Docker containers

| Component | File |
|-----------|------|
| Main provisioner | `src/lib/provisioner.ts` |
| SSH execution | `src/lib/ssh.ts` |
| Container client | `src/lib/container-client.ts` |
| Status API | `src/app/api/container/status/route.ts` |

**Container Details:**
- Image: `clawer-openclaw:v2026.2.19` (env: `CONTAINER_IMAGE`)
- Port range: 4010-5000 (env: `PORT_RANGE_START`, `PORT_RANGE_END`)
- Network: `clawer_shared`
- User data: `/opt/clawer/userdata/{container}/`

**Provisioning Flow:**
1. `provisionContainer()` - Create container via SSH
2. `provisionFullTeam()` - Create agent workspaces
3. Register agents with OpenClaw
4. Write SOUL.md, AGENTS.md per agent

---

### Authentication

**Purpose:** User auth and admin access control

| Component | File |
|-----------|------|
| Middleware | `src/middleware.ts` |
| Webhook handler | `src/app/api/webhooks/clerk/route.ts` |
| Admin check | `src/lib/admin.ts` |

**Protected Routes:** `/dashboard/*`, `/api/*` (except webhooks)

**Admin Access:** Email allowlist via `ADMIN_EMAILS` env var

---

### Billing

**Purpose:** Stripe subscription management

| Component | File |
|-----------|------|
| Stripe config | `src/lib/stripe.ts` |
| Checkout | `src/app/api/stripe/checkout/route.ts` |
| Portal | `src/app/api/stripe/portal/route.ts` |
| Webhooks | `src/app/api/webhooks/stripe/route.ts` |
| UI button | `src/components/CheckoutButton.tsx` |

**Webhook Events:**
- `checkout.session.completed` → Provision container
- `customer.subscription.deleted` → Stop container
- `invoice.payment_failed` → Alert admin

---

### Cron Jobs

**Purpose:** Visual cron management for OpenClaw schedules

| Component | File |
|-----------|------|
| Dashboard API | `src/app/api/dashboard/crons/route.ts` |
| CLI API | `src/app/api/dashboard/crons/cli/route.ts` |
| UI panel | `src/components/dashboard/CronJobsPanel.tsx` |

**Database:** `cron_job_status` table

---

### Files

**Purpose:** Browse and manage files in agent workspaces

| Component | File |
|-----------|------|
| API | `src/app/api/files/route.ts` |
| Library | `src/lib/files.ts` |
| Components | `src/components/files/` |

---

### Memory Search

**Purpose:** Semantic search across agent memory

| Component | File |
|-----------|------|
| Search API | `src/app/api/dashboard/memory/search/route.ts` |
| UI | `src/components/dashboard/MemorySearch.tsx` |

---

### Onboarding

**Purpose:** New user setup flow

| Component | File |
|-----------|------|
| Page | `src/app/onboarding/page.tsx` |
| Flow component | `src/components/OnboardingFlow.tsx` |
| API | `src/app/api/onboarding/route.ts` |
| Context API | `src/app/api/onboarding/context/route.ts` |
| First deliverable | `src/app/api/onboarding/first-deliverable/route.ts` |
| Security setup | `src/components/onboarding/SecuritySetup.tsx` |

---

## API Routes Reference

### Chat

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat` | Send message to agent |
| GET | `/api/chat/sessions` | List user's chat sessions |
| GET | `/api/chat/history` | Load message history |

### Tasks

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tasks` | List user's tasks |
| POST | `/api/tasks` | Create new task |
| POST | `/api/tasks/execute` | Execute task via agent |
| PATCH | `/api/tasks/[id]` | Update task |
| DELETE | `/api/tasks/[id]` | Delete task |

### Team

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/team/provision` | Check provision status |
| POST | `/api/team/provision` | Provision team |
| GET | `/api/teams` | Get team config |
| GET | `/api/team/agents` | List custom agents |
| POST | `/api/team/agents` | Create custom agent |
| DELETE | `/api/team/agents` | Delete custom agent |

### Container

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/container/status` | Container health |
| GET | `/api/container/crons` | List crons |
| POST | `/api/container/crons` | Manage crons |
| GET | `/api/container/files` | List files |
| GET | `/api/container/skills` | Skills library |

### Dashboard

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/dashboard/crons` | Cron status + history |
| POST | `/api/dashboard/memory/search` | Memory search |
| GET | `/api/dashboard/activity` | Activity feed |
| GET | `/api/dashboard/stats` | Usage stats |

### Billing

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/stripe/checkout` | Create checkout session |
| POST | `/api/stripe/portal` | Customer portal URL |

### Webhooks

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/webhooks/clerk` | Clerk auth events |
| POST | `/api/webhooks/stripe` | Stripe payment events |

---

## Database Tables

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id (Clerk), email, tier, containerId, containerPort, gatewayToken, teamTemplate |
| `tasks` | Task management | userId, title, status, priority, assignedTo, result |
| `custom_agents` | User-created agents | userId, agentId, name, role, personality, triggers |
| `bot_settings` | Bot customization | userId, botName, botAvatar, personality |

### Event Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `agent_events` | Activity feed | userId, eventType, agentName, summary |
| `cron_job_status` | Cron tracking | userId, jobName, schedule, lastRunAt, status |
| `feedback` | User feedback | userId, rating, feedback, page |

### Deprecated (Keep for Analytics)

| Table | Purpose | Notes |
|-------|---------|-------|
| `conversations` | Chat threads | Chat now stored in OpenClaw sessions |
| `messages` | Chat messages | Same as above |

---

## Container Communication

### Container Client (`src/lib/container-client.ts`)

```typescript
// Key functions
containerApi.chat(port, message, agentId)     // Send chat message
containerApi.getSessions(port)                 // List sessions
containerApi.listCrons(port)                   // List cron jobs
containerApi.listFiles(port, path)            // List directory
containerApi.readFile(port, path)             // Read file
containerApi.writeFile(port, path, content)   // Write file
containerApi.searchMemory(userId, query)      // Search memory
```

### Container Ports

Each user container exposes:
- Port 8081: API server (JSON-RPC style)
- Accessed via: `http://localhost:{containerPort}` through SSH tunnel or nginx proxy

---

## Environment Variables

### Required

```bash
DATABASE_URL=postgresql://...        # Postgres connection
CLERK_SECRET_KEY=sk_...              # Clerk auth
STRIPE_SECRET_KEY=sk_...             # Stripe billing
PRODUCTION_SERVER=root@...           # SSH target
FREE_TIER_PORT=4000                  # Shared container port
FREE_TIER_TOKEN=...                  # Shared container auth
```

### Optional

```bash
REDIS_URL=redis://...                # Rate limiting (else in-memory)
RESEND_API_KEY=re_...                # Email sending (else console.log)
ADMIN_EMAILS=email@...               # Admin allowlist
```

See `.env.example` for full list.

---

## Common Tasks

### Add New Team Template

1. Add config to `src/lib/teams.ts`:
   ```typescript
   export const TEAM_CONFIGS: Record<string, TeamConfig> = {
     'my-template': {
       name: 'My Team',
       description: '...',
       defaultMember: 'agent-id',
       members: [...]
     }
   }
   ```

2. Add agent name mappings in `src/lib/container/provision-team.ts`:
   ```typescript
   const AGENT_NAME_MAP = {
     'my-agent-id': 'shortname',
   }
   ```

3. Optionally add welcome prompts in `DashboardWorkspace.tsx`

### Add New API Route

1. Create file: `src/app/api/my-route/route.ts`
2. Use pattern:
   ```typescript
   import { auth } from '@clerk/nextjs/server';
   import { NextResponse } from 'next/server';
   
   export async function GET() {
     const { userId } = await auth();
     if (!userId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     // ... your logic
     return NextResponse.json({ data });
   }
   ```

### Modify Container Image

1. Update image in `docker/openclaw-user/`
2. Build: `docker build -t clawer-openclaw:vYYYY.M.D .`
3. Push to server
4. Update `CONTAINER_IMAGE` env var or `src/lib/provisioner.ts`

---

## Testing

**Run tests:** `npm test`

**Test files:** `src/**/__tests__/*.test.ts`

**Key test areas:**
- API routes: `src/app/api/__tests__/`
- Libraries: `src/lib/__tests__/`
- Components: `src/components/**/__tests__/`

---

*For detailed feature audit, see `~/clawd/specs/FEATURE-AUDIT-2026-02-23.md`*
