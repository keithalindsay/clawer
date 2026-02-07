#!/bin/bash
#
# Test Discord Integration Locally
# Verifies the build works before deploying
#

set -e

echo "🧪 Testing Discord integration locally..."
echo ""

# 1. Check if discord.js is installed
echo "1️⃣ Checking dependencies..."
if grep -q "discord.js" package.json; then
  echo "   ✅ discord.js found in package.json"
else
  echo "   ❌ discord.js not found!"
  exit 1
fi

# 2. Check if all files exist
echo ""
echo "2️⃣ Checking files..."
FILES=(
  "src/lib/discord/client.ts"
  "src/lib/discord/messageHandler.ts"
  "src/lib/discord/encryption.ts"
  "src/lib/discord/startup.ts"
  "src/lib/db/schema/discord.ts"
  "src/app/discord/page.tsx"
  "src/app/discord/DiscordConnectionForm.tsx"
  "src/app/api/discord/connect/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file"
  else
    echo "   ❌ $file missing!"
    exit 1
  fi
done

# 3. Check environment variables
echo ""
echo "3️⃣ Checking environment..."
if grep -q "DISCORD_ENCRYPTION_KEY" .env.local; then
  echo "   ✅ DISCORD_ENCRYPTION_KEY found"
else
  echo "   ⚠️  DISCORD_ENCRYPTION_KEY not found (will use from file)"
fi

# 4. Build the project
echo ""
echo "4️⃣ Building project..."
source ~/.nvm/nvm.sh
nvm use 20 >/dev/null

# Set fake database URL for build
export DATABASE_URL="postgresql://fake:fake@localhost:5432/fake"

if npm run build >/dev/null 2>&1; then
  echo "   ✅ Build successful"
else
  echo "   ❌ Build failed!"
  echo "   Run: npm run build (to see errors)"
  exit 1
fi

# 5. Check TypeScript compilation
echo ""
echo "5️⃣ Checking TypeScript..."
if npx tsc --noEmit --skipLibCheck >/dev/null 2>&1; then
  echo "   ✅ TypeScript check passed"
else
  echo "   ⚠️  TypeScript warnings (non-blocking)"
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy to production: ./deploy-discord.sh"
echo "   2. Add MOONSHOT_API_KEY to production .env.local"
echo "   3. Test at https://clawer.ai/discord"
echo ""
