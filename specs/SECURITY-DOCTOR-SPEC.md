# Security Doctor — Container Health & Security Validation System

**Status:** DRAFT  
**Created:** 2026-02-28  
**Author:** Lex (automated spec)  
**Replaces:** Manual build guide, tribal knowledge, ad-hoc container debugging

---

## Problem Statement

Container issues (missing API keys, restart loops, incomplete team templates, unvalidated security settings) are caught only when users report broken containers. The manual build guide is tribal knowledge that nobody follows consistently. Yesterday a container was restart-looping because API keys were missing — nobody caught it until the user complained.

Security Doctor replaces manual checks with automated enforcement across three modes: **Build Doctor** (image build time), **Pre-flight Check** (before `docker run`), and **Container Doctor** (running containers).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Doctor                        │
├──────────────┬──────────────────┬────────────────────────┤
│  CLI Script  │   API Endpoints  │   Dashboard Page       │
│  (bash)      │   (Next.js)      │   (React)              │
├──────────────┴──────────────────┴────────────────────────┤
│                   Check Engine (TypeScript)               │
│  - CheckRunner: executes checks, collects results        │
│  - Checks: individual validation functions               │
│  - Scorer: computes 0-100 score from results             │
│  - Remediator: auto-fix actions for fixable issues       │
└──────────────────────────────────────────────────────────┘
```

### Components

1. **`scripts/security-doctor.sh`** — CLI wrapper. Runs locally or via SSH against production server. Used in CI/CD and by operators.
2. **`src/lib/security-doctor/`** — TypeScript check engine. Shared by API and CLI (via `tsx` for CLI).
3. **`src/app/api/admin/security-doctor/route.ts`** — API endpoint for dashboard.
4. **`src/app/api/admin/security-doctor/container/[id]/route.ts`** — Single container endpoint.
5. **Dashboard page** — `/admin/security-doctor` — visual security score + drill-down.

---

## Scoring System

Each check has a **weight** (1-10) and produces one of:
- **PASS** ✅ — 100% of weight
- **WARN** ⚠️ — 50% of weight
- **FAIL** ❌ — 0% of weight
- **SKIP** ⏭️ — excluded from scoring (e.g., optional checks)

**Score = (earned points / total possible points) × 100**, rounded to integer.

### Grades
| Score | Grade | Meaning |
|-------|-------|---------|
| 90-100 | A | Production-ready |
| 75-89 | B | Minor issues, acceptable |
| 50-74 | C | Significant issues, needs attention |
| 25-49 | D | Critical issues, container at risk |
| 0-24 | F | Broken, immediate action required |

---

## Mode 1: Build Doctor

**When:** Before `docker build` (CI/CD gate, operator manual run)  
**Target:** The `docker/openclaw-user/` directory on the build host

### Checklist

| # | Check | Severity | Weight | Auto-fix? | Details |
|---|-------|----------|--------|-----------|---------|
| B01 | Dockerfile: non-root USER | FAIL | 10 | No | Verify `USER 1000` or `USER node` present after all `RUN` commands |
| B02 | Dockerfile: HEALTHCHECK defined | WARN | 3 | No | Verify `HEALTHCHECK` instruction exists |
| B03 | Dockerfile: no secrets in build args | FAIL | 10 | No | Scan for `ARG.*KEY`, `ARG.*TOKEN`, `ARG.*SECRET`, `ARG.*PASSWORD` (except `SEARXNG_PROXY_URL`) |
| B04 | Dockerfile: OpenClaw version matches expected | WARN | 5 | No | Parse `openclaw-*.tgz` filename, compare to `EXPECTED_OPENCLAW_VERSION` env var |
| B05 | Dockerfile: SearXNG proxy URL configured | WARN | 4 | No | Verify `ARG SEARXNG_PROXY_URL` is set to a non-empty, non-brave URL |
| B06 | Required files exist | FAIL | 10 | No | Check: `entrypoint.sh`, `api-server.js`, `init_clawsec.sh`, `defaults/` dir |
| B07 | Default workspace files complete | FAIL | 8 | No | Verify `defaults/` contains: `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `PLATFORM.md`, `MEMORY.md`, `BRAIN.md`, `BOOTSTRAP.md` |
| B08 | Team templates: required structure | FAIL | 8 | No | Each dir in `teams/` must have `team-config.json` and `AGENTS.md` |
| B09 | Team templates: team-config.json valid | FAIL | 7 | No | Each `team-config.json` must parse as JSON, have `name`, `members[]` with `id`+`name`+`role` |
| B10 | Team templates: agent SOUL files exist | WARN | 6 | No | For each member in team-config.json, verify corresponding SOUL.md file exists (check `agents/` or `members/` dirs) |
| B11 | No hardcoded secrets in source | FAIL | 10 | No | Scan all files for patterns: `sk-[a-zA-Z0-9]{20,}`, `eyJ[a-zA-Z0-9]{50,}`, `AKIA[A-Z0-9]{16}`, `ghp_`, `ghu_`, `whsec_` |
| B12 | entrypoint.sh: exits on missing keys | WARN | 5 | No | Verify entrypoint has `exit 1` path when no API keys provided |
| B13 | ClawSec feed URL valid format | WARN | 3 | No | Verify `CLAWSEC_FEED_URL` in `init_clawsec.sh` is a valid HTTPS URL |
| B14 | Skills directory exists | WARN | 3 | No | Verify `skills/` directory exists and has at least one skill |
| B15 | Dockerfile: capability drops present | FAIL | 8 | No | Note: caps are dropped at `docker run` time, not in Dockerfile. Check that provisioner.ts has `--cap-drop=ALL` |

