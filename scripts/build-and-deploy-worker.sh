#!/bin/bash
# Build and deploy bot worker Docker image to server

set -e

SERVER="YOUR_DOCKER_HOST"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/docker/bot-worker"

echo "🔨 Building Docker image..."
cd "$DOCKER_DIR"

# Build image locally
docker build -t clawer-bot-worker .

echo "📦 Saving image as tar..."
docker save clawer-bot-worker | gzip > /tmp/clawer-bot-worker.tar.gz

echo "🚀 Uploading to server $SERVER..."
scp /tmp/clawer-bot-worker.tar.gz root@$SERVER:/tmp/

echo "📥 Loading image on server..."
ssh root@$SERVER "docker load < /tmp/clawer-bot-worker.tar.gz && rm /tmp/clawer-bot-worker.tar.gz"

echo "🧹 Cleaning up local tar..."
rm /tmp/clawer-bot-worker.tar.gz

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Ensure MOONSHOT_API_KEY is set on server"
echo "  2. Run: scripts/test-container.sh <userId>"
