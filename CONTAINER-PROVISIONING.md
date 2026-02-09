# Container Auto-Provisioning Implementation

## Overview
When a user successfully subscribes via Stripe, a Docker container is automatically provisioned on the production server (YOUR_DOCKER_HOST) running OpenClaw gateway.

## Architecture

### Flow
1. **User subscribes** → Stripe webhook triggered
2. **Webhook handler** → calls `provisionContainer(userId, teamTemplate)`
3. **Provisioner** → executes via SSH on production server:
   - Generates secure gateway token
   - Allocates next available port (starting at 4010, incrementing by 2)
   - Reads API keys from `/opt/clawer/.env.local`
   - Creates Docker container with proper configuration
   - Patches `entrypoint.sh` to fix known bugs
   - Patches `openclaw.json` to configure providers correctly
   - Updates database with container details

### Key Files

#### `/src/lib/provisioner.ts` ✨ NEW
Main provisioning logic:
- `provisionContainer(userId, teamTemplate)` - Create and configure container
- `stopContainer(userId)` - Stop running container
- `restartContainer(userId)` - Restart container
- `getContainerStatus(userId)` - Check container state

All operations execute via SSH on the production server.

#### `/src/app/api/webhooks/stripe/route.ts` ✏️ UPDATED
Calls provisioner when `checkout.session.completed` event occurs.

#### `/src/lib/orchestrator.ts` ⚠️ DEPRECATED
Old local Docker orchestration - replaced by provisioner.ts for production.

## Container Configuration

### Docker Command
```bash
docker run -d \
  --name clawer_user_${userId} \
  --memory=2g --cpus=1 \
  -p ${apiPort}:8081 \
  -e USER_ID=${userId} \
  -e TEAM_TEMPLATE=${teamTemplate} \
  -e OPENAI_API_KEY=${openaiKey} \
  -e GEMINI_API_KEY=${geminiKey} \
  -e GATEWAY_TOKEN=${gatewayToken} \
  --restart=unless-stopped \
  clawer-openclaw:ecommerce
```

### Port Allocation
- **Strategy**: Sequential allocation starting at 4010
- **Increment**: +2 per container (legacy 2-port design, now using only API port)
- **Database**: `users.containerPort` stores the API server port (8081 inside container)
- **Max**: 5000

### API Keys
Read from production server at `/opt/clawer/.env.local`:
```
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

⚠️ These keys are embedded in container env vars - rotate periodically and rebuild containers.

## Container Patching

### 1. entrypoint.sh Fixes
**Problem**: Default entrypoint has bugs that break API server
**Solution**: Patch after container creation

```bash
# Remove --port 8080 flag (conflicts with environment config)
sed -i 's/--port 8080//g' /tmp/entrypoint.sh

# Don't unset GATEWAY_TOKEN (API server needs it)
sed -i 's/^unset GATEWAY_TOKEN/#unset GATEWAY_TOKEN/g' /tmp/entrypoint.sh
```

### 2. openclaw.json Configuration
**Problem**: Missing baseUrl for OpenAI provider, wrong gateway mode
**Solution**: Inject proper config

```json
{
  "gateway": {
    "mode": "local",
    "token": "${GATEWAY_TOKEN}"
  },
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "baseUrl": "https://api.openai.com/v1"
    },
    "gemini": {
      "apiKey": "${GEMINI_API_KEY}"
    }
  }
}
```

Container restart required after patching.

## Database Schema

### users table columns (relevant):
```typescript
{
  containerId: string | null,           // Docker container ID
  containerPort: number | null,         // API server port (not gateway)
  containerStatus: string | null,       // 'running' | 'stopped' | 'provisioning' | 'error'
  containerCreatedAt: timestamp | null, // When container was first created
  gatewayToken: string | null,          // Auth token for container API
  teamTemplate: string,                 // 'lifeos' | 'email-assistant' | etc.
}
```

## Testing

### Manual Test (Development)
```bash
# 1. Create test user in DB
# 2. Trigger provisioning
curl -X POST http://localhost:3000/api/test/provision \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_123"}'

# 3. Check container on server
ssh root@YOUR_DOCKER_HOST "docker ps -a | grep clawer_user_test"

# 4. Test API endpoint
curl http://YOUR_DOCKER_HOST:4010/api/health
```

### Production Test
1. Create test Stripe checkout session
2. Complete payment with test card
3. Monitor logs: `vercel logs --follow`
4. SSH to server and verify container: `docker ps -a | grep clawer_user_`
5. Check DB for updated user record

## Deployment

```bash
cd /home/keith/projects/clawer
bash deploy.sh
```

This:
1. Builds Next.js app
2. Pushes to Vercel
3. Environment variables already configured in Vercel dashboard

## Troubleshooting

### Container not starting
- Check server disk space: `ssh root@YOUR_DOCKER_HOST df -h`
- Check Docker logs: `ssh root@YOUR_DOCKER_HOST "docker logs clawer_user_${userId}"`
- Verify image exists: `ssh root@YOUR_DOCKER_HOST "docker images | grep clawer-openclaw"`

### API keys not working
- Verify `.env.local` exists on server
- Check key format (no quotes, no extra whitespace)
- Restart container after key changes

### Port conflicts
- List all ports in use: `ssh root@YOUR_DOCKER_HOST "docker ps --format '{{.Names}} {{.Ports}}'"`
- Check DB for port allocation gaps
- Manually allocate specific port if needed

### Patching fails
- Container might not have write permissions
- Check Docker volume mounts
- Consider rebuilding image with fixes baked in

## Future Improvements

1. **Bake patches into Docker image** - Rebuild `clawer-openclaw:ecommerce` with fixes
2. **Health monitoring** - Cron job to check container health and auto-restart
3. **Resource limits** - Implement per-user CPU/memory quotas
4. **Container pooling** - Pre-provision containers for faster onboarding
5. **Log aggregation** - Stream container logs to central logging service
6. **Backup/restore** - Implement user data persistence between container rebuilds

## Security Notes

- Containers run as root inside (OpenClaw requirement)
- Ports only exposed on localhost (proxied through main app)
- Gateway tokens are 64-char hex (256-bit entropy)
- API keys stored in plain env vars (consider secrets manager)
- SSH keys on deployment server - rotate quarterly
