# Security Fixes Applied

**Date:** February 8, 2026  
**Status:** ✅ Code committed, pending production deployment  
**Commits:** 550c4b4, 8977248, 8a58efb, e9185b1

---

## Summary

All 4 critical security vulnerabilities have been fixed and committed to the repository:

### ✅ Fix #1: Container API Authentication
**Commit:** 550c4b4  
**Changes:**
- Added `gatewayToken` column to users table
- Generate unique 32-byte hex token per container
- Added Bearer token authentication to `api-server.js`
- Updated `container-client.ts` to pass auth header
- **BONUS:** Bound container ports to `127.0.0.1` (localhost only)

**Impact:** Prevents unauthorized access to user containers

### ✅ Fix #2: Stripe Webhook Signature Enforcement
**Commit:** 8977248  
**Changes:**
- Removed dangerous bypass for missing `STRIPE_WEBHOOK_SECRET`
- Webhook now rejects all requests if secret not configured
- Always verify signature, never skip validation

**Impact:** Prevents payment bypass and privilege escalation attacks

### ✅ Fix #3: Container Ports - Localhost Only
**Commit:** 8a58efb  
**Changes:**
- Created `scripts/fix-container-ports.sh` to fix existing containers
- Script recreates containers with `127.0.0.1` port bindings
- Preserves all env vars, volumes, and settings
- Orchestrator already updated in Fix #1 for new containers

**Impact:** Removes direct internet access to container ports

### ✅ Fix #4: Docker Secrets for API Keys
**Commit:** e9185b1  
**Changes:**
- Updated `entrypoint.sh` to unset `OPENAI_API_KEY` after writing config
- Unset `GATEWAY_TOKEN` after writing config
- Env vars no longer visible via `docker inspect`

**Impact:** Prevents API key and token theft from container inspection

---

## Deployment to Production

### Prerequisites
- SSH access to production server (YOUR_DOCKER_HOST)
- Database backup
- Container backup (optional but recommended)

### Step 1: Deploy Code Changes

```bash
# On production server
cd /opt/clawer
git pull origin main

# Rebuild Docker image (for entrypoint.sh and api-server.js changes)
cd docker/openclaw-user
docker build -t clawer-openclaw:latest .
```

### Step 2: Run Database Migration

```bash
# On production server
cd /opt/clawer

# Apply migration (adds gatewayToken column)
npm run db:push

# Or manually:
psql "$DATABASE_URL" -f drizzle/0004_add_gateway_token.sql
```

### Step 3: Fix Existing Container

⚠️ **This will restart the user's container!**

```bash
# On production server
cd /opt/clawer

# Run the fix script (requires jq)
sudo apt-get install -y jq  # if not already installed
sudo ./scripts/fix-container-ports.sh
```

**What this does:**
1. Stops the existing container
2. Inspects and saves all env vars and volumes
3. Removes old container
4. Recreates with localhost-only port bindings
5. Uses the new Docker image (with API auth + env var cleanup)

**Expected output:**
```
🔒 Fixing container port bindings to localhost only...

Found containers:
clawer_user_user_39J8qrTlonXJZMPANz4xGKywaXQ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Processing: clawer_user_user_39J8qrTlonXJZMPANz4xGKywaXQ

Current ports: gateway=4003, api=4004
🛑 Stopping old container...
🗑️  Removing old container...
🚀 Creating new container with localhost-only ports...
✅ Container recreated successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All containers fixed!

Verifying port bindings...
NAMES                                     PORTS
clawer_user_user_39J8qrTlonXJZMPANz4xGKywaXQ   127.0.0.1:4003->8080/tcp, 127.0.0.1:4004->8081/tcp

🔒 All container ports now bound to localhost only (127.0.0.1)
   Containers are no longer accessible from the internet.
```

### Step 4: Restart Next.js App

```bash
# On production server
cd /opt/clawer
pm2 restart clawer
# or
systemctl restart clawer
# or however you run it
```

### Step 5: Verify Fixes

#### Test 1: Container API Auth
```bash
# From production server
# Should fail (no auth):
curl http://localhost:4004/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
# Expected: {"error":"Unauthorized"}

# From internet (should timeout - not accessible):
curl http://YOUR_DOCKER_HOST:4004/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  --max-time 5
# Expected: Connection timeout
```

