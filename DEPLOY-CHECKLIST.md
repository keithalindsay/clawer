# 🚀 Deployment Checklist - Container Auto-Provisioning

## Pre-Deployment

- [ ] Run verification script: `bash scripts/verify-provisioning.sh`
- [ ] Verify all checks pass
- [ ] Ensure SSH keys for root@YOUR_DOCKER_HOST are configured
- [ ] Confirm API keys exist on server: `ssh root@YOUR_DOCKER_HOST "cat /opt/clawer/.env.local"`
- [ ] Verify Docker image exists: `ssh root@YOUR_DOCKER_HOST "docker images | grep clawer-openclaw:ecommerce"`

## Deployment

- [ ] Push to repository: `git push origin main`
- [ ] Deploy to Vercel: `bash deploy.sh` or let auto-deploy trigger
- [ ] Wait for deployment to complete
- [ ] Check deployment status in Vercel dashboard

## Post-Deployment Testing

### 1. Manual Provisioning Test (Optional)
```bash
# Create a test user in production DB first, then:
npx tsx scripts/test-provision.ts test_user_$(date +%s)
```

### 2. Full Integration Test (Recommended)

- [ ] Go to production app: https://clawer.ai
- [ ] Sign up with test email (use + trick: youremail+test1@gmail.com)
- [ ] Click "Subscribe Now"
- [ ] Use Stripe test card: `4242 4242 4242 4242`, any future date, any CVC
- [ ] Complete checkout
- [ ] Wait 5-10 seconds for webhook processing

### 3. Verify Provisioning

- [ ] Check Vercel logs: `vercel logs --follow --project=clawer`
- [ ] Look for provisioning logs:
  ```
  [PROVISION] Starting provisioning for user user_xxx
  [PROVISION] Allocated port XXXX
  [PROVISION] ✅ Successfully provisioned container
  ```
- [ ] Verify container on server:
  ```bash
  ssh root@YOUR_DOCKER_HOST "docker ps -a | grep clawer_user"
  ```
- [ ] Check container logs:
  ```bash
  ssh root@YOUR_DOCKER_HOST "docker logs clawer_user_<userId>"
  ```

### 4. User Dashboard Test

- [ ] Login to dashboard
- [ ] Verify status shows "Your AI is ready" with green indicator
- [ ] Check container status card displays correctly
- [ ] Try clicking "WhatsApp" connection (should trigger QR fetch)

### 5. API Health Check

Get the user's port from dashboard or DB, then:
```bash
# Replace 4010 with actual port
curl http://YOUR_DOCKER_HOST:4010/api/health
```

Expected response:
```json
{
  "ready": true,
  "gateway": "local",
  "uptime": 123
}
```

## Troubleshooting

### Provisioning Failed

**Symptom**: Logs show "[PROVISION] ❌ Failed to provision container"

**Check:**
1. SSH connection: `ssh root@YOUR_DOCKER_HOST "echo ok"`
2. Docker available: `ssh root@YOUR_DOCKER_HOST "docker ps"`
3. Disk space: `ssh root@YOUR_DOCKER_HOST "df -h"`
4. API keys file: `ssh root@YOUR_DOCKER_HOST "cat /opt/clawer/.env.local"`
5. Image exists: `ssh root@YOUR_DOCKER_HOST "docker images"`

**Fix:**
- If SSH fails: Check SSH keys and firewall
- If disk full: Clean old containers/images
- If API keys missing: Create `/opt/clawer/.env.local` with keys
- If image missing: Build and push image

### Container Created But Not Running

**Symptom**: Container exists but status shows "stopped" or "error"

**Check logs:**
```bash
ssh root@YOUR_DOCKER_HOST "docker logs clawer_user_<userId>"
```

**Common issues:**
- API key invalid → Check keys in .env.local
- Port conflict → Check port allocation in DB
- Memory limit → Check server resources
- Entrypoint error → Verify patches applied

