-- Master Orchestrator - Phase 3: Permission System & Alert Routing
-- Migration: 0013_orchestrator.sql
-- Created: 2026-02-22

-- ══════════════════════════════════════════════════════════════════════════
-- Alert Definitions (templates + custom alerts)
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orchestrator_alerts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  check_script TEXT NOT NULL,
  schedule TEXT NOT NULL,          -- cron expression (e.g., "*/5 * * * *")
  action TEXT DEFAULT 'notify',    -- notify | auto | approve
  severity TEXT DEFAULT 'warning', -- info | warning | critical
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════
-- User Alert Assignments (which users get which alerts)
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alert_id TEXT REFERENCES orchestrator_alerts(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  threshold_overrides TEXT,         -- JSON string for user-specific thresholds
  permission_level TEXT DEFAULT 'notify', -- notify | auto | approve | manual
  created_at TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════
-- Alert History (log of all triggered alerts)
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS alert_history (
  id TEXT PRIMARY KEY,
  alert_id TEXT REFERENCES orchestrator_alerts(id) ON DELETE SET NULL,
  user_id TEXT,                     -- NULL = fleet-wide alert
  container_name TEXT,
  severity TEXT,
  message TEXT,
  action_taken TEXT,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════
-- Permission Requests (user approval flow for orchestrator actions)
-- ══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS permission_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,        -- upgrade | cleanup | config_change | security_patch
  description TEXT,
  status TEXT DEFAULT 'pending',    -- pending | approved | denied | expired
  expires_at TIMESTAMP,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════
-- Indexes for performance
-- ══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_alert_id ON user_alerts(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_requests_user_id ON permission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON permission_requests(status);

-- ══════════════════════════════════════════════════════════════════════════
-- Seed Data: 5 Default Alerts
-- ══════════════════════════════════════════════════════════════════════════
INSERT INTO orchestrator_alerts (id, name, description, check_script, schedule, action, severity, enabled)
VALUES
  (
    'ssh_bruteforce',
    'Failed SSH Login Detection',
    'Monitors SSH authentication logs for brute force attempts. Alerts when >5 failed login attempts detected in 5 minutes.',
    'FAILURES=$(journalctl -u sshd --since "5 minutes ago" | grep "Failed password" | wc -l); if [ $FAILURES -gt 5 ]; then echo "🚨 $FAILURES failed SSH login attempts detected"; journalctl -u sshd --since "5 minutes ago" | grep "Failed password" | awk ''{print $(NF-3)}'' | sort | uniq -c | sort -rn; fi',
    '*/5 * * * *',
    'notify',
    'critical',
    true
  ),
  (
    'disk_space',
    'Disk Space Monitor',
    'Monitors disk usage and warns at 80% (warning) and 90% (critical) thresholds.',
    'USAGE=$(df -h / | awk ''NR==2 {print $5}'' | tr -d ''%''); if [ $USAGE -gt 90 ]; then echo "🔴 CRITICAL: Disk usage at ${USAGE}%"; elif [ $USAGE -gt 80 ]; then echo "🟡 WARNING: Disk usage at ${USAGE}%"; fi',
    '0 */6 * * *',
    'notify',
    'warning',
    true
  ),
  (
    'config_audit',
    'Daily Config Audit',
    'Daily audit of container configuration files, resource usage, and security posture.',
    'echo "🔍 Daily Config Audit - $(date)"; docker ps --filter "name=clawer_user_" --format "{{.Names}}: {{.Status}} | CPU: {{.CPUPerc}} | Mem: {{.MemUsage}}"',
    '0 8 * * *',
    'notify',
    'info',
    true
  ),
  (
    'container_health',
    'Container Health Monitor',
    'Monitors all user containers for unhealthy status and gateway connectivity issues.',
    'docker ps --filter "name=clawer_user_" --format "{{.Names}} {{.Status}}" | while read name status; do if echo "$status" | grep -q "unhealthy"; then echo "🔴 $name is unhealthy"; fi; PORT=$(docker port "$name" | grep -oP ''\d+$''); if ! curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then echo "🟡 $name gateway not responding"; fi; done',
    '*/10 * * * *',
    'notify',
    'warning',
    true
  ),
  (
    'unauthorized_access',
    'Unauthorized Access Detection',
    'Monitors for suspicious container access patterns, unexpected exec sessions, and potential escape attempts.',
    'echo "🔒 Checking for unauthorized access patterns..."; docker events --since 15m --filter ''event=exec_start'' --format ''{{.Time}}: {{.Actor.Attributes.name}} - {{.Action}}'' | tail -20',
    '*/15 * * * *',
    'notify',
    'critical',
    true
  )
ON CONFLICT (id) DO NOTHING;
