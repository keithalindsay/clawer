# Clawer.ai V2 Implementation Plan

**Date:** 2026-02-06
**Status:** Ready for Build
**Architecture:** Containerized OpenClaw per user

---

## Architecture Overview

```
User subscribes → Stripe webhook → Provision container → OpenClaw runs
                                          ↓
                              User connects WhatsApp/Telegram
                                          ↓
                              Messages flow through their container
```

Each paying user gets an **isolated OpenClaw container** with Moonshot/Kimi as the model backend.

---

## What We Keep (Already Built ✅)

| Component | File | Status |
|-----------|------|--------|
| Next.js app shell | `src/app/` | ✅ Working |
| Clerk auth | `src/app/(auth)/` | ✅ Working |
| Stripe billing | `src/app/api/stripe/` | ✅ Working |
| Stripe webhook | `src/app/api/webhooks/stripe/route.ts` | ✅ Wired to orchestrator |
| Orchestrator | `src/lib/orchestrator.ts` | ✅ Core functions work |
| Database | Postgres + Drizzle | ✅ Running |
| Rate limiting | `src/lib/rate-limit/` | ✅ Working |
| Landing page | `src/app/page.tsx` | ✅ Working |
| Live server | YOUR_DOCKER_HOST | ✅ PM2 running |

---

## What We Need to Build

### Phase 1: OpenClaw Docker Image (Priority: HIGH)

**Goal:** Build a Docker image that runs actual OpenClaw with Moonshot/Kimi

**Files to create:**
```
docker/openclaw-user/
├── Dockerfile           # Node 20, install openclaw npm package
├── config-template.json # OpenClaw config with Moonshot provider
├── SOUL.md              # Default agent personality
└── entrypoint.sh        # Configure and start OpenClaw gateway
```

**Key requirements:**
- Install `openclaw` npm package (not copy source)
- Configure Moonshot as model provider
- Expose port 8080 for gateway
- Accept env vars: `MOONSHOT_API_KEY`, `USER_ID`
- Health check endpoint
- Support WhatsApp QR linking
- Support Telegram bot token

---

### Phase 2: Dashboard Container Management (Priority: HIGH)

**Goal:** Let users see their container status, connect chat apps

**Files to create/update:**
```
src/app/dashboard/
├── page.tsx             # Show container status, restart button
├── whatsapp/page.tsx    # Proxy QR code from container
└── telegram/page.tsx    # Enter bot token, send to container

src/app/api/container/
├── status/route.ts      # GET container status
├── restart/route.ts     # POST restart container
├── whatsapp/
│   ├── qr/route.ts      # GET QR from user's container
│   └── status/route.ts  # GET WhatsApp connection status
└── telegram/
    ├── connect/route.ts # POST bot token to container
    └── status/route.ts  # GET Telegram connection status
```

**Key requirements:**
- Authenticate user (Clerk)
- Look up their container port from DB
- Proxy requests to `http://localhost:{port}/...`

---

### Phase 3: OpenClaw Config API (Priority: MEDIUM)

**Goal:** OpenClaw container exposes API for runtime config

The OpenClaw gateway should expose:
- `GET /health` - Health check
- `GET /whatsapp/qr` - Get QR code for linking
- `GET /whatsapp/status` - Connection status
- `POST /telegram/connect` - Set bot token
- `GET /telegram/status` - Bot status

This may require custom OpenClaw config or a wrapper script.

---

## Build Order

| # | Task | Owner | Depends On |
|---|------|-------|------------|
| 1 | Build OpenClaw Dockerfile | Engineer 1 | - |
| 2 | Test container locally | Engineer 1 | 1 |
| 3 | Build dashboard status UI | Engineer 2 | - |
| 4 | Build container API proxy | Engineer 2 | - |
| 5 | Build WhatsApp QR flow | Engineer 3 | 1, 4 |
| 6 | Build Telegram connect flow | Engineer 3 | 1, 4 |
| 7 | Integration testing | All | 1-6 |
| 8 | Deploy to production | Lead | 7 |

---

## Engineering Team Assignments

### Engineer 1: Docker & OpenClaw Container
- Research OpenClaw npm package
- Build Dockerfile with proper config
- Test Moonshot/Kimi integration
- Ensure WhatsApp/Telegram work in container

### Engineer 2: Dashboard & API Proxy
- Build container status component
- Build API routes to proxy to containers
- Handle auth + port lookup

### Engineer 3: Chat Platform Integration
- Build WhatsApp QR flow (proxy from container)
- Build Telegram token flow
- Test end-to-end chat flows

---

## Success Criteria

1. ✅ Docker image builds and runs OpenClaw with Moonshot
2. ✅ User subscribes → container auto-provisions
3. ✅ Dashboard shows container status
4. ✅ User can connect WhatsApp via QR
5. ✅ User can connect Telegram via bot token
6. ✅ Messages flow through their isolated container
7. ✅ Container restarts work
8. ✅ Subscription cancel → container removed

---

## Files Archived (Old Scratch Build)

Moved to `archive/v1-scratch-bot/`:
- Bot-worker (non-OpenClaw)
- Telegram direct integration docs
- WhatsApp Baileys integration docs
- Discord/Slack setup docs

---

## Technical Notes

### OpenClaw Installation

OpenClaw is NOT on npm. Install from GitHub:
```bash
npm install github:openclaw/openclaw
# or from local tar
npm pack ~/AIWorkspace/moltbot  # creates openclaw-2026.2.1.tgz
npm install ./openclaw-2026.2.1.tgz
```

### OpenClaw Configuration

Config file: `~/.openclaw/openclaw.json`

```json
{
  "models": {
    "providers": {
      "moonshot": {
        "baseUrl": "https://api.moonshot.cn/v1",
        "api": "openai-completions",
        "models": [{
          "id": "moonshot-v1-8k",
          "name": "Moonshot V1 8K",
          "contextWindow": 8192,
          "maxTokens": 4096
        }]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "moonshot/moonshot-v1-8k"
      },
      "workspace": "/home/user/workspace"
    }
  },
  "gateway": {
    "port": 8080,
    "mode": "local"
  },
  "plugins": {
    "entries": {
      "whatsapp": { "enabled": true },
      "telegram": { "enabled": true }
    }
  },
  "channels": {
    "whatsapp": {
      "dmPolicy": "open"
    }
  }
}
```

### Dockerfile Strategy

Option A: Install from GitHub
```dockerfile
RUN npm install -g github:openclaw/openclaw
```

Option B: Copy packed tarball (faster, more reliable)
```dockerfile
COPY openclaw-2026.2.1.tgz /tmp/
RUN npm install -g /tmp/openclaw-2026.2.1.tgz
```

### Port Allocation

- Base port: 4001
- Max port: 5000
- ~1000 users per server
- Stored in `users.containerPort`

### Container Resources

- Memory: 512MB
- CPU: 0.5 cores
- Restart policy: unless-stopped

---

## Ready for Build

This plan is ready for the engineering team. Spawn parallel engineers for tasks 1-3 (independent), then converge for integration testing.
