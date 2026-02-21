# Command Center Dashboard — Product Spec

**Product:** Clawer.ai  
**Feature:** Command Center — Dashboard Upgrade  
**Status:** Spec  
**Author:** Lex  
**Date:** 2026-02-21  
**Replaces:** AI-TEAM-DASHBOARD-SPEC.md (partial), current DashboardHome.tsx

---

## The One-Line Goal

> Users should open the dashboard and **feel** their AI team worked overnight — not just see a list of agents.

The current dashboard is a glorified quick-start menu. A real command center shows you what happened, who did it, and what needs your attention. That's the upgrade.

---

## What We're NOT Building

Before the spec, cut list. These are traps:

- ❌ **Real-time WebSocket agent tracking** — Over-engineered for MVP. Polling at 30s is fine.
- ❌ **Calendar view for tasks** — Phase 3 stretch. Most users never use calendar in task tools anyway.
- ❌ **Vanity metrics** — "Total messages sent: 4,231" means nothing. Cut it.
- ❌ **Agent personality chat feed** — Cute but fake. Don't show made-up "agent banter."
- ❌ **Complex pipeline views** — Kanban + list is enough. Multi-step pipeline view is for enterprise.
- ❌ **Dark mode** — Not in brand guide. Not planned. Skip.
- ❌ **Push notifications** — Phase 3. Build the data layer first.

---

## 1. Information Architecture

### Current Navigation
```
/dashboard          → DashboardHome (overview + quick prompts)
/dashboard/chat     → Chat with agents
/dashboard/tasks    → Kanban board
/dashboard/files    → File browser
/dashboard/agent    → Agent file editor
/dashboard/memory   → Memory viewer
/dashboard/settings → Settings
/dashboard/telegram → Telegram setup
/dashboard/whatsapp → WhatsApp setup (implied)
/dashboard/slack    → Slack setup
```

### New Navigation (Phase 1 changes in bold)

```
/dashboard              → Command Center Home ← REDESIGNED
/dashboard/chat         → Chat (unchanged)
/dashboard/tasks        → Task Board + list view ← ENHANCED  
/dashboard/files        → File browser (unchanged)
/dashboard/agent        → Agent file editor (unchanged)
/dashboard/outputs      → Agent Outputs ← NEW
/dashboard/health       → System Health ← NEW
/dashboard/memory       → Memory viewer (unchanged)
/dashboard/settings     → Settings (unchanged)
```

### Navigation Bar Changes

Current nav shows 7 items inline. Too many. Restructure:

**Primary nav (always visible):**
```
🦞 Clawer.ai  |  Dashboard  Chat  Tasks  Files  |  ⚙ Settings  [avatar]
```

**Secondary nav (in sidebar on desktop, bottom sheet on mobile):**
```
Agent Editor  |  Outputs  |  Health  |  Memory  |  Integrations
```

This cleans up the top bar and groups by frequency of use.

On **mobile**: Bottom tab bar with 4 tabs (Dashboard, Chat, Tasks, More).

---

## 2. Dashboard Home Redesign (`/dashboard`)

### Layout (Desktop — 1152px max-width)

```
┌────────────────────────────────────────────────────────┐
│  HEADER (logo, nav, user menu)                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [System Health Pill]  🟢 All systems normal    [14:32]│
│                                                        │
│  Good afternoon, Keith 👋                             │
│  Your team completed 3 tasks today.                   │
│                                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ 🔥 3         │ │ 📄 2         │ │ ⚡ 4          │  │
│  │ Tasks done   │ │ Files saved  │ │ Crons ran    │  │
│  │ today        │ │ today        │ │ today        │  │
│  └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                        │
│  ┌──────────────────────────┐ ┌─────────────────────┐ │
│  │  ACTIVITY FEED           │ │  TEAM STATUS        │ │
│  │  (last 24h)              │ │                     │ │
│  │                          │ │  📋 Max     ● Active│ │
│  │  ◉ 11 min ago            │ │  🔍 Scout   ○ Idle  │ │
│  │  Scout saved research    │ │  ⚡ Dash    ● Active │ │
│  │  → files/research/...    │ │  🎯 North   ○ Idle  │ │
│  │                          │ │  🧘 Zen     ○ Idle  │ │
│  │  ◉ 7:00 AM               │ │                     │ │
│  │  Daily standup ran       │ │  [Chat with team →] │ │
│  │                          │ │                     │ │
│  │  ◉ 4:00 AM               │ │─────────────────────│ │
│  │  Memory summarizer OK    │ │                     │ │
│  │                          │ │  QUICK STATS        │ │
│  │  [View all activity →]   │ │  Messages: 47 today │ │
│  │                          │ │  Storage: 24 MB     │ │
│  └──────────────────────────┘ │  Plan: Pro          │ │
│                                │  [Upgrade →]        │ │
│                                └─────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  MORNING BRIEFING (if enabled, if today's is new)│ │
│  │  📋 Today's briefing • 7:00 AM                   │ │
│  │  [Summary text — first 200 chars + expand]       │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Layout (Mobile — single column stack)

```
┌─────────────────────────┐
│ 🦞 Clawer.ai  [☰] [👤] │
├─────────────────────────┤
│ 🟢 All systems normal   │
│ Good afternoon, Keith   │
│ 3 tasks done today      │
│                         │
│ [3 Tasks] [2 Files] [4 Crons]  (3 equal-width pills)
│                         │
│ ─── ACTIVITY FEED ───  │
│ ◉ 11m  Scout saved...  │
│ ◉ 7:00 Daily standup   │
│ ◉ 4:00 Memory synced   │
│ [See all activity]      │
│                         │
│ ─── TEAM STATUS ────   │
│ 📋 Max   ● Active  [→] │
│ 🔍 Scout ○ Idle    [→] │
│ ⚡ Dash  ● Active  [→] │
│                         │
│ ─── MORNING BRIEF ──   │
│ 📋 7:00 AM today        │
│ [Summary...]            │
│ [Read full →]           │
└─────────────────────────┘

