# Clawer.ai - System Architecture

**Version:** 2.0 (Container-based)  
**Last Updated:** 2026-02-08  
**Status:** Production

---

## Executive Summary

Clawer.ai is a **managed OpenClaw SaaS** that provisions isolated Docker containers for each paying user. The core value proposition is **personal AI assistant-as-a-service** with WhatsApp, Telegram, and web chat integration.

**Architecture Pattern:** Container-per-user isolation  
**AI Backend:** OpenClaw (containerized) → OpenAI GPT models  
**Search Backend:** Self-hosted SearXNG (replacing Brave API)

---

## System Topology

```
┌────────────────────────────────────────────────────────────────┐
│                         Internet                                │
└─────────────────┬──────────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Reverse Proxy  │ (Caddy/Nginx)
         │  :443 → :3002   │
         └────────┬───────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js App (PM2)                             │
│                 Port 3002 on YOUR_DOCKER_HOST                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Dashboard   │  │   Auth (Clerk)│  │  Billing API  │         │
│  │   /dashboard  │  │   /sign-in    │  │  /api/stripe  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     API Routes                            │  │
│  │  /api/chat             Chat messages → containers        │  │
│  │  /api/container/*      Container management              │  │
│  │  /api/usage            Token usage tracking              │  │
│  │  /api/diagnose         AI-powered diagnostics            │  │
│  │  /api/webhooks/*       Stripe + Clerk webhooks           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────┬────────────────────────────┬──────────────────────┘
              │                            │
              ▼                            ▼
    ┌──────────────────┐         ┌──────────────────┐
    │   PostgreSQL      │         │      Redis       │
    │   Port 5432       │         │   Port 6379      │
    │                   │         │  (Rate Limiting) │
    │ • users           │         └──────────────────┘
    │ • weekly_usage    │
    │ • admin_settings  │
    └───────────────────┘
              │
              │ Container orchestration
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Docker Engine                              │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │  Container: user_1    │  │  Container: user_2    │   ...     │
│  │  clawer-openclaw      │  │  clawer-openclaw      │            │
│  │                       │  │                       │            │
│  │  Port 4001:8080       │  │  Port 4003:8080       │            │
│  │  Port 4002:8081       │  │  Port 4004:8081       │            │
│  │                       │  │                       │            │
│  │  ┌─────────────────┐ │  │  ┌─────────────────┐ │            │
│  │  │ OpenClaw Gateway│ │  │  │ OpenClaw Gateway│ │            │
│  │  │   (port 8080)   │ │  │  │   (port 8080)   │ │            │
│  │  └────────┬────────┘ │  │  └────────┬────────┘ │            │
│  │           │           │  │           │           │            │
│  │           ▼           │  │           ▼           │            │
│  │  ┌─────────────────┐ │  │  ┌─────────────────┐ │            │
│  │  │  API Server     │ │  │  │  API Server     │ │            │
│  │  │  (port 8081)    │ │  │  │  (port 8081)    │ │            │
│  │  │  HTTP wrapper   │ │  │  │  HTTP wrapper   │ │            │
│  │  └─────────────────┘ │  │  └─────────────────┘ │            │
│  │                       │  │                       │            │
│  │  WhatsApp ✓           │  │  Telegram ✓           │            │
│  └───────┬───────────────┘  └───────┬───────────────┘            │
│          │                          │                            │
│          └──────────────┬───────────┘                            │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │   OpenAI API      │
                │   GPT-4o-mini     │
                │   (primary model) │
                └──────────────────┘
                          │
                    ┌─────▼──────┐
                    │  SearXNG    │
                    │ Port 8889   │
                    │ (web search)│
                    └─────────────┘
```

---

## Data Flow Diagrams

### User Signup → Container Provisioning

