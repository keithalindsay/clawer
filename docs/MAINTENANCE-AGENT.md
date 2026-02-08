# Clawer Container Maintenance Agent (CCMA)

Autonomous monitoring and auto-remediation for OpenClaw user containers.

## Overview

The Clawer Container Maintenance Agent (CCMA) is a Node.js service that continuously monitors all user containers, detects issues, and automatically fixes problems using a graduated response system.

### Key Features

- **Health Monitoring**: Checks container status, API responsiveness, resource usage
- **Auto-Remediation**: Graduated fix levels from light cache clears to full restarts
- **Smart Detection**: Identifies stuck containers, missing builds, resource issues
- **Comprehensive Logging**: All actions logged to `logs/maintenance.log`
- **API Validation**: Tests Moonshot API key on startup

## Architecture

```
┌─────────────────────────────────────────┐
│     Maintenance Agent (CCMA)            │
│  ┌─────────────────────────────────┐    │
│  │  MaintenanceAgent               │    │
│  │  - Orchestrates all components  │    │
│  └────────────┬────────────────────┘    │
│               │                          │
│     ┌─────────┼──────────┐               │
│     │         │          │               │
│  ┌──▼──┐  ┌──▼───┐  ┌──▼────┐           │
│  │Health│  │Remed-│  │Valid- │           │
│  │Check │  │iator │  │ator   │           │
│  └──────┘  └──────┘  └───────┘           │
│                                           │
│  Logger → logs/maintenance.log            │
└───────────────┬───────────────────────────┘
                │
                ▼
        Docker API (/var/run/docker.sock)
                │
        ┌───────┴────────┐
        │ User Containers │
        │ (clawer_user_*) │
        └────────────────┘
```

## Files Structure

```
src/lib/maintenance/
├── index.ts           # Main service coordinator
├── types.ts           # Type definitions
├── logger.ts          # Logging system
├── health-checker.ts  # Container health monitoring
├── remediation.ts     # Auto-fix actions
└── validator.ts       # API key & env validation

scripts/
├── maintenance-check.ts    # CLI entry point
└── run-maintenance.sh      # Wrapper script with env setup

logs/
└── maintenance.log         # JSON-formatted log output
```

## Installation

No additional dependencies needed - uses existing Clawer project dependencies.

```bash
# Make scripts executable
chmod +x scripts/maintenance-check.ts
chmod +x scripts/run-maintenance.sh
```

## Usage

### CLI Commands

```bash
# Show help
npx tsx scripts/maintenance-check.ts --help

# Run single check (for cron jobs)
npx tsx scripts/maintenance-check.ts

# Run continuous monitoring (daemon mode, 5 min interval)
npx tsx scripts/maintenance-check.ts --daemon

# Run continuous monitoring with custom interval
npx tsx scripts/maintenance-check.ts --daemon --interval 10

# Using the wrapper script (handles Node version)
./scripts/run-maintenance.sh
./scripts/run-maintenance.sh --daemon
```

### Cron Setup

Add to crontab for automatic checks every 5 minutes:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your clawer directory)
*/5 * * * * cd /home/user/projects/clawer && ./scripts/run-maintenance.sh >> logs/maintenance-cron.log 2>&1
```

### Systemd Service (Production)

For production deployment, create a systemd service:

```bash
# /etc/systemd/system/clawer-maintenance.service
[Unit]
Description=Clawer Container Maintenance Agent
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=clawer
WorkingDirectory=/opt/clawer
ExecStart=/usr/bin/npx tsx scripts/maintenance-check.ts --daemon --interval 5
Restart=always
RestartSec=10
Environment="NODE_VERSION=20"
Environment="MOONSHOT_API_KEY=your-api-key-here"

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable clawer-maintenance
sudo systemctl start clawer-maintenance
sudo systemctl status clawer-maintenance
```

## Health Checks

The agent performs the following checks on each container:

### Container State Checks

| Check | Method | Frequency |
|-------|--------|-----------|
| Container Running | `docker inspect` | Every cycle |
| API Responsive | HTTP GET `/health` | Every cycle |
| Memory Usage | `docker stats` | Every cycle |
| CPU Usage | `docker stats` | Every cycle |
| .next Build Exists | `docker exec test -d` | Every cycle |

### Health States

- **HEALTHY**: All checks pass
- **DEGRADED**: High resource usage or minor issues
- **UNHEALTHY**: API unresponsive but container running
- **DEAD**: Container not running
- **UNKNOWN**: Cannot determine state

## Auto-Remediation

The agent uses a graduated response system:

### Fix Level 1: In-Process (No Restart)
- Clear PM2 logs
- Flush caches
- **Duration**: ~2 seconds
- **Impact**: Minimal

### Fix Level 2: Process Restart
- Restart PM2 processes
- **Duration**: ~10 seconds
- **Impact**: Brief interruption

### Fix Level 3: Container Restart
- Graceful container restart
- **Duration**: 30-60 seconds
- **Impact**: Service downtime

### Fix Level 4: Container Recreate
- Full recreate with new config
- **Duration**: 1-2 minutes
- **Impact**: Full downtime
- **Note**: Currently not implemented (requires manual approval)

### Safety Limits

- **Max restart attempts**: 3 per level per 30 minutes
- **Attempt window**: 30 minutes (resets after)
- **Escalation**: After 3 failed attempts, issue is logged and requires manual intervention

## Logging

All events are logged to `logs/maintenance.log` in JSON format:

```json
{
  "timestamp": "2026-02-08T03:08:56.737Z",
  "level": "info",
  "event": "=== Starting maintenance check ===",
  "containerId": "abc123...",
  "details": {...}
}
```

### Log Levels

- **info**: Normal operations, status updates
- **warn**: Non-critical issues, degraded states
- **error**: Critical failures, blocked operations

### Viewing Logs

```bash
# View all logs
cat logs/maintenance.log

