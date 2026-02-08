# Clawer.ai - Operations Runbook

**Version:** 2.0  
**Last Updated:** 2026-02-08  
**Audience:** DevOps, SRE, On-call Engineers

---

## Quick Reference

| Task | Command |
|------|---------|
| Check app status | `pm2 status` |
| View app logs | `pm2 logs clawer-web` |
| Restart app | `pm2 restart clawer-web` |
| List user containers | `docker ps --filter "name=clawer_user_"` |
| Restart user container | `docker restart clawer_user_{userId}` |
| View container logs | `docker logs -f clawer_user_{userId}` |
| Check database | `psql -U clawer -d clawer -c "SELECT COUNT(*) FROM users;"` |
| Deploy updates | See [Deployment](#deployment) |

---

## Server Access

### SSH Connection

```bash
ssh root@YOUR_DOCKER_HOST
```

**Alternate:** If you have a dedicated user account:
```bash
ssh deploy@YOUR_DOCKER_HOST
```

### Key Locations

- **App directory:** `/opt/clawer` (assumed, verify with PM2)
- **Logs:** `/opt/clawer/logs/` (if PM2 configured) or `~/.pm2/logs/`
- **Docker images:** Check with `docker images | grep clawer`
- **Environment:** `/opt/clawer/.env.local` or environment variables in PM2 config

---

## Deployment

### Pre-Deployment Checklist

- [ ] Code reviewed and merged to `main`
- [ ] Tests passing locally (`npm run build`)
- [ ] Database migrations tested locally
- [ ] Backup database (see [Backup](#backup-procedures))
- [ ] Check current container count: `docker ps --filter "name=clawer_user_" | wc -l`
- [ ] Notify users if expecting downtime (for DB migrations)

### Deploy Application Code

```bash
# On local machine
cd /home/keith/projects/clawer
git checkout main
git pull

# Build locally to verify
npm run build

# Deploy to server
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env*' \
  --exclude 'docker/' \
  ./ root@YOUR_DOCKER_HOST:/opt/clawer/

# SSH to server
ssh root@YOUR_DOCKER_HOST

cd /opt/clawer
npm install --production
npm run build

# Apply database migrations (if any)
npm run db:push

# Restart application
pm2 restart clawer-web

# Monitor logs for errors
pm2 logs clawer-web --lines 50
```

**Expected output:**
```
[PM2] Restarting clawer-web
[PM2] Process successfully restarted
```

**Rollback:** If deploy fails, restore previous code and restart.

### Deploy Docker Container Image

When `docker/openclaw-user/` changes:

```bash
# On local machine
cd /home/keith/projects/clawer/docker/openclaw-user

# Build image
docker build -t clawer-openclaw:latest .

# Save to file
docker save clawer-openclaw:latest | gzip > /tmp/clawer-openclaw.tar.gz

# Transfer to server
scp /tmp/clawer-openclaw.tar.gz root@YOUR_DOCKER_HOST:/tmp/

# SSH to server
ssh root@YOUR_DOCKER_HOST

# Load image
docker load < /tmp/clawer-openclaw.tar.gz

# Verify image loaded
docker images | grep clawer-openclaw

# Optional: Restart existing containers to use new image
# WARNING: This will disconnect users temporarily
docker ps --filter "name=clawer_user_" --format "{{.Names}}" | \
  xargs -I {} docker restart {}
```

**Note:** Existing containers continue using old image until restarted. New containers use new image.

### Zero-Downtime Deployment (PM2 Cluster Mode)

If using PM2 cluster mode (multiple instances):

```bash
pm2 reload clawer-web  # Graceful reload, no downtime
```

---

## Provisioning a New User Container

### Automatic Provisioning

Containers are automatically provisioned when a user subscribes via Stripe. The webhook at `/api/webhooks/stripe` handles this.

**Verify webhook is working:**
```bash
# Check Stripe webhook logs
curl -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  https://api.stripe.com/v1/webhook_endpoints

# Check app logs for provisioning events
pm2 logs clawer-web | grep "provisionContainer"
```

### Manual Provisioning

If automatic provisioning fails or you need to manually create a container:

```bash
# SSH to server
ssh root@YOUR_DOCKER_HOST

# Get userId from database
psql -U clawer -d clawer -c "SELECT id, email FROM users WHERE email='user@example.com';"

# Note the userId (Clerk ID, looks like: user_2abc123xyz)

# Manually provision via API (requires admin auth)
# Or use Node REPL:
cd /opt/clawer
node

> const { provisionContainer } = require('./dist/lib/orchestrator.js');
> provisionContainer('user_2abc123xyz').then(console.log);

# Expected output:
# {
#   success: true,
#   containerId: 'abc123...',
#   port: 4001
# }
```

**Verify container is running:**
```bash
docker ps --filter "name=clawer_user_user_2abc123xyz"
```

**Check health:**
```bash
# Get port from database
PORT=$(psql -U clawer -d clawer -t -c "SELECT container_port FROM users WHERE id='user_2abc123xyz';")

# Health check
curl http://localhost:$PORT/health

# Expected: {"status":"ok","uptime":123}
```

---

## Debugging Container Issues

### Symptom: User Reports "Chat Not Working"

**Step 1: Check container status**
```bash
# Get userId (from user email or dashboard)
USER_ID="user_2abc123xyz"

# Check if container exists
docker ps -a --filter "name=clawer_user_$USER_ID" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Possible states:**
- **Not found:** Container never provisioned → Check DB, re-provision
- **Exited:** Container crashed → Check logs, restart
- **Restarting:** Boot loop → Check logs for errors
- **Up:** Running but not responding → Check health endpoint

**Step 2: Check container logs**
```bash
docker logs --tail 100 clawer_user_$USER_ID

# Look for:
# - "ERROR" messages
# - "OPENAI_API_KEY" missing
# - Port binding errors
# - Config validation failures
```

**Common errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `OPENAI_API_KEY environment variable not set` | Missing env var | Re-create container with key |
| `Cannot bind to port` | Port already in use | Check port allocation in DB |
| `Config invalid` | Bad config template | Check config-template.json |
| `429 Too Many Requests` | OpenAI rate limit | Wait 2-3 minutes |
| `401 Unauthorized` | Invalid API key | Update OPENAI_API_KEY |

**Step 3: Check health endpoint**
```bash
PORT=$(psql -U clawer -d clawer -t -c "SELECT container_port FROM users WHERE id='$USER_ID';")
curl http://localhost:$PORT/health
```

**Expected:** `{"status":"ok","uptime":...}`  
**If timeout:** Container API server not responding → Restart container

**Step 4: Test chat endpoint**
```bash
curl -X POST http://localhost:$((PORT+1))/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"test"}'
```

**Expected:** `{"content":"..."}`  
**If error:** Check logs, verify OpenAI key

**Step 5: Restart container**
```bash
docker restart clawer_user_$USER_ID

# Wait 10 seconds
sleep 10

# Verify it started
docker ps --filter "name=clawer_user_$USER_ID"

# Check logs
docker logs --tail 50 clawer_user_$USER_ID
```

### Symptom: Container Stuck in "Restarting" Loop

**Diagnose:**
```bash
# Check restart count
docker inspect clawer_user_$USER_ID --format '{{.RestartCount}}'

# If > 3, there's a persistent issue
```

**Common causes:**
1. **Config error** - Check logs for validation errors
2. **Missing dependencies** - OpenClaw installation failed
3. **Port conflict** - Another process using the port

**Fix:**
```bash
# Stop the container
docker stop clawer_user_$USER_ID

# Remove it
docker rm clawer_user_$USER_ID

# Re-provision via API or manually
# (See "Provisioning a New User Container")
```

### Symptom: WhatsApp/Telegram Not Connecting

**WhatsApp:**
```bash
# Get QR code status
PORT=$(psql -U clawer -d clawer -t -c "SELECT container_port FROM users WHERE id='$USER_ID';")
curl http://localhost:$((PORT+1))/whatsapp/qr

# Expected: Base64 QR code image
# If error: Check OpenClaw logs in container
docker logs clawer_user_$USER_ID | grep -i whatsapp
```

**Telegram:**
```bash
# Check Telegram status
curl http://localhost:$((PORT+1))/telegram/status

# Expected: {"connected":true,"username":"..."}
# If false: User needs to reconnect bot token
```

**Reset WhatsApp connection:**
```bash
docker exec clawer_user_$USER_ID rm -rf /home/user/.openclaw/sessions/whatsapp
docker restart clawer_user_$USER_ID
```

---

## Restarting Services

### Restart Application (Next.js)

```bash
pm2 restart clawer-web

# Or if using custom ecosystem file
pm2 restart ecosystem.config.js

# Monitor logs
pm2 logs clawer-web --lines 50
```

**Expected downtime:** <5 seconds

### Restart User Container

```bash
docker restart clawer_user_{userId}

# Verify it restarted
docker ps --filter "name=clawer_user_{userId}"
```

**Expected downtime:** 10-30 seconds (container startup time)

### Restart All User Containers

⚠️ **WARNING:** This will disconnect ALL users. Only do during maintenance window.

```bash
# List all containers first
docker ps --filter "name=clawer_user_" --format "{{.Names}}"

# Restart all
docker ps --filter "name=clawer_user_" --format "{{.Names}}" | \
  xargs -I {} docker restart {}

# Verify they restarted
docker ps --filter "name=clawer_user_" | wc -l
```

### Restart Database

⚠️ **WARNING:** App will be unavailable during restart.

```bash
sudo systemctl restart postgresql

# Verify
sudo systemctl status postgresql
```

**Expected downtime:** 10-30 seconds

### Restart Redis (If Used)

```bash
sudo systemctl restart redis

# Verify
redis-cli ping
# Expected: PONG
```

---

## Checking Logs

### Application Logs (PM2)

```bash
# View all logs
pm2 logs clawer-web

# View only errors
pm2 logs clawer-web --err

# View last N lines
pm2 logs clawer-web --lines 100

# Follow logs in real-time
pm2 logs clawer-web --lines 0

# Clear logs
pm2 flush
```

### Container Logs

```bash
# View logs for specific user
docker logs clawer_user_{userId}

# Follow logs
docker logs -f clawer_user_{userId}

# Last 100 lines
docker logs --tail 100 clawer_user_{userId}

# Logs since timestamp
docker logs --since 2026-02-08T10:00:00 clawer_user_{userId}

# All user containers
for container in $(docker ps --filter "name=clawer_user_" --format "{{.Names}}"); do
  echo "=== $container ==="
  docker logs --tail 10 $container
done
```

### Database Logs

```bash
# PostgreSQL logs location
tail -f /var/log/postgresql/postgresql-14-main.log

# Or via journalctl
sudo journalctl -u postgresql -f
```

### System Logs

```bash
# System messages
sudo journalctl -f

# Docker daemon logs
sudo journalctl -u docker -f

# Disk space issues
df -h

# Memory usage
free -h

# CPU usage
top
```

---

## Common Issues and Fixes

### Issue: "Database connection failed"

**Symptoms:**
- App fails to start
- 500 errors on all requests
- PM2 logs show: `Error: connect ECONNREFUSED`

**Diagnosis:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if database exists
psql -U clawer -d clawer -c "SELECT 1;"

# Check connection string
echo $DATABASE_URL
# or check .env.local
```

**Fix:**
```bash
# Start PostgreSQL if stopped
sudo systemctl start postgresql

# Verify credentials
psql -U clawer -d clawer

# If wrong password, reset:
sudo -u postgres psql
postgres=# ALTER USER clawer WITH PASSWORD 'new_password';
postgres=# \q

# Update .env.local with correct DATABASE_URL
# Restart app
pm2 restart clawer-web
```

### Issue: "Port already in use"

**Symptoms:**
- Container fails to start
- Logs show: `Error: bind: address already in use`

**Diagnosis:**
```bash
# Check what's using the port
lsof -i :4001

# Check database for port conflicts
psql -U clawer -d clawer -c "SELECT id, email, container_port FROM users WHERE container_port IS NOT NULL ORDER BY container_port;"
```

**Fix:**
```bash
# Kill process using port (if not another container)
sudo kill -9 $(lsof -t -i :4001)

# Or update database to use different port
psql -U clawer -d clawer -c "UPDATE users SET container_port = NULL WHERE container_port = 4001;"

# Re-provision container (will allocate new port)
```

### Issue: "Out of disk space"

**Symptoms:**
- Containers fail to start
- Docker commands fail
- App can't write logs

**Diagnosis:**
```bash
df -h

# Check Docker disk usage
docker system df

# Check largest directories
du -sh /* | sort -h | tail -10
```

**Fix:**
```bash
# Remove unused Docker images
docker image prune -a

# Remove stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# Clean up logs
pm2 flush
sudo journalctl --vacuum-time=7d

# If still full, expand disk or delete old files
```

### Issue: "Too many open files"

**Symptoms:**
- Containers fail to start
- Error: `EMFILE: too many open files`

**Diagnosis:**
```bash
# Check current limit
ulimit -n

# Check number of open files
lsof | wc -l
```

**Fix:**
```bash
# Increase limit temporarily
ulimit -n 65536

# Increase permanently (add to /etc/security/limits.conf)
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Restart services
pm2 restart clawer-web
```

### Issue: "OpenAI rate limit exceeded"

**Symptoms:**
- User reports slow responses or errors
- Container logs show: `429 Too Many Requests`

**Diagnosis:**
```bash
# Check OpenAI usage
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check how many containers are running
docker ps --filter "name=clawer_user_" | wc -l
```

**Fix:**
- **Short term:** Wait 2-3 minutes, rate limit will reset
- **Long term:** Upgrade OpenAI plan or implement request queuing

### Issue: "Stripe webhook not working"

**Symptoms:**
- Users subscribe but container not provisioned
- Stripe dashboard shows webhook failures

**Diagnosis:**
```bash
# Check webhook endpoint in Stripe dashboard
# https://dashboard.stripe.com/webhooks

# Check app logs for webhook events
pm2 logs clawer-web | grep "webhook"

# Verify STRIPE_WEBHOOK_SECRET is set
echo $STRIPE_WEBHOOK_SECRET
```

**Fix:**
```bash
# Test webhook locally
stripe trigger checkout.session.completed

# Check app logs
pm2 logs clawer-web --lines 50

# If signature verification fails, regenerate secret in Stripe dashboard
# Update .env.local with new secret
# Restart app
pm2 restart clawer-web
```

---

## Backup Procedures

### Database Backup

```bash
# Create backup
pg_dump -U clawer -d clawer -F c -f /tmp/clawer_backup_$(date +%Y%m%d).dump

# Verify backup
pg_restore --list /tmp/clawer_backup_*.dump

# Copy to safe location
scp /tmp/clawer_backup_*.dump backup-server:/backups/

# Automate with cron (daily at 2 AM)
0 2 * * * pg_dump -U clawer -d clawer -F c -f /backups/clawer_$(date +\%Y\%m\%d).dump
```

### Restore Database

⚠️ **WARNING:** This will overwrite current data.

```bash
# Stop app
pm2 stop clawer-web

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE clawer;"
sudo -u postgres psql -c "CREATE DATABASE clawer OWNER clawer;"

# Restore from backup
pg_restore -U clawer -d clawer /tmp/clawer_backup_20260208.dump

# Restart app
pm2 restart clawer-web
```

### Container State Backup (Not Recommended)

Containers should be stateless. If a user loses WhatsApp connection, they can reconnect. Don't back up container filesystems.

### Environment Variables Backup

```bash
# Backup .env.local
cp /opt/clawer/.env.local /opt/clawer/.env.local.backup.$(date +%Y%m%d)

# Store securely (don't commit to git!)
```

---

## Monitoring

### Health Checks

**Application:**
```bash
# Check if app is responding
curl http://localhost:3002/

# Check API health (if endpoint exists)
curl http://localhost:3002/api/health
```

**Database:**
```bash
psql -U clawer -d clawer -c "SELECT COUNT(*) FROM users;"
```

**Containers:**
```bash
# Check all containers are healthy
docker ps --filter "name=clawer_user_" --filter "health=healthy"

# Count unhealthy containers
docker ps --filter "name=clawer_user_" --filter "health=unhealthy" | wc -l
```

### Metrics to Monitor

**Application:**
- Request count per endpoint
- Response time (p50, p95, p99)
- Error rate (5xx responses)
- Active user sessions

**Containers:**
- Total running containers
- Container CPU usage
- Container memory usage
- Container restart count

**Database:**
- Connection count
- Query latency
- Disk usage

**System:**
- CPU usage
- Memory usage
- Disk usage
- Network throughput

### Alerting (Recommended Setup)

**Tools:**
- **Uptime monitoring:** UptimeRobot, Pingdom
- **Error tracking:** Sentry
- **Metrics:** Prometheus + Grafana
- **Logs:** ELK stack or Loki

**Alerts to configure:**
1. App down for >5 minutes
2. Database connection errors
3. Disk usage >80%
4. Memory usage >90%
5. >10% of containers unhealthy
6. Stripe webhook failures

---

## Scaling Operations

### Add Capacity (Vertical Scaling)

**Increase server resources:**
1. Upgrade server RAM/CPU via hosting provider
2. Restart server
3. Verify containers restart successfully

### Add Servers (Horizontal Scaling)

**Not currently supported.** Architecture is single-server. To add servers:

1. **Set up second server** with same environment
2. **Deploy app** to second server
3. **Set up Redis** for distributed port allocation
4. **Set up load balancer** to route users to correct server
5. **Update database schema** to track user → server mapping

**This requires architecture changes. See ARCHITECTURE.md for details.**

---

## Security Incident Response

### Compromised API Key

**If OpenAI, Stripe, or other API key leaked:**

1. **Rotate immediately** via provider dashboard
2. **Update environment variable** on server
   ```bash
   # Update .env.local
   nano /opt/clawer/.env.local
   
   # Restart app
   pm2 restart clawer-web
   
   # Restart all containers (they cache the old key)
   docker ps --filter "name=clawer_user_" --format "{{.Names}}" | \
     xargs -I {} docker restart {}
   ```
3. **Review logs** for unauthorized usage
4. **Notify affected users** if needed

### Suspicious Container Activity

**If container shows unusual behavior (high CPU, network traffic):**

```bash
# Stop container immediately
docker stop clawer_user_{userId}

# Inspect container
docker logs clawer_user_{userId} > /tmp/suspicious_container.log

# Check network connections
docker exec clawer_user_{userId} netstat -an

# Remove container
docker rm clawer_user_{userId}

# Review logs for indicators of compromise
# Notify user and re-provision clean container
```

### Database Breach

**If database access suspected:**

1. **Change database password** immediately
2. **Rotate all API keys** in admin_settings table
3. **Review audit logs** (if available)
4. **Notify affected users** per data breach regulations
5. **File incident report**

---

## Maintenance Windows

### Planned Maintenance Procedure

1. **Schedule maintenance** (notify users 48 hours in advance)
2. **Backup database** (see [Backup Procedures](#backup-procedures))
3. **Set app to maintenance mode** (optional: serve static "Under Maintenance" page)
4. **Perform maintenance** (deploy code, run migrations, etc.)
5. **Verify functionality** (test critical paths)
6. **Restore service**
7. **Monitor for issues** (watch logs for 1 hour)

### Emergency Maintenance

If critical issue requires immediate maintenance:

1. **Assess severity** (security issue vs. degraded performance)
2. **Notify users** via status page or social media
3. **Fix issue** (deploy patch, restart services, etc.)
4. **Verify fix** (test affected functionality)
5. **Post-mortem** (document what went wrong and how to prevent)

---

## Appendix: Useful Commands

### Docker

```bash
# List all containers
docker ps -a

# List user containers only
docker ps --filter "name=clawer_user_"

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Check disk usage
docker system df

# View container resource usage
docker stats --filter "name=clawer_user_"

# Execute command in container
docker exec -it clawer_user_{userId} bash

# Copy file from container
docker cp clawer_user_{userId}:/path/to/file /tmp/file
```

### PM2

```bash
# Start app
pm2 start npm --name clawer-web -- start

# Stop app
pm2 stop clawer-web

# Restart app
pm2 restart clawer-web

# Delete app from PM2
pm2 delete clawer-web

# List all apps
pm2 list

# Monitor resources
pm2 monit

# Save current PM2 config
pm2 save

# Resurrect saved config (after reboot)
pm2 resurrect
```

### PostgreSQL

```bash
# Connect to database
psql -U clawer -d clawer

# List tables
\dt

# Describe table
\d users

# Count users
SELECT COUNT(*) FROM users;

# Find user by email
SELECT * FROM users WHERE email = 'user@example.com';

# Check container ports
SELECT id, email, container_port, container_status FROM users WHERE container_port IS NOT NULL;

# Vacuum database (reclaim space)
VACUUM FULL;
```

---

## Emergency Contacts

**On-Call Engineer:** [Your contact info]  
**Hosting Provider:** [Provider support link]  
**Stripe Support:** https://support.stripe.com/  
**OpenAI Support:** https://help.openai.com/  

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-08 | Initial runbook | AI Assistant |

