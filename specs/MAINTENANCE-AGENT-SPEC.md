# Clawer.ai Container Maintenance Agent (CCMA) Specification

> **Version**: 1.0  
> **Last Updated**: 2026-02-07  
> **Status**: Draft  
> **Owner**: Platform Infrastructure Team

---

## 1. Agent Overview

### Identity
- **Name**: Clawer Container Maintenance Agent (CCMA)
- **Codename**: `ccma` / `maintenance-agent`
- **Purpose**: Ensure 99.9% uptime for paying users' OpenClaw containers through proactive monitoring, automated remediation, and intelligent escalation.

### Operating Model
CCMA runs as a **privileged autonomous agent** with direct Docker API access on the Clawer production server (YOUR_DOCKER_HOST). It operates in three modes:

1. **Scheduled Monitoring**: Health checks every 60 seconds for all active containers
2. **Reactive Response**: Immediate action on Docker events (container stops, OOM, etc.)
3. **Proactive Maintenance**: Scheduled tasks for updates, backups, and cleanup

### Design Principles
- **Autonomy First**: Fix problems automatically when safe; escalate when uncertain
- **Minimal Disruption**: Prefer in-container fixes over full restarts
- **Audit Everything**: Every action logged with timestamps and outcomes
- **Fail Safe**: When in doubt, preserve current state and alert humans

---

## 2. Health Monitoring

### Health Definition
A container is **HEALTHY** when ALL of the following are true:

| Check | Method | Threshold | Frequency |
|-------|--------|-----------|-----------|
| Container Running | `docker inspect --format='{{.State.Running}}'` | `true` | 60s |
| Gateway Process | `docker exec <id> pm2 jlist` → gateway status | `online` | 60s |
| API Server | `GET http://localhost:<port>/health` | HTTP 200 within 5s | 60s |
| Memory Usage | `docker stats --no-stream` | < 80% of limit | 60s |
| CPU Usage | `docker stats --no-stream` | < 90% sustained | 60s |
| WhatsApp Session | `GET /api/whatsapp/status` (if configured) | `connected` | 5m |
| Telegram Bot | `GET /api/telegram/status` (if configured) | `connected` | 5m |
| Last Activity | Query activity log | Within 48 hours | 1h |
| Error Rate | Parse recent logs | < 10 errors/minute | 5m |

### Health States
```
HEALTHY     → All checks pass
DEGRADED    → 1-2 non-critical checks failing (e.g., high memory)
UNHEALTHY   → Critical check failing (gateway down, API unresponsive)
DEAD        → Container not running
UNKNOWN     → Cannot determine state (check failure)
```

### Container Registry
CCMA maintains a registry of all managed containers:

```sql
CREATE TABLE containers (
    id UUID PRIMARY KEY,
    docker_id VARCHAR(64) NOT NULL,
    container_name VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL CHECK (port BETWEEN 4001 AND 5000),
    user_id UUID NOT NULL,
    user_email VARCHAR(255),
    user_phone VARCHAR(20),  -- For WhatsApp notifications
    created_at TIMESTAMP DEFAULT NOW(),
    config_version INTEGER DEFAULT 1,
    last_healthy_at TIMESTAMP,
    current_state VARCHAR(20) DEFAULT 'unknown',
    whatsapp_enabled BOOLEAN DEFAULT false,
    telegram_enabled BOOLEAN DEFAULT false
);
```

---

## 3. Detection Capabilities

### Problem Taxonomy

#### P0 - Critical (Immediate Action Required)
| Problem | Detection Method | Signal |
|---------|-----------------|--------|
| Container Crashed | Docker events API | `container.die` event |
| Container Stopped | `docker inspect` | `State.Running = false` |
| OOM Kill | Docker events + exit code | Exit code 137 or `OOMKilled = true` |
| Gateway Process Dead | PM2 status check | Process status ≠ `online` |
| API Completely Unresponsive | HTTP health check | 5 consecutive failures (5+ seconds each) |

