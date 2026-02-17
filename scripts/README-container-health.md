# Container Health Dashboard

**Quick container management for Clawer production server**

## What It Does

Monitor and manage all OpenClaw user containers on production server (YOUR_DOCKER_HOST):
- Real-time health checks (Docker status + HTTP endpoints)
- Security audits (exposed API keys, misconfigurations)
- Version tracking across containers
- Quick access to logs, restart, stop commands
- Full container inspection (resources, config, recent activity)

## Installation

Already installed at: `~/projects/clawer/scripts/container-health.sh`

```bash
# Make executable (if not already)
chmod +x ~/projects/clawer/scripts/container-health.sh
```

## Usage

### Quick Health Check
```bash
~/projects/clawer/scripts/container-health.sh
```

**Output:**
```
════════════════════════════════════════════════════════════════
  Clawer Container Health Dashboard
  Server: root@YOUR_DOCKER_HOST
  Time: 2026-02-16 04:15:32
════════════════════════════════════════════════════════════════

CONTAINER                           STATUS       HEALTH       PORT     IMAGE
────────────────────────────────────────────────────────────────
clawer_user_39idIfXQ8pPbCZM6HCBWw0  running      ✓ healthy    4004     v2026.2.6-3
clawer_user_test_123                exited       ✗ unhealthy  4010     ecommerce

════════════════════════════════════════════════════════════════
Total: 2 | Healthy: 1 | Degraded: 0 | Unhealthy: 1
════════════════════════════════════════════════════════════════
```

### Watch Mode (Real-Time Monitoring)
```bash
~/projects/clawer/scripts/container-health.sh status --watch
```

Refreshes every 30 seconds. Press `Ctrl+C` to exit.

**Use case:** During deployments, incident response, or multi-container management.

### View Container Logs
```bash
~/projects/clawer/scripts/container-health.sh logs <userId>
```

Example:
```bash
~/projects/clawer/scripts/container-health.sh logs 39idIfXQ8pPbCZM6HCBWw0Qy9bS
```

Shows last 100 lines and follows new logs (like `docker logs -f`).

### Restart Container
```bash
~/projects/clawer/scripts/container-health.sh restart <userId>
```

Example:
```bash
~/projects/clawer/scripts/container-health.sh restart 39idIfXQ8pPbCZM6HCBWw0Qy9bS
```

**Output:**
```
ℹ Restarting clawer_user_39idIfXQ8pPbCZM6HCBWw0Qy9bS...
✓ Container restarted
✓ Container is healthy
```

Includes automatic health check after restart.

### Stop Container
```bash
~/projects/clawer/scripts/container-health.sh stop <userId>
```

**Warning:** Only use when deliberately stopping a user's service (subscription cancelled, maintenance, etc.).

### Full Inspection
```bash
~/projects/clawer/scripts/container-health.sh inspect <userId>
```

Example:
```bash
~/projects/clawer/scripts/container-health.sh inspect 39idIfXQ8pPbCZM6HCBWw0Qy9bS
```

**Shows:**
- Basic info (image, status, uptime, resource limits)
- **Security check** (exposed API keys via `docker inspect`)
- Current resource usage (CPU, memory, network, disk)
- OpenClaw version
- Last 20 log lines

**Output:**
```
════════════════════════════════════════════════════════════════
  Container Inspection: clawer_user_39idIfXQ8pPbCZM6HCBWw0Qy9bS
════════════════════════════════════════════════════════════════

ℹ Basic Information
Image: clawer-openclaw:v2026.2.6-3
Status: running
Started: 2026-02-15T14:23:45.123Z
Memory Limit: 2147483648
CPU Limit: 1000000000
Restart Policy: unless-stopped

ℹ Security Check (Environment Variables)
⚠   Exposed: OPENAI_API_KEY=sk-p***
⚠   Exposed: GEMINI_API_KEY=AIza***
⚠   Exposed: GATEWAY_TOKEN=0a56***
⚠   Found 3 exposed keys (visible via docker inspect)

ℹ Resource Usage
CPU: 2.45%
Memory: 234.5MiB / 2GiB
Network I/O: 1.2MB / 450KB
Block I/O: 12.3MB / 8.9MB

ℹ OpenClaw Version
  openclaw 2026.2.6

ℹ Recent Logs (last 20 lines)
  [gateway] API server listening on 8081
  [gateway] Health check passed
  ...
════════════════════════════════════════════════════════════════
```

**Use case:** Debugging user issues, security audits, resource monitoring.

### Check Versions Across Containers
```bash
~/projects/clawer/scripts/container-health.sh versions
```

**Output:**
```
════════════════════════════════════════════════════════════════
  OpenClaw Version Check
════════════════════════════════════════════════════════════════

CONTAINER                           OPENCLAW VERSION     IMAGE
────────────────────────────────────────────────────────────────
clawer_user_39idIfXQ8pPbCZM6HCBWw0  openclaw 2026.2.6    v2026.2.6-3
clawer_user_test_123                openclaw 2026.2.14   ecommerce

ℹ Version Summary:
  openclaw 2026.2.6: 1 containers
  openclaw 2026.2.14: 1 containers
════════════════════════════════════════════════════════════════
```

**Use case:** Identify containers running outdated versions before upgrades.

### Security Audit
```bash
~/projects/clawer/scripts/container-health.sh security
```

**Checks:**
- ✅ Exposed API keys (via `docker inspect`)
- ✅ Privileged mode (security risk)
- ✅ Missing resource limits (DoS risk)
- ✅ Weak restart policies

