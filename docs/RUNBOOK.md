# Clawer.ai Operations Runbook

**Purpose:** Quick-reference troubleshooting guide for agents and operators. When something breaks, start here.

**Last updated:** 2026-02-20

---

## Architecture Overview

```
User Browser → Caddy (HTTPS) → Next.js (PM2, port 3000) → Container API (ports 4000-4012)
                                      ↓
                                 PostgreSQL (5432)
                                      
Each container:
  OpenClaw gateway (port 8080) ← api-server (port 8081) → MiniMax M2.5 API
                                                         → Ollama (heartbeats/embeddings)
                                                         → GPT-4o Mini (fallback)
```

- **Server:** `root@YOUR_DOCKER_HOST`
- **App:** PM2 process `clawer`, Next.js 16, port 3000
- **DB:** PostgreSQL `clawer:YOUR_DB_PASSWORD@localhost:5432/clawer`
- **Containers:** Docker, image `clawer-openclaw:v2026.2.19`
- **Shared services:** Ollama, SearXNG, SearXNG proxy — all on `clawer_shared` Docker network
- **DNS/SSL:** Caddy reverse proxy, certs auto-managed
- **Auth:** Clerk
- **Payments:** Stripe, price ID `price_1SxtZMKtZGLqQJF6DYKV6Cup`

---

## Common Issues

### 1. "Failed to connect. Please try again." in Chat

**Symptom:** User sends message, gets "Failed to connect" response.

**Diagnosis flowchart:**
```
1. Check PM2 logs for the actual error:
   ssh root@YOUR_DOCKER_HOST 'pm2 logs clawer --lines 50 --nostream 2>&1 | grep -v "Server Action" | grep -i error'

2. If "Container request failed" + "other side closed" or "fetch failed":
   → Container is rejecting/dropping the connection. Go to step 3.

3. Check container logs:
   ssh root@YOUR_DOCKER_HOST 'docker logs <container_name> --tail 30 2>&1'

4. If "Gateway request timeout":
   → The container's OpenClaw gateway can't get an LLM response. Go to "LLM API Issues"

5. If "Unauthorized":
   → Gateway token mismatch. Go to "Gateway Token Mismatch"

6. If container not running:
   ssh root@YOUR_DOCKER_HOST 'docker ps | grep clawer_'
   → If missing, check: docker ps -a | grep clawer_  (stopped vs removed)
```

### 2. LLM API Issues (MiniMax)

**Symptom:** Container logs show `Gateway request timeout` or `chat error`.

**Test MiniMax directly from inside container:**
```bash
ssh root@YOUR_DOCKER_HOST 'docker exec <container> node -e "
fetch(\"https://api.minimax.io/anthropic/v1/messages\", {
  method: \"POST\",
  headers: {\"Content-Type\":\"application/json\", \"x-api-key\":\"<KEY>\"},
  body: JSON.stringify({model:\"MiniMax-M2.5\",max_tokens:10,messages:[{role:\"user\",content:\"hi\"}]})
}).then(r=>r.json()).then(console.log).catch(console.error)
"'
```

**Common errors:**
| Error | Cause | Fix |
|-------|-------|-----|
| `insufficient balance (1008)` | MiniMax credits exhausted | Top up at minimax.io dashboard, then rotate key on all containers |
| `invalid api key` | Key revoked or wrong | Get new key, rotate on all containers |
| Timeout (no response) | MiniMax API down | Check status page; containers should fall back to GPT-4o Mini but may not |

### 3. Gateway Token Mismatch

**Symptom:** PM2 logs show container returns 401. Container logs show "Unauthorized request to /api/chat/send".

**Cause:** The gateway token in the PostgreSQL `users` table doesn't match the token in the container's `openclaw.json`. This happens when containers are recreated (entrypoint generates a new random token).

**Fix:**
```bash
# Get the container's actual token
TOKEN=$(ssh root@YOUR_DOCKER_HOST "docker exec <container> cat /home/user/.openclaw/openclaw.json | python3 -c \"import json,sys; c=json.load(sys.stdin); print(c['gateway']['auth']['token'])\"")

# Update DB
ssh root@YOUR_DOCKER_HOST "PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c \"UPDATE users SET gateway_token = '$TOKEN' WHERE container_port = <PORT>;\""
```

**Prevention:** When recreating containers, ALWAYS sync tokens to DB afterward. Use the update-containers.sh script which handles this.

### Gateway Token Auto-Sync

A server-side cron runs every 5 minutes to sync container gateway tokens to the DB. This prevents "Unauthorized" errors after container restarts/recreations.

**Script:** `/opt/clawer/scripts/sync-gateway-tokens.sh`
**Log:** `/var/log/token-sync.log`
**Cron:** `*/5 * * * * /opt/clawer/scripts/sync-gateway-tokens.sh >> /var/log/token-sync.log 2>&1`

This is a pure bash script — no AI tokens, no API calls. It runs `docker exec` to read each container's config and `psql` to update the DB. Cost: zero.

