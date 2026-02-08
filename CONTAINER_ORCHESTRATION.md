> ⚠️ **OUTDATED** - See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/RUNBOOK.md](docs/RUNBOOK.md) for current documentation
> 
> This document is preserved for historical reference only.

# Container Orchestration Layer

Auto-provision isolated Docker containers per user when they subscribe.

## Architecture

```
User subscribes → Stripe webhook → Provision container
                                   ↓
                            clawer_user_{userId}
                            Port: 4001+
                            Resources: 512MB RAM, 0.5 CPU
                            ↓
                            Bot Worker (Node.js)
                            - POST /message → Kimi API
                            - GET /health
```

## Components

### 1. Docker Worker Image

**Location:** `docker/bot-worker/`

- `Dockerfile` - Node 20 slim container
- `worker.js` - Express server with message endpoint
- `package.json` - Dependencies

**What it does:**
- Receives messages via HTTP POST /message
- Calls Kimi API with MOONSHOT_API_KEY
- Returns AI response
- Health check endpoint

### 2. Orchestrator Service

**Location:** `src/lib/orchestrator/`

- `container-manager.ts` - Provision, start, stop, restart, remove containers
- `health-checker.ts` - Periodic health checks, auto-restart on failure
- `message-router.ts` - Route messages to correct user's container
- `index.ts` - Main exports

### 3. Stripe Integration

**Updated:** `src/app/api/webhooks/stripe/route.ts`

- `checkout.session.completed` → provision container
- `customer.subscription.deleted` → remove container

### 4. Message API

**New:** `src/app/api/message/route.ts`

- POST /api/message - Send message to authenticated user's container

### 5. Database

**Updated:** `src/lib/db/schema/users.ts`

Added field:
```typescript
containerPort: integer('container_port')
```

## Deployment

### Prerequisites

1. **Server:** YOUR_DOCKER_HOST with Docker installed
2. **SSH Access:** root@YOUR_DOCKER_HOST
3. **Environment:** MOONSHOT_API_KEY set on server

### Build and Deploy

```bash
# 1. Build and push Docker image to server
./scripts/build-and-deploy-worker.sh

# 2. Set API key on server
ssh root@YOUR_DOCKER_HOST
export MOONSHOT_API_KEY=your_key_here
# Add to ~/.bashrc for persistence

# 3. Run database migration
source ~/.nvm/nvm.sh && nvm use 20
cd ~/projects/clawer
npm run db:push
```

### Test Container

```bash
# Export API key locally
export MOONSHOT_API_KEY=your_key_here

# Test container provisioning
./scripts/test-container.sh test_user_123 4001
```

This will:
1. Remove any existing test container
2. Start new container
3. Wait for health check
4. Send test message
5. Display response

## Container Management

### Manual Commands (on server)

```bash
# List all user containers
docker ps -a --filter "name=clawer_user_"

# View logs
docker logs -f clawer_user_{userId}

# Restart container
docker restart clawer_user_{userId}

# Stop container
docker stop clawer_user_{userId}

# Remove container
docker rm -f clawer_user_{userId}

# Health check
curl http://localhost:4001/health

# Send test message
curl -X POST http://localhost:4001/message \
  -H 'Content-Type: application/json' \
  -d '{"message": "Hello!"}'
```

### Programmatic Usage

```typescript
import {
  provisionContainer,
  stopContainer,
  restartContainer,
  removeContainer,
  routeMessage,
} from '@/lib/orchestrator';

// Provision new container
const container = await provisionContainer('user_123');
// → { userId, containerName, port, status: 'running' }

// Send message
const response = await routeMessage('user_123', {
  message: 'Hello bot!',
  conversationId: 'optional-conversation-id',
});
// → { response, conversationId, userId, timestamp }

// Restart unhealthy container
await restartContainer('user_123');

// Remove on cancellation
await removeContainer('user_123');
```

## Resource Limits

Per container:
- **Memory:** 512MB
- **CPU:** 0.5 cores
- **Port range:** 4001-9999 (auto-allocated)
- **Restart policy:** unless-stopped

## Health Checks

### Automatic (via health-checker.ts)

- Runs every 60 seconds
- Checks Docker status + HTTP /health endpoint
- Auto-restarts unhealthy containers (max 3 attempts)

### Manual

```typescript
import { checkUserHealth } from '@/lib/orchestrator';

const health = await checkUserHealth('user_123');
// → { userId, containerName, port, healthy, error? }
```

## Port Allocation

- **Starting port:** 4001
- **Strategy:** Sequential allocation, finds next available
- **Storage:** `users.containerPort` in database

## Security

- Containers isolated from each other
- MOONSHOT_API_KEY passed via environment variable (not exposed)
- Resource limits prevent resource exhaustion
- Containers run as non-root inside

## Monitoring

### Container Logs

```bash
# View logs
ssh root@YOUR_DOCKER_HOST "docker logs --tail 100 clawer_user_{userId}"

# Follow logs
ssh root@YOUR_DOCKER_HOST "docker logs -f clawer_user_{userId}"
```

### Programmatic

```typescript
import { getContainerLogs } from '@/lib/orchestrator';

const logs = await getContainerLogs('user_123', 100);
```

## Troubleshooting

### Container won't start

```bash
# Check Docker logs
docker logs clawer_user_{userId}

# Check if port is in use
netstat -tulpn | grep {port}

# Verify image exists
docker images | grep clawer-bot-worker
```

### Health check failing

```bash
# Manual health check
curl http://localhost:{port}/health

# Check container status
docker ps -a | grep clawer_user_{userId}

# Inspect container
docker inspect clawer_user_{userId}
```

### Container repeatedly restarting

- Check logs for errors: `docker logs clawer_user_{userId}`
- Verify MOONSHOT_API_KEY is valid
- Check memory usage: `docker stats clawer_user_{userId}`

## Future Improvements

- [ ] Redis-based port allocation for multi-server setup
- [ ] Container metrics collection (CPU, memory, request count)
- [ ] Graceful shutdown on low resources
- [ ] Container image versioning
- [ ] Multi-region deployment
- [ ] Load balancing for high-traffic users
- [ ] Container autoscaling based on message volume

## Files Created/Modified

### New Files
- `docker/bot-worker/Dockerfile`
- `docker/bot-worker/worker.js`
- `docker/bot-worker/package.json`
- `src/lib/orchestrator/container-manager.ts`
- `src/lib/orchestrator/health-checker.ts`
- `src/lib/orchestrator/message-router.ts`
- `src/lib/orchestrator/index.ts`
- `src/app/api/message/route.ts`
- `scripts/build-and-deploy-worker.sh`
- `scripts/test-container.sh`

### Modified Files
- `src/lib/db/schema/users.ts` - Added `containerPort` field
- `src/app/api/webhooks/stripe/route.ts` - Added container provisioning/removal

### Database Migration
- `drizzle/0002_nappy_monster_badoon.sql` - Adds container_port column
