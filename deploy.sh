#!/bin/bash
# Manual deploy script for Clawer
# Fallback for when GitHub Actions is not available
set -e

SERVER="root@YOUR_DOCKER_HOST"
REMOTE_DIR="/opt/clawer"
BACKUP_DIR="/opt/clawer-backup-$(date +%Y%m%d-%H%M%S)"

# Pre-deploy checks
echo "🔍 Running pre-deploy checks..."

# Check if on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️  Warning: Not on main branch (currently on $BRANCH)"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check if working directory is clean
if [[ -n $(git status -s) ]]; then
  echo "⚠️  Warning: Working directory has uncommitted changes"
  git status -s
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check for .env files in git
if git ls-files | grep -q '\.env$'; then
  echo "❌ Error: .env file is tracked by git!"
  echo "Run: git rm --cached .env && git commit -m 'Remove .env from git'"
  exit 1
fi

echo "✅ Pre-deploy checks passed"

# Create backup on server
echo "💾 Creating backup on server..."
ssh ${SERVER} "if [ -d ${REMOTE_DIR} ]; then cp -r ${REMOTE_DIR} ${BACKUP_DIR}; echo 'Backup created at ${BACKUP_DIR}'; fi"

# Build locally
echo "🚀 Building..."
cd /home/keith/projects/clawer
NEXT_PRIVATE_WORKER_THREADS=0 npm run build

# Sync to server
echo "📦 Syncing to server..."
rsync -avz --delete \
  --exclude '.env.local' \
  --exclude '.env' \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next/cache' \
  . ${SERVER}:${REMOTE_DIR}/

# Install dependencies on server
echo "📦 Installing deps on server..."
ssh ${SERVER} "cd ${REMOTE_DIR} && npm install --production"

# Restart PM2
echo "🔄 Restarting PM2..."
ssh ${SERVER} "pm2 restart clawer"

# Health check with retries
echo "⏳ Waiting for startup..."
sleep 5

echo "🏥 Health check..."
for i in {1..3}; do
  echo "Attempt $i/3..."
  STATUS=$(ssh ${SERVER} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/")
  if [ "$STATUS" = "200" ]; then
    echo "✅ Deploy complete! Server returning 200"
    echo ""
    echo "To rollback: ssh ${SERVER} 'rm -rf ${REMOTE_DIR} && mv ${BACKUP_DIR} ${REMOTE_DIR} && pm2 restart clawer'"
    exit 0
  fi
  echo "Got status $STATUS, retrying in 5s..."
  sleep 5
done

# Health check failed
echo "❌ Health check failed after 3 attempts"
echo "Server returned: $STATUS"
echo ""
echo "📋 Last 20 lines of logs:"
ssh ${SERVER} "pm2 logs clawer --lines 20 --nostream"
echo ""
echo "To rollback: ssh ${SERVER} 'rm -rf ${REMOTE_DIR} && mv ${BACKUP_DIR} ${REMOTE_DIR} && pm2 restart clawer'"
exit 1