#### P1 - High (Action Within 5 Minutes)
| Problem | Detection Method | Signal |
|---------|-----------------|--------|
| API Slow Response | HTTP health check timing | Response > 10 seconds |
| High Memory Usage | Docker stats | > 90% of container limit |
| WhatsApp Disconnected | API status endpoint | `whatsapp.status = disconnected` |
| Telegram Bot Down | API status endpoint | `telegram.status = disconnected` |
| Error Loop Detected | Log analysis | Same error > 10x in 5 minutes |

#### P2 - Medium (Action Within 1 Hour)
| Problem | Detection Method | Signal |
|---------|-----------------|--------|
| High CPU Usage | Docker stats | > 80% sustained for 10+ minutes |
| Disk Space Low | `df` inside container | < 20% free on /app volume |
| Config Drift | Config hash comparison | Hash mismatch from stored version |
| Stale Container | Activity log | No user interaction in 48+ hours |

#### P3 - Low (Scheduled Maintenance)
| Problem | Detection Method | Signal |
|---------|-----------------|--------|
| Log Files Large | File size check | > 500MB total logs |
| Old Docker Image | Image age check | > 7 days since last pull |
| SSL Certificate Expiring | Cert check | < 30 days to expiry |
| Outdated Dependencies | Version check | Security advisories published |

### Detection Implementation

```python
# Pseudo-code for health check loop
async def health_check_loop():
    while True:
        for container in get_active_containers():
            try:
                health = await check_container_health(container)
                await record_health(container, health)
                
                if health.state == 'DEAD':
                    await handle_dead_container(container)
                elif health.state == 'UNHEALTHY':
                    await handle_unhealthy_container(container)
                elif health.state == 'DEGRADED':
                    await handle_degraded_container(container)
                    
            except Exception as e:
                await record_check_failure(container, e)
                
        await asyncio.sleep(60)
```

---

## 4. Automated Fix Actions

### Fix Hierarchy
CCMA follows a **graduated response** model. Start with the least disruptive fix; escalate if it fails.

```
Level 1: In-Process Fix (no user impact)
    ↓ if fails
Level 2: Process Restart (brief interruption)
    ↓ if fails
Level 3: Container Restart (30-60s downtime)
    ↓ if fails
Level 4: Container Recreate (1-2 min downtime)
    ↓ if fails
Level 5: Escalate to Human
```

### Fix Actions Detail

#### Level 1: In-Process Fixes
| Action | When | Command | Timeout |
|--------|------|---------|---------|
| Clear Session Cache | Stuck sessions | `docker exec <id> openclaw admin clear-sessions` | 10s |
| Flush Redis Cache | Memory pressure | `docker exec <id> redis-cli FLUSHDB` | 5s |
| Rotate Logs | Disk space low | `docker exec <id> pm2 flush && find /app/logs -mtime +7 -delete` | 30s |
| Reconnect WhatsApp | WA disconnected | `docker exec <id> openclaw whatsapp reconnect` | 60s |

#### Level 2: Process Restart
| Action | When | Command | Timeout |
|--------|------|---------|---------|
| Restart Gateway | Gateway unresponsive | `docker exec <id> pm2 restart gateway` | 30s |
| Restart API Server | API unresponsive | `docker exec <id> pm2 restart api` | 30s |
| Restart All PM2 | Multiple process issues | `docker exec <id> pm2 restart all` | 60s |

#### Level 3: Container Restart
| Action | When | Command | Timeout |
|--------|------|---------|---------|
| Graceful Restart | Process restarts failed | `docker restart <id>` | 120s |
| Force Restart | Graceful timeout | `docker restart -t 0 <id>` | 30s |

#### Level 4: Container Recreate
| Action | When | Command | Notes |
|--------|------|---------|-------|
| Pull Latest Image | Update needed | `docker pull clawer/openclaw:latest` | Pre-pull during off-hours |
| Recreate Container | Restarts failed 3x | Stop → Remove → Create → Start | Preserve volumes |
| Rollback Config | New config broke | Restore from `config_backups` | Version -1 |

