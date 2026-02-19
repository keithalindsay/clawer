# Shared Services Architecture for Clawer.ai

**Date:** 2026-02-18  
**Status:** Recommended — Ready to implement  
**Author:** Architecture review (subagent)

---

## TL;DR — The Recommendation

**Option A: Named Docker Network + Dedicated Sidecar Containers**

Create a `clawer_shared` bridge network. Run SearXNG proxy, SearXNG, and Ollama as dedicated containers on that network. Connect every user container to `clawer_shared` at launch. Containers reach shared services by Docker DNS name.

**Why:** SearXNG is already running. The proxy is already working but fragile (bare node process). This architecture just formalizes what you have, adds Ollama for heartbeats, and makes it all restart-safe and maintainable. It takes ~2 hours to implement and zero ongoing maintenance.

---

## Server Specs (Actual — Checked Live)

| Resource | Value | Notes |
|----------|-------|-------|
| CPU | AMD EPYC-Rome, 4 cores | Solid for shared services |
| RAM | 7.6 GB total, 4.6 GB available | **NO swap configured** |
| Disk | 150 GB main (84 GB free), 49 GB HC Volume (47 GB free) |  |
| Running containers | 3 user + postgres + redis + searxng + umami + umami-db | |
| Memory used | ~2.9 GB | ~4.6 GB headroom |

### What This Means for Ollama

- **qwen3:14b — NOT feasible.** Needs ~8 GB RAM, you only have 4.6 GB free. Would immediately OOM.
- **qwen2.5:3b — FEASIBLE.** ~2.3 GB RAM, leaves ~2 GB headroom for user containers.
- **qwen2.5:3b or phi3:mini is the right call for heartbeats** — heartbeats are simple "am I alive?" checks, not heavy reasoning tasks. A 3B model handles them perfectly.
- **nomic-embed-text (embeddings) — FEASIBLE.** ~270 MB. Can run alongside Ollama.
- **Add swap to the server ASAP.** 4 GB on the HC volume would prevent OOM kills. Do this before adding Ollama.

---

## Current State (What Already Exists)

You're further along than the task description suggested:

```
Already running on production:
  ✅ searxng         — Docker container, port 8888 (bridge network)
  ✅ searxng-proxy   — Node process at /opt/searxng-proxy.js, port 8889
  ✅ User containers — Already patched to use 172.17.0.1:8889 for search
  
Missing / needs work:
  ❌ Proxy is unsupervised (no Docker, no systemd — dies on crash)
  ❌ Ollama — not running
  ❌ Named Docker network (everything on default bridge with IPs, no DNS)
  ❌ No swap (risky for Ollama)
```

The proxy is the biggest gap — it's running but will NOT restart if it crashes. Everything else is working.

---

## Architecture Options Compared

### Option A: Named Docker Network + Sidecar Containers ✅ RECOMMENDED

```
┌─────────────────────────────────────────────────────────────────┐
│                     clawer_shared network                        │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   searxng   │  │  searxng-proxy   │  │     ollama       │   │
│  │  port 8080  │◄─│  port 8889       │  │  port 11434      │   │
│  │             │  │  (Brave → SearX) │  │  qwen2.5:3b        │   │
│  └─────────────┘  └──────────────────┘  │  nomic-embed     │   │
│                                          └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ clawer_user_ │  │ clawer_user_ │  │ clawer_user_ │  ...    │
│  │   alice      │  │    bob       │  │   charlie    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Host Network     │
                    │  Caddy (reverse    │
                    │   proxy, TLS)      │
                    └────────────────────┘
```

**Pros:**
- Docker DNS works: containers reach `http://searxng-proxy:8889` by name — no hardcoded IPs
- Each service is its own container — crash one, restart one
- Easy to update individual services without touching others
- Isolation is preserved: user containers can't reach host filesystem or each other (only shared services on the same network)
- `docker compose up` to manage the shared services layer
- Scales to multi-VPS with minimal changes (WireGuard tunnel or overlay network)

**Cons:**
- User containers need `--network clawer_shared` added to `docker run` in provisioner.ts
- First-time: need to `docker pull ollama` and pull the model (~2 GB download)

---

### Option B: Host-level Services

Run SearXNG and Ollama directly on the host, access via `172.17.0.1` from containers.

**Verdict: Skip it.** This is roughly what you have today with the proxy (unsupervised host process). The problem: no restart on crash, hard to update, no resource limits, no health checks. It worked for the proxy as a quick hack but isn't production-grade.

The *only* advantage is avoiding Docker overhead. On a 4-core box, that overhead is negligible.

---

### Option C: Single "Services" Container (All-in-One)

Pack SearXNG + Ollama + proxy into one container.

**Verdict: Skip it.** Violates single-responsibility. Restarting it to update SearXNG restarts Ollama too (drops all in-flight requests, unloads model from RAM). More complex to debug. No real benefit for solo founder. Option A is simpler.

---

### Option D: Something Else?

For the future multi-VPS case, consider **Consul or Docker Swarm overlay network** to let services on VPS-2 reach Ollama on VPS-1 transparently. That's a 6-month problem, not today's.

