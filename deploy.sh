#!/bin/bash
# Deploy clawer to production
# Excludes: .git, node_modules, .next, userdata (container volumes)
set -e

rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='userdata' \
  ~/projects/clawer/ root@YOUR_DOCKER_HOST:/opt/clawer/

ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && pnpm install && pnpm build && pm2 restart clawer"

echo "✅ Deployed to production"
