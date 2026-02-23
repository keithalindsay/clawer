# AI Teams Phase 1 Deployment Guide

**Server:** root@YOUR_DOCKER_HOST  
**Phase:** 1 - Single Agent with Proper Session Management  
**Estimated Time:** 30-45 minutes

---

## Pre-Deployment Checklist

- [ ] All code changes committed and pushed
- [ ] Database migration file created
- [ ] Test user account ready (paid subscription)
- [ ] Server SSH access confirmed
- [ ] Backup current production state

---

## Deployment Steps

### 1. Backup Current State

```bash
# SSH to server
ssh root@YOUR_DOCKER_HOST

# Create backup directory
mkdir -p ~/backups/ai-teams-phase1-$(date +%Y%m%d)
cd ~/backups/ai-teams-phase1-$(date +%Y%m%d)

# Backup database
pg_dump clawer > clawer_backup.sql

# Backup running containers list
docker ps > running_containers.txt

# Backup docker images
docker images > docker_images.txt

echo "✅ Backup complete"
```

### 2. Pull Latest Code

```bash
cd ~/projects/clawer

# Stash any local changes
git stash

# Pull latest
git pull origin main

# Check files changed
git log -1 --stat
```

### 3. Apply Database Migration

```bash
# Connect to database
psql clawer

# Run migration
\i drizzle/migrations/0009_add_default_agent_id.sql

# Verify column added
\d users

# Should show: default_agent_id | text

# Exit psql
\q

echo "✅ Migration applied"
```

### 4. Rebuild Docker Image

```bash
cd ~/projects/clawer

# Build new image with updated entrypoint
docker build -t openclaw-user:ai-teams-phase1 -f docker/openclaw-user/Dockerfile .

# Tag as latest
docker tag openclaw-user:ai-teams-phase1 openclaw-user:latest

# Verify image built
docker images | grep openclaw-user

echo "✅ Docker image rebuilt"
```

### 5. Deploy to Running Containers

**Option A: Rolling Update (Zero Downtime)**
```bash
# If using Docker Swarm
docker service update --image openclaw-user:ai-teams-phase1 openclaw-user-service

# Monitor rollout
docker service ps openclaw-user-service

echo "✅ Rolling update complete"
```

**Option B: Restart Individual Containers**
```bash
# List all user containers
docker ps --filter "ancestor=openclaw-user" --format "{{.Names}}"

# For test user only (safer)
TEST_CONTAINER="openclaw-user-<test-user-id>"

# Stop container
docker stop $TEST_CONTAINER

# Remove old container
docker rm $TEST_CONTAINER

# Start new container with updated image
docker run -d \
  --name $TEST_CONTAINER \
  --restart unless-stopped \
  -e GATEWAY_TOKEN=<token> \
  -e MINIMAX_API_KEY=<key> \
  -v openclaw-user-<test-user-id>:/home/user/clawd \
  openclaw-user:ai-teams-phase1

echo "✅ Test container updated"
```

### 6. Verify Deployment

```bash
# Check test container running
docker ps | grep $TEST_CONTAINER

# Check logs for errors
docker logs $TEST_CONTAINER --tail 50

# Should see:
# "📋 Legacy single-agent mode (no team config)"
# (since team not provisioned yet)

# Check entrypoint logic
docker exec $TEST_CONTAINER printenv | grep OPENCLAW

# Should see:
# OPENCLAW_WORKSPACE=/home/user/clawd
# OPENCLAW_AGENT_ID=main

echo "✅ Container verified"
```

### 7. Test Provisioning API

```bash
# Get test user token
TEST_TOKEN="<your-test-user-token>"

# Test provision endpoint
curl -X POST https://clawer.ai/api/team/provision \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"templateName":"lifeos"}' | jq

# Should return:
# { "success": true, "defaultAgent": "chief-of-staff" }

# Verify workspace created
docker exec $TEST_CONTAINER ls -la /home/user/clawd/workspace-chief-of-staff/

# Should show:
# SOUL.md, AGENTS.md, USER.md, memory/, skills/

echo "✅ Provisioning tested"
```

