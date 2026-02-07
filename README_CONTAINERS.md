# Container Orchestration - Quick Reference

🐳 Auto-provision isolated Docker containers per user when they subscribe.

---

## 🎯 What It Does

- **Auto-provision** container when user subscribes (Stripe webhook)
- **Route messages** to user's isolated container
- **Health monitoring** with auto-restart on failure
- **Auto-cleanup** when user cancels subscription

---

## 🚀 Quick Deploy

### 1. Build & Deploy Image

```bash
cd ~/projects/clawer
./scripts/build-and-deploy-worker.sh
```

### 2. Set API Key on Server

```bash
ssh root@YOUR_DOCKER_HOST
export MOONSHOT_API_KEY=your_key_here
echo 'export MOONSHOT_API_KEY=your_key_here' >> ~/.bashrc
```

### 3. Test

```bash
export MOONSHOT_API_KEY=your_key_here
./scripts/test-container.sh test_user_123 4001
```

---

## 💻 Usage

### Provision Container

```typescript
import { provisionContainer } from '@/lib/orchestrator';

const container = await provisionContainer('user_123');
// → { userId, containerName, port, status: 'running' }
```

### Send Message

```typescript
import { routeMessage } from '@/lib/orchestrator';

const response = await routeMessage('user_123', {
  message: 'Hello bot!',
});
// → { response, conversationId, userId, timestamp }
```

### Start Health Checker

```typescript
import { startHealthChecker } from '@/lib/orchestrator';

// In your app startup
startHealthChecker();
```

---

## 🧪 Test Commands

### On Server

```bash
# List containers
docker ps --filter "name=clawer_user_"

# View logs
docker logs -f clawer_user_{userId}

# Restart
docker restart clawer_user_{userId}

# Health check
curl http://localhost:{port}/health

# Send message
curl -X POST http://localhost:{port}/message \
  -H 'Content-Type: application/json' \
  -d '{"message": "test"}'

# Remove
docker rm -f clawer_user_{userId}
```

### Scripts

```bash
# Verify everything
./scripts/verify-orchestration.sh

# Deploy image
./scripts/build-and-deploy-worker.sh

# Test container
./scripts/test-container.sh <userId> <port>
```

---

## 📊 Container Specs

- **Image:** clawer-bot-worker (Node 20 slim)
- **Memory:** 512MB per container
- **CPU:** 0.5 cores per container
- **Port Range:** 4001-9999 (auto-allocated)
- **Health Check:** Every 30s via HTTP /health
- **Restart Policy:** unless-stopped
- **Auto-restart:** Max 3 attempts by health checker

---

## 📁 Key Files

```
docker/bot-worker/
  ├── Dockerfile          # Container image
  ├── worker.js          # Express server (message + health endpoints)
  └── package.json       # Dependencies

src/lib/orchestrator/
  ├── container-manager.ts   # Provision/start/stop/restart/remove
  ├── health-checker.ts      # Periodic health checks + auto-restart
  ├── message-router.ts      # Route messages to containers
  └── index.ts              # Exports

src/app/api/
  ├── webhooks/stripe/route.ts  # Auto-provision/remove on subscription
  └── message/route.ts          # Message API endpoint

scripts/
  ├── build-and-deploy-worker.sh  # Deploy Docker image
  ├── test-container.sh          # Test container provisioning
  └── verify-orchestration.sh    # Verify setup
```

---

## 🔄 Lifecycle

```
Subscribe → Provision → Running → Health Checks → Cancel → Remove
```

1. **User subscribes** (Stripe checkout.session.completed)
2. **Container provisions** (docker run, port allocated, DB updated)
3. **Health checker monitors** (every 60s, auto-restart if unhealthy)
4. **Messages route** (POST /api/message → user's container → Kimi API)
5. **User cancels** (Stripe customer.subscription.deleted)
6. **Container removes** (docker stop + rm, DB cleared)

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker logs clawer_user_{userId}

# Check if image exists
docker images | grep clawer-bot-worker

# Check port availability
netstat -tulpn | grep {port}
```

### Health check failing

```bash
# Manual health check
curl -v http://localhost:{port}/health

# Check container running
docker ps | grep clawer_user_{userId}

# Restart container
docker restart clawer_user_{userId}
```

### MOONSHOT_API_KEY errors

```bash
# Verify key set
echo $MOONSHOT_API_KEY

# Check in container
docker inspect clawer_user_{userId} | grep MOONSHOT
```

---

## 📚 Full Documentation

- **QUICK_START_CONTAINERS.md** - Detailed deployment guide
- **CONTAINER_ORCHESTRATION.md** - Complete architecture
- **CONTAINER_BUILD_SUMMARY.md** - What was built
- **CONTAINER_TEST_PLAN.md** - Testing checklist

---

## ✅ Deployment Checklist

- [ ] Docker image built
- [ ] Image deployed to server (YOUR_DOCKER_HOST)
- [ ] MOONSHOT_API_KEY set on server
- [ ] Test container provisions successfully
- [ ] Health check responds
- [ ] Message endpoint works
- [ ] Stripe webhook tested
- [ ] Health checker started
- [ ] First user container provisioned

---

## 🆘 Support

**Server:** YOUR_DOCKER_HOST  
**Container naming:** clawer_user_{userId}  
**Port range:** 4001-9999  
**Max containers:** ~30-60 per server (based on resources)

For issues:
1. Check container logs: `docker logs clawer_user_{userId}`
2. Check health: `curl http://localhost:{port}/health`
3. Review server resources: `docker stats`
4. Check MOONSHOT_API_KEY is set

---

**Status:** ✅ Ready for deployment  
**Next:** Deploy image and test full flow
