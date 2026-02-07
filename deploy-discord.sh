#!/bin/bash
#
# Deploy Discord Integration to Production
# Run from local machine: ./deploy-discord.sh
#

set -e

SERVER="root@YOUR_DOCKER_HOST"
PROJECT_PATH="/opt/clawer"

echo "🚀 Deploying Discord integration to production..."

# 1. Build locally
echo ""
echo "📦 Building project locally..."
source ~/.nvm/nvm.sh
nvm use 20
npm run build

# 2. Rsync to server (excluding node_modules, .git, .next cache)
echo ""
echo "📤 Syncing files to server..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next/cache' \
  --exclude '.env.local' \
  ./ $SERVER:$PROJECT_PATH/

# 3. Add environment variables on server
echo ""
echo "🔧 Updating environment variables..."
ssh $SERVER << 'ENDSSH'
cd /opt/clawer

# Add Discord encryption key if not exists
if ! grep -q "DISCORD_ENCRYPTION_KEY" .env.local; then
  echo "" >> .env.local
  echo "# Discord Bot Encryption" >> .env.local
  echo "DISCORD_ENCRYPTION_KEY=b81459f1ea5290bfb02e5f943723790cae56ab2e0cd5dcc8aa4a95fb8dd30222" >> .env.local
  echo "✓ Added DISCORD_ENCRYPTION_KEY"
fi

# Check if MOONSHOT_API_KEY exists
if ! grep -q "MOONSHOT_API_KEY" .env.local; then
  echo "⚠️  WARNING: MOONSHOT_API_KEY not found in .env.local"
  echo "   Please add your Kimi API key manually:"
  echo "   ssh root@YOUR_DOCKER_HOST"
  echo "   cd /opt/clawer"
  echo "   echo 'MOONSHOT_API_KEY=sk-...' >> .env.local"
fi
ENDSSH

# 4. Install dependencies and run migrations
echo ""
echo "📚 Installing dependencies..."
ssh $SERVER << 'ENDSSH'
cd /opt/clawer
source ~/.nvm/nvm.sh
nvm use 20
npm install

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
npm run db:push
ENDSSH

# 5. Restart PM2
echo ""
echo "🔄 Restarting application..."
ssh $SERVER "pm2 restart clawer"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Make sure MOONSHOT_API_KEY is set in production .env.local"
echo "   2. Test Discord connection at https://clawer.ai/discord"
echo "   3. Monitor logs: ssh root@YOUR_DOCKER_HOST 'pm2 logs clawer'"
echo ""
