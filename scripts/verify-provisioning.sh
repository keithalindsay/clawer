#!/bin/bash
# Verification script for container provisioning setup

set -e

echo "🔍 Verifying Container Provisioning Setup..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Provisioner file exists
echo -n "✓ Checking provisioner.ts exists... "
if [ -f "src/lib/provisioner.ts" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL${NC}"
  exit 1
fi

# Check 2: Stripe webhook updated
echo -n "✓ Checking Stripe webhook imports provisioner... "
if grep -q "from '@/lib/provisioner'" src/app/api/webhooks/stripe/route.ts; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL${NC}"
  echo "  Stripe webhook still importing from orchestrator"
  exit 1
fi

# Check 3: SSH connection to production server
echo -n "✓ Testing SSH connection to production server... "
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@YOUR_DOCKER_HOST "echo ok" &> /dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL${NC}"
  echo "  Cannot connect to root@YOUR_DOCKER_HOST"
  echo "  Make sure SSH keys are configured"
  exit 1
fi

# Check 4: Docker available on server
echo -n "✓ Checking Docker on production server... "
DOCKER_VERSION=$(ssh -o StrictHostKeyChecking=no root@YOUR_DOCKER_HOST "docker --version" 2>/dev/null || echo "")
if [ -n "$DOCKER_VERSION" ]; then
  echo -e "${GREEN}OK${NC} ($DOCKER_VERSION)"
else
  echo -e "${RED}FAIL${NC}"
  echo "  Docker not found on server"
  exit 1
fi

# Check 5: API keys file exists on server
echo -n "✓ Checking API keys file on server... "
if ssh -o StrictHostKeyChecking=no root@YOUR_DOCKER_HOST "test -f /opt/clawer/.env.local" 2>/dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${YELLOW}WARNING${NC}"
  echo "  /opt/clawer/.env.local not found on server"
  echo "  Provisioning will fail without API keys"
fi

# Check 6: Docker image exists on server
echo -n "✓ Checking Docker image on server... "
IMAGE_EXISTS=$(ssh -o StrictHostKeyChecking=no root@YOUR_DOCKER_HOST "docker images -q clawer-openclaw:ecommerce" 2>/dev/null || echo "")
if [ -n "$IMAGE_EXISTS" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${YELLOW}WARNING${NC}"
  echo "  Image clawer-openclaw:ecommerce not found on server"
  echo "  Build the image first or update IMAGE name in provisioner.ts"
fi

# Check 7: Environment variables in Vercel
echo ""
echo "📋 Required Vercel Environment Variables:"
echo "   - DATABASE_URL"
echo "   - CLERK_WEBHOOK_SECRET"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - STRIPE_SECRET_KEY"
echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "   - CLERK_SECRET_KEY"
echo ""
echo -e "${YELLOW}⚠️  Verify these are set in Vercel dashboard${NC}"

# Check 8: No references to old orchestrator (except deprecated file itself)
echo ""
echo -n "✓ Checking for remaining orchestrator imports... "
OLD_IMPORTS=$(grep -r "from '@/lib/orchestrator'" src/ --include="*.ts" --include="*.tsx" | grep -v "src/lib/orchestrator.ts" | wc -l)
if [ "$OLD_IMPORTS" -eq "0" ]; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL${NC}"
  echo "  Found $OLD_IMPORTS files still importing from orchestrator:"
  grep -r "from '@/lib/orchestrator'" src/ --include="*.ts" --include="*.tsx" | grep -v "src/lib/orchestrator.ts"
  exit 1
fi

# Summary
echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}✅ All checks passed!${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "📦 Next steps:"
echo "   1. Review CONTAINER-PROVISIONING.md"
echo "   2. Deploy: bash deploy.sh"
echo "   3. Test with Stripe test mode checkout"
echo "   4. Monitor: vercel logs --follow"
echo ""