```
User signs up (Clerk)
    │
    ├─> Clerk webhook → POST /api/webhooks/clerk
    │                    └─> Create user in DB (tier=free)
    │
User subscribes (Stripe)
    │
    ├─> Stripe Checkout → checkout.session.completed webhook
    │                       └─> POST /api/webhooks/stripe
    │                           │
    │                           ├─> Update user:
    │                           │   • stripeCustomerId
    │                           │   • stripeSubscriptionId
    │                           │   • tier=pro
    │                           │
    │                           └─> provisionContainer(userId)
    │                               │
    │                               ├─> Allocate port pair (4001-5000)
    │                               ├─> docker run clawer-openclaw:latest
    │                               │   • Memory: 1GB
    │                               │   • CPU: 1 core
    │                               │   • Ports: 4001:8080, 4002:8081
    │                               │   • Env: OPENAI_API_KEY, GATEWAY_TOKEN
    │                               │
    │                               └─> Update users table:
    │                                   • containerId
    │                                   • containerPort
    │                                   • containerStatus='running'
    │
Container ready ✅
```

### Chat Message Flow

```
User sends message
    │
    ├─> Web Chat:     POST /api/chat
    ├─> WhatsApp:     Container webhook → Container API
    └─> Telegram:     Container webhook → Container API
        │
        ▼
    POST /api/chat
        │
        ├─> Clerk auth check (userId)
        ├─> DB lookup: user.stripeSubscriptionId (check subscription)
        ├─> DB lookup: user.containerPort, user.containerStatus
        │   └─> If no container or stopped → 503 error
        │
        ▼
    containerApi.chat(port, message, context, settings)
        │
        └─> POST http://localhost:{containerPort+1}/api/chat
            {
              message: "user message",
              context: { conversationId, userId },
              settings: { botName, personality, ... }
            }
            │
            ▼
    Container's api-server.js
        │
        ├─> Build system prompt from settings
        ├─> WebSocket → OpenClaw Gateway
        │   └─> chat.send event
        │
        ├─> OpenClaw Agent processes:
        │   ├─> Intent understanding
        │   ├─> Tool selection (web_search, file_read, etc.)
        │   └─> LLM call → OpenAI API
        │
        ├─> Wait for agent.complete event
        │   └─> Extract response content
        │
        └─> Return { content: "AI response" }
            │
            ▼
    Response sent to user (web/WhatsApp/Telegram)
```

### Container Health Monitoring

```
Every 60 seconds:
    │
    ├─> Health checker runs
    │   │
    │   ├─> For each user with containerPort:
    │   │   │
    │   │   ├─> Check Docker status
    │   │   │   docker ps -a --filter name=clawer_user_{userId}
    │   │   │
    │   │   ├─> Check HTTP health endpoint
    │   │   │   GET http://localhost:{port}/health
    │   │   │
    │   │   └─> If unhealthy:
    │   │       ├─> Attempt restart (max 3 times)
    │   │       └─> Update DB: containerStatus='error'
    │   │
    │   └─> Log health status
```

---

## API Routes Inventory

### Authentication Requirements

- 🔓 **Public**: No auth required
- 🔑 **User**: Requires Clerk authentication
- 👑 **Admin**: Requires admin role check
- 🔗 **Webhook**: Requires signature verification

### Chat & Messaging

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/chat` | POST | 🔑 | Send message to user's container |
| `/api/messages` | GET | 🔑 | List recent messages (stub) |

### Container Management

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/container/status` | GET | 🔑 | Get container health status |
| `/api/container/restart` | POST | 🔑 | Restart user's container |
| `/api/container/whatsapp/qr` | GET | 🔑 | Get WhatsApp QR code for linking |
| `/api/container/whatsapp/status` | GET | 🔑 | WhatsApp connection status |
| `/api/container/telegram/connect` | POST | 🔑 | Set Telegram bot token |
| `/api/container/telegram/status` | GET | 🔑 | Telegram connection status |

### Admin

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/admin/settings` | GET/POST | 👑 | LLM provider API keys |
| `/api/admin/container/restart` | POST | 👑 | Restart any user's container |
| `/api/admin/container/logs` | GET | 👑 | View container logs |

### Billing

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/stripe/checkout` | POST | 🔑 | Create checkout session |
| `/api/stripe/portal` | POST | 🔑 | Redirect to customer portal |
| `/api/webhooks/stripe` | POST | 🔗 | Handle subscription events |

### User Management

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/user` | GET | 🔑 | Get user profile (stub - returns mock) |
| `/api/user/usage` | GET | 🔑 | Get usage stats |
| `/api/webhooks/clerk` | POST | 🔗 | Handle user create/update/delete |

### Usage Tracking

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/usage` | GET | 🔑 | Current week usage summary |
| `/api/usage/details` | GET | 🔑 | Per-request breakdown (stub) |