### Fix Attempt Tracking

```sql
CREATE TABLE fix_attempts (
    id UUID PRIMARY KEY,
    container_id UUID REFERENCES containers(id),
    problem_type VARCHAR(50) NOT NULL,
    fix_level INTEGER NOT NULL,
    fix_action VARCHAR(100) NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    success BOOLEAN,
    error_message TEXT,
    output TEXT
);

-- Query: Recent fix attempts for a container
SELECT * FROM fix_attempts 
WHERE container_id = $1 
AND started_at > NOW() - INTERVAL '1 hour'
ORDER BY started_at DESC;
```

### Safety Guards
- **Rate Limiting**: Max 3 restart attempts per container per 30 minutes
- **Blast Radius**: Never restart more than 10% of containers simultaneously
- **Quiet Hours**: Delay non-critical fixes between 2-6 AM user local time
- **Rollback Ready**: Always backup config before changes

---

## 5. Escalation Protocol

### Escalation Triggers

| Trigger | Condition | Priority |
|---------|-----------|----------|
| Fix Exhaustion | All auto-fix levels failed (3+ attempts at each level) | P0 |
| Prolonged Outage | Container unhealthy > 5 minutes despite fixes | P0 |
| Security Anomaly | Unexpected process, network connection, or file change | P0 |
| Unknown Error | Error pattern not in known signatures | P1 |
| Payment Issue | Billing webhook indicates failed payment | P1 |
| Resource Exhaustion | Host disk < 5% or host memory < 10% | P0 |
| Mass Failure | > 20% of containers unhealthy simultaneously | P0 |

### Escalation Workflow

```
1. DETECT: Problem identified, auto-fix attempted
2. CLASSIFY: Determine escalation priority (P0-P3)
3. NOTIFY: Send alerts via appropriate channels
4. DOCUMENT: Create incident record with full context
5. TRACK: Monitor until human acknowledges
6. HANDOFF: Provide runbook link and diagnostic data
```

### Incident Record

```sql
CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    container_id UUID REFERENCES containers(id),
    priority VARCHAR(2) NOT NULL,  -- P0, P1, P2, P3
    problem_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    escalated_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    fix_attempts_count INTEGER DEFAULT 0,
    auto_fix_succeeded BOOLEAN DEFAULT false
);
```

---

## 6. Notification System

### Notification Channels

| Channel | Use Case | Latency | Format |
|---------|----------|---------|--------|
| WhatsApp (Admin) | P0 Critical alerts | Immediate | Short message + link |
| WhatsApp (User) | User action needed (re-scan QR) | Immediate | Friendly message |
| Dashboard | All incidents | Real-time | Full incident card |
| Email | Daily summaries, P2-P3 issues | Batched | HTML report |
| Slack/Discord | Dev team awareness | Immediate | Webhook |
| Audit Log | Everything | Synchronous | Structured JSON |

### Admin WhatsApp Alerts
**Target**: +18606815315

```
🚨 CCMA ALERT [P0]

Container: user-abc123 (port 4021)
Problem: Container crashed - OOM Kill
Status: Auto-fix failed (3 attempts)
Duration: 7 minutes

Action needed: Manual investigation
Dashboard: https://clawer.ai/admin/incidents/abc123

Reply MUTE to silence for 1 hour
```

### User WhatsApp Notifications
**Target**: User's registered WhatsApp number

```
Hi! 👋 

Your Clawer assistant needs your help to reconnect to WhatsApp.

Please scan this QR code to restore the connection:
https://clawer.ai/reconnect/abc123

This link expires in 15 minutes.

— Clawer.ai Support
```

### Dashboard Alert Schema

