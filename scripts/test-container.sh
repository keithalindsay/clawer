#!/bin/bash
# Manually provision and test a container

set -e

USER_ID="${1:-test_user_123}"
PORT="${2:-4001}"
SERVER="YOUR_DOCKER_HOST"

echo "🧪 Testing container for user: $USER_ID"
echo "📡 Port: $PORT"
echo ""

# Check if MOONSHOT_API_KEY is set
if [ -z "$MOONSHOT_API_KEY" ]; then
  echo "❌ MOONSHOT_API_KEY environment variable not set"
  echo "   Set it with: export MOONSHOT_API_KEY=your_key_here"
  exit 1
fi

echo "1️⃣ Removing existing container (if any)..."
ssh root@$SERVER "docker rm -f clawer_user_$USER_ID 2>/dev/null || true"

echo ""
echo "2️⃣ Starting container..."
ssh root@$SERVER "docker run -d \
  --name clawer_user_$USER_ID \
  --memory=512m \
  --cpus=0.5 \
  -p $PORT:3001 \
  -e USER_ID=$USER_ID \
  -e MOONSHOT_API_KEY=$MOONSHOT_API_KEY \
  --restart=unless-stopped \
  clawer-bot-worker"

echo ""
echo "3️⃣ Waiting for container to be ready..."
sleep 3

echo ""
echo "4️⃣ Checking health..."
ssh root@$SERVER "curl -f http://localhost:$PORT/health" || {
  echo "❌ Health check failed"
  echo "Container logs:"
  ssh root@$SERVER "docker logs clawer_user_$USER_ID"
  exit 1
}

echo ""
echo ""
echo "5️⃣ Sending test message..."
ssh root@$SERVER "curl -X POST http://localhost:$PORT/message \
  -H 'Content-Type: application/json' \
  -d '{\"message\": \"Hello, this is a test message. Please respond.\"}' \
  -w '\n\n'"

echo ""
echo "✅ Container test complete!"
echo ""
echo "Useful commands:"
echo "  View logs:    ssh root@$SERVER 'docker logs -f clawer_user_$USER_ID'"
echo "  Restart:      ssh root@$SERVER 'docker restart clawer_user_$USER_ID'"
echo "  Stop:         ssh root@$SERVER 'docker stop clawer_user_$USER_ID'"
echo "  Remove:       ssh root@$SERVER 'docker rm -f clawer_user_$USER_ID'"