Bottom tab bar:
[🏠 Home] [💬 Chat] [📋 Tasks] [⋯ More]
```

---

## 3. Component Designs

### 3.1 System Health Pill

**Position:** Top of dashboard, full-width pill/banner.  
**Variants:**
- 🟢 Green: "All systems normal" — bg-green-50, text-green-700, green dot
- 🟡 Yellow: "1 cron job failing" — bg-yellow-50, text-yellow-700, yellow dot  
- 🔴 Red: "Container offline — agents not responding" — bg-red-50, text-red-700, red dot

**Data source:** `GET /api/dashboard/health` (Next.js route — aggregates container health)

**Interactions:**
- Clicking the pill → `/dashboard/health` (System Health page)
- Auto-refresh: Every 60 seconds via `setInterval` + SWR
- On red: Shows "Reconnecting..." state if container is temporarily down

**Implementation note:** Load this first, render immediately — it should never block the rest of the page. If container is unreachable, degrade gracefully (show yellow pill, rest of page still loads from DB).

---

### 3.2 Today's Stats Bar

**Three stat pills in a row:**
- Tasks done today (from `tasks` table, `completedAt` timestamp)
- Files saved today (from container API `/api/files/recent`)  
- Cron jobs ran today (from `agent_events` table)

**Design:**
```tsx
<div className="grid grid-cols-3 gap-4">
  {stats.map(s => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <div className="text-2xl font-bold text-gray-900">{s.value}</div>
      <div className="text-xs text-gray-500 mt-1">{s.label}</div>
    </div>
  ))}
</div>
```

**Rules:**
- If all zeros (new user, no activity) → show encouraging message, not zeros: "Your team is ready. Ask them something! →"
- Numbers link to relevant pages (tasks count → /dashboard/tasks, files → /dashboard/outputs)
- No graphs here — numbers only. Fast, legible on mobile.

---

### 3.3 Activity Feed

**The most important component.** This is what makes users feel their team is working.

**Feed items (what we track):**

| Event Type | Display Text | Icon |
|------------|--------------|------|
| `task_completed` | "{agent} completed '{task title}'" | ✅ |
| `task_failed` | "{agent} couldn't complete '{task title}'" | ❌ |
| `file_created` | "{agent} saved {filename}" | 📄 |
| `cron_ran` | "{cron name} ran successfully" | ⚡ |
| `cron_failed` | "{cron name} failed — {error summary}" | 🚨 |
| `subagent_spawned` | "{agent} delegated '{task}' to {subagent}" | 🔀 |
| `subagent_completed` | "Subtask completed: {description}" | ✅ |
| `memory_updated` | "Memory updated by {agent}" | 🧠 |
| `briefing_sent` | "Morning briefing sent via {channel}" | 📋 |

**Display rules:**
- Show last 20 events (no pagination on homepage)
- Timestamp: relative ("11 min ago", "7:00 AM", "Yesterday at 11pm")
- Group by date when spanning multiple days
- Empty state: "No activity yet today. Your agents are ready to go." + CTA
- "See all activity →" link at bottom (future: `/dashboard/activity` page)

**Feed item design:**
```
◉ 11 min ago
  Scout saved research results
  → files/research/saas-competitors.md
  [View file]