```json
{
  "incident_id": "uuid",
  "priority": "P0",
  "container": {
    "id": "uuid",
    "name": "user-abc123",
    "port": 4021,
    "user_email": "user@example.com"
  },
  "problem": {
    "type": "oom_kill",
    "description": "Container killed due to out of memory",
    "detected_at": "2026-02-07T19:30:00Z"
  },
  "fix_attempts": [
    {"level": 3, "action": "container_restart", "success": false, "at": "..."},
    {"level": 3, "action": "container_restart", "success": false, "at": "..."},
    {"level": 3, "action": "container_restart", "success": false, "at": "..."}
  ],
  "status": "escalated",
  "escalated_at": "2026-02-07T19:35:00Z"
}
```

### Audit Log Format

```json
{
  "timestamp": "2026-02-07T19:30:00.123Z",
  "event_type": "fix_attempt",
  "container_id": "uuid",
  "action": "container_restart",
  "level": 3,
  "trigger": "gateway_unresponsive",
  "outcome": "failure",
  "error": "Container did not become healthy within 120s",
  "duration_ms": 120000,
  "agent_version": "1.0.0"
}
```

Logs written to:
- `/var/log/ccma/ccma.log` (JSON lines, rotated daily)
- PostgreSQL `audit_log` table (queryable)

---

## 7. Scheduled Maintenance

### Maintenance Schedule

| Task | Frequency | Window | Duration |
|------|-----------|--------|----------|
| Health Sweep | Every 60s | 24/7 | ~5s per container |
| Deep Diagnostics | Hourly | 24/7 | ~30s per container |
| Log Rotation | Daily | 03:00-04:00 UTC | ~1 min per container |
| Config Backup | Daily | 04:00-05:00 UTC | ~30s per container |
| Image Update Check | Daily | 05:00 UTC | 5 minutes total |
| Security Scan | Weekly (Sunday) | 02:00-03:00 UTC | ~5 min per container |
| Image Pull & Update | Monthly (1st) | 02:00-06:00 UTC | Rolling, 10% at a time |

### Health Sweep (Every 60 Seconds)
```python
async def health_sweep():
    containers = await get_all_containers()
    
    for container in containers:
        health = await quick_health_check(container)  # Docker state + API health
        
        if health.changed_from_last:
            await record_state_change(container, health)
            
        if health.needs_attention:
            await queue_remediation(container, health)
```

### Deep Diagnostics (Hourly)
```python
async def deep_diagnostics():
    for container in get_containers_by_priority():
        # Full inspection
        stats = await docker_stats(container)
        logs = await recent_logs(container, lines=100)
        processes = await exec_ps(container)
        disk = await exec_df(container)
        
        # Analyze
        issues = analyze_diagnostics(stats, logs, processes, disk)
        
        for issue in issues:
            if issue.severity >= P2:
                await queue_fix(container, issue)
```

### Log Rotation (Daily 03:00 UTC)
```bash
#!/bin/bash
# For each container
docker exec $CONTAINER_ID bash -c '
    # Rotate PM2 logs
    pm2 flush
    
    # Compress old logs
    find /app/logs -name "*.log" -mtime +1 -exec gzip {} \;
    
    # Delete logs older than 7 days
    find /app/logs -name "*.gz" -mtime +7 -delete
    
    # Report disk usage
    du -sh /app/logs
'
```

### Config Backup (Daily 04:00 UTC)
```python
async def backup_configs():
    for container in get_all_containers():
        # Extract config
        config = await exec_cat(container, '/app/.env')
        user_config = await exec_cat(container, '/app/config/user.json')
        
        # Version and store
        version = container.config_version + 1
        await store_config_backup(
            container_id=container.id,
            version=version,
            config=config,
            user_config=user_config
        )
        
        # Keep last 30 versions
        await prune_old_backups(container.id, keep=30)
```

### Rolling Image Update (Monthly)
```python
async def rolling_update():
    # Pull new image first
    await docker_pull('clawer/openclaw:latest')
    
    containers = get_all_containers()
    batch_size = max(1, len(containers) // 10)  # 10% at a time
    
    for batch in chunked(containers, batch_size):
        for container in batch:
            try:
                await update_container(container)
                await verify_healthy(container, timeout=120)
            except Exception as e:
                await rollback_container(container)
                await alert_update_failed(container, e)
                
        # Wait between batches
        await asyncio.sleep(300)  # 5 minutes
```

