> ⚠️ **OUTDATED** - See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/RUNBOOK.md](docs/RUNBOOK.md) for current documentation
> 
> This document is preserved for historical reference only.

# Container Orchestration Test Plan

## Pre-Deployment Checks

### ✅ Local Verification

```bash
cd ~/projects/clawer

# 1. Verify all files exist
./scripts/verify-orchestration.sh

# 2. Check database migration applied
PGPASSWORD="YOUR_DB_PASSWORD" psql -h localhost -p 5433 -U clawer -d clawer \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='container_port';"

# Expected: container_port

# 3. Test TypeScript compilation (ignore path alias warnings)
source ~/.nvm/nvm.sh && nvm use 20
npx tsc --noEmit src/lib/orchestrator/*.ts --skipLibCheck
```

### ✅ Docker Image Build

```bash
cd ~/projects/clawer/docker/bot-worker

# Build image (requires docker group access or sudo)
docker build -t clawer-bot-worker .

# Expected: Successfully built and tagged
```

---

## Server Deployment

### Step 1: Deploy Docker Image

```bash
cd ~/projects/clawer

# Build and push to server
./scripts/build-and-deploy-worker.sh

# OR manually:
cd docker/bot-worker
docker build -t clawer-bot-worker .
docker save clawer-bot-worker | gzip > /tmp/clawer-bot-worker.tar.gz
scp /tmp/clawer-bot-worker.tar.gz root@YOUR_DOCKER_HOST:/tmp/
ssh root@YOUR_DOCKER_HOST "docker load < /tmp/clawer-bot-worker.tar.gz && rm /tmp/clawer-bot-worker.tar.gz"
```

**Verify:**
```bash
ssh root@YOUR_DOCKER_HOST "docker images | grep clawer-bot-worker"
# Expected: clawer-bot-worker   latest   <image_id>   <time>   <size>
```

### Step 2: Set Environment Variables

```bash
# Get your Moonshot API key from https://platform.moonshot.cn/

ssh root@YOUR_DOCKER_HOST
export MOONSHOT_API_KEY=your_moonshot_key_here
echo 'export MOONSHOT_API_KEY=your_moonshot_key_here' >> ~/.bashrc
source ~/.bashrc
echo $MOONSHOT_API_KEY  # Verify it's set
exit
```

**Verify:**
```bash
ssh root@YOUR_DOCKER_HOST "echo \$MOONSHOT_API_KEY"
# Expected: your key
```

---

## Container Tests

### Test 1: Manual Container Provisioning

```bash
export MOONSHOT_API_KEY=your_moonshot_key_here
./scripts/test-container.sh test_user_123 4001
```

**Expected Output:**
```
🧪 Testing container for user: test_user_123
📡 Port: 4001

1️⃣ Removing existing container (if any)...
2️⃣ Starting container...
<container_id>

3️⃣ Waiting for container to be ready...
4️⃣ Checking health...
{"status":"healthy","userId":"test_user_123","timestamp":"..."}

5️⃣ Sending test message...
{
  "response": "...",
  "conversationId": "...",
  "userId": "test_user_123",
  "timestamp": "..."
}

✅ Container test complete!
```

**If it fails:**

```bash
# Check container logs
ssh root@YOUR_DOCKER_HOST "docker logs clawer_user_test_user_123"

# Check container status
ssh root@YOUR_DOCKER_HOST "docker ps -a | grep test_user_123"

# Check if port is in use
ssh root@YOUR_DOCKER_HOST "netstat -tulpn | grep 4001"
```

### Test 2: Health Check

```bash
ssh root@YOUR_DOCKER_HOST "curl http://localhost:4001/health"
```

**Expected:**
```json
{
  "status": "healthy",
  "userId": "test_user_123",
  "timestamp": "2026-02-06T20:30:00.000Z"
}
```

### Test 3: Message Endpoint

```bash
ssh root@YOUR_DOCKER_HOST 'curl -X POST http://localhost:4001/message \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Tell me a short joke\"}"'
```

**Expected:**
```json
{
  "response": "<AI joke response>",
  "conversationId": "cmpl-xxx",
  "userId": "test_user_123",
  "timestamp": "2026-02-06T20:30:05.000Z"
}
```