```

The dot color = event status (green = success, red = error, gray = info).  
The file link opens the file in the files browser.  
Agent delegation events are indented slightly to show hierarchy.

**Data source:** `agent_events` table (new — see Schema section).

---

### 3.4 Team Status Panel

**Shows each team member with live-ish status.**

**Each card:**
```
┌─────────────────────────────┐
│ 📋 Max                 ●    │
│ Chief of Staff    Active    │
│ Last: 4 min ago             │
│ [Chat with Max]             │
└─────────────────────────────┘
```

**Status logic:**
- `Active` (green dot): Last activity within 10 minutes  
- `Idle` (gray dot): Last activity 10min–24h ago  
- `Offline` (yellow dot): No activity in 24h+ (might mean container issue)
- `Error` (red dot): Last action was a failure

**"Chat with Max" button:**
- Links to `/dashboard/chat?agent=max`  
- Orange CTA button (`btn-primary` style but compact — 36px height)  
- On mobile, fills full width of the card

**Data source:** `agent_events` table (last event per agent + status).

**Panel layout:**
- Desktop: Vertical stack in right sidebar (3-col layout)
- Mobile: Horizontal scrolling row of mini-cards (show emoji + name + dot)

---

### 3.5 Morning Briefing Card

**Only shown if:** `morningBriefingEnabled = 1` AND a briefing was sent today.

**Design:**
```
┌────────────────────────────────────────┐
│ 📋 Morning Briefing · 7:00 AM today   │
│                                        │
│ Good morning Keith. Here's what        │
│ happened overnight: Scout researched   │
│ three SaaS competitors for your...     │
│                              [more]    │
│                                        │
│ [Read full briefing →]                 │
└────────────────────────────────────────┘
```

**Data source:** Read from `agent_events` table (event type `briefing_sent`) + fetch the briefing content from the agent's memory file or a stored `briefings` table.

**Rule:** If no briefing today, don't show the card at all. Don't show yesterday's briefing — it's stale.

---

### 3.6 Quick Stats (right panel, below team)

**Not vanity metrics. Operational metrics only:**
- Messages sent today (from `messages` or `daily_message_count`)
- Storage used (from container API)
- Plan + daily limit remaining

**Skip:** Total messages ever, sign-up date, "days active" streak. None of these help users do anything.

---

## 4. Enhanced Task Board (`/dashboard/tasks`)

### View Modes

Add a view toggle (right of page title):

```
[▣ Board]  [≡ List]
```

**Board view:** Existing kanban (unchanged, already works well).

**List view (new):**
```
┌────────────────────────────────────────────────────────┐
│  Filter: [All agents ▾]  [All status ▾]  [Priority ▾] │
├────────────────────────────────────────────────────────┤
│  ☐  Draft pitch deck      Scout   ■ High   Running     │
│  ☐  Research competitors  Scout   ■ Med    Queued       │
│  ✓  Send weekly report    Max     ■ Low    Done 2h ago  │
│  ✗  Scrape pricing page   Dash    ■ High   Failed       │
└────────────────────────────────────────────────────────┘
```

**List row design:**
- Checkbox (click to mark done — same as kanban)
- Task title (truncated to 1 line)
- Agent assigned (pill with emoji + name)
- Priority badge (colored dot)
- Status (text + relative time for done/failed)
- Row hover → shows action buttons (play ▶, edit ✏, delete 🗑)

**Filters:**
- Agent: All / [agent name dropdown]
- Status: All / Backlog / Queued / Running / Done / Failed
- Priority: All / Urgent / High / Medium / Low

**Agent assignment (already in schema, expose in UI):**
Current tasks have `assignedTo` field. The board view already shows this in card metadata. In list view, make it filterable. When creating a task, let users pick which agent handles it.

**No calendar view.** I know it was in the brief. Cut it. Here's why: scheduled tasks in this system are cron jobs, not calendar events. A separate calendar view would show mostly empty space. Build it if users ask for it.

---

## 5. New: Agent Outputs Page (`/dashboard/outputs`)

**Purpose:** Browse what agents actually produced. Research, drafts, analyses — the deliverables.

**This is not a file browser.** The files page already shows raw files. Outputs surfaces the notable ones — agent-created content, not config files.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Agent Outputs                     [Filter ▾]       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Today                                              │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ 📄 SaaS Comp...  │  │ 📄 Weekly Report  │         │
│  │ Scout · 11min    │  │ Max · 7:00 AM     │         │
│  │ research/saas... │  │ reports/weekly... │         │
│  │ [View] [Download]│  │ [View] [Download] │         │
│  └──────────────────┘  └──────────────────┘         │
│                                                     │
│  Yesterday                                          │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ 📝 Draft Email   │  │ 📊 Market Analysis│         │
│  │ Dash · 3:22 PM   │  │ Scout · 11:00 PM  │         │
│  └──────────────────┘  └──────────────────┘         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**What counts as an "output":**
- Any file created by an agent (tracked in `agent_events` where `event_type = 'file_created'`)
- Files in `files/` that weren't uploaded by the user (we know user-uploaded vs agent-created by tracking)
- Reports, research docs, drafts — file extensions: .md, .txt, .pdf, .csv

**What NOT to show:**
- System files (MEMORY.md, AGENTS.md, cron configs)
- Upload files the user put there themselves
- Intermediate/temp files

**File viewer:**
- Click "View" → opens inline preview (markdown rendered nicely, CSV as table)
- Click "Download" → downloads the file
- No in-page editing — that's the Agent Files editor's job

**Filter options:**
- By agent
- By date range
- By file type

**Empty state:** "Your agents haven't saved any output files yet. Give them a research task or ask them to draft something."

---

## 6. New: System Health Page (`/dashboard/health`)

**Not a vanity page. This is operations.** When things break, users need to know why.

### Layout

```
┌─────────────────────────────────────────────────────┐
│  System Health                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  CONTAINER                                          │
│  Status:  🟢 Online                                 │
│  Uptime:  4 days, 7 hours                           │
│  Memory:  342 MB / 512 MB  [████████░░]  67%        │
│  Port:    41337                                     │
│                                                     │
│  AI MODELS                                          │
│  MiniMax (Kimi)   🟢 Connected  · 240ms avg latency │
│  Anthropic        🟢 Connected  · 380ms avg latency │
│  Ollama (local)   🔴 Not configured                 │
│                                                     │
│  CRON JOBS                                          │
│  ┌─────────────────────────────────────────────────┐│
│  │ Job Name         │ Schedule │ Last Run  │ Status ││
│  ├─────────────────────────────────────────────────┤│
│  │ Morning Briefing │ 7:00 AM  │ 7:00 AM   │ ✅     ││
│  │ Memory Summarizer│ every 4h │ 12:00 PM  │ ✅     ││
│  │ Weekly Review    │ Mon 9AM  │ Feb 16    │ ✅     ││
│  │ SEO Monitor      │ daily    │ 11:00 PM  │ ❌ err ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  INTEGRATIONS                                       │
│  WhatsApp   🟢 Connected (+1-555-000-0000)          │
│  Telegram   🔴 Not connected                        │
│  Slack      🟡 Configured, not linked               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Cron job table rules:**
- Sort: Failing jobs first, then by last run recency
- Error row: Red background tint, expandable → shows last error message
- "Consecutive errors" count if ≥ 2 failures in a row
- "Fix it" link for known fixable errors (e.g., broken API key → Settings)