### 8. Test Chat Routing

```bash
# Send message to provisioned agent
curl -X POST https://clawer.ai/api/chat \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about yourself",
    "agentId": "chief-of-staff"
  }' | jq '.content'

# Verify response is in character as Max

# Check session routing
docker exec $TEST_CONTAINER openclaw sessions list | jq

# Should show session: agent:chief-of-staff:main

echo "✅ Chat routing tested"
```

### 9. Test Legacy Compatibility

```bash
# Create fresh user (no team provisioned)
LEGACY_USER_CONTAINER="openclaw-user-<legacy-user-id>"

# Send chat message (no agentId)
curl -X POST https://clawer.ai/api/chat \
  -H "Authorization: Bearer $LEGACY_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}' | jq '.content'

# Should work normally (legacy mode)

# Check container env
docker exec $LEGACY_USER_CONTAINER printenv | grep OPENCLAW

# Should see:
# OPENCLAW_WORKSPACE=/home/user/clawd
# OPENCLAW_AGENT_ID=main

echo "✅ Legacy mode verified"
```

### 10. Monitor Logs

```bash
# Watch test container logs
docker logs -f $TEST_CONTAINER

# Watch for:
# - No errors during provisioning
# - "📋 Team configuration detected" after provision
# - Workspace path: /home/user/clawd/workspace-chief-of-staff

# Watch API server logs
tail -f /var/log/clawer/api.log

# Watch for:
# - /api/team/provision requests
# - /api/chat routing to agent sessions

echo "✅ Monitoring active"
```

---

## Post-Deployment

### Verify Production Health

```bash
# Check all containers healthy
docker ps --filter "health=healthy" | wc -l

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://clawer.ai/api/health

# Check database connections
psql clawer -c "SELECT COUNT(*) FROM users WHERE team_template IS NOT NULL;"

echo "✅ Health check complete"
```

### Update Monitoring

1. **Add Metrics**
   - Track provisioning success rate
   - Track agent session counts
   - Track workspace disk usage

2. **Add Alerts**
   - Alert on provisioning failures
   - Alert on workspace > 500MB
   - Alert on gateway restart failures

### Update Documentation

- [ ] Update API docs with `/api/team/provision` endpoint
- [ ] Update user guide with team provisioning flow
- [ ] Update architecture docs with Phase 1 changes

---

## Rollback Procedure

If issues found:

```bash
# 1. Revert database
psql clawer -c "ALTER TABLE users DROP COLUMN default_agent_id;"

# 2. Rollback containers
docker service update --image openclaw-user:previous-version openclaw-user-service

# 3. Verify rollback
docker ps | grep openclaw-user
docker logs <container> --tail 50

# 4. Notify team
echo "⚠️ Rolled back to previous version"
```

---

## Troubleshooting

### Issue: Provisioning fails with "Container not found"
**Solution:** Check container_id in users table matches running container

### Issue: Gateway won't restart
**Solution:** 
```bash
docker exec <container> pkill -f "openclaw gateway"
docker restart <container>
```

### Issue: SOUL.md not found
**Solution:**
```bash
docker exec <container> cat /home/user/clawd/workspace-<agent>/SOUL.md
# If missing, re-run provision
```

### Issue: Session routing to wrong workspace
**Solution:**
```bash
# Check entrypoint env vars
docker exec <container> printenv | grep OPENCLAW

# If wrong, check .team-config
docker exec <container> cat /home/user/clawd/.team-config
```

---

## Next Phase

After Phase 1 stable for 7 days:
- Phase 2: Multi-Agent (provision all team members)
- Phase 2: UI agent selector
- Phase 2: Per-agent conversation history

---

**Deployed by:** [Your name]  
**Date:** [Deployment date]  
**Version:** ai-teams-phase1  
**Status:** ✅ Production