**Fix:**
```bash
# Restart container
ssh root@YOUR_DOCKER_HOST "docker restart clawer_user_<userId>"

# Or remove and re-provision
ssh root@YOUR_DOCKER_HOST "docker stop clawer_user_<userId> && docker rm clawer_user_<userId>"
# Then trigger provisioning again from app
```

### Dashboard Shows "Setting up..." Forever

**Symptom**: Status card stuck in "Setting up" or "not_provisioned"

**Check:**
1. Database record: Does user have `containerPort` and `containerId`?
2. Container actually running: `docker ps | grep clawer_user_<userId>`
3. Webhook executed: Check Vercel logs for webhook event

**Fix:**
- If webhook didn't fire: Manually trigger from Stripe dashboard
- If DB not updated: Check for errors in provisioning logs
- If container stopped: Restart it

### API Health Check Fails

**Symptom**: `curl http://YOUR_DOCKER_HOST:<port>/api/health` returns error

**Check:**
1. Container running: `docker ps | grep clawer_user`
2. Port correct: Verify port in DB matches container
3. API server started: Check container logs for "API server listening"

**Fix:**
```bash
# Check container status
ssh root@YOUR_DOCKER_HOST "docker ps -a | grep clawer_user_<userId>"

# Check exposed ports
ssh root@YOUR_DOCKER_HOST "docker port clawer_user_<userId>"

# Restart container
ssh root@YOUR_DOCKER_HOST "docker restart clawer_user_<userId>"
```

## Monitoring

### Webhook Health
Monitor webhook delivery in Stripe Dashboard:
- Stripe Dashboard → Developers → Webhooks
- Check delivery success rate
- Review failed webhook attempts

### Container Health
Set up monitoring script (run via cron):
```bash
# Check all containers
ssh root@YOUR_DOCKER_HOST "docker ps -a --filter name=clawer_user_ --format 'table {{.Names}}\t{{.Status}}'"

# Auto-restart stopped containers
ssh root@YOUR_DOCKER_HOST "docker ps -a --filter status=exited --filter name=clawer_user_ --format '{{.Names}}' | xargs -r docker restart"
```

### Resource Usage
```bash
# Check memory/CPU per container
ssh root@YOUR_DOCKER_HOST "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'"

# Check disk usage
ssh root@YOUR_DOCKER_HOST "df -h"
```

## Rollback Plan

If provisioning is broken and blocking new signups:

### Option 1: Quick Fix
Comment out provisioning in Stripe webhook:
```typescript
// Temporarily disable auto-provisioning
// const result = await provisionContainer(userId, teamTemplate);
console.log('⚠️ Auto-provisioning disabled - manual provisioning required');
```

Deploy immediately. New users won't get containers but can complete signup.

### Option 2: Revert to Orchestrator
1. Revert changes to use `@/lib/orchestrator` instead of provisioner
2. Update orchestrator to run via SSH (quick patch)
3. Deploy

### Option 3: Manual Provisioning
1. Disable auto-provisioning
2. Create admin endpoint to manually provision
3. Run provisioning for each new user manually

## Success Criteria

✅ **Deployment successful when:**
- New user can signup and subscribe
- Webhook processes without errors
- Container created and running on server
- Dashboard shows "Your AI is ready"
- API health check returns 200 OK
- User can connect WhatsApp/Telegram

## Post-Launch Tasks

- [ ] Monitor first 10 signups closely
- [ ] Check webhook success rate (should be 100%)
- [ ] Review container resource usage
- [ ] Plan for scaling (add more servers at N containers)
- [ ] Document common issues and solutions
- [ ] Consider auto-restart cron for containers
- [ ] Plan for Docker image rebuild with fixes baked in

## Notes

- Provisioning typically takes 10-15 seconds
- Users see immediate feedback in dashboard
- Failed provisions can be retried without issue
- Old orchestrator.ts kept for reference but not used
- SSH keys required on deployment machine (already configured)

---

**Ready to ship!** 🚢

Read PROVISIONING-COMPLETE.md for full technical details.
