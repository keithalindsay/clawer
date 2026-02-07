# Quick Start: Container Orchestration

## ✅ What's Built

1. **Docker Worker Image** (`docker/bot-worker/`)
   - Minimal Node.js container that receives messages and calls Kimi API
   - Health checks, auto-restart, resource limits

2. **Orchestrator Service** (`src/lib/orchestrator/`)
   - `container-manager.ts` - Provision/start/stop/restart/remove containers
   - `health-checker.ts` - Periodic health checks with auto-restart
   - `message-router.ts` - Route messages to correct user container

3. **Stripe Integration** (Updated `src/app/api/webhooks/stripe/route.ts`)
   - Auto-provision on subscription
   - Auto-remove on cancellation

4. **Message API** (`src/app/api/message/route.ts`)
   - Authenticated endpoint to send messages to user's container

5. **Database Schema** (Updated `src/lib/db/schema/users.ts`)
   - Added `containerPort` field (migration applied)

## 🚀 Deploy to Server (YOUR_DOCKER_HOST)

### Step 1: Build and Push Docker Image

```bash
cd ~/projects/clawer/docker/bot-worker

# Build locally (requires Docker access)
docker build -t clawer-bot-worker .

# Save to tar
docker save clawer-bot-worker | gzip > /tmp/clawer-bot-worker.tar.gz

# Upload to server
scp /tmp/clawer-bot-worker.tar.gz root@YOUR_DOCKER_HOST:/tmp/

# SSH to server and load
ssh root@YOUR_DOCKER_HOST
docker load < /tmp/clawer-bot-worker.tar.gz
rm /tmp/clawer-bot-worker.tar.gz
```

**OR use the script:**

```bash
./scripts/build-and-deploy-worker.sh
```

### Step 2: Set Environment on Server

```bash
ssh root@YOUR_DOCKER_HOST

# Set API key
export MOONSHOT_API_KEY=your_moonshot_key_here

# Make it persistent
echo 'export MOONSHOT_API_KEY=your_moonshot_key_here' >> ~/.bashrc
```

### Step 3: Test Manual Container

```bash
# From your local machine, with MOONSHOT_API_KEY exported
export MOONSHOT_API_KEY=your_moonshot_key_here
./scripts/test-container.sh test_user_123 4001
```

This will:
- Remove any existing test container
- Start new container on port 4001
- Wait for health check
- Send test message
- Display response

### Step 4: Verify Full Flow

1. **Check container is running:**
   ```bash
   ssh root@YOUR_DOCKER_HOST "docker ps | grep clawer"
   ```

2. **Send a message:**
   ```bash
   ssh root@YOUR_DOCKER_HOST "curl -X POST http://localhost:4001/message \
     -H 'Content-Type: application/json' \
     -d '{\"message\": \"Tell me a joke\"}'"
   ```

3. **Check logs:**
   ```bash
   ssh root@YOUR_DOCKER_HOST "docker logs clawer_user_test_user_123"
   ```

## 📝 Usage in Your App

### Provision Container on Subscription

Already integrated in Stripe webhook. When user subscribes:

```typescript
// Automatic in src/app/api/webhooks/stripe/route.ts
import { provisionContainer } from '@/lib/orchestrator';

const container = await provisionContainer(userId);
// → { userId, containerName, port, status: 'running' }
```

### Send Messages to User's Container

```typescript
// From API route or server component
import { routeMessage } from '@/lib/orchestrator';

const response = await routeMessage(userId, {
  message: 'Hello bot!',
  conversationId: 'optional-id',
});
// → { response, conversationId, userId, timestamp }
```

### Start Health Checker

Add to your app startup (e.g., `src/app/layout.tsx` or a server startup script):

```typescript
import { startHealthChecker } from '@/lib/orchestrator';

// In a useEffect or server startup
if (typeof window === 'undefined') {
  // Server-side only
  startHealthChecker();
}
```

## 🧪 Testing

### Run Verification Script

```bash
cd ~/projects/clawer
./scripts/verify-orchestration.sh
```

### Manual Container Operations

```bash
# On server
ssh root@YOUR_DOCKER_HOST

# List all containers
docker ps -a --filter "name=clawer_user_"

# View specific container logs
docker logs -f clawer_user_<userId>

# Restart container
docker restart clawer_user_<userId>

# Remove container
docker rm -f clawer_user_<userId>

# Check health
curl http://localhost:<port>/health

# Send message
curl -X POST http://localhost:<port>/message \
  -H 'Content-Type: application/json' \
  -d '{"message": "test"}'
```

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
ssh root@YOUR_DOCKER_HOST "docker logs clawer_user_<userId>"

# Check if image exists
ssh root@YOUR_DOCKER_HOST "docker images | grep clawer-bot-worker"

# Verify port not in use
ssh root@YOUR_DOCKER_HOST "netstat -tulpn | grep <port>"
```

### Health check failing

```bash
# Manual health check
ssh root@YOUR_DOCKER_HOST "curl -v http://localhost:<port>/health"

# Check container is running
ssh root@YOUR_DOCKER_HOST "docker ps | grep clawer_user_<userId>"

# Inspect container
ssh root@YOUR_DOCKER_HOST "docker inspect clawer_user_<userId>"
```

### MOONSHOT_API_KEY errors

```bash
# Verify key is set
ssh root@YOUR_DOCKER_HOST "echo \$MOONSHOT_API_KEY"

# Check it's in container env
ssh root@YOUR_DOCKER_HOST "docker inspect clawer_user_<userId> | grep MOONSHOT"
```

## 📊 Container Specs

- **Base Image:** node:20-slim
- **Memory:** 512MB per container
- **CPU:** 0.5 cores per container
- **Port Range:** 4001-9999 (auto-allocated)
- **Restart Policy:** unless-stopped
- **Health Check:** Every 30s via HTTP /health endpoint

## 🔐 Security

- Containers are isolated from each other
- MOONSHOT_API_KEY passed via environment (not exposed in code)
- Resource limits prevent DoS
- Containers run as non-root internally

## 📈 Scaling

Current setup supports:
- **~6000 concurrent containers** (ports 4001-9999)
- Single server deployment
- For multi-server, add Redis for port allocation coordination

## 🔄 Next Steps

1. ✅ Deploy Docker image to server
2. ✅ Set MOONSHOT_API_KEY on server
3. ✅ Test manual container
4. ⏳ Test Stripe webhook flow (subscribe → container provisions)
5. ⏳ Test message routing through API
6. ⏳ Start health checker in production
7. ⏳ Monitor first user containers

## 📚 Full Documentation

See `CONTAINER_ORCHESTRATION.md` for complete architecture details.