---

## Specific Design Decisions

### 1. Docker Networking

**Decision:** `clawer_shared` bridge network with `internal: false` (to allow egress for SearXNG to fetch search results).

User containers connect to **two networks**:
- Default bridge (for Caddy port mapping — already working)
- `clawer_shared` (for shared services DNS)

This is supported: Docker containers can be on multiple networks simultaneously.

```bash
# At container launch, add:
--network clawer_shared
```

Docker DNS then resolves `searxng-proxy`, `ollama`, etc. by container name within `clawer_shared`.

### 2. Resource Management

Ollama with qwen2.5:3b needs ~2.3 GB RAM. To make this safe:

**Step 0 (before adding Ollama): Add swap.**
```bash
# On host:
fallocate -l 4G /mnt/HC_Volume_104591317/swapfile
chmod 600 /mnt/HC_Volume_104591317/swapfile
mkswap /mnt/HC_Volume_104591317/swapfile
swapon /mnt/HC_Volume_104591317/swapfile
echo '/mnt/HC_Volume_104591317/swapfile none swap sw 0 0' >> /etc/fstab
```

**Ollama resource limits in compose:**
```yaml
deploy:
  resources:
    limits:
      memory: 3G
      cpus: '2.0'
```

**Per-user container limits** should also be audited — current limit is 2 GB each. With 20 containers, that's theoretically 40 GB (Linux doesn't actually allocate until used, but OOM risk is real without swap).

### 3. Security

Container isolation is maintained because:
- `clawer_shared` is a bridge network, not host networking — containers only see other containers on the same network
- User containers still have `--cap-drop=ALL` and `--security-opt=no-new-privileges`
- Shared services don't expose anything to the internet (internal Docker network, host ports optional)
- User containers cannot reach each other's ports or host filesystem

**DOS risk (malicious user hammering Ollama):**
- Short term (0-10 users): Accept the risk. Add a simple queue in the proxy or rely on Ollama's built-in request queuing.
- Medium term (10-40 users): Add per-container rate limiting via a Caddy or nginx sidecar in front of Ollama, or use Ollama's `OLLAMA_MAX_QUEUE` env var.
- Ollama already serializes requests by default (one at a time, queues the rest). A malicious container can slow others down but can't crash the service.

### 4. Rate Limiting

**Not needed for MVP.** Ollama queues requests natively. SearXNG handles concurrent requests fine.

Add rate limiting when you see evidence of abuse or when you have 20+ users. A simple approach at that point:
- nginx in front of Ollama with `limit_req_zone` per container IP
- Or a lightweight token-bucket proxy (50-100 lines of Node)

### 5. Configuration

Each container's openclaw.json is generated by `entrypoint.sh`. Changes needed:
1. Set `SEARXNG_PROXY_URL` to `http://searxng-proxy:8889/res/v1/web/search`
2. Add heartbeat model override pointing to `http://ollama:11434`
3. Add embeddings config pointing to Ollama's nomic-embed-text

Full patch in `docker/shared-services/entrypoint-patch.md`.

### 6. Scaling to Multiple VPS

**6-month plan: WireGuard mesh**

When you add VPS-2:
1. Install WireGuard on both servers
2. VPS-1 hosts shared services (searxng, ollama) — they stay put
3. VPS-2 user containers reach VPS-1 services via WireGuard IP (e.g., `10.0.0.1`)
4. Update `SEARXNG_PROXY_URL` and Ollama base URL to use WireGuard IPs for VPS-2 containers

No DNS changes needed — just env var differences per VPS.

**Alternative:** Run SearXNG on each VPS (lightweight), keep Ollama only on VPS-1 (heavy). Use WireGuard only for Ollama traffic.

### 7. Monitoring

**Immediate (free):**
```bash
# Cron every 5 min, alert if unhealthy:
watch -n 300 'docker inspect --format="{{.Name}}: {{.State.Health.Status}}" searxng ollama searxng-proxy'
```

**Better:** You have Umami running. Add a simple uptime endpoint to the existing Next.js app that checks:
- `GET http://localhost:8889/health` (proxy)
- `GET http://localhost:11434/api/version` (ollama)
- `GET http://localhost:8888/` (searxng)

Show this on an internal `/admin/services` page.

**For 40+ users:** Add Prometheus + Grafana on the HC volume. Collect Ollama metrics (it exposes Prometheus endpoints natively) and container CPU/RAM stats.

---

## Resource Budget (Realistic)

| Service | RAM | CPU | Notes |
|---------|-----|-----|-------|
| Ollama (qwen2.5:3b) | 2.3 GB | 2 cores (inference) | Sequential requests |
| nomic-embed-text | loaded within Ollama | minimal | 270 MB when active |
| SearXNG | 370 MB | <0.1 core | Already running |
| searxng-proxy | 50 MB | <0.1 core | Node.js |
| postgres | 200 MB | <0.1 core | Already running |
| redis | 50 MB | <0.1 core | Already running |
| umami | 200 MB | <0.1 core | Already running |
| **Shared services total** | **~3.2 GB** | **~2.5 cores** | |
| **Per user container** | 200-500 MB active | 0.1-0.3 cores idle | Limit is 2 GB, actual is much less |
| **10 user containers** | ~1-2 GB | ~1 core | Estimate |
| **20 user containers** | ~2-4 GB | ~2 cores | Getting tight |
| **Total at 10 users** | ~5 GB | ~3.5 cores | OK with 4.6 GB free + swap |
| **Total at 20 users** | ~7 GB | ~4.5 cores | **Needs VPS upgrade** |

