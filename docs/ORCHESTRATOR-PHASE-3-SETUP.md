# Master Orchestrator - Phase 3 Setup Guide

## Overview

Phase 3 implements the **Permission System & Alert Routing API** for the Master Orchestrator. This enables:

1. **Alert Management** - Pre-built security alerts that can be assigned to users
2. **Permission System** - User approval workflow for orchestrator actions
3. **Alert History** - Complete audit trail of all triggered alerts
4. **User Controls** - Dashboard for users to manage their alert preferences

---

## Database Setup

### 1. Run the Migration

```bash
cd ~/projects/clawer

# Option A: Using psql directly
psql $DATABASE_URL -f migrations/0013_orchestrator.sql

# Option B: Using the connection string from .env
source .env
psql "$DATABASE_URL" -f migrations/0013_orchestrator.sql
```

This creates 4 tables:
- `orchestrator_alerts` - Alert definitions (templates + custom)
- `user_alerts` - Per-user alert assignments
- `alert_history` - Log of triggered alerts
- `permission_requests` - Approval workflow queue

**Note:** The migration automatically seeds 5 default alerts.

### 2. Verify Tables

```bash
psql $DATABASE_URL -c "\dt orchestrator*"
```

Expected output:
```
                List of relations
 Schema |          Name           | Type  | Owner
--------+-------------------------+-------+--------
 public | alert_history           | table | clawer
 public | orchestrator_alerts     | table | clawer
 public | permission_requests     | table | clawer
 public | user_alerts             | table | clawer
```

### 3. Verify Default Alerts

```bash
psql $DATABASE_URL -c "SELECT id, name, severity, schedule FROM orchestrator_alerts ORDER BY severity, name;"
```

Should show 5 alerts:
1. **ssh_bruteforce** - Critical, every 5 min
2. **unauthorized_access** - Critical, every 15 min
3. **disk_space** - Warning, every 6 hours
4. **container_health** - Warning, every 10 min
5. **config_audit** - Info, daily at 8am

---

## API Endpoints

### Admin Endpoints

#### List All Alerts
```bash
GET /api/admin/orchestrator/alerts
```

#### Create/Update Alert
```bash
POST /api/admin/orchestrator/alerts
Content-Type: application/json

{
  "id": "optional-for-update",
  "name": "Custom Alert",
  "description": "Description of what this monitors",
  "checkScript": "echo 'check logic here'",
  "schedule": "*/10 * * * *",
  "action": "notify",
  "severity": "warning",
  "enabled": true
}
```

#### Get Alert History (All Users)
```bash
GET /api/admin/orchestrator/alerts/history?userId=user_123&severity=critical&limit=50
```

#### Respond to Permission Request (Admin)
```bash
POST /api/admin/orchestrator/permissions/[requestId]/respond
Content-Type: application/json

{
  "action": "approve" | "deny"
}
```

### Dashboard Endpoints (User)

#### Get My Alerts
```bash
GET /api/dashboard/alerts
```

Returns user's alert assignments with joined alert definitions.

#### Toggle Alert On/Off
```bash
POST /api/dashboard/alerts/[alertId]/toggle
```

Toggles the enabled state for that user.

#### Get My Alert History
```bash
GET /api/dashboard/alerts/history?limit=50&offset=0
```

#### Get My Permission Requests
```bash
GET /api/dashboard/permissions?status=pending
```

Query params:
- `status`: `pending` (default), `approved`, `denied`, `expired`, or `all`

#### Respond to Permission Request
```bash
POST /api/dashboard/permissions/[requestId]/respond
Content-Type: application/json

{
  "action": "approve" | "deny"
}
```

---

## Testing

### Run Tests

```bash
cd ~/projects/clawer

# Run all orchestrator tests
npm test -- orchestrator

# Run specific test files
npm test -- src/app/api/admin/orchestrator/__tests__/alerts.test.ts
npm test -- src/app/api/dashboard/__tests__/orchestrator.test.ts
```

### Manual API Testing

```bash
# Set auth token (get from Clerk dashboard or login)
TOKEN="your_clerk_session_token"

# Test: Get all alerts (admin)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/orchestrator/alerts

# Test: Get my alerts (user)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/dashboard/alerts

# Test: Create permission request (simulate orchestrator)
curl -X POST -H "Content-Type: application/json" \
  http://localhost:3000/api/dashboard/permissions \
  -d '{
    "userId": "user_123",
    "actionType": "security_patch",
    "description": "Update OpenClaw to v2026.2.22",
    "expiresAt": "'$(date -u -d '+24 hours' +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

---

## Seed Data Script

If you need to re-seed the default alerts (safe to run multiple times):

```bash
cd ~/projects/clawer
tsx scripts/seed-orchestrator-alerts.ts
```

Output:
```
🌱 Seeding orchestrator alerts...