### Build Doctor Implementation

```bash
# Check is a function that outputs JSON:
# {"id":"B01","name":"Non-root USER","status":"PASS|WARN|FAIL","message":"...","remediation":"..."}
```

---

## Mode 2: Container Doctor

**When:** On-demand via dashboard or API; optionally on a cron (every 5 min for health, hourly for full)  
**Target:** Running containers on production server (via SSH + `docker exec`)

### Checklist

| # | Category | Check | Severity | Weight | Auto-fix? | How |
|---|----------|-------|----------|--------|-----------|-----|
| C01 | API Keys | MINIMAX_API_KEY set and non-empty | FAIL | 10 | Yes¹ | `docker exec $CID printenv MINIMAX_API_KEY` (check non-empty, key not echoed in output) |
| C02 | API Keys | OPENAI_API_KEY set and non-empty | FAIL | 10 | Yes¹ | Same pattern |
| C03 | API Keys | GEMINI_API_KEY set and non-empty | WARN | 5 | Yes¹ | Same pattern (warn only — not strictly required if others present) |
| C04 | API Keys | At least one AI provider key present | FAIL | 10 | No | If all three are empty → FAIL |
| C05 | Gateway | GATEWAY_TOKEN env var set | FAIL | 10 | No | `docker exec $CID printenv GATEWAY_TOKEN` |
| C06 | Gateway | Gateway port 8080 listening | FAIL | 9 | Auto-restart | `docker exec $CID curl -sf http://127.0.0.1:8080/ -o /dev/null` |
| C07 | Gateway | Health endpoint responds | FAIL | 9 | Auto-restart | `docker exec $CID curl -sf http://127.0.0.1:8081/api/health` |
| C08 | Config | openclaw.json exists and valid JSON | FAIL | 10 | Regenerate² | `docker exec $CID cat /home/user/.openclaw/openclaw.json \| jq .` |
| C09 | Config | Primary model set | FAIL | 8 | No | Parse `openclaw.json` → `.agents.defaults.model.primary` non-empty |
| C10 | Config | Fallback models configured | WARN | 4 | No | `.agents.defaults.model.fallbacks` is non-empty array |
| C11 | Config | Memory search enabled | WARN | 4 | No | `.agents.defaults.memorySearch.enabled == true` |
| C12 | Security | Running as non-root (UID != 0) | FAIL | 10 | No | `docker exec $CID id -u` → should be `1000` |
| C13 | Security | no-new-privileges set | FAIL | 8 | No³ | `docker inspect $CID --format '{{.HostConfig.SecurityOpt}}'` contains `no-new-privileges` |
| C14 | Security | Capabilities dropped | FAIL | 8 | No³ | `docker inspect $CID --format '{{.HostConfig.CapDrop}}'` contains `ALL` |
| C15 | Security | Memory limit set | WARN | 5 | No³ | `docker inspect $CID --format '{{.HostConfig.Memory}}'` > 0 |
| C16 | Security | PID limit set | WARN | 4 | No³ | `docker inspect $CID --format '{{.HostConfig.PidsLimit}}'` > 0 |
| C17 | Workspace | SOUL.md exists | FAIL | 7 | Restore⁴ | `docker exec $CID test -f /home/user/clawd/SOUL.md` |
| C18 | Workspace | AGENTS.md exists | FAIL | 7 | Restore⁴ | Same |
| C19 | Workspace | USER.md exists | WARN | 5 | Restore⁴ | Same |
| C20 | Workspace | PLATFORM.md exists | WARN | 3 | Restore⁴ | Same |
| C21 | Workspace | IDENTITY.md exists | WARN | 3 | Restore⁴ | Same |
| C22 | Team | .team-config exists (if team mode) | WARN | 4 | No | Only checked if team provisioning was expected |
| C23 | Team | team/AGENTS.md exists | WARN | 4 | Restore | `docker exec $CID test -f /home/user/clawd/team/AGENTS.md` |
| C24 | Health | Container status is "running" | FAIL | 10 | Auto-start | `docker inspect --format '{{.State.Status}}'` |
| C25 | Health | Restart count < 5 | WARN | 6 | Investigate | `docker inspect --format '{{.RestartCount}}'` |
| C26 | Health | Last healthcheck passed | WARN | 5 | Auto-restart | `docker inspect --format '{{.State.Health.Status}}'` == "healthy" |
| C27 | Health | Uptime > 60s | WARN | 3 | None | Calculated from `StartedAt` |
| C28 | Network | Can reach MiniMax API | WARN | 4 | No | `docker exec $CID curl -sf --max-time 5 https://api.minimax.io/ -o /dev/null` |
| C29 | Network | Can reach OpenAI API | WARN | 4 | No | Same for `api.openai.com` |
| C30 | Network | SearXNG proxy reachable | WARN | 4 | No | `docker exec $CID curl -sf --max-time 5 http://searxng-proxy:8889/` |
| C31 | Storage | Disk usage < 80% | WARN | 4 | No | `docker exec $CID df -h /home/user/clawd` |
| C32 | Storage | Disk usage < 95% | FAIL | 6 | No | Same |
| C33 | Storage | /home/user owned by UID 1000 | WARN | 5 | Fix perms | `docker exec $CID stat -c '%u' /home/user/clawd` |
| C34 | ClawSec | soul-guardian state dir exists | WARN | 3 | Init | `docker exec $CID test -d /var/lib/openclaw/soul-guardian` |
| C35 | ClawSec | Advisory feed cached | WARN | 2 | Refresh | `docker exec $CID test -f /home/user/.openclaw/clawsec-feed-state.json` |

