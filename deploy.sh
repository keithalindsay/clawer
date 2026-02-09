#!/bin/bash
# Deploy Clawer to production
set -e

SERVER="root@YOUR_DOCKER_HOST"
REMOTE_DIR="/opt/clawer"

echo "🚀 Building..."
cd /home/keith/projects/clawer
npm run build 2>&1 | tail -5

echo "📦 Syncing to server..."
rsync -avz --delete \
  --exclude '.env.local' \
  --exclude '.env' \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next/cache' \
  . ${SERVER}:${REMOTE_DIR}/

echo "📦 Installing deps on server..."
ssh ${SERVER} "cd ${REMOTE_DIR} && npm install --production 2>&1 | tail -3"

echo "🔄 Restarting..."
ssh ${SERVER} "pm2 restart clawer"

echo "⏳ Waiting for startup..."
sleep 3

echo "🏥 Health check..."
STATUS=$(ssh ${SERVER} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
if [ "$STATUS" = "200" ]; then
  echo "✅ Deploy complete! Server returning 200"
else
  echo "❌ Server returned $STATUS — check logs:"
  ssh ${SERVER} "pm2 logs clawer --lines 10 --nostream"
fi