📋 Seeding alert: ssh_bruteforce - Failed SSH Login Detection
   ✅ ssh_bruteforce seeded (or already exists)

... (4 more alerts)

✨ All default alerts seeded successfully!
```

---

## Default Alerts Reference

### 1. SSH Brute Force Detection
- **ID:** `ssh_bruteforce`
- **Schedule:** Every 5 minutes
- **Severity:** Critical
- **Action:** Notify user
- **Monitors:** Failed SSH login attempts (>5 in 5 min)

### 2. Disk Space Monitor
- **ID:** `disk_space`
- **Schedule:** Every 6 hours
- **Severity:** Warning
- **Action:** Notify user
- **Monitors:** Disk usage (warns at 80%, critical at 90%)

### 3. Daily Config Audit
- **ID:** `config_audit`
- **Schedule:** Daily at 8am
- **Severity:** Info
- **Action:** Notify user
- **Monitors:** Container config changes, resource usage, security posture

### 4. Container Health
- **ID:** `container_health`
- **Schedule:** Every 10 minutes
- **Severity:** Warning
- **Action:** Notify user
- **Monitors:** Container health status, gateway connectivity

### 5. Unauthorized Access Detection
- **ID:** `unauthorized_access`
- **Schedule:** Every 15 minutes
- **Severity:** Critical
- **Action:** Notify user
- **Monitors:** Suspicious exec sessions, unexpected port openings, escape attempts

---

## Permission Levels

When assigning alerts to users, each alert can have a permission level:

| Level | Behavior | Use Case |
|-------|----------|----------|
| `notify` | Execute, notify user after | Default for most alerts |
| `auto` | Always execute, notify after | Urgent actions (disk cleanup at 95%) |
| `approve` | Require user approval before executing | Security patches, config changes |
| `manual` | Never auto-execute, notify only | Data deletion, major upgrades |

Set via `user_alerts.permission_level` field.

---

## Next Steps

**Phase 4: Fleet Intelligence**
- Aggregate container metrics
- Build recommendation engine
- Create weekly fleet health reports
- Implement auto-remediation for common issues

**Phase 5: User Onboarding Integration**
- Add "Security Setup" step during onboarding
- Pre-configure recommended alerts for new users
- Explain what each alert does
- Let users customize thresholds

---

## Troubleshooting

### Migration Fails

**Error:** `relation "orchestrator_alerts" already exists`

**Solution:** Migration was already run. If you need to re-run:
```bash
psql $DATABASE_URL -c "DROP TABLE IF EXISTS alert_history CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS permission_requests CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS user_alerts CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS orchestrator_alerts CASCADE;"

psql $DATABASE_URL -f migrations/0013_orchestrator.sql
```

### No Default Alerts

Run the seed script:
```bash
tsx scripts/seed-orchestrator-alerts.ts
```

### API Returns 401

Ensure you're authenticated with Clerk. For admin endpoints, verify your user has admin role:
```bash
psql $DATABASE_URL -c "SELECT id, email, tier FROM users WHERE id = 'your_user_id';"
```

---

## Files Created

```
migrations/
  └── 0013_orchestrator.sql                    # Database schema + seed data

scripts/
  └── seed-orchestrator-alerts.ts              # Re-seed default alerts

src/lib/db/schema/
  ├── index.ts                                 # Updated with orchestrator export
  └── orchestrator.ts                          # Drizzle schema definitions

src/app/api/admin/orchestrator/
  ├── alerts/
  │   ├── route.ts                             # GET/POST alert definitions
  │   └── history/
  │       └── route.ts                         # GET alert history (all users)
  ├── permissions/
  │   └── [requestId]/
  │       └── respond/
  │           └── route.ts                     # POST approve/deny (admin)
  └── __tests__/
      └── alerts.test.ts                       # Admin endpoint tests

src/app/api/dashboard/
  ├── alerts/
  │   ├── route.ts                             # GET user's alerts
  │   ├── [alertId]/
  │   │   └── toggle/
  │   │       └── route.ts                     # POST toggle alert
  │   └── history/
  │       └── route.ts                         # GET user's alert history
  ├── permissions/
  │   ├── route.ts                             # GET user's permission requests
  │   └── [requestId]/
  │       └── respond/
  │           └── route.ts                     # POST approve/deny (user)
  └── __tests__/
      └── orchestrator.test.ts                 # Dashboard endpoint tests
```

---

**Status:** ✅ Phase 3 Complete  
**Committed:** bb0cdc6  
**Pushed:** origin/main  
**Ready for:** Phase 4 implementation
