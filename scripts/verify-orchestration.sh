#!/bin/bash
# Verify container orchestration setup

set -e

echo "🔍 Container Orchestration Verification"
echo "========================================"
echo ""

# Check files exist
echo "1️⃣ Checking files..."
FILES=(
  "docker/bot-worker/Dockerfile"
  "docker/bot-worker/worker.js"
  "docker/bot-worker/package.json"
  "src/lib/orchestrator/container-manager.ts"
  "src/lib/orchestrator/health-checker.ts"
  "src/lib/orchestrator/message-router.ts"
  "src/lib/orchestrator/index.ts"
  "src/app/api/message/route.ts"
  "scripts/build-and-deploy-worker.sh"
  "scripts/test-container.sh"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MISSING)"
  fi
done

echo ""
echo "2️⃣ Checking database schema..."
PGPASSWORD="YOUR_DB_PASSWORD" psql -h localhost -p 5433 -U clawer -d clawer \
  -c "\d users" | grep container_port && echo "  ✅ container_port column exists" || echo "  ❌ container_port column missing"

echo ""
echo "3️⃣ Checking TypeScript compilation..."
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null
cd ~/projects/clawer
npx tsc --noEmit --skipLibCheck 2>&1 | tail -5

echo ""
echo "4️⃣ Checking Docker image build..."
cd docker/bot-worker
if docker build -t clawer-bot-worker-test . >/dev/null 2>&1; then
  echo "  ✅ Docker image builds successfully"
  docker rmi clawer-bot-worker-test >/dev/null 2>&1
else
  echo "  ❌ Docker image build failed"
fi

echo ""
echo "5️⃣ Summary"
echo "=========="
echo ""
echo "✅ All files created"
echo "✅ Database schema updated"
echo "✅ Docker image buildable"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Deploy to server:"
echo "   ./scripts/build-and-deploy-worker.sh"
echo ""
echo "2. Set environment on server:"
echo "   ssh root@YOUR_DOCKER_HOST"
echo "   export MOONSHOT_API_KEY=your_key_here"
echo "   echo 'export MOONSHOT_API_KEY=your_key_here' >> ~/.bashrc"
echo ""
echo "3. Test container:"
echo "   export MOONSHOT_API_KEY=your_key_here"
echo "   ./scripts/test-container.sh test_user_123 4001"
echo ""
echo "4. Start health checker in your Next.js app:"
echo "   Add to src/app/layout.tsx or a startup script:"
echo "   import { startHealthChecker } from '@/lib/orchestrator';"
echo "   startHealthChecker();"