**Output:**
```
════════════════════════════════════════════════════════════════
  Security Audit
════════════════════════════════════════════════════════════════

ℹ Auditing: clawer_user_39idIfXQ8pPbCZM6HCBWw0Qy9bS
⚠   ⚠ 3 API keys exposed via docker inspect
✓   No critical issues found

════════════════════════════════════════════════════════════════
⚠ Security audit complete: 3 issues found

ℹ Recommendations:
  1. Migrate API keys to secrets manager or .env file mounts
  2. Ensure all containers have resource limits
  3. Use 'unless-stopped' restart policy for production
════════════════════════════════════════════════════════════════
```

**Use case:** Pre-launch security review, compliance audits, incident investigation.

## Common Workflows

### During Incident Response
```bash
# 1. Quick overview
~/projects/clawer/scripts/container-health.sh

# 2. Identify unhealthy containers
# (Look for red "✗ unhealthy" status)

# 3. Inspect failing container
~/projects/clawer/scripts/container-health.sh inspect <userId>

# 4. Check logs for errors
~/projects/clawer/scripts/container-health.sh logs <userId>

# 5. Restart if needed
~/projects/clawer/scripts/container-health.sh restart <userId>
```

### Pre-Deployment Checks
```bash
# 1. Check version consistency
~/projects/clawer/scripts/container-health.sh versions

# 2. Run security audit
~/projects/clawer/scripts/container-health.sh security

# 3. Monitor health during deploy
~/projects/clawer/scripts/container-health.sh status --watch
```

### Weekly Health Checks
```bash
# Run on Mondays (example cron)
0 9 * * 1 ~/projects/clawer/scripts/container-health.sh security >> ~/logs/container-audit.log
```

## Troubleshooting

### "Failed to connect to server"
**Problem:** SSH connection failed

**Fix:**
```bash
# Test SSH access
ssh root@YOUR_DOCKER_HOST "echo 'Connection OK'"

# Check SSH keys
ls ~/.ssh/id_rsa*
```

### "Container not found"
**Problem:** Container doesn't exist for user ID

**Fix:**
```bash
# List all containers
ssh root@YOUR_DOCKER_HOST "docker ps -a | grep clawer_user_"

# Verify user ID is correct (check database)
```

### Script hangs on health check
**Problem:** Container port is not responding

**Possible causes:**
- Container crashed but Docker thinks it's running
- API server didn't start (check logs)
- Port conflict

**Fix:**
```bash
# Check container logs
~/projects/clawer/scripts/container-health.sh logs <userId>

# Manual health check
ssh root@YOUR_DOCKER_HOST "curl http://localhost:<port>/api/health"
```

## Design Decisions

### Why SSH vs Docker API?
- Production server is remote (YOUR_DOCKER_HOST)
- SSH already configured and secure
- No need to expose Docker API over network

### Why Bash vs TypeScript?
- Operations team familiarity
- No dependencies (works on any system with bash + ssh)
- Faster execution for simple queries
- Easy to run manually or in cron

### Health Check Strategy
Two-phase check:
1. **Docker status** - Is container running?
2. **HTTP health** - Is API server responding?

**Status definitions:**
- `healthy` - Docker running + HTTP 200
- `degraded` - Docker running + HTTP non-200/timeout
- `unhealthy` - Docker not running

### Security Trade-offs
The script reveals that API keys are exposed via `docker inspect`. This is **by design** in current architecture (env vars passed to container).

**Long-term fix:** Migrate to Docker secrets or mounted .env files.

**Short-term mitigation:** Restrict SSH access to production server.

## Performance

- **Status check (all containers):** ~2-5 seconds for 10 containers
- **Inspect single container:** ~1-2 seconds
- **Security audit:** ~5-10 seconds for 10 containers

SSH latency is the bottleneck. For frequent checks, use `--watch` mode (reuses connection).

## Integration

### Add to Clawer Dashboard (Future)
```typescript
// src/app/admin/containers/page.tsx
import { exec } from 'child_process';

export async function getContainerHealth() {
  const output = await exec('~/projects/clawer/scripts/container-health.sh --json');
  return JSON.parse(output);
}
```

### Slack/Discord Alerts (Future)
```bash
# Alert on unhealthy containers
~/projects/clawer/scripts/container-health.sh status | grep "unhealthy" && \
  curl -X POST "https://discord.com/api/webhooks/..." -d '{"content":"⚠️ Unhealthy container detected"}'
```

## Related

- **Container provisioning:** `~/projects/clawer/src/lib/provisioner.ts`
- **Database schema:** `~/projects/clawer/src/lib/db/schema/users.ts`
- **Deployment docs:** `~/projects/clawer/CONTAINER-PROVISIONING.md`

## Maintenance

**Monthly:**
- Review security audit results
- Check for version drift (containers on old images)
- Update script if new health checks needed

**After incidents:**
- Add new checks based on failure modes discovered
- Document incident response patterns

## Future Improvements

- [ ] JSON output mode for programmatic parsing
- [ ] Prometheus metrics export
- [ ] Auto-restart unhealthy containers (with max retries)
- [ ] Container upgrade automation
- [ ] Historical health tracking (store results in DB)
- [ ] Integration with main Clawer dashboard
- [ ] Slack/Discord webhook alerts
- [ ] Container logs search (grep across all containers)

---

**Last updated:** 2026-02-16  
**Author:** Lex (nightly-improvement-builder)