**Auto-fix notes:**
1. ¹ Push keys from server `.env.local` via `docker exec` to set env vars + restart
2. ² Restart container (entrypoint.sh regenerates config from env vars)
3. ³ Requires container recreation (security opts set at `docker run`)
4. ⁴ Copy from `/opt/defaults/` inside container

---

## Mode 3: Pre-flight Check

**When:** Before `provisionContainer()` in `provisioner.ts`  
**Target:** The production server environment before `docker run`

### Checklist

| # | Check | Severity | Weight | Auto-fix? | Details |
|---|-------|----------|--------|-----------|---------|
| P01 | API keys in .env.local | FAIL | 10 | No | `cat /opt/clawer/.env.local` has non-empty `MINIMAX_API_KEY`, `OPENAI_API_KEY` |
| P02 | At least one AI key present | FAIL | 10 | No | At minimum one of MINIMAX/OPENAI/GEMINI |
| P03 | Target port available | FAIL | 8 | Auto-allocate | `ss -tlnp \| grep :PORT` is empty |
| P04 | Disk space > 2GB free | FAIL | 7 | No | `df -BG /opt/clawer/userdata` |
| P05 | Docker network exists (if configured) | FAIL | 6 | Create | `docker network inspect $NETWORK` |
| P06 | Container image exists | FAIL | 10 | No | `docker images $IMAGE --format '{{.ID}}'` non-empty |
| P07 | Image version matches expected | WARN | 5 | No | Compare `CONTAINER_IMAGE` env with expected |
| P08 | Team template directory exists | FAIL | 7 | No | `test -d /opt/teams/$TEMPLATE` inside image or on host |
| P09 | Container name not already taken | FAIL | 8 | No | `docker ps -a --filter name=^NAME$` is empty |
| P10 | Userdata parent dir writable | FAIL | 6 | No | `test -w /opt/clawer/userdata` |

---

## One-Click Fix Actions