**If tokens are still mismatched:** Check `/var/log/token-sync.log` for errors. Common causes:
- Container not running (docker exec fails)
- DB connection issue (psql fails)
- Script not executable (`chmod +x /opt/clawer/scripts/sync-gateway-tokens.sh`)

**To manually sync immediately:** `bash /opt/clawer/scripts/sync-gateway-tokens.sh`

### 4. Rotating API Keys on All Containers

**⚠️ CRITICAL: You cannot just `sed` the config file — the entrypoint regenerates it on restart from the `MINIMAX_API_KEY` env var.**

**Correct procedure:**
```bash
NEW_KEY="sk-..."

# For each container: must RECREATE (not just restart)
for c in <container_names>; do
  PORT=$(docker inspect $c --format '{{range $k,$v := .NetworkSettings.Ports}}{{range $v}}{{.HostPort}}{{end}}{{end}}' | grep -o '[0-9]*' | head -1)
  
  docker stop $c && docker rm $c
  
  docker run -d \
    --name $c \
    --restart unless-stopped \
    -p 127.0.0.1:${PORT}:8081 \
    -e MINIMAX_API_KEY=$NEW_KEY \
    -v /opt/clawer/userdata/${c}/.openclaw:/home/user/.openclaw \
    -v /opt/clawer/userdata/${c}/clawd:/home/user/clawd \
    --network clawer_shared \
    --health-cmd 'node -e "fetch(\"http://localhost:8081/health\").then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"' \
    --health-interval 30s \
    --health-timeout 10s \
    --health-retries 3 \
    clawer-openclaw:v2026.2.19
done

# THEN sync gateway tokens to DB (see "Gateway Token Mismatch" above)
```

**Also update:**
- `/opt/clawer-docker/entrypoint.sh` on server (template for new containers)
- `~/projects/clawer/docker/openclaw-user/entrypoint.sh` locally (commit + push)

### 5. Container Won't Start / Unhealthy

**Check status:**
```bash
docker ps -a | grep clawer_
docker logs <container> --tail 50
```

**Common causes:**
- Port conflict: another container already on that port
- Volume mount missing: `/opt/clawer/userdata/<name>/` doesn't exist
- Network missing: `docker network ls | grep clawer_shared`
- Image missing: `docker images | grep clawer-openclaw`

### 6. "Failed to find Server Action" Errors

**Symptom:** PM2 error logs full of `Failed to find Server Action "x"`.

**Cause:** User's browser has cached JS from a previous deployment. The server action IDs changed.

**Fix:** User needs to hard-refresh (Ctrl+Shift+R) or clear cache. This is cosmetic — doesn't affect API routes.

### 7. Database Connection Issues

**Test connection:**
```bash
ssh root@YOUR_DOCKER_HOST 'PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c "SELECT count(*) FROM users;"'
```

**If Next.js can't connect:** Check `.env.local` on server has correct `DATABASE_URL`:
```
DATABASE_URL=postgresql://clawer:YOUR_DB_PASSWORD@localhost:5432/clawer
```

### 8. Qwen Cron Jobs Going Off-Script

**Symptom:** Qwen cron job output is nonsensical — explaining errors instead of doing the task, trying to spawn sub-agents, discussing tools it doesn't have.

**Cause:** Session pollution. Qwen cron jobs reuse sessions. A single bad run (script error, tool failure, rate limit) creates confused output that becomes context for every subsequent run. Qwen then "helps" with the previous error instead of executing the prompt.

**Diagnosis:**
```
cron → runs → runs (list runs for the job ID)
```
Look for the transition point: runs go from OK summaries to confused responses.

**Fix:**
1. Fix the underlying script error (check exit codes, add `trap '' SIGPIPE` if pipelines involved)
2. The job will naturally get a fresh session after the cron config is updated (any `cron update` resets the session)
3. If still broken: disable + re-enable the job to force a fresh session

**Prevention rules for Qwen cron prompts:**
- Be **brutally explicit**: exact tool name, exact command, nothing ambiguous
- Say what NOT to do: `DO NOT use memory_search, cron tools, sessions_spawn`
- Scripts must handle errors gracefully — exit 0 with an error message, not non-zero
- Use `delivery: "none"` for utility jobs (no need to announce)
- Add `trap '' SIGPIPE` to any script with `set -euo pipefail` that uses pipes

---

## Container Inventory

| Container | Port | Users | Purpose |
|-----------|------|-------|---------|
| `clawer_free_tier` | 4000 | All free users | Shared free tier |
| `clawer_user_39PgWfJYYrb2T36BqfnRgtwlsfM` | 4010 | Keith + 2 others | Paid shared |
| `clawer_user_user_39oXEIzIlIMnVYEMXqfCHxypJWx` | 4012 | 1 user | Paid |