**Data sources:**
- Container: `GET /api/health` (enhanced — see new endpoints)
- Cron status: `GET /api/crons/status` (new container endpoint)
- Model connectivity: `GET /api/models/status` (new container endpoint)

**Auto-refresh:** Every 30 seconds.

**Mobile:** Stack all sections vertically. Cron table scrolls horizontally.

---

## 7. API Endpoints Needed

### New Container API Endpoints

These are endpoints added to the OpenClaw Gateway (each user's container).

#### `GET /api/events?since=<ISO8601>&limit=<n>`
Returns recent agent activity events.

**Response:**
```json
{
  "events": [
    {
      "id": "evt_abc123",
      "type": "task_completed",
      "agentId": "researcher",
      "agentName": "Scout",
      "title": "Completed: Research SaaS competitors",
      "detail": "Saved to files/research/saas-competitors.md",
      "filePath": "files/research/saas-competitors.md",
      "timestamp": "2026-02-21T14:22:00Z",
      "success": true
    }
  ]
}
```

**Event types emitted by OpenClaw:**
- Task lifecycle: `task_started`, `task_completed`, `task_failed`
- Subagent lifecycle: `subagent_spawned`, `subagent_completed`
- File operations: `file_created`, `file_updated`
- Cron: `cron_started`, `cron_completed`, `cron_failed`
- Memory: `memory_updated`
- Briefing: `briefing_sent`

**OpenClaw side:** Requires adding event emission hooks to the OpenClaw daemon. Events written to a local SQLite file inside the container (`/clawd/events.db`). The Gateway serves them via this endpoint.

#### `GET /api/crons/status`
Returns cron job status.

**Response:**
```json
{
  "jobs": [
    {
      "id": "morning-briefing",
      "name": "Morning Briefing",
      "schedule": "0 7 * * *",
      "lastRun": "2026-02-21T07:00:00Z",
      "lastStatus": "success",
      "consecutiveErrors": 0,
      "lastError": null,
      "nextRun": "2026-02-22T07:00:00Z"
    }
  ]
}
```

#### `GET /api/models/status`
Returns AI model connectivity status.

**Response:**
```json
{
  "models": [
    {
      "id": "minimax",
      "name": "MiniMax (Kimi)",
      "status": "connected",
      "latencyMs": 240,
      "lastCheck": "2026-02-21T14:29:00Z"
    },
    {
      "id": "anthropic",
      "name": "Anthropic",
      "status": "connected",
      "latencyMs": 380,
      "lastCheck": "2026-02-21T14:29:00Z"
    }
  ]
}
```

#### `GET /api/health` (enhanced, not new)
Add to existing health response:
```json
{
  "ready": true,
  "uptime": 383400,
  "memoryMb": 342,
  "memoryLimitMb": 512,
  "containerPort": 41337,
  "gateway": "v0.9.1"
}
```

#### `GET /api/files/recent?since=<ISO8601>&agent=<agentId>`
Returns recently created/modified files by agents.

**Response:**
```json
{
  "files": [
    {
      "path": "files/research/saas-competitors.md",
      "name": "saas-competitors.md",
      "agentId": "researcher",
      "agentName": "Scout",
      "createdAt": "2026-02-21T14:22:00Z",
      "modifiedAt": "2026-02-21T14:22:00Z",
      "sizeBytes": 4821,
      "isAgentCreated": true
    }
  ]
}
```

---

### New Next.js API Routes

#### `GET /api/dashboard/activity`
**Auth:** Clerk session  
**Purpose:** Aggregates events from container + DB for activity feed.

```typescript
// Fetches container events + merges with task completions from DB
// Response:
{
  events: ActivityEvent[],
  lastUpdated: string  // ISO8601
}
```

**Logic:**
1. Get user's container port from DB
2. Call `containerApi.events(port, { since: '24h ago', limit: 50 })`
3. Merge with DB task completions (`tasks.completedAt` today)
4. Sort by timestamp descending
5. Deduplicate (task completions may appear in both sources)
6. Return unified feed

#### `GET /api/dashboard/team-status`
**Purpose:** Returns each team member's status (last activity + derived status).

```typescript
{
  members: {
    id: string,
    name: string,
    emoji: string,
    role: string,
    status: 'active' | 'idle' | 'offline' | 'error',
    lastActivityAt: string | null,
    lastActivityDescription: string | null
  }[]
}
```

**Logic:** 
1. Get team config (from `teamTemplate` in DB)
2. For each member, query `agent_events` for their most recent event
3. Derive status from time elapsed + success/failure

#### `GET /api/dashboard/stats`
**Purpose:** Today's quick stats.

```typescript
{
  tasksCompletedToday: number,
  filesCreatedToday: number,
  cronsRanToday: number,
  messagesUsedToday: number,
  storageMb: number
}
```

#### `GET /api/dashboard/health`
**Purpose:** Aggregated health check for the health pill.

```typescript
{
  status: 'ok' | 'degraded' | 'error',
  issues: string[],  // human-readable issue descriptions
  container: { online: boolean, uptimeSeconds: number, memoryMb: number },
  cronsFailing: number,
  modelsAvailable: number
}
```

#### `GET /api/outputs`
**Purpose:** Agent-created files for outputs page.

Returns files from container where `isAgentCreated = true`, sorted by date, grouped by day.

#### `GET /api/health/full`
**Purpose:** Full system health for `/dashboard/health` page.

Aggregates container health + cron status + model status into one response.

---

## 8. Database Schema Changes

### New Table: `agent_events`

Mirrors what the container exposes, but persisted in Postgres for:
- Queries across time (activity feed history beyond what container holds)
- Reporting and stats aggregation
- Surviving container restarts

```sql
CREATE TABLE agent_events (
  id          TEXT PRIMARY KEY,           -- evt_<nanoid>
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event metadata
  event_type  TEXT NOT NULL,             -- task_completed, file_created, cron_ran, etc.
  agent_id    TEXT,                      -- team member ID (researcher, executor, etc.)
  agent_name  TEXT,                      -- Display name (Scout, Dash, etc.)
  
  -- Content
  title       TEXT NOT NULL,            -- "Completed: Research competitors"
  detail      TEXT,                     -- "Saved to files/research/..."
  file_path   TEXT,                     -- If file-related
  task_id     TEXT REFERENCES tasks(id), -- If task-related
  
  -- Status
  success     BOOLEAN NOT NULL DEFAULT TRUE,
  error_msg   TEXT,                     -- If success = false
  
  -- Timing
  occurred_at TIMESTAMP NOT NULL,       -- When the event happened (from container)
  synced_at   TIMESTAMP NOT NULL DEFAULT NOW()  -- When we pulled it
);

CREATE INDEX idx_agent_events_user_occurred ON agent_events(user_id, occurred_at DESC);
CREATE INDEX idx_agent_events_user_agent ON agent_events(user_id, agent_id);
```

**Sync strategy:** Background job (Next.js cron or simple interval) pulls from container every 5 minutes, upserts into this table. This means the dashboard queries fast from Postgres, not from the container.

---

### New Table: `cron_job_status`

Caches cron status so the health page loads from DB, not container.

```sql
CREATE TABLE cron_job_status (
  id                  TEXT NOT NULL,      -- Cron job ID
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name                TEXT NOT NULL,
  schedule            TEXT NOT NULL,      -- Cron expression
  last_run_at         TIMESTAMP,
  last_status         TEXT,              -- 'success' | 'error'
  last_error          TEXT,
  consecutive_errors  INTEGER DEFAULT 0,
  next_run_at         TIMESTAMP,
  
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (id, user_id)
);
```

---

### Modify: `tasks` table

No structural changes. The `assignedTo` field already exists — just expose it properly in the UI.

Add one column for display in outputs page:
```sql
ALTER TABLE tasks ADD COLUMN output_file_path TEXT;
-- Populated when a task completes and saves a file
```

---

### Modify: `users` table

```sql
-- Track when we last synced events from container
ALTER TABLE users ADD COLUMN last_event_sync_at TIMESTAMP;
ALTER TABLE users ADD COLUMN events_sync_enabled BOOLEAN DEFAULT TRUE;
```

---

## 9. Data Flow

### How Data Gets from Container → Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S CONTAINER                          │
│                                                             │
│  OpenClaw daemon                                            │
│  ├── writes events → /clawd/events.db (SQLite)             │
│  └── OpenClaw Gateway serves:                              │
│      ├── GET /api/events          (activity)               │
│      ├── GET /api/crons/status    (cron health)            │
│      ├── GET /api/models/status   (model connectivity)     │
│      ├── GET /api/health          (container health)       │
│      └── GET /api/files/recent   (agent outputs)          │
│                                                             │
└──────────────────────────────┬──────────────────────────────┘
                               │  HTTP (internal, same server)
                               │  containerPort (e.g. 41337)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS (Clawer.ai)                       │
│                                                             │
│  Background sync (every 5 min):                            │
│  ├── Pull events → upsert into agent_events table          │
│  └── Pull cron status → upsert into cron_job_status table  │
│                                                             │
│  API routes (on-demand):                                    │
│  ├── GET /api/dashboard/activity  → reads agent_events     │
│  ├── GET /api/dashboard/stats     → reads agent_events +   │
│  │                                    tasks table          │
│  ├── GET /api/dashboard/health    → real-time container    │
│  │                                    request (low latency)│
│  └── GET /api/outputs             → reads agent_events +   │
│                                       file metadata        │
│                                                             │
└──────────────────────────────┬──────────────────────────────┘
                               │  SWR / fetch
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Dashboard)                       │
│                                                             │
│  DashboardHome component:                                   │
│  ├── SSR: Initial data from DB (fast, no waterfall)        │
│  ├── SWR: Revalidate activity feed every 30s               │
│  ├── SWR: Revalidate health pill every 60s                 │
│  └── SWR: Team status every 60s                            │
└─────────────────────────────────────────────────────────────┘
```

### Freshness Strategy

| Data | Strategy | Staleness OK? |
|------|----------|---------------|
| System health pill | Real-time container request (SSR + 60s SWR) | 60s |
| Activity feed | DB (synced every 5min) + SSR | 5 min |
| Team status | DB (synced every 5min) + 60s SWR | 5 min |
| Today's stats | DB (synced every 5min) + SSR | 5 min |
| Cron health | DB (synced every 5min) | 5 min |
| Morning briefing | DB, only shown when exists | N/A |

**Decision rationale:** Polling the container every page load would slow down the dashboard and hammer the container. Instead, sync to DB on a background schedule and serve fast from Postgres. Only health pill hits the container in real-time (it needs to be accurate — if the container is down, we need to know NOW).

---

## 10. Background Sync Implementation

The event sync needs to be reliable but simple. Options:
1. **Vercel Cron** — but we're not on Vercel
2. **Next.js Route Handler + Cron** — use `node-cron` in a server action, but this doesn't work in serverless
3. **Dedicated sync process** — a small Node.js worker that runs alongside Next.js

**Recommendation:** Add a sync script (`/scripts/sync-container-events.ts`) that runs as a PM2 process on the server:

```
pm2 start npm --name "event-sync" -- run sync-events
```

The sync script:
```typescript
// Every 5 minutes:
// 1. Get all active users with containers (containerPort is set)
// 2. For each user, GET /api/events?since=<last_sync>
// 3. Upsert events into agent_events table
// 4. GET /api/crons/status → upsert into cron_job_status
// 5. Update users.last_event_sync_at
```

Alternative (simpler for now): Trigger sync on page load via API route with rate limiting (sync if `last_event_sync_at` is >5min ago). This means first dashboard load after 5 min of inactivity is slightly slower but requires no extra process.

**Start with the simpler approach.** Add the PM2 process in Phase 2 when user count warrants it.

---

## 11. Mobile-First Wireframe Descriptions

### Dashboard Home (Mobile)

**Header (44px):**
- Logo left, hamburger right (opens bottom sheet navigation)
- Don't show full nav bar — too cramped

**Health pill (40px):** Full width, tap to go to health page.

**Greeting (2 lines):** "Good morning, Keith\nYour team completed 3 tasks today."

**Stats row (80px):** 3 equal pills in a row. Numbers big (24px bold), labels small (11px). Tap each → relevant page.

**Activity feed (list, no fixed height):**
- Each item: dot + relative time + 1-line description + optional file link
- Item height: 56px
- Tap item → expands to show detail (inline, not modal)
- "See all" at the bottom

**Team status (horizontal scroll row):**
- Mini cards: 80px wide × 80px tall
- Shows: emoji (24px), name (11px), status dot
- Tap → full agent card (bottom sheet) with "Chat with [Name]" CTA
- Scrolls horizontally past the viewport edge (peek pattern)

**Morning briefing card (collapsible):**
- Collapsed: 56px tall — shows title + timestamp + expand arrow
- Expanded: full text (scrollable)

**Bottom tab bar (fixed, 56px):**
```
🏠          💬          📋          ⋯
Home       Chat        Tasks      More
```
- "More" tab opens bottom sheet with: Files, Outputs, Health, Memory, Settings

### Tasks (Mobile — List View)

- Filter controls collapse into a single "Filter" pill that opens a bottom sheet
- Each row: 64px tall, title left, status badge right, tap to expand detail
- Swipe right on row → quick mark as done
- Swipe left on row → delete (with undo toast)
- FAB (floating action button, orange) in bottom-right: "＋ Add Task"

### System Health (Mobile)

- Status cards stack vertically
- Cron table: scroll horizontally or collapse to accordion (cron name + status badge, tap to expand schedule + last run)

---

## 12. Phased Implementation Plan

### Phase 1 — Command Center Foundation (2–3 days)

**Goal:** Dashboard feels like an operations center, not a homepage. This is all in-product — no new infrastructure.

**Scope:**
1. **Dashboard home redesign** — New layout with stats bar + health pill + team status
   - Read stats from existing DB tables (no new data yet)
   - Team status = "no recent data" state with placeholder
   - Health pill reads existing `containerApi.health()`
   - Estimated: 1 day

2. **Activity feed — DB-backed version** — Start logging task completions  
   - Create `agent_events` table
   - Hook into existing task `status = 'done'` updates → write event
   - Feed shows task completions only (no cron/file events yet)
   - Estimated: 0.5 day

3. **Task list view** — Add list toggle to tasks page
   - Reuse existing task data, add filter UI
   - Estimated: 0.5 day

4. **Navigation restructure** — Clean up the top nav bar
   - Move less-used links to "More" / secondary menu
   - Add mobile bottom tab bar
   - Estimated: 0.5 day

**What Phase 1 does NOT need from container:**
- No new container endpoints needed
- Activity feed uses only DB data (task completions)
- Health pill uses existing `/api/health`

---

### Phase 2 — Full Activity + Health (1 week)

**Goal:** Activity feed is rich (shows cron runs, file creates, sub-agent delegation). Health page is live. Outputs page exists.

**Scope:**
1. **Container event endpoint** — Add `GET /api/events` to OpenClaw Gateway
   - Requires OpenClaw event emission hooks
   - Estimated: 2 days (OpenClaw side)

2. **Event sync pipeline** — Pull from container every 5min on page load
   - Sync function in Next.js API route (no separate process yet)
   - Estimated: 0.5 day

3. **Rich activity feed** — Cron runs, file creates, sub-agent events
   - Feed now shows full team activity, not just task completions
   - Estimated: 0.5 day

4. **Team status from events** — Status derived from agent_events
   - Active/Idle/Error states based on last event timestamp
   - Estimated: 0.25 day

5. **System Health page** — `/dashboard/health`
   - Container health, model status, cron table
   - New container endpoints: `/api/crons/status`, `/api/models/status`
   - Estimated: 1 day

6. **Agent Outputs page** — `/dashboard/outputs`
   - Reads `agent_events` for file_created events
   - File preview (markdown renderer)
   - Estimated: 1 day

---

### Phase 3 — Polish & Power Features (stretch)

**These only if Phase 1 and 2 are solid and users request them.**

- **Event sync daemon (PM2 process)** — Replace on-load sync with background process
- **Push notifications** — Browser notifications when task completes, cron fails
- **Morning briefing card** — Show today's briefing on dashboard (needs briefing persistence)
- **Activity archive page** — `/dashboard/activity` with full history, filters, search
- **Calendar view for tasks** — Only if users ask for it
- **Export outputs** — Bulk download agent-created files
- **Agent performance metrics** — Tasks completed per agent per week (useful for power users)

---

## 13. Priority Ranking

Ranked by user value × build effort (highest ROI first):

| # | Feature | Value | Effort | Phase |
|---|---------|-------|--------|-------|
| 1 | Dashboard stats bar (tasks done today) | High | Low | 1 |
| 2 | Team status panel with active/idle | High | Low | 1 |
| 3 | Health pill (system ok/degraded) | High | Low | 1 |
| 4 | Task list view + filters | High | Low | 1 |
| 5 | Activity feed (task completions only) | High | Med | 1 |
| 6 | Nav restructure + mobile bottom tabs | Med | Low | 1 |
| 7 | Container event endpoint (OpenClaw) | High | High | 2 |
| 8 | Rich activity feed (cron + files) | High | Med | 2 |
| 9 | System Health page | Med | Med | 2 |
| 10 | Agent Outputs page | Med | Med | 2 |
| 11 | Morning briefing card | Med | Med | 2-3 |
| 12 | Event sync daemon (PM2) | Low | Med | 3 |
| 13 | Push notifications | Med | High | 3 |
| 14 | Activity archive page | Low | Med | 3 |
| 15 | Calendar view for tasks | Low | High | 3/cut |
| 16 | Agent performance metrics | Low | Med | 3 |

**Cut entirely:**
- Total messages ever (vanity)
- Days active streak (vanity)
- Complex pipeline views (enterprise feature, not needed)
- Real-time WebSocket streaming (over-engineered for current scale)

---

## 14. Key Design Decisions (And Why)

### Why DB sync instead of real-time container polling?
Containers go up and down. If the dashboard hit the container on every page load, downtime = broken dashboard. By syncing to Postgres on a schedule and serving from DB, the dashboard stays fast and usable even if the container is temporarily unreachable. The health pill is the only component that hits the container in real-time (because that's specifically what it's for).

### Why no WebSocket / real-time feed?
The activity feed shows "what happened" not "what is happening." Users check the dashboard periodically — they don't watch it like a terminal. 30-second SWR revalidation is fast enough that it feels live without the complexity of WebSocket connections, socket reconnection logic, or scaling concerns.

### Why is the outputs page separate from files?
The files page is raw file system access — power user territory. The outputs page is "things my team made for me" — the highlight reel. Different mental models, different audiences. Non-technical users need outputs. Developers need files. Both can coexist.

### Why cut the calendar view for tasks?
Tasks in this system don't have due dates in the schema (and cron jobs have schedules, not calendar events). A calendar view would be mostly empty and misleading. Add due dates to the tasks schema first, THEN build calendar view. Don't build the view before the data exists.

### Why mobile bottom tab bar instead of hamburger?
Hamburger menus are fine for infrequent navigation. Dashboard users hit Chat, Tasks, and Home constantly. Those 3 items deserve dedicated tabs. The bottom bar puts the most-used actions one thumb-tap away, which is the mobile UX standard in 2026.

---

## 15. Implementation Notes

### SSR Strategy for Dashboard Home

Load initial data server-side for fast first paint:
```typescript
// /app/dashboard/page.tsx (server component)
const [stats, recentEvents, teamConfig] = await Promise.all([
  getDashboardStats(userId),
  getRecentEvents(userId, { limit: 10 }),
  getTeamConfig(userId),
]);