### Diagnostics

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/diagnose` | POST | 🔑 | AI-powered container diagnostics |

### Model Configuration (Future)

| Route | Method | Auth | Purpose | Status |
|-------|--------|------|---------|--------|
| `/api/models` | GET | 🔑 | List available models | Stub |
| `/api/models/configure` | POST | 🔑 | Update user's model config | Stub |
| `/api/models/preview` | GET | 🔑 | Preview pricing for config | Stub |

### Bots (Unused)

| Route | Method | Auth | Purpose | Status |
|-------|--------|------|---------|--------|
| `/api/bots` | GET | 🔑 | List user bots | Unused |
| `/api/bots/[botId]` | GET/PUT | 🔑 | Bot CRUD | Unused |
| `/api/bots/[botId]/activate` | POST | 🔑 | Activate bot | 501 Not Implemented |
| `/api/bot/settings` | GET/POST | 🔑 | Bot settings | Unused |

### Platform Integrations (Partial)

| Route | Method | Auth | Purpose | Status |
|-------|--------|------|---------|--------|
| `/api/telegram/connect` | POST | 🔑 | Connect Telegram bot | ✅ Working |
| `/api/telegram/disconnect` | POST | 🔑 | Disconnect Telegram | ✅ Working |
| `/api/telegram/status` | GET | 🔑 | Telegram status | ✅ Working |
| `/api/slack/connect` | POST | 🔑 | OAuth connect Slack | Stub |
| `/api/slack/events` | POST | 🔗 | Slack event handler | Stub |

---

## Database Schema

### Active Tables (In Use)

#### `users` - Core user data
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                        -- Clerk user ID
  email TEXT NOT NULL,
  name TEXT,
  tier TEXT NOT NULL DEFAULT 'free',          -- Subscription tier
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Container
  container_id TEXT,                          -- Docker container ID
  container_port INTEGER,                     -- Host port (4001, 4003, ...)
  container_status TEXT,                      -- running|stopped|error
  container_created_at TIMESTAMP,
  
  -- Platform connections
  whatsapp_connected INTEGER DEFAULT 0,
  telegram_connected INTEGER DEFAULT 0,
  telegram_bot_token TEXT,
  telegram_bot_username TEXT,
  
  -- Usage tracking
  daily_message_count INTEGER DEFAULT 0,
  daily_reset_at TIMESTAMP DEFAULT NOW(),
  monthly_message_count INTEGER DEFAULT 0,
  monthly_reset_at TIMESTAMP DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP                        -- Soft delete
);
```

**Indexes:**
- Primary key on `id`
- Recommended: `CREATE INDEX users_container_port_idx ON users(container_port) WHERE container_port IS NOT NULL;`
- Recommended: `CREATE INDEX users_stripe_subscription_idx ON users(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;`

#### `weekly_usage` - Token tracking
```sql
CREATE TABLE weekly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  
  -- Week boundaries
  week_start TIMESTAMP NOT NULL,
  week_end TIMESTAMP NOT NULL,
  
  -- Token counts
  orchestrator_input_tokens BIGINT DEFAULT 0,
  orchestrator_output_tokens BIGINT DEFAULT 0,
  worker_input_tokens BIGINT DEFAULT 0,
  worker_output_tokens BIGINT DEFAULT 0,
  total_oet BIGINT DEFAULT 0,                 -- Normalized tokens
  
  -- Cost
  estimated_cost_usd DECIMAL(10, 4) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, week_start)
);
```

**Status:** Created but not actively written to (token tracking not wired up yet)

