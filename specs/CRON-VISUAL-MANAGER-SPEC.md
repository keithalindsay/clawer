# Cron Job Visual Manager — Dashboard Feature

## Context
ClawPilot's main differentiator is a cron UI. We can do it better as part of the Command Center. Shows users their AI team is working autonomously — justifies the $49/mo.

## What to Build

### Phase 1: Read-Only Dashboard (1 week)
New page: `/dashboard/crons` (add to nav)

#### Components
1. **CronJobList** — Table view of all scheduled jobs
   - Columns: Name, Schedule (human-readable), Last Run, Status, Next Run
   - Status badges: ✅ OK, ⚠️ Error, ⏸️ Disabled, 🔄 Running
   - Click row to expand details (last output, error message, run history)

2. **CronTimeline** — Visual 24h timeline
   - Horizontal bar showing when jobs fire
   - Color-coded by status
   - Current time indicator
   - Hover for job details

3. **CronRunHistory** — Per-job history
   - Last 10 runs with duration, status, truncated output
   - Expandable for full output

#### API Routes
- `GET /api/dashboard/crons` — List all cron jobs for user's container
  - Proxies to container gateway: `GET /api/cron/jobs`
  - Returns job list with schedules, last run info
- `GET /api/dashboard/crons/[jobId]/runs` — Run history
  - Proxies to: `GET /api/cron/jobs/{id}/runs`

#### Data Source
Cron jobs live in the user's OpenClaw container. The dashboard proxies requests through the container client, same pattern as chat.

### Phase 2: Management UI (future)
- Enable/disable jobs
- Trigger manual run
- Create new jobs (template-based: "Daily briefing", "Weekly summary", etc.)
- Edit schedule (cron expression builder)

## Technical Notes
- Container API endpoints for cron: check OpenClaw docs at ~/clawd/docs/
- Use same container-client proxy pattern as chat/files
- Gateway token auth required
- Mobile: stack timeline below list, horizontal scroll

## Design
- Follow `docs/BRAND-GUIDE.md`
- Status colors: green=ok, orange=warning, red=error, gray=disabled
- Orange CTA for "Enable Crons" upsell on free tier
- Timeline uses subtle grid lines, not heavy borders
