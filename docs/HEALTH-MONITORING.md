# Container Health Monitoring System

## Overview

Comprehensive health monitoring for all user containers with proactive alerts and dashboard visualization.

## Components

### 1. Fleet Health Check Script
**Location:** `/opt/orchestrator/scripts/fleet-health-check.sh`

Performs comprehensive health checks on all `clawer_user_*` containers:

- **Gateway Health:** HTTP endpoint response time (<5s)
- **Config Validation:** `openclaw doctor` exit code
- **Disk Usage:** Alert at >80% (warning), >90% (critical)
- **Memory Usage:** Alert at >90% (critical)
- **Uptime/Restarts:** Detect restart loops (>5 restarts in 1h)
- **Heartbeat:** Last activity within 30 minutes

**Output:** JSON array with health status for each container

```bash
# Manual run
/opt/orchestrator/scripts/fleet-health-check.sh
```

### 2. Health Dashboard API
**Endpoint:** `GET /api/admin/health/fleet`  
**Location:** `~/projects/clawer/src/app/api/admin/health/fleet/route.ts`

Executes the health check script via SSH and returns JSON.

**Response:**
```json
{
  "timestamp": "2026-02-23T00:00:00Z",
  "containers": [
    {
      "name": "clawer_user_abc123",
      "userId": "abc123",
      "status": "healthy|warning|critical",
      "checks": {
        "gateway": { "status": "pass", "responseMs": 120 },
        "config": { "status": "pass" },
        "disk": { "status": "warning", "usagePercent": 82 },
        "memory": { "status": "pass", "usagePercent": 45 },
        "uptime": { "status": "pass", "hours": 24, "restarts": 0 },
        "heartbeat": { "status": "pass", "lastSeen": "<30m" }
      },
      "issues": ["Disk usage at 82%"]
    }
  ],
  "summary": {
    "total": 4,
    "healthy": 3,
    "warning": 1,
    "critical": 0
  }
}
```

### 3. Health Dashboard UI
**URL:** `https://clawer.ai/admin/health`  
**Location:** `~/projects/clawer/src/app/admin/health/page.tsx`

Features:
- Fleet overview cards (total, healthy, warning, critical)
- Container list with status indicators
- Expandable details showing individual check results
- Auto-refresh every 60 seconds
- Real-time issue detection

### 4. Automated Health Monitoring
**Script:** `/opt/orchestrator/scripts/health-monitor-cron.sh`  
**Cron Config:** `/opt/orchestrator/health-monitor.cron`

Runs every 10 minutes (when enabled) to:
- Execute health checks
- Store results at `/opt/orchestrator/logs/fleet-health-latest.json`
- Append to history at `/opt/orchestrator/logs/fleet-health-history.jsonl`
- Detect status changes (healthy → warning → critical)
- Trigger alerts for critical issues
- Log alerts to `/opt/orchestrator/logs/fleet-health-alerts.jsonl`

**Enable the cron job:**
```bash
# On server as root
sudo cp /opt/orchestrator/health-monitor.cron /etc/cron.d/clawer-health-monitor
sudo chmod 644 /etc/cron.d/clawer-health-monitor
```

**Disable the cron job:**
```bash
sudo rm /etc/cron.d/clawer-health-monitor
```

**View logs:**
```bash
# Latest health check
cat /opt/orchestrator/logs/fleet-health-latest.json | jq

# Alert history
tail -f /opt/orchestrator/logs/fleet-health-alerts.jsonl

# Cron execution log
tail -f /opt/orchestrator/logs/health-monitor-cron.log
```

## Alert Integration

The health monitor integrates with the existing alert system:

### Status Change Detection
- **healthy → warning:** Logged to alert history (no notification)
- **warning → critical:** Logged + notification sent
- **critical/warning → healthy:** Recovery logged

### Alert Types
```json
{
  "type": "status_change",
  "severity": "critical",
  "container": "clawer_user_abc123",
  "userId": "abc123",
  "from": "warning",
  "to": "critical",
  "issues": "Gateway not responding, Memory usage at 92%",
  "timestamp": "2026-02-23T00:00:00Z"
}
```

