# Maintenance Agent - Deployment Checklist

Use this checklist when deploying the maintenance agent to production.

## Pre-Deployment

- [ ] Review `docs/MAINTENANCE-AGENT.md`
- [ ] Review `MAINTENANCE-QUICK-START.md`
- [ ] Verify all files present:
  ```bash
  ls -la src/lib/maintenance/
  ls -la scripts/maintenance-check.ts
  ls -la scripts/run-maintenance.sh
  ```

## Environment Setup

- [ ] Set `MOONSHOT_API_KEY` in `.env` or environment
  ```bash
  echo "MOONSHOT_API_KEY=sk-your-key-here" >> .env
  ```

- [ ] Verify Docker access (must return containers):
  ```bash
  docker ps
  ```

- [ ] Add user to docker group if needed:
  ```bash
  sudo usermod -aG docker $USER
  # Then log out and back in
  ```

- [ ] Create logs directory:
  ```bash
  mkdir -p logs
  ```

- [ ] Test Node version (requires 20+):
  ```bash
  node --version  # Should be v20.x or v22.x
  ```

## Testing

- [ ] Run single check:
  ```bash
  npm run maintenance
  ```

- [ ] Verify log file created:
  ```bash
  cat logs/maintenance.log | jq .
  ```

- [ ] Check for errors in output:
  ```bash
  cat logs/maintenance.log | jq 'select(.level == "error")'
  ```

- [ ] Test daemon mode (run for 30 seconds):
  ```bash
  timeout 30s npm run maintenance:daemon
  # Should run checks and exit cleanly
  ```

## Production Deployment (Option 1: Cron)

- [ ] Edit crontab:
  ```bash
  crontab -e
  ```

- [ ] Add job (update path):
  ```
  */5 * * * * cd /opt/clawer && /usr/bin/npm run maintenance >> logs/maintenance-cron.log 2>&1
  ```

- [ ] Verify cron is running:
  ```bash
  sudo systemctl status cron
  ```

- [ ] Wait 5 minutes and check logs:
  ```bash
  tail -20 logs/maintenance-cron.log
  cat logs/maintenance.log | tail -20 | jq .
  ```

## Production Deployment (Option 2: Systemd)

- [ ] Create systemd service file:
  ```bash
  sudo nano /etc/systemd/system/clawer-maintenance.service
  ```

- [ ] Paste service configuration (update paths and user):
  ```ini
  [Unit]
  Description=Clawer Container Maintenance Agent
  After=docker.service
  Requires=docker.service

  [Service]
  Type=simple
  User=clawer
  WorkingDirectory=/opt/clawer
  ExecStart=/usr/bin/npm run maintenance:daemon
  Restart=always
  RestartSec=10
  Environment="MOONSHOT_API_KEY=sk-your-key-here"

  [Install]
  WantedBy=multi-user.target
  ```

- [ ] Reload systemd:
  ```bash
  sudo systemctl daemon-reload
  ```

- [ ] Enable service:
  ```bash
  sudo systemctl enable clawer-maintenance
  ```

- [ ] Start service:
  ```bash
  sudo systemctl start clawer-maintenance
  ```

- [ ] Check status:
  ```bash
  sudo systemctl status clawer-maintenance
  ```

- [ ] View logs:
  ```bash
  sudo journalctl -u clawer-maintenance -f
  ```

## Monitoring

- [ ] Set up log rotation (optional):
  ```bash
  sudo nano /etc/logrotate.d/clawer-maintenance
  ```
  ```
  /opt/clawer/logs/maintenance.log {
      daily
      rotate 30
      compress
      delaycompress
      missingok
      notifempty
      create 0644 clawer clawer
  }
  ```

- [ ] Add monitoring alert (optional):
  - Set up log parsing for ERROR events
  - Alert when containers remain UNHEALTHY > 15 min
  - Alert when fix success rate < 70%

- [ ] Schedule weekly review:
  - Check `logs/maintenance.log` for patterns
  - Review fix attempt stats
  - Tune thresholds if needed

## Verification (After 1 Hour)

- [ ] Check service is running:
  ```bash
  # For cron:
  ps aux | grep maintenance-check
  
  # For systemd:
  sudo systemctl status clawer-maintenance
  ```

- [ ] Verify multiple checks completed:
  ```bash
  cat logs/maintenance.log | jq 'select(.event == "=== Starting maintenance check ===")' | wc -l
  # Should be > 1
  ```

- [ ] Check for any failed restarts:
  ```bash
  cat logs/maintenance.log | jq 'select(.event == "Level 3 fix failed")'
  ```

- [ ] Verify container health:
  ```bash
  docker ps -a --filter name=clawer_user_ --format "table {{.Names}}\t{{.Status}}"
  ```

## Rollback (If Issues)

- [ ] Stop service:
  ```bash
  # For cron:
  crontab -e  # Remove the line
  
  # For systemd:
  sudo systemctl stop clawer-maintenance
  sudo systemctl disable clawer-maintenance
  ```

- [ ] Investigate logs:
  ```bash
  cat logs/maintenance.log | jq 'select(.level == "error")'
  sudo journalctl -u clawer-maintenance --since "1 hour ago"
  ```

- [ ] Report issues with:
  - Error messages from logs
  - System configuration details
  - Docker version and access status

## Success Indicators

✅ Service running continuously (systemd) or cron jobs executing  
✅ Logs show regular health checks (every 5 minutes)  
✅ No repeated errors in logs  
✅ Unhealthy containers automatically restarted  
✅ Fix success rate > 80%  

## Next Steps

- [ ] Monitor for first 24 hours
- [ ] Tune `healthCheckIntervalMs` if needed (currently 5 min)
- [ ] Adjust `maxRestartAttempts` if containers frequently fail
- [ ] Consider implementing Phase 2 features:
  - Database integration for history
  - Alert notifications
  - Dashboard integration

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Production URL/Server**: _______________  
**Status**: ⬜ Deployed ⬜ Verified ⬜ Monitoring