**Container model routing (all containers):**
- Primary: `minimax/MiniMax-M2.5`
- Fallback: `openai/gpt-4o-mini`
- Heartbeats: `ollama/qwen2.5:3b` (via shared Ollama)
- Embeddings: `nomic-embed-text` (via shared Ollama at `http://ollama:11434/v1`)

**Shared services (on `clawer_shared` network):**
- `ollama` — qwen2.5:3b + nomic-embed-text
- `searxng` — web search
- `searxng-proxy` — containerized proxy (port 127.0.0.1:8889)

---

## Deployment

**Pipeline:** Push to `main` → GitHub Actions → rsync to server → `pnpm install && pnpm build` → PM2 restart

**Manual deploy:**
```bash
cd ~/projects/clawer && git push  # triggers CI
```

**Check deploy status:**
```bash
ssh root@YOUR_DOCKER_HOST 'pm2 status clawer'
ssh root@YOUR_DOCKER_HOST 'pm2 logs clawer --lines 10 --nostream'
```

**Rebuild Docker image:**
```bash
ssh root@YOUR_DOCKER_HOST 'cd /opt/clawer-docker && docker build -t clawer-openclaw:v2026.2.19 -f Dockerfile .'
```

---

## File Paths (Server)

| What | Path |
|------|------|
| Next.js app | `/opt/clawer/` |
| PM2 config | PM2 process `clawer` |
| Docker image source | `/opt/clawer-docker/` |
| Entrypoint template | `/opt/clawer-docker/entrypoint.sh` |
| Team templates | `/opt/clawer-docker/teams/{template}/AGENTS.md` |
| Default workspace files | `/opt/defaults/` |
| User data volumes | `/opt/clawer/userdata/{containerName}/` |
| Caddy config | `/etc/caddy/Caddyfile` |
| Umami analytics | Docker port 3033, `https://analytics.clawer.ai` |

---

## Useful Commands

```bash
# Container health check
ssh root@YOUR_DOCKER_HOST 'docker ps --format "{{.Names}} {{.Status}}" | grep clawer_'

# Test chat end-to-end (replace TOKEN and PORT)
ssh root@YOUR_DOCKER_HOST 'curl -s -X POST http://localhost:PORT/api/chat -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d "{\"message\":\"hello\"}" --max-time 30'

# Check all gateway tokens match DB
ssh root@YOUR_DOCKER_HOST 'for c in $(docker ps --format "{{.Names}}" | grep clawer_); do echo "$c: $(docker exec $c python3 -c "import json; print(json.load(open(\"/home/user/.openclaw/openclaw.json\"))[\"gateway\"][\"auth\"][\"token\"])" 2>/dev/null || echo "FAILED")"; done'

# Check MiniMax balance (from any container)
ssh root@YOUR_DOCKER_HOST 'docker exec clawer_free_tier node -e "fetch(\"https://api.minimax.io/anthropic/v1/messages\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\",\"x-api-key\":\"KEY\"},body:JSON.stringify({model:\"MiniMax-M2.5\",max_tokens:5,messages:[{role:\"user\",content:\"hi\"}]})}).then(r=>r.json()).then(console.log)"'

# Restart PM2
ssh root@YOUR_DOCKER_HOST 'pm2 restart clawer'

# DB quick query
ssh root@YOUR_DOCKER_HOST 'PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c "QUERY"'
```

---

## Incident Log

### 2026-02-20: MiniMax "insufficient balance" → all chat broken
- **Impact:** All users got "Failed to connect" for every message
- **Root cause:** MiniMax API key ran out of credits. Container returns 500, gateway times out, Next.js gets socket closed.
- **Detection:** PM2 logs showed `Container request failed: fetch failed` + `other side closed`. Container logs showed `Gateway request timeout`. Direct MiniMax API test returned `insufficient balance (1008)`.
- **Fix:** Keith upgraded MiniMax plan, got new API key. Had to RECREATE all containers (not just restart) because env vars are baked at container creation. Then synced new gateway tokens to DB.
- **Lesson:** Config edits inside running containers are lost on restart — entrypoint regenerates from env vars. Must recreate containers for env var changes.
- **Prevention:** Add MiniMax balance monitoring to War Machine cron. Consider a `/health` endpoint that tests LLM connectivity.

### 2026-02-20: Qwen Memory Summarizer cron broken for 3 days

- **Impact:** No hourly memory summaries written from Feb 18-20. Low severity (background utility job).
- **Root cause (3 compounding issues):**
  1. **SIGPIPE (exit 141):** The script uses `sort -rn | head -1` with `set -euo pipefail`. `head -1` closes the pipe early, `sort` gets SIGPIPE, `pipefail` makes it fatal. Script exits 141.
  2. **Session pollution:** Qwen cron jobs reuse the same session. Once the script errored, Qwen's confused "here's how to fix SIGPIPE" response became context for the next run. Each subsequent run built on the previous garbage — trying to spawn sub-agents, discussing embedding models, saying "exec tool not available."
  3. **Announce delivery failure:** Job had `delivery: "announce"` which tried to send Qwen's nonsensical output to the user, generating additional error noise.
