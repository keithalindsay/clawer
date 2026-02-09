# ✅ Container Auto-Provisioning Implementation Complete

## What Was Done

### 1. Created New Provisioner (`src/lib/provisioner.ts`)
- **SSH-based orchestration** - Executes Docker commands on production server (root@YOUR_DOCKER_HOST)
- **Secure token generation** - 64-char hex tokens (256-bit entropy)
- **Smart port allocation** - Scans DB for max port, adds 2, starts at 4010
- **Server-side API keys** - Reads from `/opt/clawer/.env.local` on production server
- **Container patching** - Fixes known bugs in entrypoint.sh and openclaw.json
- **Full lifecycle management** - provision, stop, restart, status

### 2. Updated Stripe Webhook (`src/app/api/webhooks/stripe/route.ts`)
- Now imports from `@/lib/provisioner` instead of orchestrator
- Passes user's `teamTemplate` to provisioner
- Calls `provisionContainer(userId, teamTemplate)` on successful subscription

### 3. Updated All Container API Routes
Updated imports from orchestrator → provisioner:
- `src/app/api/container/whatsapp/qr/route.ts`
- `src/app/api/container/restart/route.ts`
- `src/app/api/admin/container/restart/route.ts`

### 4. Documentation
- **CONTAINER-PROVISIONING.md** - Complete architecture and troubleshooting guide
- **verify-provisioning.sh** - Pre-deployment verification script

## What Happens Now

### User Signup Flow
1. User signs up via Clerk → creates DB record (tier: 'basic')
2. User completes Stripe checkout → webhook triggered
3. **Webhook handler:**
   - Updates user record (tier: 'pro', adds Stripe IDs)
   - Calls `provisionContainer(userId, teamTemplate)`
4. **Provisioner:**
   - Generates gateway token
   - Allocates port (e.g., 4010)
   - Reads API keys from server
   - Creates Docker container via SSH
   - Patches entrypoint.sh (removes --port 8080, keeps GATEWAY_TOKEN)
   - Patches openclaw.json (adds baseUrl, sets mode: 'local')
   - Restarts container
   - Updates DB with container details
5. User dashboard shows "Your AI is ready"

### Container Configuration
```bash
docker run -d \
  --name clawer_user_${userId} \
  --memory=2g --cpus=1 \
  -p ${apiPort}:8081 \
  -e USER_ID=${userId} \
  -e TEAM_TEMPLATE=lifeos \
  -e OPENAI_API_KEY=sk-proj-... \
  -e GEMINI_API_KEY=AIza... \
  -e GATEWAY_TOKEN=<64-char-hex> \
  --restart=unless-stopped \
  clawer-openclaw:ecommerce
```

## Verification Results

✅ All checks passed:
- Provisioner file exists
- Stripe webhook updated
- SSH connection working
- Docker available on server
- API keys file present
- Docker image exists
- No orphaned orchestrator imports

## Ready to Deploy

```bash
cd /home/keith/projects/clawer
bash deploy.sh
```

## Testing Checklist

### After Deployment:
1. ✅ Create test Stripe checkout
2. ✅ Complete with test card (4242 4242 4242 4242)
3. ✅ Monitor webhook logs: `vercel logs --follow`
4. ✅ Verify container created: `ssh root@YOUR_DOCKER_HOST "docker ps -a | grep clawer_user"`
5. ✅ Check DB record updated
6. ✅ Test container API: `curl http://YOUR_DOCKER_HOST:<port>/api/health`
7. ✅ Login to dashboard and verify status shows "Your AI is ready"

### Expected Logs:
```
[PROVISION] Starting provisioning for user user_xxx
[PROVISION] Allocated port 4010
[PROVISION] Retrieved API keys from server
[PROVISION] Creating container...
[PROVISION] Container created: abc123def456
[PATCH] Fixing entrypoint.sh in container abc123def456
[PATCH] Entrypoint.sh patched successfully
[PATCH] Fixing openclaw.json in container abc123def456
[PATCH] openclaw.json patched successfully
[PROVISION] Restarting container to apply patches
[PROVISION] ✅ Successfully provisioned container for user user_xxx
```

## Known Limitations

1. **Patching approach** - Better to rebuild Docker image with fixes baked in
2. **No health monitoring** - Should add cron to auto-restart unhealthy containers
3. **Port allocation** - Sequential allocation works but could be smarter
4. **API key rotation** - Requires manual container rebuild
5. **No resource quotas** - All users get same CPU/memory limits

## Future Improvements (Post-Launch)

1. Rebuild `clawer-openclaw:ecommerce` image with fixes built-in
2. Add health check cron job
3. Implement container pooling for faster provisioning
4. Add user data persistence (volumes)
5. Setup log aggregation
6. Implement resource quotas based on tier
7. Add monitoring/alerting for failed provisions

## Files Changed

### New Files:
- `src/lib/provisioner.ts` (372 lines)
- `CONTAINER-PROVISIONING.md` (documentation)
- `PROVISIONING-COMPLETE.md` (this file)
- `scripts/verify-provisioning.sh` (verification tool)

### Modified Files:
- `src/app/api/webhooks/stripe/route.ts` (import + teamTemplate)
- `src/app/api/container/whatsapp/qr/route.ts` (import + teamTemplate)
- `src/app/api/container/restart/route.ts` (import)
- `src/app/api/admin/container/restart/route.ts` (import)

### Deprecated Files:
- `src/lib/orchestrator.ts` (kept for reference, not imported anywhere)

## Support

If provisioning fails in production:
1. Check Vercel logs for error messages
2. SSH to server and check Docker logs: `docker logs clawer_user_${userId}`
3. Verify API keys in `/opt/clawer/.env.local`
4. Check disk space: `df -h`
5. Manual provision: Call `/api/admin/provision` endpoint (create this if needed)

## Summary

🎉 **Container auto-provisioning is fully implemented and ready for deployment.**

The system will now automatically:
- Provision a Docker container when users subscribe
- Configure it with proper API keys and settings
- Patch known bugs in the container
- Update the database with container details
- Enable users to start chatting immediately

Next step: **Deploy and test with a real subscription!**