#### Test 2: Stripe Webhook
```bash
# Should fail (no STRIPE_WEBHOOK_SECRET):
curl https://clawer.ai/api/webhooks/stripe \
  -X POST \
  -H "Content-Type: application/json" \
  -H "stripe-signature: fake" \
  -d '{"type":"test"}'
# Expected: {"error":"Webhook not configured"}
```

#### Test 3: Port Binding
```bash
# On production server
docker ps --filter "name=clawer_user_" --format "{{.Ports}}"
# Expected: 127.0.0.1:4003->8080/tcp, 127.0.0.1:4004->8081/tcp
#          (NOT 0.0.0.0:4003->8080/tcp)

# From internet (should be inaccessible)
nmap -p 4003,4004 YOUR_DOCKER_HOST
# Expected: filtered/closed
```

#### Test 4: Docker Secrets
```bash
# On production server
docker inspect clawer_user_user_39J8qrTlonXJZMPANz4xGKywaXQ | grep -i openai
# Expected: No results (env var unset)

# Check inside container
docker exec clawer_user_user_39J8qrTlonXJZMPANz4xGKywaXQ env | grep OPENAI
# Expected: No results (unset after config generated)
```

---

## Rollback Plan

If something goes wrong:

### Rollback Code
```bash
cd /opt/clawer
git reset --hard HEAD~4  # Undo 4 commits
docker build -t clawer-openclaw:latest docker/openclaw-user/
pm2 restart clawer
```

### Rollback Database
```bash
# Remove gatewayToken column
psql "$DATABASE_URL" -c "ALTER TABLE users DROP COLUMN gateway_token;"
```

### Rollback Container
```bash
# If you saved the old container before removing:
docker start <old_container_id>

# Or recreate with old port bindings:
docker run -d \
  --name clawer_user_user_39J8qrTlonXJZMPANz4xGKywaXQ \
  -p 4003:8080 \
  -p 4004:8081 \
  <other flags> \
  clawer-openclaw:latest
```

---

## Post-Deployment

### Required Configuration

Ensure `STRIPE_WEBHOOK_SECRET` is set in production environment:

```bash
# Add to .env or environment config
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

Get the secret from Stripe Dashboard:
1. Go to Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Reveal" under Signing secret
4. Copy and set as environment variable

### Security Audit Checklist

After deployment, verify:

- [ ] Container ports not accessible from internet (`nmap` test)
- [ ] Container API rejects requests without auth token
- [ ] Stripe webhook rejects unsigned requests
- [ ] `OPENAI_API_KEY` not visible in `docker inspect`
- [ ] `GATEWAY_TOKEN` not visible in `docker inspect`
- [ ] Application still functional (chat, WhatsApp, etc.)

---

## Security Posture Improvement

**Before fixes:**
- ❌ Container API: No authentication
- ❌ Container ports: Exposed to internet
- ❌ Stripe webhook: Signature verification bypassable
- ❌ API keys: Visible in `docker inspect`

**After fixes:**
- ✅ Container API: Bearer token authentication
- ✅ Container ports: Localhost only (127.0.0.1)
- ✅ Stripe webhook: Signature required, no bypass
- ✅ API keys: Removed from environment after use

**Risk Level:**
- Before: 🔴 **CRITICAL** (CVSS 9.8)
- After: 🟢 **LOW** (Defense in depth achieved)

---

## Next Steps (Recommended)

These fixes address the 4 critical vulnerabilities. The security scan identified additional improvements:

### High Priority (Week 2)
- [ ] Add Slack webhook signature verification
- [ ] Implement command sanitization (switch to dockerode)
- [ ] Add CSRF protection (@edge-csrf/nextjs)

### Medium Priority (Month 1)
- [ ] Deploy Redis for rate limiting
- [ ] Wire up token usage tracking
- [ ] Harden container security (drop capabilities, read-only filesystem)
- [ ] Fix database schema FK types

### Low Priority (Month 2)
- [ ] Add security headers (CSP, HSTS, etc.)
- [ ] Clean up unused code (bot-engine, unused tables)
- [ ] Implement comprehensive audit logging

See `SECURITY_SCAN_RESULTS.md` for full details.

---

## Support

If you encounter issues during deployment:

1. Check logs: `docker logs clawer_user_user_39J8qrTlonXJZMPANz4xGKywaXQ`
2. Check app logs: `pm2 logs clawer`
3. Verify database connection: `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"`
4. Test container API locally: `curl http://localhost:4004/ready`

For emergencies, rollback using the procedures above.

---

**Deployed by:** [Your name]  
**Deployment date:** [Date]  
**Verification:** [Checklist completed Y/N]