---

## 8. Agent Architecture

### Runtime Model

CCMA runs as an **OpenClaw instance** itself — it uses the same agent framework it monitors. This provides:
- Built-in scheduling (cron expressions)
- Tool ecosystem (Docker, HTTP, notifications)
- State management (memory files)
- Natural language incident summaries

```
┌─────────────────────────────────────────────────────────────┐
│                    Host: YOUR_DOCKER_HOST                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  CCMA Agent     │    │  PostgreSQL     │                 │
│  │  (OpenClaw)     │◄──►│  (State Store)  │                 │
│  │  Port: 4000     │    │  Port: 5432     │                 │
│  └────────┬────────┘    └─────────────────┘                 │
│           │                                                  │
│           ▼ Docker Socket (/var/run/docker.sock)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Docker Daemon                         │ │
│  ├──────────┬──────────┬──────────┬──────────┬────────────┤ │
│  │ User     │ User     │ User     │ User     │    ...     │ │
│  │ Container│ Container│ Container│ Container│            │ │
│  │ :4001    │ :4002    │ :4003    │ :4004    │ :4005-5000 │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Permissions Required

```yaml
# Docker Compose for CCMA
services:
  ccma:
    image: clawer/openclaw:latest
    container_name: ccma-maintenance-agent
    ports:
      - "4000:4000"
    volumes:
      # Docker socket access (critical)
      - /var/run/docker.sock:/var/run/docker.sock
      # Persistent state
      - ccma-data:/app/data
      # Logs
      - /var/log/ccma:/app/logs
    environment:
      - CCMA_MODE=maintenance-agent
      - DOCKER_HOST=unix:///var/run/docker.sock
      - DATABASE_URL=postgresql://ccma:${DB_PASSWORD}@postgres:5432/ccma
      - ADMIN_WHATSAPP=+18606815315
      - CONTAINER_PORT_RANGE=4001-5000
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Docker API Access

CCMA uses the Docker Engine API via the Unix socket:

```python
import docker

class DockerManager:
    def __init__(self):
        self.client = docker.from_env()  # Uses /var/run/docker.sock
        
    def list_managed_containers(self):
        """Get all OpenClaw containers in managed port range."""
        containers = self.client.containers.list(all=True)
        return [
            c for c in containers
            if self._is_managed_container(c)
        ]
        
    def _is_managed_container(self, container):
        """Check if container is in managed port range (4001-5000)."""
        ports = container.attrs.get('NetworkSettings', {}).get('Ports', {})
        for port_binding in ports.values():
            if port_binding:
                host_port = int(port_binding[0]['HostPort'])
                if 4001 <= host_port <= 5000:
                    return True
        return False
        
    async def restart_container(self, container_id: str, timeout: int = 30):
        """Restart a container with timeout."""
        container = self.client.containers.get(container_id)
        container.restart(timeout=timeout)
        
    async def exec_in_container(self, container_id: str, command: str):
        """Execute command inside container."""
        container = self.client.containers.get(container_id)
        result = container.exec_run(command)
        return result.exit_code, result.output.decode()
```

### State Management

CCMA maintains state in PostgreSQL:

```sql
-- Core tables (already shown above)
-- containers, fix_attempts, incidents

-- Additional state tables

-- Container health history (for trending)
CREATE TABLE health_history (
    id BIGSERIAL PRIMARY KEY,
    container_id UUID REFERENCES containers(id),
    timestamp TIMESTAMP DEFAULT NOW(),
    state VARCHAR(20) NOT NULL,
    cpu_percent FLOAT,
    memory_percent FLOAT,
    response_time_ms INTEGER,
    error_count INTEGER
);

-- Create index for efficient queries
CREATE INDEX idx_health_history_container_time 
ON health_history(container_id, timestamp DESC);

-- Scheduled tasks tracking
CREATE TABLE scheduled_tasks (
    id UUID PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    schedule VARCHAR(100) NOT NULL,  -- Cron expression
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    last_status VARCHAR(20),
    last_error TEXT
);

-- Configuration store
CREATE TABLE config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Memory Files (OpenClaw Native)

CCMA also uses OpenClaw's native memory system for context:

```
~/ccma/
├── AGENTS.md           # Agent instructions
├── MEMORY.md           # Long-term learnings
├── memory/
│   └── YYYY-MM-DD.md   # Daily incident logs
├── runbooks/
│   ├── oom-kill.md
│   ├── whatsapp-disconnect.md
│   └── ...
└── state/
    └── current.json    # Current monitoring state