- **Detection:** Cron run history showed a progression: OK → OK → rate_limit → SIGPIPE explanation → agentId errors → embedding talk → "exec not found."
- **Fix:**
  1. Added `trap '' SIGPIPE` to `~/clawd/scripts/hourly-memory-summarizer.sh`
  2. Changed delivery mode to `"none"` (utility job, doesn't need to announce)
  3. Job naturally got a fresh session after the fix
- **Lesson:** **Qwen session pollution is a systemic risk.** Any Qwen cron that errors once will cascade into increasingly confused runs. All Qwen cron prompts must be brutally explicit and self-contained. Consider: (a) forcing fresh sessions per run, or (b) adding `set +o pipefail` or `trap '' SIGPIPE` to ALL scripts run by Qwen crons.
- **Scripts to audit for SIGPIPE:** Any script using `sort | head`, `grep -q` in a pipeline, or similar patterns with `set -euo pipefail`.

### 2026-02-20: Container restart loop from memorySearch config

- **Impact:** All 3 user containers in continuous restart loop. All users unable to use chat.
- **Root cause:** OpenClaw v2026.2.19 moved `memorySearch` from top-level to `agents.defaults.memorySearch`. The Docker image's `entrypoint.sh` still wrote the old format. On every startup, OpenClaw rejected the invalid config and exited (code 1), triggering Docker's restart policy — infinite loop.
- **Detection:** `docker ps` showed all 3 containers as `Restarting (1)`. `docker logs` showed config validation errors on startup.
- **Fix:**
  1. Host `/opt/clawer-docker/entrypoint.sh` was already fixed (correct config format)
  2. Stopped and removed all 3 containers
  3. Deleted stale `openclaw.json` configs from userdata volumes
  4. Recreated containers with `-v /opt/clawer-docker/entrypoint.sh:/entrypoint.sh:ro` so the fixed host entrypoint takes effect without rebuilding the image
  5. Updated gateway tokens in DB after fresh config generation
- **Permanent fix:** Installed the `sync-gateway-tokens.sh` cron (runs every 5 minutes) to automatically keep container gateway tokens in sync with the DB. This prevents token mismatch from causing future "Unauthorized" errors after any container restart or recreation. See "Gateway Token Auto-Sync" section above.
- **Lesson:** Always volume-mount `entrypoint.sh` into containers (`-v /opt/clawer-docker/entrypoint.sh:/entrypoint.sh:ro`) so host edits take effect without image rebuild. The image's copy is frozen at build time.
- **Prevention:** When upgrading OpenClaw image version, verify `entrypoint.sh` config schema against the new version's changelog before deploying.

---

*This is a living document. Update it every time you fix something non-obvious.*

---

## Provisioner Flow (`src/lib/provisioner.ts`)

### How a new paid container is created

Triggered automatically by the Stripe webhook (`checkout.session.completed` → `provisionContainer(userId, teamTemplate)`).

**Step-by-step:**

1. **Validate userId** — must match `/^user_[a-zA-Z0-9]+$/` (Clerk format). Invalid IDs throw immediately.
2. **Check if container already exists** — `docker ps -a --filter name=^clawer_user_${userId}$`. If yes: start it, update DB status to `running`, return existing port/token.
3. **Allocate port** — queries `MAX(containerPort)` from DB, adds 2. Starts at `4010`, max `5000`. Ports are always even-spaced by 2.
4. **Generate gateway token** — 32 random bytes as hex (`crypto.randomBytes(32).toString('hex')`). This is written to DB and baked into the container as `GATEWAY_TOKEN` env var.
5. **Read API keys** — SSH-executes `cat /opt/clawer/.env.local` on the server and parses `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`.
6. **Create host directories** — `mkdir -p /opt/clawer/userdata/${containerName}/.openclaw /opt/clawer/userdata/${containerName}/clawd`. These survive container recreation.
7. **`docker run`** — Creates the container with:
   - `--memory=2g --cpus=1 --pids-limit=256`
   - `--cap-drop=ALL --cap-add=CHOWN,SETUID,SETGID,DAC_OVERRIDE`
   - `--security-opt=no-new-privileges`
   - Port binding: `-p 127.0.0.1:${apiPort}:8081` (only localhost, never public)
   - Volume mounts for `.openclaw` and `clawd` (persistent)
   - Env: `USER_ID`, `TEAM_TEMPLATE`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GATEWAY_TOKEN`
   - `--restart=unless-stopped`
   - Image: `clawer-openclaw:v2026.2.19`
8. **Wait 2 seconds** for container init.
9. **Safety patch check** — scans api-server.js for old nonce bug; patches if found (shouldn't happen with v2026.2.19).
10. **`docker restart`** — Forces entrypoint to run again and write correct `openclaw.json` with `dangerouslyDisableDeviceAuth`.
11. **Update DB** — sets `containerId`, `containerPort`, `containerStatus='running'`, `gatewayToken`, `containerCreatedAt`, `updatedAt`.

**On any failure:** DB is updated to `containerStatus='error'`. Container provisioning does **not** block the user's subscription — billing succeeds even if provisioning fails (container can be manually provisioned later).

### What DB fields are set

| Field | Value | When |
|-------|-------|------|
| `containerId` | Docker short ID | After `docker run` |
| `containerPort` | e.g. `4012` | After port allocation |
| `containerStatus` | `'running'` / `'error'` / `'stopped'` | Throughout |
| `gatewayToken` | 64-char hex string | At provision time |
| `containerCreatedAt` | timestamp | After successful creation |

### What can go wrong

| Error | Symptom | Fix |
|-------|---------|-----|
| SSH failure | `Could not retrieve API keys from server` in PM2 logs | Check SSH key auth to server; check `sshExec` config |
| Port conflict | Container starts but port already in use | Check `docker ps` for conflict; manually set correct port in DB |
| `docker run` fails | `containerStatus='error'` in DB | Check SSH access; check Docker daemon on server |
| Gateway token mismatch after provision | 401 Unauthorized on first chat | Run token sync (see Section 3 "Gateway Token Mismatch") |
| entrypoint didn't write config | Chat fails with "device auth" error | `docker restart <container>` — entrypoint re-runs and rewrites `openclaw.json` |

**Manual re-provision if webhook provision failed:**
```bash
# Check DB state
ssh root@YOUR_DOCKER_HOST 'PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c "SELECT id, container_port, container_status, gateway_token FROM users WHERE id = '"'"'user_XXXXX'"'"';"'

# If container exists but DB is wrong, sync token:
TOKEN=$(ssh root@YOUR_DOCKER_HOST "docker exec clawer_user_user_XXXXX python3 -c \"import json; print(json.load(open('/home/user/.openclaw/openclaw.json'))['gateway']['auth']['token'])\"")
ssh root@YOUR_DOCKER_HOST "PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c \"UPDATE users SET gateway_token='$TOKEN', container_status='running' WHERE id='user_XXXXX';\""
```

---

## Stripe & Billing

### Webhook flow (`src/app/api/webhooks/stripe/route.ts`)

**Endpoint:** `POST /api/webhooks/stripe`

**Security:** Signature verified via `STRIPE_WEBHOOK_SECRET`. If the secret isn't configured, the endpoint returns 500 and blocks all requests. **Never disable signature verification.**

### Events handled

#### `checkout.session.completed` → User subscribes
1. Sets `tier = 'pro'`, saves `stripeCustomerId` and `stripeSubscriptionId` in DB.
2. Sends welcome email (non-blocking; logged if it fails).
3. Calls `provisionContainer(userId, teamTemplate)` — non-blocking; logged if it fails.

#### `customer.subscription.deleted` → Subscription canceled
1. Sets `tier = 'free'`, clears `stripeSubscriptionId`.
2. Calls `stopContainer(userId)` — container is **stopped but not removed** (data preserved for re-subscription).

#### `customer.subscription.updated` → Subscription status changed
- If `status === 'past_due'`: calls `alertPaymentFailure()`. ⚠️ **No email template exists yet** — see TODO in code. Subscription remains active during Stripe's retry window.

#### `invoice.payment_failed` → Payment declined
- Calls `alertPaymentFailure(customerId, 'Invoice payment failed')`.
- Container stays running during Stripe's retry window. Only stopped on `subscription.deleted`.

### Common billing issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| User paid but has no container | Provision failed silently after checkout | Check PM2 logs for `[PROVISION] ❌`; manually call provisioner or SSH and create container |
| User paid but `tier` still `'free'` | Webhook didn't fire or signature check failed | Check Stripe Dashboard → Webhooks → recent events; verify `STRIPE_WEBHOOK_SECRET` in `.env.local` |
| User canceled but container still running | `subscription.deleted` event missed | Manually `stopContainer()` or `docker stop clawer_user_XXXXX` |
| Past-due user still has access | Expected — Stripe retries for several days before canceling | Monitor Stripe Dashboard; container stops only on `subscription.deleted` |

**Check webhook delivery:**
```bash
# On server, test webhook endpoint is reachable
curl -s -o /dev/null -w "%{http_code}" https://clawer.ai/api/webhooks/stripe
# Should return 400 (missing signature) — not 404

# Check PM2 logs for webhook events
ssh root@YOUR_DOCKER_HOST 'pm2 logs clawer --lines 100 --nostream 2>&1 | grep -i "stripe\|webhook\|subscri\|checkout"'
```

**Price IDs:**
- Monthly: `price_1SxtZMKtZGLqQJF6DYKV6Cup`
- Annual: same as monthly (fallback — annual not fully configured yet)

**Customer portal** (for users to manage/cancel): Stripe Customer Portal via `createPortalSession()`. User must have `stripeCustomerId` in DB.

---

## Container Update Procedure (`scripts/update-containers.sh`)

### Full update flow

**Run from:** Locally (`~/projects/clawer/`) or on server. Script SSHes as needed.
**Requires:** `docker`, `jq`, `npm` on the machine running it.

```bash
# Standard update to a new version
~/projects/clawer/scripts/update-containers.sh v2026.2.20

# Dry run first (always recommended)
~/projects/clawer/scripts/update-containers.sh v2026.2.20 --dry-run

# Rollback if something breaks
~/projects/clawer/scripts/update-containers.sh --rollback v2026.2.19
```

**Steps the script takes:**

1. **Acquire tgz** — Looks for `docker/openclaw-user/openclaw-<version>.tgz`. If missing, runs `npm pack openclaw@<version>` to download from npm registry.
2. **Update Dockerfile** — Patches `COPY` and `npm install -g` lines to reference the new tgz filename.
3. **Build Docker image** — `docker build -t clawer-openclaw:v<version> docker/openclaw-user/`. Build log saved to `/tmp/docker-build-*.log`.
4. **For each running `clawer_` container:**
   - `docker inspect` → saves full config to temp JSON
   - Saves all env vars to temp file
   - `docker stop` + `docker rm`
   - Reconstructs `docker run` command from inspect JSON (preserves all ports, volumes, caps, resource limits, restart policy)
   - Creates new container with new image
   - Waits up to 120s (12 × 10s) for health check to pass
   - If health check fails → **auto-rollback to old image**
5. **Summary** — Reports success/failure per container.

### ⚠️ Known issue: AGENTS.md overwrite bug

The entrypoint.sh unconditionally copies the team template `AGENTS.md` on every start, overwriting user customizations. Before running updates in production:

**Fix in `/opt/clawer-docker/entrypoint.sh`:**
```bash
# Change this:
cp "$TEAM_DIR/AGENTS.md" /home/user/clawd/AGENTS.md

# To this:
[ -f /home/user/clawd/AGENTS.md ] || cp "$TEAM_DIR/AGENTS.md" /home/user/clawd/AGENTS.md
```
Also fix in `~/projects/clawer/docker/openclaw-user/entrypoint.sh` and commit.

### Gateway token sync after update

Container recreation preserves env vars (including `GATEWAY_TOKEN`) from the temp env file, so tokens should survive updates. **Verify after any update:**
```bash
ssh root@YOUR_DOCKER_HOST 'for c in $(docker ps --format "{{.Names}}" | grep clawer_user_); do
  DB_TOKEN=$(PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -tAc "SELECT gateway_token FROM users WHERE container_port = $(docker port $c 8081 | cut -d: -f2);" 2>/dev/null)
  CTR_TOKEN=$(docker exec $c python3 -c "import json; print(json.load(open(\"/home/user/.openclaw/openclaw.json\"))[\"gateway\"][\"auth\"][\"token\"])" 2>/dev/null)
  [ "$DB_TOKEN" = "$CTR_TOKEN" ] && echo "$c: OK" || echo "$c: TOKEN MISMATCH"
done'
```

### OpenClaw version check

Weekly cron (Mondays 09:00): `scripts/check-openclaw-version.sh`

```bash
# Manual check
~/projects/clawer/scripts/check-openclaw-version.sh

# JSON output (for scripts)
~/projects/clawer/scripts/check-openclaw-version.sh --json

# Logs
cat ~/projects/clawer/logs/version-check.log
cat ~/projects/clawer/logs/version-check-status.json
```

Checks: npm registry latest → local moltbot install → Docker image version (reads tag from Dockerfile or running image). Exit code 1 = updates available.

---

## Caddy / SSL / Reverse Proxy

**Config file:** `/etc/caddy/Caddyfile` on server
**Service:** `systemd caddy.service` — running continuously, certs auto-renewed via Let's Encrypt

### Current routing rules

```
clawer.ai
  /umami/script.js  →  rewrite to /script.js  →  localhost:3033 (Umami analytics)
  /umami/api/*      →  strip /umami prefix    →  localhost:3033 (Umami API/events)
  /*                →  localhost:3000         (Next.js app)

www.clawer.ai       →  301 redirect to https://clawer.ai

analytics.clawer.ai →  localhost:3033         (Umami dashboard — needs DNS A record pointed to YOUR_DOCKER_HOST)
```

### Common Caddy operations

```bash
# Check Caddy status
ssh root@YOUR_DOCKER_HOST 'systemctl status caddy --no-pager'

# Reload after config change (no downtime)
ssh root@YOUR_DOCKER_HOST 'caddy reload --config /etc/caddy/Caddyfile --force'

# Validate config before applying
ssh root@YOUR_DOCKER_HOST 'caddy validate --config /etc/caddy/Caddyfile'

# View Caddy logs
ssh root@YOUR_DOCKER_HOST 'journalctl -u caddy --since "1 hour ago" -n 50 --no-pager'

# Check cert status
ssh root@YOUR_DOCKER_HOST 'caddy list-installed-packages 2>/dev/null; ls /var/lib/caddy/.local/share/caddy/certificates/acme-v02.api.letsencrypt.org-directory/'

# Restart Caddy (only if reload fails)
ssh root@YOUR_DOCKER_HOST 'systemctl restart caddy'
```

### SSL cert issues

Caddy handles certs automatically. If HTTPS stops working:
- Check domain DNS points to `YOUR_DOCKER_HOST`
- Check port 80 and 443 are open: `ss -tlnp | grep -E '80|443'`
- Check Caddy logs for ACME errors: `journalctl -u caddy | grep -i acme`
- Caddy stores certs in `/var/lib/caddy/.local/share/caddy/`

---

## Free Tier Routing (`src/app/api/chat/route.ts`)

### How routing decisions are made

The chat API checks `users.stripeSubscriptionId` to decide routing:

```
stripeSubscriptionId = NULL  →  Free tier (shared container)
stripeSubscriptionId = set   →  Paid tier (dedicated container)
```

### Free tier limits

| Constant | Value | Env Override |
|----------|-------|-------------|
| `FREE_TIER_PORT` | `4000` | `FREE_TIER_PORT` |
| `FREE_TIER_TOKEN` | `free_tier_shared_2026_clawer` | `FREE_TIER_TOKEN` |
| `FREE_MESSAGE_LIMIT` | `100` total lifetime | — |
| `FREE_DAILY_LIMIT` | `25` per day | — |
| `MAX_MESSAGE_LENGTH` | `32,768` chars (32KB) | — |
| Per-minute rate limit | `20` req/min | — |
| Per-hour rate limit | `200` req/hour | — |

**`FREE_TIER_TOKEN`** is the static auth token for the `clawer_free_tier` container (port 4000). It's a hardcoded default (`free_tier_shared_2026_clawer`) unless `FREE_TIER_TOKEN` env var is set. **This must match the gateway token in the free tier container's `openclaw.json`.** If the container is recreated and generates a new token, update the env var and redeploy.

### Free tier error responses

| `error` field | HTTP Status | Meaning |
|---------------|------------|---------|
| `free_trial_exceeded` | 403 | User hit 100-message lifetime cap |
| `daily_limit_exceeded` | 429 | User hit 25/day limit |
| `rate_limited` | 429 | Too many requests per minute |

### Paid tier failure modes

| Response | HTTP Status | Meaning |
|----------|------------|---------|
| `"Container not provisioned"` | 503 | `containerPort` is null in DB |
| `"Container is stopped"` | 503 | `containerStatus` ≠ `'running'` |

### Check free message usage

```bash
# How many free messages a user has used
ssh root@YOUR_DOCKER_HOST 'PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c "SELECT id, email, free_messages_used, tier, stripe_subscription_id IS NOT NULL AS paid FROM users ORDER BY free_messages_used DESC LIMIT 20;"'

# Reset free message counter for a user (manual override)
ssh root@YOUR_DOCKER_HOST 'PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c "UPDATE users SET free_messages_used = 0 WHERE id = '"'"'user_XXXXX'"'"';"'
```

### Smart request router

The chat route also classifies every message via `routeRequest()` to pick the LLM model:
- **Orchestrator model:** `google/gemini-3-flash` (complex reasoning)
- **Worker model:** `google/gemini-2.0-flash-lite` (bulk/cheap tasks)

This is independent of free/paid routing — both tiers get smart model selection.

---

## Clerk Auth

### How it works

- **Middleware:** `src/middleware.ts` — uses `clerkMiddleware` + `createRouteMatcher`
- **Protected routes:** `/dashboard/*`, `/chat/*`, `/api/chat/*`, `/api/bots/*`, `/api/conversations/*`, `/api/admin/*`, and others (see middleware for full list)
- **Unprotected:** `/api/webhooks/stripe`, `/api/webhooks/clerk`, `/api/slack/events`, public pages, static assets
- **Auth in API routes:** `const { userId } = await auth()` — returns `null` if unauthenticated

### Common Clerk failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| All API routes return 401 | `CLERK_SECRET_KEY` missing or wrong in `.env.local` | Verify env var on server: `grep CLERK_SECRET_KEY /opt/clawer/.env.local` |
| Middleware loop / infinite redirect | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` wrong | Check both Clerk keys match your Clerk dashboard environment |
| Clerk webhook failures | `CLERK_WEBHOOK_SECRET` wrong | Check Clerk Dashboard → Webhooks → signing secret |
| Users can't log in after deploy | Clerk domain mismatch | Ensure `clawer.ai` is in Clerk's allowed origins |
| `auth()` returns null inside API route | Route not matched by middleware | Add route to `isProtectedRoute` in `middleware.ts` |

### Debug Clerk auth

```bash
# Check Clerk env vars are set on server
ssh root@YOUR_DOCKER_HOST 'grep -E "CLERK" /opt/clawer/.env.local | sed "s/=.*/=<YOUR_SECRET>/"'

# Check PM2 logs for auth errors
ssh root@YOUR_DOCKER_HOST 'pm2 logs clawer --lines 100 --nostream 2>&1 | grep -i "clerk\|unauthorized\|401"'

# Test a protected route (should get 401 without token, not 500)
curl -s -o /dev/null -w "%{http_code}" https://clawer.ai/api/chat -X POST -H "Content-Type: application/json" -d '{"message":"test"}'
# Expected: 401
```

### Clerk webhook events

`/api/webhooks/clerk` handles user lifecycle events (not Stripe). Route is excluded from auth middleware so Clerk can POST to it. Verify its signing secret is configured.

---

## Umami Analytics

### Setup

- **Container:** `ghcr.io/umami-software/umami:postgresql-latest` running as `umami-umami-1`
- **Port:** `127.0.0.1:3033` (not exposed publicly — Caddy proxies it)
- **DB:** Separate Postgres instance `umami-umami-db-1` (postgres:15-alpine)
- **Dashboard:** `https://analytics.clawer.ai` (requires DNS A record → `YOUR_DOCKER_HOST`)
- **Script embed:** `https://clawer.ai/umami/script.js` (served via Caddy rewrite)
- **Event collection:** `https://clawer.ai/umami/api/send` (Caddy strips `/umami` prefix)

### Check if Umami is working

```bash
# 1. Container running?
ssh root@YOUR_DOCKER_HOST 'docker ps | grep umami'

# 2. Script endpoint reachable?
curl -s -o /dev/null -w "%{http_code}" https://clawer.ai/umami/script.js
# Expected: 200

# 3. Event collection endpoint reachable?
curl -s -o /dev/null -w "%{http_code}" -X POST https://clawer.ai/umami/api/send \
  -H "Content-Type: application/json" \
  -d '{"payload":{"website":"test"},"type":"event"}'
# Expected: 400 (bad payload) or 200 — NOT 404

# 4. Dashboard accessible?
curl -s -o /dev/null -w "%{http_code}" https://analytics.clawer.ai
# Expected: 200

# 5. Check Umami logs
ssh root@YOUR_DOCKER_HOST 'docker logs umami-umami-1 --tail 20 2>&1'

# 6. If Umami is down, restart
ssh root@YOUR_DOCKER_HOST 'cd /opt/umami && docker compose restart'
# (or wherever the compose file is)
```

### Umami not tracking hits

**Check browser:** Open DevTools → Network → filter for `/umami/script.js` — should be 200. If it's blocked by an ad blocker, that's expected for logged-out users.

**Check script tag in HTML:** The `NEXT_PUBLIC_UMAMI_WEBSITE_ID` env var must be set and the script tag must be in the `<head>` of the page.

```bash
# Verify env var is set
ssh root@YOUR_DOCKER_HOST 'grep UMAMI /opt/clawer/.env.local'
```

---

## Useful Commands (Expanded)

```bash
# Check all user container states vs DB
ssh root@YOUR_DOCKER_HOST 'PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c "SELECT id, tier, container_port, container_status, stripe_subscription_id IS NOT NULL AS paid FROM users WHERE container_port IS NOT NULL ORDER BY container_port;"'

# List containers with their ports and status
ssh root@YOUR_DOCKER_HOST 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep clawer_'

# Check free tier token matches container
ssh root@YOUR_DOCKER_HOST 'docker exec clawer_free_tier python3 -c "import json; print(json.load(open(\"/home/user/.openclaw/openclaw.json\"))[\"gateway\"][\"auth\"][\"token\"])"'

# Test free tier directly (use actual FREE_TIER_TOKEN value)
ssh root@YOUR_DOCKER_HOST 'curl -s -X POST http://localhost:4000/api/chat -H "Content-Type: application/json" -H "Authorization: Bearer free_tier_shared_2026_clawer" -d "{\"message\":\"hello\"}" --max-time 30'

# Count users by tier
ssh root@YOUR_DOCKER_HOST 'PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c "SELECT tier, count(*) FROM users GROUP BY tier;"'

# Find users with payment issues (paid subscription but no container)
ssh root@YOUR_DOCKER_HOST 'PGPASSWORD=YOUR_DB_PASSWORD psql -h localhost -U clawer -d clawer -c "SELECT id, email, tier, container_status FROM users WHERE stripe_subscription_id IS NOT NULL AND (container_port IS NULL OR container_status != '"'"'running'"'"');"'

# Check Caddy is routing correctly
ssh root@YOUR_DOCKER_HOST 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health'

# Verify Stripe webhook secret is set
ssh root@YOUR_DOCKER_HOST 'grep STRIPE_WEBHOOK_SECRET /opt/clawer/.env.local | sed "s/=.*/=<YOUR_SECRET>/"'

# Check update-containers.sh version check log
cat ~/projects/clawer/logs/version-check.log | tail -30

# Full container update dry run
~/projects/clawer/scripts/update-containers.sh v2026.2.19 --dry-run
```