// Health check — parallel, timeout 2s
const health = await getContainerHealth(userId).catch(() => null);

return <DashboardHome initialStats={stats} initialEvents={recentEvents} ... />
```

Client-side, use SWR to revalidate:
```typescript
// Activity feed revalidates every 30s
const { data } = useSWR('/api/dashboard/activity', fetcher, { 
  refreshInterval: 30_000,
  fallbackData: initialEvents 
});
```

This pattern gives instant first load (SSR) + stays fresh (SWR).

### Skeleton Loading States

Activity feed loading:
```tsx
// 3 gray bars, different widths
<div className="space-y-4 animate-pulse">
  {[80, 60, 70].map(w => (
    <div className="flex gap-3">
      <div className="w-3 h-3 bg-gray-200 rounded-full mt-1" />
      <div className={`h-4 bg-gray-200 rounded w-${w}%`} />
    </div>
  ))}
</div>
```

### Error States

If container is unreachable (activity feed):
```
◌ Unable to load activity
  Container may be starting up. Retrying...
  [Check system health]
```

Don't show an error message that looks like the product is broken. Use neutral gray dot, calm language, and a path forward.

---

## Appendix A: Component File Structure

```
src/
  app/
    dashboard/
      page.tsx              ← REDESIGNED (server component, loads all initial data)
      tasks/page.tsx        ← ENHANCED (add list view toggle)
      outputs/page.tsx      ← NEW
      health/page.tsx       ← NEW
    api/
      dashboard/
        activity/route.ts   ← NEW
        stats/route.ts      ← NEW
        health/route.ts     ← NEW
        team-status/route.ts ← NEW
      outputs/route.ts      ← NEW
      health/full/route.ts  ← NEW
  components/
    dashboard/
      DashboardHome.tsx        ← REDESIGNED
      ActivityFeed.tsx         ← NEW
      TeamStatusPanel.tsx      ← NEW
      SystemHealthPill.tsx     ← NEW
      StatBar.tsx              ← NEW
      MorningBriefingCard.tsx  ← NEW
      AgentOutputsGrid.tsx     ← NEW
      HealthPage.tsx           ← NEW
      TaskListView.tsx         ← NEW
  lib/
    container-client.ts     ← ENHANCED (new endpoints)
    event-sync.ts           ← NEW (sync logic)
```

---

## Appendix B: Container Event Schema (OpenClaw Side)

The OpenClaw daemon needs to write events. Here's the SQLite schema for `/clawd/events.db`:

```sql
CREATE TABLE events (
  id          TEXT PRIMARY KEY,   -- evt_<nanoid>
  type        TEXT NOT NULL,      -- task_completed, file_created, etc.
  agent_id    TEXT,               -- Which agent did this
  agent_name  TEXT,               -- Display name
  title       TEXT NOT NULL,      -- Human-readable summary
  detail      TEXT,               -- Extra detail
  file_path   TEXT,               -- If file-related
  task_id     TEXT,               -- If task-related
  success     INTEGER NOT NULL DEFAULT 1,
  error_msg   TEXT,
  occurred_at TEXT NOT NULL       -- ISO8601
);

CREATE INDEX idx_events_occurred ON events(occurred_at DESC);
```

Events are append-only. The container can prune events older than 30 days. The Next.js sync pulls only new events (since `last_event_sync_at`).

---

*End of spec.*
*Next step: Phase 1 implementation. Start with the dashboard home layout (no new endpoints needed) and the `agent_events` table migration.*