```

---

## 9. Runbook Integration

### Runbook Format

Each problem type has a structured runbook:

```markdown
# Runbook: OOM Kill

## Detection
- **Signal**: Container exit code 137 OR `OOMKilled: true` in Docker inspect
- **Check Command**: `docker inspect --format='{{.State.OOMKilled}}' <container>`
- **Severity**: P0

## Root Causes
1. Memory leak in application
2. Large file processing
3. Too many concurrent connections
4. Container memory limit too low

## Auto-Fix Steps
1. **Restart Container** (Level 3)
   - Command: `docker restart <container_id>`
   - Wait: 60 seconds for healthy
   - Success if: API responds to /health

2. **Increase Memory Limit** (Level 4) - REQUIRES APPROVAL
   - Stop container
   - Recreate with +256MB memory
   - Start container
   - Monitor for 5 minutes

## Escalation Trigger
- OOM kill happens 3+ times in 1 hour
- Memory increase doesn't help

## Resolution Verification
- Container state = running
- API health check passes
- Memory usage < 70% after 5 minutes
- No OOM events in Docker events for 10 minutes

## Prevention
- Set up memory usage alerting at 80%
- Review application for memory leaks
- Consider upgrading container tier
```

### Runbook Index

| Problem Type | Runbook File | Auto-Fix Levels |
|--------------|--------------|-----------------|
| Container Crash | `crash.md` | 3, 4 |
| OOM Kill | `oom-kill.md` | 3, 4 |
| Gateway Unresponsive | `gateway-unresponsive.md` | 1, 2, 3 |
| API Slow | `api-slow.md` | 1, 2 |
| WhatsApp Disconnect | `whatsapp-disconnect.md` | 1, 2 |
| Telegram Disconnect | `telegram-disconnect.md` | 1, 2 |
| High CPU | `high-cpu.md` | 1, 2, 3 |
| High Memory | `high-memory.md` | 1, 2, 3 |
| Disk Space | `disk-space.md` | 1 |
| Config Corruption | `config-corruption.md` | 4 |
| Error Loop | `error-loop.md` | 2, 3 |
| SSL Expiry | `ssl-expiry.md` | 1 |

### Runbook Execution Engine

```python
class RunbookExecutor:
    def __init__(self, docker_manager, notifier):
        self.docker = docker_manager
        self.notifier = notifier
        self.runbooks = self._load_runbooks()
        
    async def execute_runbook(self, container, problem_type):
        runbook = self.runbooks.get(problem_type)
        if not runbook:
            await self.escalate_unknown_problem(container, problem_type)
            return
            
        for step in runbook.auto_fix_steps:
            # Check if we've exceeded attempts at this level
            attempts = await self.get_recent_attempts(container, step.level)
            if attempts >= 3:
                continue  # Try next level
                
            # Execute fix
            result = await self.execute_step(container, step)
            await self.record_attempt(container, step, result)
            
            if result.success:
                # Verify resolution
                if await self.verify_resolution(container, runbook.verification):
                    await self.close_incident(container, problem_type)
                    return
                    
        # All auto-fix levels exhausted
        await self.escalate(container, problem_type, runbook)
