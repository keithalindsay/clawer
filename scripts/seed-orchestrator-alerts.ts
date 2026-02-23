#!/usr/bin/env tsx
/**
 * Seed Orchestrator Default Alerts
 * 
 * Seeds the 5 default alert templates into the orchestrator_alerts table.
 * Safe to run multiple times (uses INSERT ... ON CONFLICT DO NOTHING)
 * 
 * Usage: tsx scripts/seed-orchestrator-alerts.ts
 */

import { db } from '../src/lib/db';
import { orchestratorAlerts } from '../src/lib/db/schema';

const DEFAULT_ALERTS = [
  {
    id: 'ssh_bruteforce',
    name: 'Failed SSH Login Detection',
    description: 'Monitors SSH authentication logs for brute force attempts. Alerts when >5 failed login attempts detected in 5 minutes.',
    checkScript: `FAILURES=$(journalctl -u sshd --since "5 minutes ago" | grep "Failed password" | wc -l); if [ $FAILURES -gt 5 ]; then echo "🚨 $FAILURES failed SSH login attempts detected"; journalctl -u sshd --since "5 minutes ago" | grep "Failed password" | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn; fi`,
    schedule: '*/5 * * * *',
    action: 'notify',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'disk_space',
    name: 'Disk Space Monitor',
    description: 'Monitors disk usage and warns at 80% (warning) and 90% (critical) thresholds.',
    checkScript: `USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%'); if [ $USAGE -gt 90 ]; then echo "🔴 CRITICAL: Disk usage at \${USAGE}%"; elif [ $USAGE -gt 80 ]; then echo "🟡 WARNING: Disk usage at \${USAGE}%"; fi`,
    schedule: '0 */6 * * *',
    action: 'notify',
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'config_audit',
    name: 'Daily Config Audit',
    description: 'Daily audit of container configuration files, resource usage, and security posture.',
    checkScript: `echo "🔍 Daily Config Audit - $(date)"; docker ps --filter "name=clawer_user_" --format "{{.Names}}: {{.Status}} | CPU: {{.CPUPerc}} | Mem: {{.MemUsage}}"`,
    schedule: '0 8 * * *',
    action: 'notify',
    severity: 'info',
    enabled: true,
  },
  {
    id: 'container_health',
    name: 'Container Health Monitor',
    description: 'Monitors all user containers for unhealthy status and gateway connectivity issues.',
    checkScript: `docker ps --filter "name=clawer_user_" --format "{{.Names}} {{.Status}}" | while read name status; do if echo "$status" | grep -q "unhealthy"; then echo "🔴 $name is unhealthy"; fi; PORT=$(docker port "$name" | grep -oP '\\d+$'); if ! curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then echo "🟡 $name gateway not responding"; fi; done`,
    schedule: '*/10 * * * *',
    action: 'notify',
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'unauthorized_access',
    name: 'Unauthorized Access Detection',
    description: 'Monitors for suspicious container access patterns, unexpected exec sessions, and potential escape attempts.',
    checkScript: `echo "🔒 Checking for unauthorized access patterns..."; docker events --since 15m --filter 'event=exec_start' --format '{{.Time}}: {{.Actor.Attributes.name}} - {{.Action}}' | tail -20`,
    schedule: '*/15 * * * *',
    action: 'notify',
    severity: 'critical',
    enabled: true,
  },
];

async function seedAlerts() {
  console.log('🌱 Seeding orchestrator alerts...\n');

  try {
    for (const alert of DEFAULT_ALERTS) {
      console.log(`📋 Seeding alert: ${alert.id} - ${alert.name}`);
      
      await db
        .insert(orchestratorAlerts)
        .values(alert)
        .onConflictDoNothing();
      
      console.log(`   ✅ ${alert.id} seeded (or already exists)\n`);
    }

    console.log('✨ All default alerts seeded successfully!\n');
    console.log('Alert summary:');
    console.log('  • ssh_bruteforce: Every 5 minutes (critical)');
    console.log('  • disk_space: Every 6 hours (warning)');
    console.log('  • config_audit: Daily at 8am (info)');
    console.log('  • container_health: Every 10 minutes (warning)');
    console.log('  • unauthorized_access: Every 15 minutes (critical)');
  } catch (error) {
    console.error('❌ Error seeding alerts:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedAlerts();