**Conclusion:** This VPS comfortably supports up to 10-12 concurrent users with shared services. Beyond that, upgrade to a 16 GB RAM VPS (~$40/month) or split services.

---

## Implementation Steps (Ordered)

### Phase 1: Stabilize What Exists (30 min)

**Step 1.1 — Add swap** (critical, do before anything else)
```bash
# SSH to server
fallocate -l 4G /mnt/HC_Volume_104591317/swapfile
chmod 600 /mnt/HC_Volume_104591317/swapfile
mkswap /mnt/HC_Volume_104591317/swapfile
swapon /mnt/HC_Volume_104591317/swapfile
echo '/mnt/HC_Volume_104591317/swapfile none swap sw 0 0' >> /etc/fstab
free -h  # verify
```

**Step 1.2 — Create `clawer_shared` Docker network**
```bash
docker network create clawer_shared
```

**Step 1.3 — Containerize the searxng proxy**
Deploy via `docker/shared-services/docker-compose.yml`. This replaces the fragile bare node process.
```bash
cd /opt/clawer-shared
docker compose up -d searxng-proxy
# Kill the old bare process
kill $(pgrep -f "node /opt/searxng-proxy.js")
```

**Step 1.4 — Connect SearXNG to `clawer_shared`**
```bash
docker network connect clawer_shared searxng
```

### Phase 2: Add Ollama (60-90 min including model download)

**Step 2.1 — Add Ollama to compose, pull model**
```bash
docker compose up -d ollama
docker exec ollama ollama pull qwen2.5:3b
docker exec ollama ollama pull nomic-embed-text
```

The qwen2.5:3b model is ~2 GB — download time depends on connection speed.

**Step 2.2 — Test Ollama**
```bash
curl http://localhost:11434/api/generate -d '{"model":"qwen2.5:3b","prompt":"ping","stream":false}'
```

### Phase 3: Wire User Containers to Shared Services (30 min)

**Step 3.1 — Update `entrypoint.sh`** (see `entrypoint-patch.md`)
- Change default `SEARXNG_PROXY_URL` to use Docker DNS name
- Add heartbeat model config
- Add embeddings config

**Step 3.2 — Update `provisioner.ts`**
Add `--network clawer_shared` to the `docker run` command.

**Step 3.3 — Rebuild container image and redeploy**
```bash
# Build new image with updated entrypoint.sh
./scripts/build.sh  # whatever your build script is

# Restart existing containers (they'll pick up new network + entrypoint on restart)
# Option A: Rolling restart
docker restart clawer_free_tier
docker restart clawer_user_39PgWfJYYrb2T36BqfnRgtwlsfM
# etc.

# Option B: For existing containers, connect them to the shared network
docker network connect clawer_shared clawer_free_tier
docker network connect clawer_shared clawer_user_39PgWfJYYrb2T36BqfnRgtwlsfM
# etc.
```

Note: Existing containers still need to be connected to `clawer_shared` manually (they were provisioned before this network existed). New containers will be connected at launch via the updated provisioner.

### Phase 4: Verification (15 min)

```bash
# Test from inside a user container
docker exec clawer_free_tier curl http://searxng-proxy:8889/health
docker exec clawer_free_tier curl "http://searxng-proxy:8889/res/v1/web/search?q=test"
docker exec clawer_free_tier curl http://ollama:11434/api/version

# Test search from agent (ask the agent to web_search something)
# Test heartbeat (check openclaw logs — should show model=ollama/qwen2.5:3b for heartbeats)
```

---

## Files in This Directory

```
docker/shared-services/
├── docker-compose.yml       # Deploy shared services
└── entrypoint-patch.md      # Changes to entrypoint.sh
```

---

## What Changes in provisioner.ts

In `src/lib/provisioner.ts`, add `--network clawer_shared` to the `dockerCmd` array:

```typescript
const dockerCmd = [
  'docker run -d',
  `--name ${containerName}`,
  // Resource limits
  '--memory=2g',
  '--memory-swap=2g',
  '--cpus=1',
  '--pids-limit=256',
  '--ulimit nofile=1024:2048',
  // Security hardening
  '--security-opt=no-new-privileges',
  '--cap-drop=ALL',
  '--cap-add=CHOWN',
  '--cap-add=SETUID',
  '--cap-add=SETGID',
  '--cap-add=DAC_OVERRIDE',
  '--tmpfs /tmp:rw,noexec,nosuid,size=256m',
  // Network — join shared services network for DNS access
  '--network clawer_shared',             // ← ADD THIS LINE
  // Port
  `-p 127.0.0.1:${apiPort}:8081`,
  // Volume mounts
  ...
```