```json
{
  "type": "recovery",
  "severity": "info",
  "container": "clawer_user_abc123",
  "userId": "abc123",
  "from": "critical",
  "to": "healthy",
  "timestamp": "2026-02-23T00:15:00Z"
}
```

## Health Check Thresholds

| Check | Warning | Critical |
|-------|---------|----------|
| Gateway | No response in 5s | - |
| Config | Validation fails | - |
| Disk | >80% used | >90% used |
| Memory | - | >90% used |
| Restarts | >3 restarts | >5 restarts in <1h |
| Heartbeat | 30m-1h since last activity | >1h since last activity |

## Maintenance

### Log Rotation
The health monitor automatically rotates history logs to keep the last 1000 entries (~7 days at 10-minute intervals).

### Manual Cleanup
```bash
# Clear old history
sudo truncate -s 0 /opt/orchestrator/logs/fleet-health-history.jsonl

# Clear alert history
sudo truncate -s 0 /opt/orchestrator/logs/fleet-health-alerts.jsonl

# Reset state (will trigger alerts on next run)
sudo rm /opt/orchestrator/logs/fleet-health-state.json
```

## Testing

### Manual Health Check
```bash
# Run health check
ssh root@YOUR_DOCKER_HOST "/opt/orchestrator/scripts/fleet-health-check.sh"

# Run monitoring cycle
ssh root@YOUR_DOCKER_HOST "/opt/orchestrator/scripts/health-monitor-cron.sh"

# Check latest results
ssh root@YOUR_DOCKER_HOST "cat /opt/orchestrator/logs/fleet-health-latest.json | jq"
```

### Test Alert Detection
```bash
# Stop a container to trigger critical alert
docker stop clawer_user_test123

# Run monitoring
/opt/orchestrator/scripts/health-monitor-cron.sh

# Verify alert was logged
cat /opt/orchestrator/logs/fleet-health-alerts.jsonl | tail -1 | jq

# Start container to trigger recovery
docker start clawer_user_test123

# Run monitoring again
/opt/orchestrator/scripts/health-monitor-cron.sh

# Verify recovery was logged
cat /opt/orchestrator/logs/fleet-health-alerts.jsonl | tail -1 | jq
```

## Dashboard Access

**URL:** https://clawer.ai/admin/health

**Requirements:**
- Admin authentication via Clerk
- Admin status verified via `isAdmin()` function

**Features:**
- Real-time status cards
- Container health grid
- Expandable check details
- Auto-refresh toggle
- Manual refresh button

## Future Enhancements

1. **Email/SMS Alerts:** Send notifications for critical issues
2. **Slack Integration:** Post alerts to Slack channel
3. **Historical Charts:** Graph health metrics over time
4. **Predictive Alerts:** Warn before issues become critical (e.g., disk at 75%)
5. **Auto-Recovery:** Restart containers that fail health checks
6. **User Notifications:** Alert users when their container has issues
7. **Health Score:** Composite metric for overall fleet health

## Troubleshooting

### Dashboard shows no containers
- Verify containers are named `clawer_user_*`
- Check SSH access: `ssh root@YOUR_DOCKER_HOST "docker ps"`
- Verify script permissions: `ls -l /opt/orchestrator/scripts/fleet-health-check.sh`

### Health check times out
- Increase timeout in API route (`timeout: 60000`)
- Check container health manually: `docker exec clawer_user_XXX openclaw doctor`
- Review script execution: `bash -x /opt/orchestrator/scripts/fleet-health-check.sh`

### Alerts not triggering
- Verify cron is running: `systemctl status cron`
- Check cron log: `tail /opt/orchestrator/logs/health-monitor-cron.log`
- Verify state file exists: `cat /opt/orchestrator/logs/fleet-health-state.json`

### False positives
- Adjust thresholds in `fleet-health-check.sh`
- Extend timeout values
- Filter specific containers from checks

## Related Documentation

- [Container Lifecycle Management](../specs/CONTAINER-LIFECYCLE-MANAGEMENT.md)
- [Orchestrator Alert System](../specs/ORCHESTRATOR-ALERTS.md)
- [Container Provisioning](../docs/CONTAINER-PROVISIONING.md)