### Test 4: Container Restart

```bash
ssh root@YOUR_DOCKER_HOST "docker restart clawer_user_test_user_123"
sleep 5
ssh root@YOUR_DOCKER_HOST "curl http://localhost:4001/health"
```

**Expected:** Health check returns 200 OK

### Test 5: Container Logs

```bash
ssh root@YOUR_DOCKER_HOST "docker logs --tail 20 clawer_user_test_user_123"
```

**Expected:**
```
🤖 Bot worker starting for user: test_user_123
✅ Bot worker listening on port 3001
👤 User ID: test_user_123
📨 User test_user_123 message: Tell me a short joke...
✅ Response sent to user test_user_123
```

### Test 6: Multiple Containers

```bash
# Provision multiple test containers
export MOONSHOT_API_KEY=your_moonshot_key_here
./scripts/test-container.sh test_user_456 4002
./scripts/test-container.sh test_user_789 4003

# Verify all running
ssh root@YOUR_DOCKER_HOST "docker ps --filter 'name=clawer_user_'"
```

**Expected:** 3 containers running (test_user_123, test_user_456, test_user_789)

### Test 7: Container Removal

```bash
ssh root@YOUR_DOCKER_HOST "docker rm -f clawer_user_test_user_123"
ssh root@YOUR_DOCKER_HOST "docker ps -a | grep test_user_123"
```

**Expected:** Container removed, no output from second command

---

## Application Integration Tests

### Test 8: Orchestrator Service (Programmatic)

Create test file: `src/lib/orchestrator/__tests__/integration.test.ts`

```typescript
import { provisionContainer, routeMessage, removeContainer } from '../index';

describe('Container Orchestration', () => {
  const testUserId = 'integration_test_user';

  afterAll(async () => {
    await removeContainer(testUserId);
  });

  it('should provision container', async () => {
    const container = await provisionContainer(testUserId);
    
    expect(container.userId).toBe(testUserId);
    expect(container.containerName).toBe(`clawer_user_${testUserId}`);
    expect(container.port).toBeGreaterThanOrEqual(4001);
    expect(container.status).toBe('running');
  });

  it('should route message to container', async () => {
    const response = await routeMessage(testUserId, {
      message: 'Hello, this is a test',
    });

    expect(response.userId).toBe(testUserId);
    expect(response.response).toBeTruthy();
    expect(response.timestamp).toBeTruthy();
  });

  it('should remove container', async () => {
    await removeContainer(testUserId);
    
    // Verify port cleared in DB
    const user = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    
    expect(user?.containerPort).toBeNull();
  });
});
```

**Run:**
```bash
npm test src/lib/orchestrator/__tests__/integration.test.ts
```

### Test 9: Stripe Webhook Integration

**Manual test with Stripe CLI:**

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test subscription
stripe trigger checkout.session.completed
```

**Expected:**
1. Webhook receives event
2. Container provisions for test user
3. Check logs: "🐳 Container provisioned for user..."

**Verify:**
```bash
ssh root@YOUR_DOCKER_HOST "docker ps | grep clawer_user_"
```

### Test 10: Message API Endpoint

**Create test user in Clerk and get auth token**

```bash
# Using curl with Clerk auth token
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_auth_token>" \
  -d '{"message": "Test via API"}'
```

**Expected:**
```json
{
  "response": "<AI response>",
  "conversationId": "...",
  "userId": "<clerk_user_id>",
  "timestamp": "..."
}
```

### Test 11: Health Checker

**Add to a test route:** `src/app/api/test-health-checker/route.ts`

```typescript
import { startHealthChecker, checkUserHealth } from '@/lib/orchestrator';
import { NextResponse } from 'next/server';

export async function GET() {
  startHealthChecker();
  
  // Wait for first health check
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  return NextResponse.json({ status: 'Health checker started' });
}
```

**Test:**
```bash
curl http://localhost:3000/api/test-health-checker
```

**Check logs for:** "🏥 Starting health checker..."

---

## Stress Tests

### Test 12: Resource Limits

```bash
# Start container with known limits
ssh root@YOUR_DOCKER_HOST "docker run -d --name test_limits \
  --memory=512m --cpus=0.5 \
  -p 5000:3001 \
  -e USER_ID=test_limits \
  -e MOONSHOT_API_KEY=\$MOONSHOT_API_KEY \
  clawer-bot-worker"