### Auto-remediable (no human required)
| Action | Trigger | Implementation |
|--------|---------|----------------|
| Push API keys | C01/C02/C03 FAIL | Read from server `.env.local`, `docker exec` to write + restart |
| Restart container | C06/C07/C26 FAIL | `docker restart $CONTAINER` |
| Start container | C24 FAIL (stopped) | `docker start $CONTAINER` |
| Restore workspace file | C17-C21 FAIL | `docker exec cp /opt/defaults/FILE /home/user/clawd/FILE` |
| Fix permissions | C33 FAIL | `docker exec chown -R 1000:1000 /home/user/clawd` |
| Init soul-guardian | C34 FAIL | `docker exec /usr/local/bin/init_clawsec.sh` |
| Refresh advisory feed | C35 FAIL | `docker exec` re-run feed fetch from `init_clawsec.sh` |
| Create Docker network | P05 FAIL | `docker network create $NETWORK` |

### Manual intervention required
| Issue | Why | What to do |
|-------|-----|------------|
| Security opts missing (C13-C16) | Set at `docker run` time | Recreate container with correct flags |
| Running as root (C12) | Image or run config issue | Rebuild image or recreate container |
| No API keys anywhere (P01) | Keys not provisioned | Admin must add keys to `.env.local` |
| Image missing (P06) | Not built | Run `docker build` |
| Disk full (C32) | Needs cleanup | Admin intervention |
| High restart count (C25) | Underlying issue | Check container logs |

---

## API Design

### `GET /api/admin/security-doctor`

Run all checks across all containers (fleet-wide).

**Query params:**
- `mode=build|container|preflight` (default: `container`)
- `quick=true` — skip network checks for speed

**Response:**
```json
{
  "timestamp": "2026-02-28T15:44:00Z",
  "mode": "container",
  "fleetScore": 87,
  "fleetGrade": "B",
  "containers": [
    {
      "containerId": "abc123",
      "containerName": "clawer_user_user_abc",
      "userId": "user_abc",
      "score": 92,
      "grade": "A",
      "checks": {
        "pass": 28,
        "warn": 3,
        "fail": 1,
        "skip": 0
      },
      "criticalFailures": ["C03: GEMINI_API_KEY not set"],
      "topIssue": null
    }
  ],
  "summary": {
    "total": 5,
    "healthy": 4,
    "degraded": 1,
    "critical": 0
  }
}
```

### `GET /api/admin/security-doctor/container/[id]`

Full check results for a single container.

**Response:**
```json
{
  "containerId": "abc123",
  "containerName": "clawer_user_user_abc",
  "userId": "user_abc",
  "score": 92,
  "grade": "A",
  "timestamp": "2026-02-28T15:44:00Z",
  "checks": [
    {
      "id": "C01",
      "category": "API Keys",
      "name": "MINIMAX_API_KEY set",
      "status": "PASS",
      "weight": 10,
      "message": "Key is set (ends in ...x4Kf)",
      "remediation": null,
      "autoFixable": true,
      "autoFixAction": "push-keys"
    },
    {
      "id": "C06",
      "category": "Gateway",
      "name": "Gateway port 8080 listening",
      "status": "FAIL",
      "weight": 9,
      "message": "Connection refused on port 8080",
      "remediation": "Restart the container to reinitialize the gateway",
      "autoFixable": true,
      "autoFixAction": "restart-container"
    }
  ],
  "categoryScores": {
    "API Keys": { "score": 100, "pass": 4, "warn": 0, "fail": 0 },
    "Gateway": { "score": 67, "pass": 1, "warn": 0, "fail": 1 },
    "Config": { "score": 100, "pass": 4, "warn": 0, "fail": 0 },
    "Security": { "score": 100, "pass": 5, "warn": 0, "fail": 0 },
    "Workspace": { "score": 92, "pass": 4, "warn": 1, "fail": 0 },
    "Health": { "score": 85, "pass": 3, "warn": 1, "fail": 0 },
    "Network": { "score": 100, "pass": 3, "warn": 0, "fail": 0 },
    "Storage": { "score": 100, "pass": 3, "warn": 0, "fail": 0 },
    "ClawSec": { "score": 100, "pass": 2, "warn": 0, "fail": 0 }
  }
}
```

### `POST /api/admin/security-doctor/fix`

Execute an auto-fix action.

**Body:**
```json
{
  "containerId": "abc123",
  "action": "restart-container" | "push-keys" | "restore-file" | "fix-permissions" | "init-clawsec",
  "params": { "file": "SOUL.md" }
}
```

