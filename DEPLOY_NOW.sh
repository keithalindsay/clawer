#!/bin/bash
# Complete deployment script for container orchestration
# Run this after code is complete

set -e

echo "🚀 Container Orchestration Deployment"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if on correct server or have SSH access
if ! ssh -q root@YOUR_DOCKER_HOST exit 2>/dev/null; then
  echo -e "${RED}❌ Cannot SSH to YOUR_DOCKER_HOST${NC}"
  echo "   Make sure you have SSH access: ssh root@YOUR_DOCKER_HOST"
  exit 1
fi
echo -e "${GREEN}✅ SSH access to server${NC}"

# Check if Docker is available locally for build
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚠️  Docker not found locally${NC}"
  echo "   Will need to build on server or install Docker"
fi

# Check if MOONSHOT_API_KEY is set
if [ -z "$MOONSHOT_API_KEY" ]; then
  echo -e "${RED}❌ MOONSHOT_API_KEY not set${NC}"
  echo ""
  read -p "Enter your Moonshot API key: " MOONSHOT_KEY
  export MOONSHOT_API_KEY="$MOONSHOT_KEY"
fi
echo -e "${GREEN}✅ MOONSHOT_API_KEY set${NC}"

echo ""
echo "======================================"
echo ""

# Step 1: Build Docker image
echo "Step 1: Building Docker image..."
echo "--------------------------------"

cd ~/projects/clawer/docker/bot-worker

if command -v docker &> /dev/null; then
  echo "Building locally..."
  docker build -t clawer-bot-worker . || {
    echo -e "${RED}❌ Docker build failed${NC}"
    echo "   Make sure you're in the docker group: sudo usermod -aG docker $USER"
    exit 1
  }
  echo -e "${GREEN}✅ Image built${NC}"
  
  # Save and transfer
  echo "Saving image..."
  docker save clawer-bot-worker | gzip > /tmp/clawer-bot-worker.tar.gz
  
  echo "Uploading to server..."
  scp /tmp/clawer-bot-worker.tar.gz root@YOUR_DOCKER_HOST:/tmp/
  
  echo "Loading on server..."
  ssh root@YOUR_DOCKER_HOST "docker load < /tmp/clawer-bot-worker.tar.gz && rm /tmp/clawer-bot-worker.tar.gz"
  
  rm /tmp/clawer-bot-worker.tar.gz
  echo -e "${GREEN}✅ Image deployed to server${NC}"
else
  echo "Building on server..."
  # Copy files to server and build there
  ssh root@YOUR_DOCKER_HOST "mkdir -p /tmp/bot-worker"
  scp -r ~/projects/clawer/docker/bot-worker/* root@YOUR_DOCKER_HOST:/tmp/bot-worker/
  ssh root@YOUR_DOCKER_HOST "cd /tmp/bot-worker && docker build -t clawer-bot-worker . && rm -rf /tmp/bot-worker"
  echo -e "${GREEN}✅ Image built and deployed on server${NC}"
fi

echo ""
echo "======================================"
echo ""

# Step 2: Set environment on server
echo "Step 2: Setting environment on server..."
echo "----------------------------------------"

ssh root@YOUR_DOCKER_HOST "echo 'export MOONSHOT_API_KEY=$MOONSHOT_API_KEY' >> ~/.bashrc"
echo -e "${GREEN}✅ MOONSHOT_API_KEY set on server${NC}"

echo ""
echo "======================================"
echo ""

# Step 3: Test container
echo "Step 3: Testing container..."
echo "----------------------------"

TEST_USER="deploy_test_$(date +%s)"
TEST_PORT="4001"

echo "Provisioning test container..."
ssh root@YOUR_DOCKER_HOST "
docker rm -f clawer_user_$TEST_USER 2>/dev/null || true

docker run -d \
  --name clawer_user_$TEST_USER \
  --memory=512m \
  --cpus=0.5 \
  -p $TEST_PORT:3001 \
  -e USER_ID=$TEST_USER \
  -e MOONSHOT_API_KEY=$MOONSHOT_API_KEY \
  --restart=unless-stopped \
  clawer-bot-worker
"

echo "Waiting for container to be ready..."
sleep 5

echo "Testing health check..."
if ssh root@YOUR_DOCKER_HOST "curl -f http://localhost:$TEST_PORT/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed${NC}"
  echo "Container logs:"
  ssh root@YOUR_DOCKER_HOST "docker logs clawer_user_$TEST_USER"
  exit 1
fi

echo "Testing message endpoint..."
RESPONSE=$(ssh root@YOUR_DOCKER_HOST "curl -s -X POST http://localhost:$TEST_PORT/message \
  -H 'Content-Type: application/json' \
  -d '{\"message\": \"Say hello in 5 words or less\"}'")

if echo "$RESPONSE" | grep -q "response"; then
  echo -e "${GREEN}✅ Message endpoint works${NC}"
  echo "Response: $RESPONSE" | head -c 200
  echo "..."
else
  echo -e "${RED}❌ Message endpoint failed${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi

echo ""
echo "Cleaning up test container..."
ssh root@YOUR_DOCKER_HOST "docker rm -f clawer_user_$TEST_USER"

echo ""
echo "======================================"
echo ""

# Step 4: Verify deployment
echo "Step 4: Verifying deployment..."
echo "--------------------------------"

echo "Checking Docker image on server..."
ssh root@YOUR_DOCKER_HOST "docker images | grep clawer-bot-worker"

echo ""
echo "Checking environment..."
ssh root@YOUR_DOCKER_HOST "echo 'MOONSHOT_API_KEY is set:' && [ -n \"\$MOONSHOT_API_KEY\" ] && echo 'Yes' || echo 'No (run: source ~/.bashrc)'"

echo ""
echo "======================================"
echo ""

# Summary
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo ""
echo "📊 Summary:"
echo "  ✅ Docker image built and deployed"
echo "  ✅ Environment configured"
echo "  ✅ Test container successful"
echo "  ✅ Health checks passing"
echo "  ✅ Message endpoint working"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Start health checker in your Next.js app:"
echo "   import { startHealthChecker } from '@/lib/orchestrator';"
echo "   startHealthChecker();"
echo ""
echo "2. Test Stripe webhook integration:"
echo "   - Subscribe a test user"
echo "   - Verify container provisions"
echo "   - Send message via API"
echo "   - Cancel subscription"
echo "   - Verify container removes"
echo ""
echo "3. Monitor first production user:"
echo "   ssh root@YOUR_DOCKER_HOST 'docker ps --filter \"name=clawer_user_\"'"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: QUICK_START_CONTAINERS.md"
echo "  - Architecture: CONTAINER_ORCHESTRATION.md"
echo "  - Test Plan: CONTAINER_TEST_PLAN.md"
echo "  - Quick Ref: README_CONTAINERS.md"
echo ""
echo "🆘 If issues occur:"
echo "  1. Check logs: docker logs clawer_user_{userId}"
echo "  2. Check health: curl http://localhost:{port}/health"
echo "  3. Verify API key: echo \$MOONSHOT_API_KEY"
echo "  4. Review server resources: docker stats"
echo ""
echo "🎉 Container orchestration is live!"