# Check resource usage
ssh root@YOUR_DOCKER_HOST "docker stats test_limits --no-stream"

# Expected: MEM USAGE < 512MB, CPU < 50%

# Cleanup
ssh root@YOUR_DOCKER_HOST "docker rm -f test_limits"
```

### Test 13: Concurrent Messages

```bash
# Send 10 concurrent requests to same container
for i in {1..10}; do
  ssh root@YOUR_DOCKER_HOST 'curl -X POST http://localhost:4001/message \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Request '$i'\"}"' &
done
wait

# Expected: All return 200 OK with responses
```

### Test 14: Container Crash Recovery

```bash
# Kill container process
ssh root@YOUR_DOCKER_HOST "docker kill clawer_user_test_user_123"

# Wait for health checker (60s)
sleep 65

# Check if restarted
ssh root@YOUR_DOCKER_HOST "docker ps | grep test_user_123"

# Expected: Container restarted by health checker
```

---

## Production Readiness Checklist

### Infrastructure
- [ ] Docker installed on server ✅ (YOUR_DOCKER_HOST)
- [ ] MOONSHOT_API_KEY set on server
- [ ] Docker image deployed to server
- [ ] Server has sufficient resources (RAM, CPU)
- [ ] Firewall rules allow container ports (if needed)

### Code
- [ ] All files created and tested
- [ ] Database migration applied
- [ ] TypeScript compiles without errors
- [ ] No hardcoded secrets in code

### Testing
- [ ] Docker image builds successfully
- [ ] Test container provisions and runs
- [ ] Health check endpoint works
- [ ] Message endpoint works
- [ ] Kimi API returns responses
- [ ] Container restart works
- [ ] Container removal works
- [ ] Multiple containers can run concurrently

### Integration
- [ ] Stripe webhook provisions container on subscription
- [ ] Stripe webhook removes container on cancellation
- [ ] Message API routes to correct container
- [ ] Health checker runs and restarts failed containers
- [ ] Clerk authentication works with message API

### Monitoring
- [ ] Health checker logs visible
- [ ] Container logs accessible
- [ ] Error handling in place
- [ ] Resource usage within limits

### Documentation
- [ ] Quick start guide (QUICK_START_CONTAINERS.md)
- [ ] Architecture docs (CONTAINER_ORCHESTRATION.md)
- [ ] Build summary (CONTAINER_BUILD_SUMMARY.md)
- [ ] Test plan (CONTAINER_TEST_PLAN.md)

---

## Rollback Plan

If issues occur in production:

```bash
# Stop all user containers
ssh root@YOUR_DOCKER_HOST "docker ps --filter 'name=clawer_user_' -q | xargs docker stop"

# Remove all user containers
ssh root@YOUR_DOCKER_HOST "docker ps -a --filter 'name=clawer_user_' -q | xargs docker rm"

# Clear containerPort in database
PGPASSWORD="YOUR_DB_PASSWORD" psql -h localhost -p 5433 -U clawer -d clawer \
  -c "UPDATE users SET container_port = NULL WHERE container_port IS NOT NULL;"

# Stop health checker (in your app code)
import { stopHealthChecker } from '@/lib/orchestrator';
stopHealthChecker();
```

---

## Success Metrics

1. **Container provisioning:** < 30 seconds from subscription to healthy container
2. **Message routing:** < 100ms to route message to container
3. **Health check:** < 5 seconds to detect unhealthy container
4. **Auto-restart:** < 60 seconds to restart failed container
5. **Resource usage:** < 512MB RAM, < 0.5 CPU per container
6. **Uptime:** > 99% container availability

---

## Next Steps After Testing

1. ✅ Complete all tests in this plan
2. ⏳ Monitor first real user subscription
3. ⏳ Verify container provisions automatically
4. ⏳ Test message flow with real user
5. ⏳ Monitor resource usage over 24 hours
6. ⏳ Implement metrics collection
7. ⏳ Set up alerts for failed containers
8. ⏳ Plan for horizontal scaling

---

**Test plan created:** 2026-02-06  
**Ready for:** Server deployment and testing