**Response:**
```json
{
  "success": true,
  "action": "restart-container",
  "message": "Container restarted successfully",
  "recheckIn": 30
}
```

---

## CLI Usage

```bash
# Build Doctor — run before docker build
./scripts/security-doctor.sh --mode build [--dir docker/openclaw-user]

# Pre-flight — run before provisioning
./scripts/security-doctor.sh --mode preflight --user-id user_abc --template lifeos

# Container Doctor — single container
./scripts/security-doctor.sh --mode container --container clawer_user_user_abc

# Container Doctor — all containers (fleet)
./scripts/security-doctor.sh --mode container --all

# Quick health check (skip network tests)
./scripts/security-doctor.sh --mode container --all --quick

# JSON output for CI/CD
./scripts/security-doctor.sh --mode build --json

# Fix mode — auto-remediate all fixable issues
./scripts/security-doctor.sh --mode container --all --fix
```

**Exit codes:**
- `0` — All checks pass (score ≥ 90)
- `1` — Warnings present (score 50-89)
- `2` — Critical failures (score < 50)

---

## Dashboard UI Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  🏥 Security Doctor                                    [Refresh] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Fleet Health Score: ████████████████████░░  87/100  Grade: B   │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  5 Total │ │ 4 Healthy│ │ 1 Degraded│ │ 0 Critical│          │
│  │ containers│ │    ✅    │ │    ⚠️    │ │    ❌    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Container              Score  Status  Issues    Actions   │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ clawer_user_user_abc   92 A   🟢      1 warn   [Details] │  │
│  │ clawer_user_user_def   95 A   🟢      —        [Details] │  │
│  │ clawer_user_user_ghi   71 C   🟡      2 fail   [Fix All] │  │
│  │ clawer_user_user_jkl   88 B   🟢      1 warn   [Details] │  │
│  │ clawer_user_user_mno   98 A   🟢      —        [Details] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ─── Container Detail: clawer_user_user_ghi ──────────────────  │
│                                                                  │
│  Score: ██████████████░░░░░░  71/100  Grade: C                  │
│  User: user_ghi  |  Uptime: 3d 4h  |  Restarts: 0              │
│                                                                  │
│  Category Breakdown:                                             │
│  API Keys    ████████░░ 80%   Gateway   ██████████ 100%         │
│  Config      ██████████ 100%  Security  ██████████ 100%         │
│  Workspace   ██████░░░░ 60%   Health    ██████████ 100%         │
│  Network     ████████░░ 80%   Storage   ██████████ 100%         │
│  ClawSec     █████░░░░░ 50%                                     │
│                                                                  │
│  ❌ FAIL: C03 — GEMINI_API_KEY not set                          │
│     Remediation: Push key from server .env.local  [🔧 Fix]      │
│                                                                  │
│  ❌ FAIL: C17 — SOUL.md missing from workspace                  │
│     Remediation: Restore from /opt/defaults/      [🔧 Fix]      │
│                                                                  │
│  ⚠️ WARN: C35 — Advisory feed not cached                        │
│     Remediation: Re-run init_clawsec.sh           [🔧 Fix]      │
│                                                                  │
│  [🔧 Fix All Auto-Remediable Issues]                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. Provisioner Integration (Fail-Fast)

In `src/lib/provisioner.ts`, add pre-flight check before `docker run`:

```typescript
import { runPreflightChecks } from '@/lib/security-doctor/preflight';

export async function provisionContainer(userId: string, teamTemplate: string = 'lifeos') {
  // Pre-flight validation — fail fast before creating anything
  const preflight = await runPreflightChecks({ userId, teamTemplate });
  if (preflight.score < 50) {
    console.error('[PROVISION] Pre-flight check FAILED:', preflight.criticalFailures);
    return { success: false, error: `Pre-flight failed: ${preflight.criticalFailures.join(', ')}` };
  }
  if (preflight.score < 75) {
    console.warn('[PROVISION] Pre-flight warnings:', preflight.warnings);
  }

  // ... existing provisioning logic ...
}
```

### 2. Post-Provision Validation

After container starts, run Container Doctor checks:

```typescript
// After docker run + restart
await new Promise(resolve => setTimeout(resolve, 10000)); // wait for startup
const health = await runContainerChecks(containerName);
if (health.score < 50) {
  console.error('[PROVISION] Post-provision health check FAILED');
  // Container exists but is unhealthy — mark in DB, alert admin
  await db.update(users).set({ containerStatus: 'degraded' }).where(eq(users.id, userId));
}
```