```

---

## 10. Metrics & Reporting

### Key Metrics

| Metric | Definition | Target | Alert Threshold |
|--------|------------|--------|-----------------|
| Container Uptime | % time container is HEALTHY | 99.9% | < 99% |
| MTTD | Time from problem start to detection | < 60s | > 120s |
| MTTR | Time from detection to resolution | < 5 min | > 15 min |
| Auto-Fix Success Rate | % of incidents resolved without escalation | > 90% | < 80% |
| Escalation Rate | Escalations per container per month | < 0.5 | > 2 |
| False Positive Rate | % of alerts that weren't real problems | < 5% | > 10% |

### Metrics Collection

```sql
-- View: Container uptime (last 30 days)
CREATE VIEW container_uptime_30d AS
SELECT 
    c.id,
    c.container_name,
    COUNT(CASE WHEN hh.state = 'HEALTHY' THEN 1 END)::FLOAT / 
    COUNT(*)::FLOAT * 100 AS uptime_percent
FROM containers c
JOIN health_history hh ON c.id = hh.container_id
WHERE hh.timestamp > NOW() - INTERVAL '30 days'
GROUP BY c.id, c.container_name;

-- View: MTTR by problem type
CREATE VIEW mttr_by_problem AS
SELECT 
    problem_type,
    AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at))) AS avg_mttr_seconds,
    COUNT(*) AS incident_count
FROM incidents
WHERE resolved_at IS NOT NULL
AND detected_at > NOW() - INTERVAL '30 days'
GROUP BY problem_type;

-- View: Auto-fix success rate
CREATE VIEW autofix_success_rate AS
SELECT 
    DATE_TRUNC('day', detected_at) AS day,
    COUNT(CASE WHEN auto_fix_succeeded THEN 1 END)::FLOAT / 
    COUNT(*)::FLOAT * 100 AS success_rate
FROM incidents
WHERE detected_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', detected_at)
ORDER BY day;
```

### Daily Report (Email to Admin)

```
CCMA Daily Report - 2026-02-07
================================

Summary
-------
Total Containers: 47
Healthy: 45 (95.7%)
Degraded: 2 (4.3%)
Unhealthy: 0 (0%)

Incidents (Last 24h)
--------------------
Total: 8
Auto-resolved: 7 (87.5%)
Escalated: 1 (12.5%)

Top Issues:
1. WhatsApp Disconnect (4 incidents)
2. High Memory (2 incidents)
3. Gateway Unresponsive (2 incidents)

Metrics
-------
Average Uptime: 99.7%
MTTD: 45 seconds
MTTR: 3.2 minutes

Scheduled Tasks
---------------
✓ Health Sweep: 1440 runs, 0 failures
✓ Log Rotation: Completed, freed 2.3 GB
✓ Config Backup: 47 configs backed up

Attention Required
------------------
- Container user-xyz789 escalated at 14:23 (high memory, needs tier upgrade)
- 2 containers approaching 90% memory limit

[View Dashboard →]
```

### Grafana Dashboard

CCMA exposes Prometheus metrics at `/metrics`:

```
# Container health
ccma_container_health{container="user-abc123", state="healthy"} 1
ccma_container_health{container="user-xyz789", state="degraded"} 1

# Resource usage
ccma_container_cpu_percent{container="user-abc123"} 23.5
ccma_container_memory_percent{container="user-abc123"} 45.2

# Incident metrics
ccma_incidents_total{type="oom_kill", outcome="auto_resolved"} 15
ccma_incidents_total{type="oom_kill", outcome="escalated"} 2

# Fix attempts
ccma_fix_attempts_total{level="1", outcome="success"} 45
ccma_fix_attempts_total{level="2", outcome="success"} 12
ccma_fix_attempts_total{level="3", outcome="failure"} 3