# View logs in real-time
tail -f logs/maintenance.log

# Pretty-print JSON logs
cat logs/maintenance.log | jq .

# Filter by level
cat logs/maintenance.log | jq 'select(.level == "error")'

# Filter by container
cat logs/maintenance.log | jq 'select(.containerId == "abc123...")'
```

## Configuration

Configure via environment variables or pass to `MaintenanceAgent` constructor:

| Variable | Default | Description |
|----------|---------|-------------|
| `MOONSHOT_API_KEY` | None | API key for Moonshot (required for provisioning) |
| `healthCheckIntervalMs` | 300000 | Check interval (5 minutes) |
| `maxRestartAttempts` | 3 | Max restart attempts per level |
| `apiTimeoutMs` | 5000 | API health check timeout |
| `logPath` | `logs/maintenance.log` | Log file path |

## Monitoring & Alerts

### Current Logging

All events are logged to file with structured JSON. You can parse logs to:

- Track uptime metrics
- Monitor fix success rates
- Identify problematic containers
- Generate reports

### Future Enhancements (Not Implemented)

- WhatsApp alerts for critical failures
- Dashboard integration
- Prometheus metrics export
- Incident tracking database

## Troubleshooting

### Docker Permission Denied

**Problem**: `permission denied while trying to connect to the docker API`

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Or run with sudo (not recommended for production)
sudo npx tsx scripts/maintenance-check.ts
```

### API Key Validation Failed

**Problem**: `Moonshot API key validation failed`

**Solution**:
1. Check `.env` file has `MOONSHOT_API_KEY=...`
2. Verify key is valid: `curl -H "Authorization: Bearer $MOONSHOT_API_KEY" https://api.moonshot.cn/v1/models`
3. Agent will still run and monitor existing containers even without valid key

### No Containers Found

**Problem**: `totalContainers: 0` in health check

**Possible causes**:
- No user containers running (normal state)
- Container name pattern changed (expects `clawer_user_*`)
- Docker access issues

### High Memory/CPU Warnings

**Problem**: Frequent DEGRADED states for resource usage

**Solution**:
1. Check actual usage: `docker stats clawer_user_<userId>`
2. Increase container limits in `orchestrator.ts`
3. Optimize container workloads

## API Reference

### MaintenanceAgent

```typescript
import { MaintenanceAgent } from '@/lib/maintenance';

const agent = new MaintenanceAgent({
  healthCheckIntervalMs: 5 * 60 * 1000,  // 5 minutes
  maxRestartAttempts: 3,
  apiTimeoutMs: 5000,
  moonshotApiKey: process.env.MOONSHOT_API_KEY,
  logPath: 'logs/maintenance.log',
});

// Initialize and validate
await agent.initialize();

// Run single check
await agent.runCheck();

// Start daemon
await agent.start();

// Stop daemon
await agent.stop();

// Get status
const status = agent.getStatus();
```

## Testing

### Manual Test

```bash
# Run a single check
npx tsx scripts/maintenance-check.ts

# Expected output:
# - Initialization logs
# - Environment validation
# - Health check results
# - Remediation attempts (if needed)
# - Final stats
```

### Test with Mock Containers

```bash
# Create a test container
docker run -d --name clawer_user_test -p 4999:8080 nginx

# Run maintenance check
npx tsx scripts/maintenance-check.ts

# Check logs
cat logs/maintenance.log | jq 'select(.containerId != null)'

# Clean up
docker stop clawer_user_test
docker rm clawer_user_test
```

## Performance

- **Check duration**: ~5-10 seconds for 10 containers
- **Memory usage**: ~50-100 MB
- **CPU usage**: Minimal (< 1% average)
- **Disk usage**: Logs rotate needed (not auto-implemented yet)

## Roadmap

### Current Features ✅
- [x] Health checking
- [x] Auto-restart (Levels 1-3)
- [x] Resource monitoring
- [x] JSON logging
- [x] API validation
- [x] CLI interface
- [x] Daemon mode

### Planned Features 📋
- [ ] Database integration (PostgreSQL)
- [ ] WhatsApp/email alerts
- [ ] Dashboard integration
- [ ] Prometheus metrics
- [ ] Advanced anomaly detection
- [ ] Runbook execution engine
- [ ] Auto log rotation
- [ ] User notification system

## Contributing

When modifying the maintenance agent:

1. Update types in `types.ts` first
2. Add tests before implementing features
3. Log all significant actions
4. Follow graduated response pattern
5. Document new fix levels
6. Update this README

## Support

For issues or questions:

1. Check logs: `cat logs/maintenance.log | jq .`
2. Run manual check: `npx tsx scripts/maintenance-check.ts`
3. Review the spec: `specs/MAINTENANCE-AGENT-SPEC.md`
4. File an issue with log excerpts

---

**Last Updated**: 2026-02-08  
**Version**: 1.0.0  
**Status**: Production Ready (with Docker access)