### 3. Fleet Health Cron (via existing admin health endpoint)

Extend `src/app/api/admin/health/fleet/` to include Security Doctor scores:

```typescript
// Add to fleet health response
const doctorResults = await runFleetDoctorChecks({ quick: true });
return { ...existingFleetHealth, securityDoctor: doctorResults };
```

### 4. CI/CD Build Gate

```yaml
# In build pipeline
- name: Security Doctor Build Check
  run: ./scripts/security-doctor.sh --mode build --json
  # Fails the build if score < 90
```

---

## Implementation Work Packages

### WP1: Check Engine Core (2-3 hours)
**Priority: P0**
- `src/lib/security-doctor/types.ts` — CheckResult, CheckConfig, DoctorReport interfaces
- `src/lib/security-doctor/runner.ts` — CheckRunner class (execute checks, compute score)
- `src/lib/security-doctor/scorer.ts` — Score computation + grading
- Unit tests for scorer

### WP2: Build Doctor Checks (2 hours)
**Priority: P0**
- `src/lib/security-doctor/checks/build/` — All B01-B15 check implementations
- `scripts/security-doctor.sh` — CLI wrapper (build mode only initially)
- Wire into check runner

### WP3: Container Doctor Checks (3-4 hours)
**Priority: P0**
- `src/lib/security-doctor/checks/container/` — All C01-C35 check implementations
- Uses `sshExec` for remote container inspection
- Parallel execution where possible (batch `docker exec` calls)

### WP4: Pre-flight Checks (1-2 hours)
**Priority: P1**
- `src/lib/security-doctor/checks/preflight/` — All P01-P10 check implementations
- Integration with provisioner (fail-fast)

### WP5: API Endpoints (2 hours)
**Priority: P1**
- `src/app/api/admin/security-doctor/route.ts` — Fleet-wide endpoint
- `src/app/api/admin/security-doctor/container/[id]/route.ts` — Single container
- `src/app/api/admin/security-doctor/fix/route.ts` — Auto-fix endpoint
- Auth: require admin role (existing admin middleware)

### WP6: Auto-Fix Actions (2-3 hours)
**Priority: P1**
- `src/lib/security-doctor/remediator.ts` — Fix action implementations
- Push keys, restart, restore files, fix permissions, init clawsec
- Each action returns success/failure + message

### WP7: Dashboard Page (3-4 hours)
**Priority: P2**
- `/admin/security-doctor` page component
- Fleet overview with scores
- Container drill-down with category breakdown
- One-click fix buttons
- Auto-refresh (poll every 30s when page is open)

### WP8: CLI Polish + CI Integration (1-2 hours)
**Priority: P2**
- `scripts/security-doctor.sh` — full CLI with all modes
- JSON output mode for CI
- `--fix` mode for auto-remediation
- Exit codes for CI gates

### WP9: Post-Provision Health Check (1 hour)
**Priority: P2**
- Wire Container Doctor into provisioner post-creation flow
- Set `containerStatus: 'degraded'` if health check fails
- Dashboard shows degraded containers prominently

**Total estimated effort: 17-22 hours**

### Recommended build order:
1. WP1 → WP3 → WP5 (get container monitoring live ASAP — solves the "nobody caught it" problem)
2. WP6 → WP7 (dashboard with fix buttons)
3. WP2 → WP8 (build validation + CI)
4. WP4 → WP9 (preflight + post-provision)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPECTED_OPENCLAW_VERSION` | (from Dockerfile) | Expected OpenClaw version for build checks |
| `SECURITY_DOCTOR_SSH_HOST` | (from existing SSH config) | Production server for remote checks |
| `SECURITY_DOCTOR_QUICK_INTERVAL` | `300` | Seconds between quick fleet checks |
| `SECURITY_DOCTOR_FULL_INTERVAL` | `3600` | Seconds between full fleet checks |

---

## Future Enhancements (Post-MVP)

- **Alerting:** Slack/WhatsApp notification when container score drops below threshold
- **Historical tracking:** Store scores over time, show trends
- **Self-healing:** Auto-fix on cron without human trigger
- **Per-user health page:** Users see their own container health (non-admin)
- **Build Doctor in GitHub Actions:** Auto-run on PR to `docker/` directory