# Timing
ccma_mttd_seconds_histogram_bucket{le="30"} 892
ccma_mttd_seconds_histogram_bucket{le="60"} 1023
ccma_mttr_seconds_histogram_bucket{le="300"} 156
```

---

## 11. Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Basic monitoring and restart capability

**Deliverables**:
- [ ] CCMA container deployed on YOUR_DOCKER_HOST
- [ ] Docker API integration working
- [ ] Container registry populated
- [ ] Basic health checks (container running, API responding)
- [ ] Container restart capability (Level 3 fix)
- [ ] WhatsApp alerting to admin
- [ ] PostgreSQL state store

**Success Criteria**:
- Can detect container crashes within 60 seconds
- Can auto-restart crashed containers
- Admin receives WhatsApp alerts

### Phase 2: Smart Remediation (Weeks 3-4)
**Goal**: Targeted fixes and better diagnostics

**Deliverables**:
- [ ] Full health check suite (CPU, memory, logs)
- [ ] Level 1 & 2 fixes (in-process, process restart)
- [ ] PM2 process management
- [ ] WhatsApp/Telegram reconnection workflow
- [ ] User notification system
- [ ] Log rotation automation
- [ ] Config backup system
- [ ] Dashboard integration

**Success Criteria**:
- 80% of incidents auto-resolved without restart
- Users notified for WhatsApp re-authentication
- Daily config backups running

### Phase 3: Proactive & Intelligent (Weeks 5-6)
**Goal**: Predictive maintenance and learning

**Deliverables**:
- [ ] Health history trending
- [ ] Anomaly detection (unusual patterns)
- [ ] Rolling image updates
- [ ] Runbook execution engine
- [ ] Full metrics & reporting
- [ ] Grafana dashboard
- [ ] Self-healing for common patterns

**Success Criteria**:
- 90%+ auto-fix success rate
- MTTR < 5 minutes average
- Predict issues before user impact

### Phase 4: Scale & Harden (Weeks 7-8)
**Goal**: Production-ready for 100+ containers

**Deliverables**:
- [ ] Load testing at scale
- [ ] Rate limiting and blast radius controls
- [ ] Disaster recovery procedures
- [ ] Runbook documentation complete
- [ ] On-call handoff procedures
- [ ] Post-incident review process

**Success Criteria**:
- Handle 100+ containers smoothly
- 99.9% platform uptime
- Clear escalation and handoff process

---

## Appendix A: Docker Commands Reference

```bash
# List all managed containers
docker ps --filter "publish=4001-5000" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"

# Health check a specific container
docker inspect --format='{{.State.Health.Status}}' <container_id>

# Get container stats
docker stats --no-stream <container_id>

# Execute command in container
docker exec <container_id> pm2 jlist

# Restart container
docker restart <container_id>

# View recent logs
docker logs --tail 100 <container_id>

# Watch Docker events
docker events --filter 'type=container' --format '{{.Time}} {{.Actor.Attributes.name}} {{.Action}}'
```

## Appendix B: API Endpoints

CCMA exposes its own API for dashboard integration:

```
GET  /health                    # CCMA health check
GET  /api/containers            # List all managed containers
GET  /api/containers/:id        # Container details
GET  /api/containers/:id/health # Container health history
POST /api/containers/:id/restart # Manual restart trigger
GET  /api/incidents             # List incidents
GET  /api/incidents/:id         # Incident details
POST /api/incidents/:id/ack     # Acknowledge incident
GET  /api/metrics               # Prometheus metrics
GET  /api/reports/daily         # Daily report JSON
```

## Appendix C: Environment Variables

```bash
# Required
CCMA_MODE=maintenance-agent
DOCKER_HOST=unix:///var/run/docker.sock
DATABASE_URL=postgresql://ccma:password@localhost:5432/ccma
ADMIN_WHATSAPP=+18606815315

# Optional
CONTAINER_PORT_RANGE=4001-5000      # Default: 4001-5000
HEALTH_CHECK_INTERVAL=60            # Default: 60 seconds
MAX_RESTART_ATTEMPTS=3              # Default: 3
ESCALATION_TIMEOUT=300              # Default: 300 seconds (5 min)
LOG_LEVEL=info                      # Default: info
NOTIFICATION_COOLDOWN=300           # Default: 300 seconds between alerts
```

---

*This specification is a living document. Update as the system evolves.*
