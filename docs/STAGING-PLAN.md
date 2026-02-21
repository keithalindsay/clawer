# Clawer.ai — Staging Environment Architecture Plan

**Date:** 2026-02-21  
**Status:** Plan only — NOT implemented  
**Author:** Architecture review  
**Decision:** Branch-based staging on the same server at `staging.clawer.ai`, $0 additional cost

---

## Table of Contents

1. [Overview & Guiding Principles](#1-overview--guiding-principles)
2. [Infrastructure Layout](#2-infrastructure-layout)
3. [Clerk Setup — Separate Auth Instance](#3-clerk-setup--separate-auth-instance)
4. [Database — clawer_staging](#4-database--clawer_staging)
5. [GitHub Actions — Staging Workflow](#5-github-actions--staging-workflow)
6. [Container Provisioning in Staging](#6-container-provisioning-in-staging)
7. [SSL/DNS — staging.clawer.ai](#7-ssldns--stagingclawerai)
8. [Environment Variables](#8-environment-variables)
9. [Data Seeding](#9-data-seeding)
10. [Nginx/Caddy Reverse Proxy](#10-nginxcaddy-reverse-proxy)
11. [Cleanup & Reset Procedures](#11-cleanup--reset-procedures)
12. [Risk Assessment](#12-risk-assessment)
13. [Implementation Checklist](#13-implementation-checklist)
14. [Future Considerations](#14-future-considerations)

---

## 1. Overview & Guiding Principles

### What We're Building

A second, fully isolated copy of the Clawer.ai stack running on the same VPS as production. It sits behind `staging.clawer.ai`, talks to a separate database, uses a Clerk dev instance (free), and spawns Docker containers in a separate port range. Deployments happen automatically when code is pushed to the `staging` branch.

### Isolation Guarantees

| Dimension | Production | Staging | Isolation method |
|-----------|-----------|---------|-----------------|
| App process | PM2: `clawer` | PM2: `clawer-staging` | Different PM2 app name |
| Port | 3000 | 3001 | Different port |
| Database | `clawer` (port 5432) | `clawer_staging` (port 5432) | Different DB name, different DB user |
| Auth | Clerk prod instance | Clerk dev instance | Different Clerk instance (different keys) |
| Source code | `/opt/clawer/` | `/opt/clawer-staging/` | Different filesystem path |
| User data | `/opt/clawer/userdata/` | `/opt/clawer-staging/userdata/` | Different volume mount path |
| Docker containers | `clawer_user_*` | `clawer_stg_user_*` | Different name prefix |
| Container ports | 4000–4999 | 5100–5999 | Different port range |
| Docker network | `clawer_shared` | `clawer_staging_shared` | Different named network |
| Payments | Stripe live keys | Stripe test keys | Different Stripe keys |
| Subdomain | `clawer.ai` | `staging.clawer.ai` | Separate Caddy virtual host |
| Logs | `/root/.pm2/logs/clawer*` | `/root/.pm2/logs/clawer-staging*` | PM2 app scoping |

### What Shares Resources (Intentionally)

These are **read-shared** for cost reasons — no staging data flows back to prod:

- **Ollama** — Staging containers can call Ollama on `clawer_staging_shared` network. Ollama is stateless; no isolation risk. (Alternative: share `clawer_shared` network for Ollama only — see §6.)
- **SearXNG** — Same as Ollama; stateless search. No user data is stored.
- **Host kernel / CPU / RAM / disk** — Unavoidable on a single VPS. Managed via resource limits (§12).

---

## 2. Infrastructure Layout

### Directory Structure

```
/opt/
├── clawer/                      ← Production (DO NOT TOUCH)
│   ├── .env                     ← Production secrets
│   ├── userdata/                ← Production user volumes
│   └── ...
└── clawer-staging/              ← Staging
    ├── .env                     ← Staging secrets (different from prod)
    ├── userdata/                ← Staging user volumes (isolated)
    └── ...
```

### PM2 Processes

```
pm2 list:
  ┌────┬──────────────────┬──────────┬──────┬───────────┬──────────┐
  │ id │ name             │ mode     │ port │ status    │ memory   │
  ├────┼──────────────────┼──────────┼──────┼───────────┼──────────┤
  │  0 │ clawer           │ fork     │ 3000 │ online    │ ~250MB   │ ← Production
  │  1 │ clawer-staging   │ fork     │ 3001 │ online    │ ~250MB   │ ← Staging
  └────┴──────────────────┴──────────┴──────┴───────────┴──────────┘
```

### Port Allocation

| Service | Production | Staging |
|---------|-----------|---------|
| Next.js app | 3000 | 3001 |
| Docker container gateway (per user) | 4001, 4003, 4005... | 5101, 5103, 5105... |
| Docker container API (per user) | 4002, 4004, 4006... | 5102, 5104, 5106... |
| PostgreSQL | 5432 (shared host, different DB) | 5432 (same host, different DB) |
| Ollama | 11434 (shared) | 11434 (shared) |
| SearXNG | 8888 (shared) | 8888 (shared) |

**Staging container port range:** 5100–5999  
**Max concurrent staging users:** ~45 (450 ports / 2 ports per user = 225, but practical limit is ~45 given RAM)

### PM2 Ecosystem File for Staging

**File:** `/opt/clawer-staging/ecosystem.staging.cjs`

```javascript
module.exports = {
  apps: [{
    name: 'clawer-staging',
    script: 'npm',
    args: 'start',
    cwd: '/opt/clawer-staging',
    env_file: '/opt/clawer-staging/.env',
    env: {
      NODE_ENV: 'production',   // Next.js needs 'production' for `next start`
      PORT: '3001',
    },
    // Resource limits to protect production
    max_memory_restart: '512M',
  }]
};
```

---

## 3. Clerk Setup — Separate Auth Instance

### Why Separate Clerk Instances

Clerk auth tokens are scoped to an instance. Production users **cannot** log into staging (different keys → different JWT signatures). This is the cleanest, most secure isolation possible.

### Clerk Dev vs Clerk Production

| Attribute | Clerk Dev Instance | Clerk Prod Instance |
|-----------|-------------------|---------------------|
| Cost | **Free** | Paid (per MAU above free tier) |
| Usage | Staging only | Production only |
| Limits | 10,000 MAU/month | Per plan |
| Social OAuth | Works (but OAuth redirect URIs must be configured for staging) | Already configured |
| Webhooks | Separate webhook endpoint | `/api/webhooks/clerk` on prod |

### Steps to Create Staging Clerk Instance

1. Log into [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create new application → name it **"Clawer Staging"**
3. Select **Development** environment
4. Configure sign-in methods to match production (Email, Google, etc.)
5. Under **Webhooks** → add endpoint: `https://staging.clawer.ai/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
6. Under **Domains** → add: `staging.clawer.ai` as allowed domain
7. Copy the keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → starts with `pk_test_`
   - `CLERK_SECRET_KEY` → starts with `sk_test_`
8. Add staging URL to Clerk's allowed origins / redirect URLs if using OAuth social login

### Key Difference

Production keys begin with `pk_live_` / `sk_live_`. Staging keys begin with `pk_test_` / `sk_test_`. Any confusion between these is immediately visible.

---

## 4. Database — clawer_staging

### Setup Commands (run on server as root)

```bash
# Connect to postgres as superuser
sudo -u postgres psql

# Create staging database user (restricted — cannot see prod data)
CREATE USER clawer_staging WITH PASSWORD 'CHOOSE_A_STRONG_PASSWORD';

# Create staging database
CREATE DATABASE clawer_staging OWNER clawer_staging;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE clawer_staging TO clawer_staging;

\q
```

### Connection String Format

```
DATABASE_URL=postgresql://clawer_staging:STRONG_PASSWORD@localhost:5432/clawer_staging
```

### Migration Strategy

The staging DB runs the **same schema** as production, applied via Drizzle migrations. There is NO data shared between `clawer` and `clawer_staging`.

#### Initial Migration (one-time setup)

```bash
# On the server, from /opt/clawer-staging/
DATABASE_URL="postgresql://clawer_staging:PASSWORD@localhost:5432/clawer_staging" \
  npx drizzle-kit push
```

Or using the migration files:

```bash
DATABASE_URL="postgresql://clawer_staging:PASSWORD@localhost:5432/clawer_staging" \
  npx drizzle-kit migrate
```

#### Keeping Schemas in Sync

When a new migration lands on `main` and is merged into `staging`, the staging deploy workflow (§5) runs `drizzle-kit migrate` against `clawer_staging` automatically. No manual steps needed after the initial setup.

**Important:** Never run `db:push` or destructive migrations in production from the staging workflow. The staging workflow only touches `clawer_staging`.

### Schema Compatibility

The staging and production databases run the same schema version (tracked by Drizzle's `drizzle/__journal.json`). If a migration is applied to staging first (experimental), it MUST be reviewed before being deployed to production.

### Backup Considerations

Staging DB does **not** need regular backups. It can be wiped and reseeded at will (§11). Production DB backup procedures remain unchanged.

---

## 5. GitHub Actions — Staging Workflow

### New File: `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches: [staging]

# Prevent concurrent staging deploys
concurrency:
  group: staging-deploy
  cancel-in-progress: true   # Unlike prod, staging can cancel mid-deploy

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy source via rsync
        run: |
          rsync -avz -e "ssh -i ~/.ssh/deploy_key" \
            --delete \
            --exclude '.env' \
            --exclude '.env.local' \
            --exclude 'node_modules' \
            --exclude '.git' \
            --exclude '.next' \
            . root@${{ secrets.DEPLOY_HOST }}:/opt/clawer-staging/

      - name: Build & restart staging on server
        run: |
          ssh -i ~/.ssh/deploy_key root@${{ secrets.DEPLOY_HOST }} << 'SCRIPT'
            set -e
            cd /opt/clawer-staging

            # Install deps
            export NODE_ENV=production
            npm install --production=false

            # Run DB migrations against staging DB only
            npx drizzle-kit migrate

            # Build Next.js
            npx next build

            # Restart PM2 staging process
            pm2 restart clawer-staging || pm2 start ecosystem.staging.cjs
          SCRIPT

      - name: Health check
        run: |
          sleep 8
          for i in {1..5}; do
            echo "Health check attempt $i/5..."
            STATUS=$(ssh -i ~/.ssh/deploy_key root@${{ secrets.DEPLOY_HOST }} \
              "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/")
            if [ "$STATUS" = "200" ]; then
              echo "✅ Staging deploy successful!"
              exit 0
            fi
            echo "Status: $STATUS — retrying in 5s..."
            sleep 5
          done
          echo "❌ Staging health check failed"
          ssh -i ~/.ssh/deploy_key root@${{ secrets.DEPLOY_HOST }} \
            "pm2 logs clawer-staging --lines 30 --nostream"
          exit 1

      - name: Notify on failure
        if: failure()
        run: echo "Staging deploy failed — check PM2 logs on server"
```

### Required GitHub Secrets (Existing — Already Used by Production)

The staging workflow reuses the same secrets as production:

| Secret | Already exists? | Notes |
|--------|----------------|-------|
| `DEPLOY_SSH_KEY` | ✅ Yes | Same SSH key — staging deploys to same server |
| `DEPLOY_HOST` | ✅ Yes | Same server IP |

No new GitHub secrets are required. The sensitive staging-specific values (Clerk keys, DB password, etc.) are stored in `/opt/clawer-staging/.env` on the server, not in GitHub.

### Branch Strategy

```
main   ─────●──────●──────●──────────────────────●──→ prod deploy
              \                                  /
staging  ──────●──────●──────●──────●──────●──→ staging deploy
               ↑
               Branch from main, merge PRs here first
```

**Workflow:**
1. Developer pushes to `staging` branch (or merges a feature branch into `staging`)
2. GitHub Actions deploys to `staging.clawer.ai` automatically
3. QA/testing happens on staging
4. When approved, merge `staging` → `main` (or cherry-pick commits)
5. Production deploys automatically from `main`

---

## 6. Container Provisioning in Staging

### The Core Question: Real Containers or Mocks?

**Decision: Real Docker containers, but in a separate namespace.**

Rationale: The entire point of staging is to test the full user flow including container provisioning. Using mocks would miss the most complex and failure-prone part of the system. Containers are cheap — the staging server already runs them.

### Container Naming Convention

| Environment | Container name prefix | Example |
|-------------|----------------------|---------|
| Production | `clawer_user_` | `clawer_user_usr_abc123` |
| Staging | `clawer_stg_user_` | `clawer_stg_user_usr_abc123` |

This prevents name collisions and makes it trivially easy to:
- `docker ps | grep clawer_stg_` — see all staging containers
- `docker rm $(docker ps -aq --filter "name=clawer_stg_")` — nuke all staging containers

### Port Range Separation

Production containers: ports **4000–5099**  
Staging containers: ports **5100–5999**

The provisioner in staging reads `PORT_RANGE_START=5100` and `PORT_RANGE_END=5999` from the `.env`.

### Volume Mount Path

Production: `/opt/clawer/userdata/{userId}/`  
Staging: `/opt/clawer-staging/userdata/{userId}/`

User data is completely isolated. A staging "wipe" can delete `/opt/clawer-staging/userdata/` without touching production data.

### Docker Network for Staging

Create a separate Docker network for staging shared services:

```bash
docker network create clawer_staging_shared
```

Staging containers join `clawer_staging_shared` instead of `clawer_shared`.

**Option A (Simpler): Share Ollama and SearXNG**  
Connect staging containers to `clawer_shared` so they can reach Ollama/SearXNG. Since these are stateless services, there's no data bleed. This avoids running duplicate Ollama instances (which would double RAM usage).

**Option B (Stricter): Separate Ollama**  
Run a second Ollama instance dedicated to staging. Not recommended — the server only has ~4.6GB RAM free. Ollama (qwen2.5:3b) already uses ~2.3GB. A second instance would likely OOM.

**Recommendation: Option A** — staging containers join `clawer_staging_shared` for app-level isolation, but the `clawer_staging_shared` network is configured to route Ollama/SearXNG calls through the existing production instances via host IP (`172.17.0.1`) or by also connecting staging containers to `clawer_shared` for Ollama only.

Simpler implementation: In the staging `.env`:
```
OLLAMA_HOST=http://172.17.0.1:11434
SEARXNG_PROXY_URL=http://172.17.0.1:8889
```
This routes staging containers to the host-level services without joining the production network.

### Changes Needed in the Provisioner Code

The provisioner (`src/lib/provisioner.ts`) needs to read these from env vars (not hardcode them):

```typescript
// These should already be env vars, but confirm:
const CONTAINER_PREFIX = process.env.CONTAINER_PREFIX ?? 'clawer_user_';
const PORT_RANGE_START = parseInt(process.env.PORT_RANGE_START ?? '4001');
const PORT_RANGE_END = parseInt(process.env.PORT_RANGE_END ?? '5099');
const USERDATA_PATH = process.env.USERDATA_PATH ?? '/opt/clawer/userdata';
const DOCKER_NETWORK = process.env.DOCKER_NETWORK ?? 'clawer_shared';
```

If these are currently hardcoded, they need to be extracted to env vars as part of the staging implementation. This is a small, safe refactor.

### Staging Container Lifecycle

Staging containers are created and destroyed the same way as production containers, just:
- Named with `clawer_stg_` prefix
- Mounted at `/opt/clawer-staging/userdata/`
- On ports 5100–5999
- On `clawer_staging_shared` Docker network (or via host IP for Ollama/SearXNG)

No special handling needed for cleanup — see §11.

---

## 7. SSL/DNS — staging.clawer.ai

### DNS Setup (Namecheap)

Add an **A record** pointing `staging.clawer.ai` → `YOUR_DOCKER_HOST`

```
Type  Host      Value            TTL
A     staging   YOUR_DOCKER_HOST  300
```

This takes 5–30 minutes to propagate. Use a low TTL (300s = 5 min) during setup.

### SSL Certificate

Caddy handles SSL automatically via Let's Encrypt. When the Caddy config for `staging.clawer.ai` is added (§10), Caddy will:
1. Detect the new virtual host
2. Request a cert from Let's Encrypt
3. Auto-renew every 60 days

No manual cert management needed.

**Important:** Let's Encrypt has rate limits — 5 cert requests per registered domain per week. Since `clawer.ai` is the registered domain and production already has a cert, the staging cert counts against this limit. This is fine — it's a one-time request during initial setup. Do NOT repeatedly tear down and recreate the cert.

---

## 8. Environment Variables

### Full Staging `.env` — What Differs from Production

```bash
# /opt/clawer-staging/.env

# =============================================================
# APP
# =============================================================
NODE_ENV=production          # Next.js needs 'production' for `next start`
PORT=3001                    # Staging runs on port 3001
NEXT_PUBLIC_APP_URL=https://staging.clawer.ai

# =============================================================
# DATABASE
# =============================================================
DATABASE_URL=postgresql://clawer_staging:STAGING_DB_PASSWORD@localhost:5432/clawer_staging

# =============================================================
# CLERK AUTH — STAGING INSTANCE (Clerk Dev, free)
# =============================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
CLERK_SECRET_KEY=sk_test_YOUR_STRIPE_KEY
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXX   # From Clerk staging webhook

# =============================================================
# STRIPE — TEST MODE (never real money)
# =============================================================
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXX
# Use Stripe test price IDs (created in Stripe test mode dashboard)
STRIPE_PRICE_ID_PRO=price_test_XXXXXXXXXXXXXXXXXXXXXXXX

# =============================================================
# CONTAINER PROVISIONING — STAGING NAMESPACE
# =============================================================
CONTAINER_PREFIX=clawer_stg_user_
PORT_RANGE_START=5100
PORT_RANGE_END=5999
USERDATA_PATH=/opt/clawer-staging/userdata
DOCKER_NETWORK=clawer_staging_shared

# =============================================================
# SHARED SERVICES (same endpoints as production — stateless services)
# =============================================================
OLLAMA_HOST=http://172.17.0.1:11434
SEARXNG_PROXY_URL=http://172.17.0.1:8889

# =============================================================
# LLM API KEYS — Can share with prod, or use separate staging keys
# (Separate keys recommended so staging usage doesn't burn prod quota)
# =============================================================
MINIMAX_API_KEY=STAGING_MINIMAX_KEY_OR_SAME_AS_PROD
OPENAI_API_KEY=STAGING_OPENAI_KEY_OR_SAME_AS_PROD

# =============================================================
# INTERNAL SECRETS — Generate fresh values for staging
# =============================================================
GATEWAY_TOKEN_SECRET=STAGING_SPECIFIC_RANDOM_SECRET
NEXTAUTH_SECRET=STAGING_SPECIFIC_RANDOM_SECRET

# =============================================================
# FEATURE FLAGS (optional — can enable experimental features on staging)
# =============================================================
# NEXT_PUBLIC_ENABLE_EXPERIMENTAL=true
```

### What Stays the Same as Production

- `MINIMAX_API_KEY` — Can share if budget allows; API is stateless. Recommend separate staging key so quota is independent.
- `OPENAI_API_KEY` — Same logic as above.
- Ollama/SearXNG endpoints — Stateless, shared is fine.

### What MUST Be Different

| Variable | Why it must differ |
|----------|-------------------|
| `DATABASE_URL` | Different DB — core isolation |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Different Clerk instance |
| `CLERK_SECRET_KEY` | Different Clerk instance |
| `CLERK_WEBHOOK_SECRET` | Different webhook endpoint |
| `STRIPE_SECRET_KEY` | Test mode vs live mode |
| `STRIPE_PRICE_ID_PRO` | Test price ID vs live price ID |
| `CONTAINER_PREFIX` | Prevent Docker name collisions |
| `PORT_RANGE_START/END` | Prevent port collisions |
| `USERDATA_PATH` | Separate volume mounts |
| `NEXT_PUBLIC_APP_URL` | Correct subdomain |

---

## 9. Data Seeding

### Philosophy

Staging should start empty (like a fresh production deployment) and be seeded on demand. This tests the actual user signup flow rather than assuming data.

### Seed Strategy

**Layer 1: Admin settings (required for app to function)**

The `admin_settings` table likely has rows that configure default behavior. After a DB reset, these need to be populated. Create a seed script:

```bash
# /opt/clawer-staging/scripts/seed-staging.sh
#!/bin/bash
set -e

DB="postgresql://clawer_staging:PASSWORD@localhost:5432/clawer_staging"

echo "Seeding admin settings..."
psql "$DB" <<SQL
  INSERT INTO admin_settings (key, value) VALUES
    ('default_container_image', 'clawer-openclaw:latest'),
    ('max_containers_per_user', '1'),
    ('maintenance_mode', 'false')
  ON CONFLICT (key) DO NOTHING;
SQL

echo "✅ Seed complete"
```

**Layer 2: Test users (optional, for faster QA)**

For rapid testing without going through the full signup flow:

```bash
# Insert a pre-verified test user directly
psql "$DB" <<SQL
  INSERT INTO users (clerk_id, email, tier, created_at) VALUES
    ('user_staging_test_001', 'test@staging.clawer.ai', 'pro', NOW())
  ON CONFLICT DO NOTHING;
SQL
```

This lets QA engineers skip the Clerk signup flow when testing specific post-signup features.

**Layer 3: Container state (do NOT seed)**  
Never pre-seed `container_port`, `container_id`, etc. These are managed by the provisioner and should be exercised via the real flow.

### Test Stripe Flow

Staging uses Stripe test mode. Stripe provides test card numbers:
- `4242 4242 4242 4242` — Always succeeds
- `4000 0000 0000 9995` — Always declines

Create a test Stripe product/price in the Stripe dashboard (test mode) and put that price ID in the staging `.env` as `STRIPE_PRICE_ID_PRO`.

### Clerk Dev Mode Test Users

Clerk dev instances allow signing in with test phone numbers / magic codes without real email delivery. During testing, use:
- Email: anything at a real domain you control (or use Clerk's test email feature)
- Clerk dev instances also support "email only" flows with a code sent to a real inbox

---

## 10. Nginx/Caddy Reverse Proxy

The current production setup uses **Caddy** (confirmed via RUNBOOK: "Caddy reverse proxy, certs auto-managed").

### Caddyfile Addition

Find the Caddyfile on the server:

```bash
find / -name "Caddyfile" 2>/dev/null
# Likely: /etc/caddy/Caddyfile or /opt/caddy/Caddyfile
```

Add a new virtual host block for staging:

```
# /etc/caddy/Caddyfile (append to existing file)

staging.clawer.ai {
    reverse_proxy localhost:3001

    # Security headers (same as production)
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
        # Add staging banner header for debugging
        X-Environment staging
    }

    # Optional: Basic auth to keep staging private
    # basicauth /* {
    #     staging $2a$14$HASH_OF_PASSWORD
    # }

    log {
        output file /var/log/caddy/staging.clawer.ai.log
        format json
    }
}
```

### Reload Caddy

```bash
caddy reload --config /etc/caddy/Caddyfile
# Or:
systemctl reload caddy
```

Caddy will automatically provision a Let's Encrypt cert for `staging.clawer.ai` on first request.

### Optional: Basic Auth Protection

To prevent the public from accidentally finding and using `staging.clawer.ai`, add HTTP basic auth. Generate a hash:

```bash
caddy hash-password --plaintext "yourStagingPassword"
```

Put the hash in the Caddyfile `basicauth` block (shown commented out above).

### Verifying the Setup

```bash
# From local machine:
curl -I https://staging.clawer.ai
# Expected: HTTP/2 200, x-environment: staging

# From server:
curl -s http://localhost:3001/  # Should return HTML
```

---

## 11. Cleanup & Reset Procedures

### Full Staging Reset (Nuclear Option)

Wipes everything and starts fresh. Takes ~5 minutes.

```bash
#!/bin/bash
# /opt/clawer-staging/scripts/reset-staging.sh
# WARNING: Destroys all staging data. Idempotent — safe to re-run.

set -e

echo "⚠️  Resetting staging environment..."

# 1. Stop staging app
pm2 stop clawer-staging 2>/dev/null || true

# 2. Kill and remove all staging containers
STAGING_CONTAINERS=$(docker ps -aq --filter "name=clawer_stg_")
if [ -n "$STAGING_CONTAINERS" ]; then
  docker kill $STAGING_CONTAINERS 2>/dev/null || true
  docker rm $STAGING_CONTAINERS 2>/dev/null || true
  echo "✅ Removed staging containers"
fi

# 3. Wipe staging user data volumes
rm -rf /opt/clawer-staging/userdata/*
echo "✅ Cleared userdata"

# 4. Wipe and recreate staging database
PGPASSWORD="STAGING_DB_PASSWORD" psql -h localhost -U postgres <<SQL
  DROP DATABASE IF EXISTS clawer_staging;
  CREATE DATABASE clawer_staging OWNER clawer_staging;
  GRANT ALL PRIVILEGES ON DATABASE clawer_staging TO clawer_staging;
SQL
echo "✅ Database wiped"

# 5. Run migrations
cd /opt/clawer-staging
DATABASE_URL="postgresql://clawer_staging:STAGING_DB_PASSWORD@localhost:5432/clawer_staging" \
  npx drizzle-kit migrate
echo "✅ Migrations applied"

# 6. Seed base data
./scripts/seed-staging.sh
echo "✅ Seed data applied"

# 7. Start staging app
pm2 start ecosystem.staging.cjs
echo "✅ Staging app started"

echo ""
echo "🎉 Staging reset complete — https://staging.clawer.ai"
```

### Partial Reset: Containers Only

```bash
# Remove all staging containers without touching the DB or app
docker rm -f $(docker ps -aq --filter "name=clawer_stg_") 2>/dev/null || true
rm -rf /opt/clawer-staging/userdata/*
echo "Staging containers cleared"
```

### Partial Reset: Database Only

```bash
PGPASSWORD="STAGING_DB_PASSWORD" psql -h localhost -U postgres -c "DROP DATABASE clawer_staging;"
PGPASSWORD="STAGING_DB_PASSWORD" psql -h localhost -U postgres -c "CREATE DATABASE clawer_staging OWNER clawer_staging;"
cd /opt/clawer-staging && npx drizzle-kit migrate && ./scripts/seed-staging.sh
```

### Routine Cleanup (After Each Test Cycle)

After a testing session, it's good practice to clean up containers to free ports and RAM:

```bash
# Kill all staging containers
docker rm -f $(docker ps -aq --filter "name=clawer_stg_") 2>/dev/null || true
# Clear userdata if desired
rm -rf /opt/clawer-staging/userdata/*
```

The staging app continues running — only containers and user data are wiped.

---

## 12. Risk Assessment

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Staging containers eating prod RAM → prod OOM | Medium | High | Container memory limits; monitor headroom |
| Port collision between staging and prod containers | Low | High | Strictly separate port ranges (4000–5099 prod, 5100–5999 staging) |
| Staging build failure blocks next prod deploy (shared disk I/O) | Low | Medium | Staging is on separate PM2 process; doesn't affect prod |
| Accidental rsync to `/opt/clawer/` instead of `/opt/clawer-staging/` | Medium | High | Hard-code the path in the GitHub Actions workflow |
| Staging Drizzle migrate touches prod DB | Low | Critical | `DATABASE_URL` in staging `.env` is the only thing that matters — keep it isolated |
| Clerk staging webhook fires prod endpoint | Low | Low | Webhook URLs are different; Clerk instance separation guarantees isolation |
| SearXNG / Ollama overloaded by staging tests | Low | Low | These services are stateless and lightly loaded |
| Let's Encrypt rate limit for `clawer.ai` domain | Very Low | Low | 5 certs/week per domain; this is a one-time setup |
| Caddy Caddyfile syntax error → prod goes down | Medium | Critical | Test with `caddy validate` before reload; edit carefully |

### Resource Contention Analysis

**Current production baseline** (from SHARED-SERVICES-ARCHITECTURE.md):
```
Total RAM:    7.6 GB
Used by prod: ~2.9 GB (app + containers + shared services)
Available:    ~4.6 GB
```

**Staging adds:**
- PM2 `clawer-staging` app: ~250MB
- Each staging Docker container: ~512MB–1GB RAM
- Build process (during deploy): ~500MB peak (goes away after build)

**Budget:**
```
Available RAM:          4.6 GB
Staging app:           -0.25 GB
Staging max containers: 3 concurrent (3 × 1GB = 3GB)
                       ─────────
Remaining headroom:     ~1.35 GB  ← TIGHT
```

**Recommendation:** Set a hard limit: **maximum 3 staging containers at any time.** This can be enforced by the staging provisioner (env var `MAX_CONTAINERS=3`). Never run a full staging load test while production is serving traffic.

**CPU:** 4 EPYC cores. A Next.js build takes 1-2 cores for ~60 seconds. Production typically uses <1 core at low traffic. Overlap is unlikely but possible during business hours. Builds happen on push — this is a narrow, temporary spike.

**Disk:** 84 GB free. Each staging user data folder is ~100MB. 10 staging users = 1GB. Not a concern.

### Worst-Case Scenario Plan

**If staging causes production to crash:**

```bash
# Immediately stop all staging containers
docker rm -f $(docker ps -aq --filter "name=clawer_stg_") 2>/dev/null

# Stop staging PM2 process
pm2 stop clawer-staging

# Check production is healthy
curl -I https://clawer.ai
pm2 status clawer
```

Production and staging are completely independent processes — stopping one has zero effect on the other.

### Security Considerations

- **Staging secrets must not contain production values.** Keep `.env` files separate and never copy prod `.env` to staging.
- **Staging DB user cannot access `clawer` (prod) database.** The PostgreSQL user `clawer_staging` only has rights to `clawer_staging`.
- **Consider basic auth on `staging.clawer.ai`** to prevent the public from signing up and consuming resources.
- **Never put real user data in staging.** If you ever need to reproduce a bug with specific data, anonymize it first.

---

## 13. Implementation Checklist

Follow this order. Each step must succeed before the next.

### Phase 1: Server Setup (One-time, ~45 minutes)

- [ ] SSH to `root@YOUR_DOCKER_HOST`
- [ ] Create PostgreSQL staging user and DB
  ```bash
  sudo -u postgres psql -c "CREATE USER clawer_staging WITH PASSWORD 'CHOOSE_STRONG_PASSWORD';"
  sudo -u postgres psql -c "CREATE DATABASE clawer_staging OWNER clawer_staging;"
  ```
- [ ] Create directory structure
  ```bash
  mkdir -p /opt/clawer-staging/userdata
  mkdir -p /opt/clawer-staging/scripts
  mkdir -p /var/log/caddy
  ```
- [ ] Create Docker network for staging
  ```bash
  docker network create clawer_staging_shared
  ```
- [ ] Create `/opt/clawer-staging/.env` with all staging values (§8)
- [ ] Create `/opt/clawer-staging/ecosystem.staging.cjs` (§2)
- [ ] Create `/opt/clawer-staging/scripts/reset-staging.sh` (§11), make executable
- [ ] Create `/opt/clawer-staging/scripts/seed-staging.sh` (§9), make executable

### Phase 2: Clerk Setup (~15 minutes)

- [ ] Create Clerk staging application ("Clawer Staging", Development environment)
- [ ] Configure sign-in methods to match production
- [ ] Add webhook endpoint: `https://staging.clawer.ai/api/webhooks/clerk`
- [ ] Copy keys into `/opt/clawer-staging/.env`

### Phase 3: Stripe Setup (~10 minutes)

- [ ] In Stripe Dashboard, switch to **Test Mode**
- [ ] Create a test product + price matching production's plan
- [ ] Copy test price ID into staging `.env` as `STRIPE_PRICE_ID_PRO`
- [ ] Add Stripe webhook for staging: `https://staging.clawer.ai/api/webhooks/stripe`
- [ ] Copy staging webhook secret to `.env`

### Phase 4: DNS (~5 minutes + propagation wait)

- [ ] Log into Namecheap
- [ ] Add A record: `staging` → `YOUR_DOCKER_HOST` (TTL 300)
- [ ] Wait for propagation: `dig staging.clawer.ai +short` should return `YOUR_DOCKER_HOST`

### Phase 5: Caddy Setup (~10 minutes)

- [ ] Locate Caddyfile: `find / -name Caddyfile 2>/dev/null`
- [ ] Validate current config: `caddy validate --config /path/to/Caddyfile`
- [ ] Add `staging.clawer.ai` virtual host block (§10)
- [ ] Validate new config: `caddy validate --config /path/to/Caddyfile`
- [ ] Reload: `caddy reload --config /path/to/Caddyfile`
- [ ] Verify cert: `curl -I https://staging.clawer.ai` → HTTP 200

### Phase 6: Code Changes (~30 minutes)

- [ ] Extract provisioner hardcoded values to env vars (§6)
  - `CONTAINER_PREFIX`, `PORT_RANGE_START`, `PORT_RANGE_END`, `USERDATA_PATH`, `DOCKER_NETWORK`
- [ ] Create `ecosystem.staging.cjs` in the repo root (committed to git)
- [ ] Confirm `PORT` env var is respected in `package.json` start script (Next.js: `next start -p $PORT`)

### Phase 7: GitHub Actions (~15 minutes)

- [ ] Create `.github/workflows/deploy-staging.yml` (§5)
- [ ] Confirm `DEPLOY_SSH_KEY` and `DEPLOY_HOST` secrets exist in GitHub repo settings
- [ ] Push to `staging` branch and verify the workflow runs successfully

### Phase 8: Initial Deployment

- [ ] Push code to `staging` branch
- [ ] GitHub Action runs: rsync → build → `drizzle-kit migrate` → PM2 start
- [ ] Verify: `pm2 status` shows `clawer-staging` as online
- [ ] Verify: `https://staging.clawer.ai` loads the app

### Phase 9: End-to-End Test

- [ ] Sign up at `https://staging.clawer.ai/sign-up` with a test email
- [ ] Verify user appears in `clawer_staging` DB (NOT in `clawer`)
- [ ] Complete onboarding flow
- [ ] Subscribe using Stripe test card `4242 4242 4242 4242`
- [ ] Verify container is provisioned (name starts with `clawer_stg_`)
- [ ] Send a chat message — verify response
- [ ] Test team switching (if applicable)
- [ ] Verify production (`https://clawer.ai`) is completely unaffected

---

## 14. Future Considerations

### When to Revisit This Plan

- **If the server gets a second VPS:** Staging can move to its own machine. The current plan is optimized for $0 cost; a dedicated staging server is cleaner.
- **If staging containers start affecting production performance:** Add cgroup limits or `--cpus`/`--memory` flags to `docker run` in the staging provisioner.
- **If team grows:** Add basic auth to `staging.clawer.ai` and distribute credentials to the team.
- **Preview environments per PR:** Not planned, but possible using dynamic subdomain routing + shorter-lived containers. Requires more infrastructure.

### Pre-production Checklist Before Using Staging

Before trusting staging as a true "production mirror," verify:
1. Schema parity — staging has run all migrations that production has
2. Feature flags are identical (or intentionally different)
3. Container image is the same version as production (`clawer-openclaw:vXXXX`)
4. Staging `.env` doesn't accidentally contain any production keys

### Monitoring

Staging doesn't need production-grade monitoring, but it's useful to:
- Keep `pm2 logs clawer-staging` available for quick checks
- Alert if the staging process crashes (PM2 can do this: `pm2 set pm2-slack:slack_url ...`)
- Periodically check disk usage: `du -sh /opt/clawer-staging/userdata/`

---

## Quick Reference

```bash
# SSH to server
ssh root@YOUR_DOCKER_HOST

# Staging app status
pm2 status clawer-staging
pm2 logs clawer-staging --lines 50

# List staging containers
docker ps --filter "name=clawer_stg_"

# Reset staging completely
/opt/clawer-staging/scripts/reset-staging.sh

# Deploy to staging manually (bypasses GitHub Actions)
cd /opt/clawer-staging && npm run build && pm2 restart clawer-staging

# Check staging is up
curl -I https://staging.clawer.ai

# Wipe staging containers only (keep DB and app)
docker rm -f $(docker ps -aq --filter "name=clawer_stg_") 2>/dev/null || true
```

---

*Last updated: 2026-02-21 | Status: Plan — not implemented | Review before executing*