#### `admin_settings` - System configuration
```sql
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,           -- 'openai_api_key', etc.
  setting_value TEXT NOT NULL,                -- Encrypted value
  encrypted BOOLEAN DEFAULT false,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Usage:** Stores LLM provider API keys (not currently synced with container env vars)

### Unused Tables (Candidates for Removal)

#### `bots` - Bot instances (not implemented)
```sql
CREATE TABLE bots (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  personality TEXT,
  capabilities JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Status:** ❌ Never used

#### `conversations` - Chat history (not implemented)
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  bot_id UUID REFERENCES bots(id),
  platform TEXT,                              -- 'whatsapp'|'telegram'|'web'
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Status:** ❌ Never used

#### `messages` - Message storage (not implemented)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL,                         -- 'user'|'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Status:** ❌ Never used

#### `integrations` - OAuth connections (not implemented)
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  platform TEXT NOT NULL,                     -- 'gmail'|'calendar'|'slack'
  access_token TEXT NOT NULL,                 -- Encrypted
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Status:** ❌ Never used (OAuth not implemented)

#### `usage_records` - Per-request tracking (not implemented)
```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  tokens_used INTEGER,
  model TEXT,
  request_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Status:** ❌ Never used (tracking not wired up)

#### `daily_usage_summary` - Aggregated daily stats (not implemented)
```sql
CREATE TABLE daily_usage_summary (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  date DATE NOT NULL,
  total_tokens BIGINT,
  message_count INTEGER,
  UNIQUE(user_id, date)
);
```
**Status:** ❌ Never used (aggregation job not running)

#### `instances` - Duplicate container tracking (broken FK)
```sql
CREATE TABLE instances (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,                      -- ❌ WRONG TYPE! Should be TEXT
  container_id TEXT,
  port INTEGER,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```
**Status:** ❌ Never used + **BROKEN** (FK type mismatch: `user_id` is UUID but `users.id` is TEXT)

#### `model_configs` - User model preferences (not implemented)
```sql
CREATE TABLE model_configs (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  orchestrator_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  worker_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash-lite',
  orchestrator_addon_cents INTEGER DEFAULT 800,
  worker_addon_cents INTEGER DEFAULT 200,
  total_monthly_cents INTEGER DEFAULT 3900,
  updated_at TIMESTAMP DEFAULT NOW(),
  stripe_price_id TEXT,
  UNIQUE(user_id)
);
```
**Status:** ❌ Never used (model selection UI not built)

#### `bot_settings` - Bot configuration (not queried)
```sql
CREATE TABLE bot_settings (
  id UUID PRIMARY KEY,
  bot_id UUID REFERENCES bots(id),
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  UNIQUE(bot_id, setting_key)
);
```
**Status:** ❌ Never queried

#### `whatsapp_connections` - Redundant with users table
```sql
CREATE TABLE whatsapp_connections (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  phone_number TEXT,
  connected_at TIMESTAMP
);
```
**Status:** ❌ Redundant with `users.whatsapp_connected`

#### `discord_connections` - Discord not implemented
```sql
CREATE TABLE discord_connections (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  guild_id TEXT,
  bot_token TEXT,
  connected_at TIMESTAMP
);
```
**Status:** ❌ Discord integration not implemented

---

## Container Architecture

### Docker Image: `clawer-openclaw:latest`

**Base Image:** `node:22-slim`  
**Size:** ~17MB compressed tarball + dependencies  
**Source:** Built from `/home/keith/projects/clawer/docker/openclaw-user/`

**What's Inside:**
- OpenClaw npm package (from `openclaw-2026.2.6-3.tgz`)
- Python3, make, g++ (for native module compilation)
- Custom entrypoint script
- API server wrapper (Node.js HTTP → OpenClaw WebSocket)
- Config template with placeholders
- SOUL.md (default agent personality)

### Container Lifecycle

```
docker run -d \
  --name clawer_user_{userId} \
  --restart unless-stopped \
  --memory 1g \
  --cpus 1.0 \
  -p {port}:8080 \
  -p {port+1}:8081 \
  -e OPENAI_API_KEY=${OPENAI_API_KEY} \
  -e GATEWAY_TOKEN=${GATEWAY_TOKEN} \
  -e SEARXNG_PROXY_URL=http://172.17.0.1:8889/res/v1/web/search \
  clawer-openclaw:latest
```

### Port Allocation

- **Base port:** 4001
- **Max port:** 5000
- **Step:** 2 (each container uses 2 ports)
- **Capacity:** ~500 containers per server
- **Port mapping:** Host:{port} → Container:8080 (gateway), Host:{port+1} → Container:8081 (API)

### Entrypoint Flow

1. **Validate environment**: Check `OPENAI_API_KEY` is set
2. **Generate token**: Create random `GATEWAY_TOKEN` if not provided
3. **Create config**: Substitute placeholders in `openclaw.json.template`
   - Insert `OPENAI_API_KEY`
   - Insert `GATEWAY_TOKEN`
4. **Patch OpenClaw**: Replace Brave API URL with SearXNG proxy
   ```bash
   sed -i "s|https://api.search.brave.com/res/v1/web/search|http://172.17.0.1:8889/res/v1/web/search|g" \
     /usr/local/lib/node_modules/openclaw/dist/**/*.js
   ```
5. **Set dummy Brave key**: `BRAVE_API_KEY=searxng-local-proxy` (enables search tool)
6. **Start API server**: Background process on port 8081
7. **Start OpenClaw gateway**: Foreground process on port 8080

### OpenClaw Configuration

**Template:** `/home/user/.openclaw/openclaw.json.template`

Key settings:
```json
{
  "models": {
    "providers": {
      "openai": {
        "apiKey": "OPENAI_API_KEY_PLACEHOLDER",
        "models": [{
          "id": "gpt-4o-mini",
          "name": "GPT-4o Mini",
          "contextWindow": 128000,
          "maxTokens": 16384
        }]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-4o-mini"
      },
      "workspace": "/home/user/clawd"
    }
  },
  "gateway": {
    "port": 8080,
    "mode": "local",
    "token": "GATEWAY_TOKEN_PLACEHOLDER"
  },
  "plugins": {
    "entries": {
      "whatsapp": { "enabled": true },
      "telegram": { "enabled": true }
    }
  },
  "channels": {
    "whatsapp": { "dmPolicy": "open" },
    "telegram": { "dmPolicy": "open" }
  }
}
```

### API Server (Port 8081)

**File:** `api-server.js` (inside container)

Exposes REST endpoints that proxy to OpenClaw Gateway (WebSocket):

- `POST /api/chat` - Send message, get response
- `GET /health` - Health check
- `GET /whatsapp/qr` - Get WhatsApp QR code
- `GET /whatsapp/status` - WhatsApp connection status
- `POST /telegram/connect` - Set Telegram bot token
- `GET /telegram/status` - Telegram connection status

### Container Networking

**Current Setup:**
- All containers on default Docker bridge network (`172.17.0.0/16`)
- Containers can reach host via `172.17.0.1`
- SearXNG exposed on host port 8889

**Security Note:** Containers can theoretically reach each other. For production, consider:
```bash
docker network create --internal clawer-internal
docker run --network clawer-internal ...
```

### Resource Limits

Per container:
- **Memory:** 1GB (hard limit)
- **CPU:** 1.0 cores
- **Disk:** No quota (⚠️ security risk)
- **Network:** No bandwidth limit
- **PIDs:** No limit (⚠️ security risk)

**Recommended hardening:**
```bash
docker run \
  --memory 1g \
  --cpus 1.0 \
  --pids-limit 100 \
  --storage-opt size=5G \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --read-only \
  --tmpfs /tmp \
  ...
```

---

## Deployment Pipeline

### Server Environment

- **Server:** YOUR_DOCKER_HOST
- **OS:** Ubuntu 22.04 LTS (assumed)
- **User:** root (or dedicated user)
- **App directory:** `/opt/clawer` (assumed)
- **Process manager:** PM2
- **Port:** 3002 (Next.js app)
- **Reverse proxy:** Caddy or Nginx (assumed, proxying :443 → :3002)

### Build Process

```bash
# Local development
git checkout main
git pull
npm install
npm run build          # next build

# Generate types (if schema changed)
npm run db:generate    # drizzle-kit generate
```

### Deploy to Server

```bash
# Rsync deployment
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env*' \
  ./ root@YOUR_DOCKER_HOST:/opt/clawer/

# SSH to server
ssh root@YOUR_DOCKER_HOST

cd /opt/clawer
npm install --production
npm run build

# Run database migrations
npm run db:push        # drizzle-kit push (applies schema changes)

# Restart PM2 process
pm2 restart clawer     # or: pm2 restart ecosystem.config.js
```

### Docker Image Deployment

When container code changes:

```bash
# Build image locally
cd docker/openclaw-user
docker build -t clawer-openclaw:latest .

# Save and transfer
docker save clawer-openclaw:latest | gzip > /tmp/clawer-openclaw.tar.gz
scp /tmp/clawer-openclaw.tar.gz root@YOUR_DOCKER_HOST:/tmp/

# Load on server
ssh root@YOUR_DOCKER_HOST
docker load < /tmp/clawer-openclaw.tar.gz

# Restart existing containers (optional, for updates)
docker ps --filter "name=clawer_user_" --format "{{.Names}}" | xargs -I {} docker restart {}
```

### PM2 Configuration

**Recommended:** Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [{
    name: 'clawer-web',
    script: 'npm',
    args: 'start',
    cwd: '/opt/clawer',
    instances: 1,              // Or 2 for cluster mode
    exec_mode: 'fork',         // Or 'cluster' for load balancing
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
  }],
};
```

**Start/Restart:**
```bash
pm2 start ecosystem.config.js
pm2 restart clawer-web
pm2 logs clawer-web
pm2 status
```

---

## Environment Variables

### Required (Server)

```bash
# Next.js
NODE_ENV=production
PORT=3002

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clawer?sslmode=require

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# OpenAI (for containers)
OPENAI_API_KEY=sk-...

# API URLs
NEXT_PUBLIC_API_URL=https://clawer.ai
```

### Optional

```bash
# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379

# Google API (if using Gmail/Calendar integrations)
GOOGLE_API_KEY=...

# Brave API (if using Brave Search instead of SearXNG)
BRAVE_API_KEY=...

# Container defaults
CONTAINER_HOST=localhost
```

### Container Environment

Injected by orchestrator when provisioning:

```bash
OPENAI_API_KEY=${process.env.OPENAI_API_KEY}
GATEWAY_TOKEN=${randomToken}
SEARXNG_PROXY_URL=http://172.17.0.1:8889/res/v1/web/search
BRAVE_API_KEY=searxng-local-proxy  # Dummy value to enable search
```

---

## SearXNG Integration

### Purpose

Replace Brave Search API (rate limits + cost) with self-hosted search aggregator.

### Setup

**SearXNG Container:**
```bash
docker run -d \
  --name searxng \
  --restart unless-stopped \
  -p 8889:8080 \
  -v $(pwd)/searxng:/etc/searxng \
  searxng/searxng:latest
```

**Configuration:** `/etc/searxng/settings.yml`
```yaml
server:
  port: 8080
  bind_address: "0.0.0.0"

search:
  formats:
    - html
    - json

engines:
  - name: google
    disabled: false
  - name: duckduckgo
    disabled: false
  - name: bing
    disabled: false
```

### Integration

User containers patch OpenClaw at startup to replace:
```
https://api.search.brave.com/res/v1/web/search
    ↓
http://172.17.0.1:8889/res/v1/web/search
```

**File patched:** `/usr/local/lib/node_modules/openclaw/dist/**/*.js`

**Note:** This is fragile. Better approach: Fork OpenClaw or add official config option.

---

## Smart Router (Disconnected)

### Status: ✅ Implemented, ❌ Not Wired Up

**Location:** `src/lib/router/`

**Purpose:** Classify prompts by complexity and route to appropriate models:
- **SIMPLE** → Cheap worker model
- **MEDIUM** → Balanced model
- **COMPLEX** → Premium orchestrator
- **REASONING** → Most capable model

**Why Disconnected:**
- Built for app → LLM direct flow
- Current architecture: app → container → OpenClaw → LLM
- Containers use hardcoded `gpt-4o-mini` from config

**Integration Options:**
1. **Delete router** (simplest, lose cost optimization)
2. **Route at container level** (pass model hint to OpenClaw, requires config patching)
3. **Move routing to app layer** (defeats purpose of using OpenClaw)

**Recommendation:** Integrate into chat flow (option 2) if cost optimization is priority, otherwise delete.

---

## Known Issues & Technical Debt

### Critical 🔴

1. **Database FK type mismatch** (`instances.user_id` is UUID but should be TEXT)
   - Breaks fresh DB setup
   - Fix: `ALTER TABLE instances ALTER COLUMN user_id TYPE text;` or drop table

2. **No container API authentication**
   - Anyone who knows port can send messages
   - Fix: Add shared secret validation in api-server.js

3. **Stripe webhook signature optional**
   - Production allows bypass
   - Fix: Make STRIPE_WEBHOOK_SECRET required

4. **Missing DATABASE_URL in .env.example**
   - Developers might use insecure connections
   - Fix: Add to example with SSL requirement

### Important 🟡

5. **Token tracking not wired up**
   - `trackTokenUsage()` exists but never called
   - Fix: Call after container response in /api/chat

6. **Smart router disconnected**
   - 14-dimension classifier unused
   - Decision: Keep and integrate, or delete

7. **Rate limiting stub mode**
   - Redis optional = no rate limits
   - Fix: Deploy Redis or implement in-memory limiting

8. **Container patching fragile**
   - Modifying installed npm package code
   - Fix: Fork OpenClaw or request official config

9. **Unused database tables**
   - 10 of 18 tables never queried
   - Fix: Drop unused tables, simplify schema

10. **Dead code** (~3,500 lines)
    - `src/lib/bot-engine/` - 3,420 lines, completely bypassed
    - `src/lib/orchestrator/` directory variant - unused
    - Fix: Archive or delete

### Nice to Have 🔵

11. **No container network isolation**
    - All containers on same bridge network
    - Fix: Create internal network

12. **No disk quotas**
    - Users could fill disk
    - Fix: Add `--storage-opt size=5G`

13. **Missing indexes**
    - Slow queries on container lookups
    - Fix: Add indexes on users(container_port), users(stripe_subscription_id)

14. **No monitoring**
    - No health check endpoint, no error tracking
    - Fix: Add /api/health, integrate Sentry

15. **No message persistence**
    - conversations/messages tables unused
    - Fix: Implement chat history storage

---

## Future Architecture Plans

### Hybrid Orchestrator (Spec Exists)

**File:** `specs/HYBRID-ORCHESTRATOR-SPEC.md`

Two-tier architecture:
- **Orchestrator model** (Gemini 3 Flash): Intent understanding, planning
- **Worker models** (Flash Lite, Grok Fast): Bulk tasks (search, code, docs)

**Benefits:**
- 79-84% margin vs single-model approach
- Smart routing based on complexity
- Cost optimization

**Status:** Spec complete, not implemented

### Model Selection (Spec Exists)

**File:** `specs/MODEL-SELECTION-SPEC.md`

Let users choose orchestrator + worker models with dynamic pricing:
- Budget: $36/mo (Flash + Flash-Lite)
- Balanced: $39/mo (4o-mini + Flash-Lite)
- Power: $66/mo (GPT-4o + Flash-Lite)

**Status:** Spec complete, schema exists, UI not built

### AI Support Agent (Spec Exists)

**File:** `specs/AI-SUPPORT-AGENT-SPEC.md`

On-demand diagnostic agent:
- Analyze container logs
- Identify issues
- Auto-remediation where safe
- User-friendly error explanations

**Status:** Spec complete, /api/diagnose exists (stub)

---

## Monitoring & Operations

### Health Checks

**Container Health:**
- HTTP endpoint: `GET http://localhost:{port}/health`
- Docker health check: Every 30s
- Application health checker: Every 60s (checks all user containers)

**App Health:**
- Next.js built-in health checks
- PM2 auto-restart on crash
- Recommended: Add `/api/health` endpoint

### Logging

**Container Logs:**
```bash
# View logs
docker logs -f clawer_user_{userId}

# Get last N lines
docker logs --tail 100 clawer_user_{userId}

# Programmatic access
curl http://localhost:3002/api/admin/container/logs?userId={userId}
```

**App Logs:**
```bash
# PM2 logs
pm2 logs clawer-web

# View errors only
pm2 logs clawer-web --err

# Clear logs
pm2 flush
```

### Metrics (Recommended)

**Container Metrics:**
- CPU usage per container
- Memory usage per container
- Message count per container
- Response time distribution

**App Metrics:**
- Active subscriptions
- Container provisioning success rate
- API endpoint latency
- Error rate by endpoint

**Business Metrics:**
- MRR (Monthly Recurring Revenue)
- Churn rate
- Average revenue per user
- Token usage vs cost

**Tools:**
- Prometheus + Grafana for metrics
- Sentry for error tracking
- PostHog or Mixpanel for product analytics

---

## Security Considerations

### Container Isolation

**Current:**
- ✅ Memory limits
- ✅ CPU limits
- ❌ No network isolation
- ❌ No disk quotas
- ❌ Run as root (should be non-root user)

**Recommended:**
```bash
# Add to Dockerfile
USER node

# Add to docker run
--network clawer-internal \
--cap-drop=ALL \
--security-opt=no-new-privileges \
--pids-limit=100 \
--read-only \
--tmpfs /tmp \
--storage-opt size=5G
```

### API Key Management

**Current:**
- `OPENAI_API_KEY` passed as env var (visible in `docker inspect`)
- Admin settings table stores encrypted keys (not synced with containers)

**Recommended:**
- Use Docker secrets: `echo $OPENAI_API_KEY | docker secret create openai_key -`
- Mount secrets in container: `--secret openai_key`
- Rotate keys regularly

### Authentication

**App:**
- ✅ Clerk handles user auth
- ✅ JWT tokens verified on API routes

**Containers:**
- ❌ No auth on container API (port+1)
- Recommendation: Add shared secret in Authorization header

**Webhooks:**
- ✅ Stripe signature verification (but optional in code - should be required)
- ✅ Clerk Svix signature verification

### Rate Limiting

**Current:**
- Redis-based rate limiting (optional, stub mode if no Redis)
- No per-container rate limits

**Recommended:**
- Make Redis required for production
- Add per-user rate limits: 100 requests/minute, 2000 requests/hour
- Add burst protection: Max 100K tokens per request

---

## Scaling Considerations

### Current Capacity

**Single server (YOUR_DOCKER_HOST):**
- Port range: 4001-5000 = ~500 containers
- Memory: 500 containers × 1GB = 500GB (realistic server: ~64GB = 64 containers)
- CPU: 500 containers × 1 core = 500 cores (realistic server: ~32 cores = 32 containers)

**Effective limit:** ~30-60 concurrent users per server

### Multi-Server Strategy

1. **Add more servers** (horizontal scaling)
2. **Use Redis for distributed port allocation**
   ```typescript
   const port = await redis.incr('next_container_port');
   ```
3. **Load balancer routes users to their assigned server**
   - Store user → server mapping in DB
   - Route /api/chat requests to correct server
4. **Shared PostgreSQL + Redis** across all servers

### Alternative Architectures

**Kubernetes:**
- Each user = Kubernetes Pod
- Auto-scaling based on load
- Built-in networking + secrets management

**Serverless Containers:**
- AWS Fargate or Google Cloud Run
- Pay per second of usage
- Auto-scaling + no server management

---

## Appendix: File Structure

```
/home/keith/projects/clawer/
├── src/
│   ├── app/
│   │   ├── (auth)/            # Clerk sign-in/up pages
│   │   ├── dashboard/         # User dashboard
│   │   ├── chat/[botId]/      # Chat interface
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── lib/
│   │   ├── db/                # Drizzle ORM
│   │   │   └── schema/        # Database schemas
│   │   ├── orchestrator.ts    # Container management
│   │   ├── container-client.ts # Container API client
│   │   ├── router/            # Smart router (unused)
│   │   ├── bot-engine/        # Bot engine (dead code)
│   │   └── ...
│   └── ...
├── docker/
│   ├── openclaw-user/         # Container image for users
│   │   ├── Dockerfile
│   │   ├── entrypoint.sh
│   │   ├── api-server.js
│   │   └── config-template.json
│   └── searxng-proxy/         # SearXNG integration
├── drizzle/                   # Database migrations
├── public/                    # Static assets
├── docs/                      # Documentation
├── specs/                     # Architecture specs
├── package.json
├── next.config.js
├── drizzle.config.ts
└── ecosystem.config.js        # PM2 config (recommended)
```

---

**Document Version:** 2.0  
**Last Updated:** 2026-02-08  
**Next Review:** When implementing Hybrid Orchestrator or Model Selection

