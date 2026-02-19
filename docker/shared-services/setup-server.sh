#!/bin/bash
# ============================================================================
# setup-server.sh — Deploy shared services on Clawer.ai production server
# ============================================================================
# Run this from your local machine:
#   bash /home/keith/projects/clawer/docker/shared-services/setup-server.sh
#
# Or upload to server and run directly.
# ============================================================================

set -e

SERVER="root@YOUR_DOCKER_HOST"
REMOTE_DIR="/opt/clawer-shared"

echo "🚀 Deploying Clawer.ai shared services..."
echo ""

# ─── Step 1: Add swap (CRITICAL — do before Ollama) ──────────────────────────
echo "📦 Step 1: Configuring swap on HC Volume..."
ssh "$SERVER" bash << 'SWAP_SCRIPT'
  SWAP_FILE="/mnt/HC_Volume_104591317/swapfile"
  if swapon --show | grep -q "$SWAP_FILE"; then
    echo "  ✅ Swap already configured"
  else
    echo "  Creating 4GB swap file on HC Volume..."
    fallocate -l 4G "$SWAP_FILE"
    chmod 600 "$SWAP_FILE"
    mkswap "$SWAP_FILE"
    swapon "$SWAP_FILE"
    # Make persistent across reboots
    if ! grep -q "$SWAP_FILE" /etc/fstab; then
      echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
    fi
    echo "  ✅ 4GB swap configured"
  fi
  free -h | grep Swap
SWAP_SCRIPT

echo ""

# ─── Step 2: Create clawer_shared Docker network ─────────────────────────────
echo "🌐 Step 2: Creating clawer_shared Docker network..."
ssh "$SERVER" bash << 'NET_SCRIPT'
  if docker network ls | grep -q "clawer_shared"; then
    echo "  ✅ clawer_shared network already exists"
  else
    docker network create \
      --driver bridge \
      --subnet 172.20.0.0/16 \
      --label com.clawer.purpose=shared-services \
      clawer_shared
    echo "  ✅ clawer_shared network created"
  fi
NET_SCRIPT

echo ""

# ─── Step 3: Upload compose files ─────────────────────────────────────────────
echo "📁 Step 3: Uploading compose files to server..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR"
scp "$(dirname "$0")/docker-compose.yml" "$SERVER:$REMOTE_DIR/docker-compose.yml"
scp "$(dirname "$0")/proxy.js" "$SERVER:$REMOTE_DIR/proxy.js"
echo "  ✅ Files uploaded to $REMOTE_DIR"

echo ""

# ─── Step 4: Connect existing SearXNG to shared network ──────────────────────
echo "🔗 Step 4: Connecting existing SearXNG to clawer_shared..."
ssh "$SERVER" bash << 'SEARXNG_SCRIPT'
  if docker network inspect clawer_shared 2>/dev/null | grep -q '"searxng"'; then
    echo "  ✅ SearXNG already on clawer_shared"
  else
    docker network connect clawer_shared searxng && echo "  ✅ SearXNG connected to clawer_shared"
  fi
SEARXNG_SCRIPT

echo ""

# ─── Step 5: Start searxng-proxy via compose ─────────────────────────────────
echo "🔄 Step 5: Starting searxng-proxy container (replacing bare node process)..."
ssh "$SERVER" bash << 'PROXY_SCRIPT'
  cd /opt/clawer-shared
  
  # Start just the proxy for now (not searxng again, it's already running)
  docker compose up -d searxng-proxy
  
  # Give it a moment to start
  sleep 3
  
  # Kill the old bare node process
  OLD_PID=$(pgrep -f "node /opt/searxng-proxy.js" 2>/dev/null || true)
  if [ -n "$OLD_PID" ]; then
    kill "$OLD_PID"
    echo "  ✅ Killed old bare node process (PID $OLD_PID)"
  else
    echo "  ℹ️  No old proxy process to kill"
  fi
  
  # Verify proxy is healthy
  sleep 2
  if curl -sf http://localhost:8889/health > /dev/null; then
    echo "  ✅ searxng-proxy is healthy"
  else
    echo "  ⚠️  searxng-proxy health check failed — check logs:"
    docker logs searxng-proxy --tail 20
  fi
PROXY_SCRIPT

echo ""

# ─── Step 6: Start Ollama ─────────────────────────────────────────────────────
echo "🤖 Step 6: Starting Ollama..."
ssh "$SERVER" bash << 'OLLAMA_SCRIPT'
  cd /opt/clawer-shared
  docker compose up -d ollama
  
  echo "  ⏳ Waiting for Ollama to start..."
  sleep 10
  
  if curl -sf http://localhost:11434/api/version > /dev/null; then
    echo "  ✅ Ollama is running"
  else
    echo "  ⚠️  Ollama not ready yet — may still be starting"
  fi
OLLAMA_SCRIPT

echo ""

# ─── Step 7: Pull models ──────────────────────────────────────────────────────
echo "📥 Step 7: Pulling Ollama models (this takes a while — ~2GB download)..."
ssh "$SERVER" bash << 'MODEL_SCRIPT'
  echo "  Pulling qwen2.5:3b for heartbeats..."
  docker exec ollama ollama pull qwen2.5:3b
  
  echo "  Pulling nomic-embed-text for embeddings..."
  docker exec ollama ollama pull nomic-embed-text
  
  echo "  ✅ Models downloaded"
  docker exec ollama ollama list
MODEL_SCRIPT

echo ""

# ─── Step 8: Connect existing user containers ─────────────────────────────────
echo "🔗 Step 8: Connecting existing user containers to clawer_shared..."
ssh "$SERVER" bash << 'CONNECT_SCRIPT'
  for container in $(docker ps --filter "name=clawer_" --format "{{.Names}}"); do
    if docker network inspect clawer_shared 2>/dev/null | grep -q "\"$container\""; then
      echo "  ✅ Already connected: $container"
    else
      docker network connect clawer_shared "$container" && echo "  ✅ Connected: $container"
    fi
  done
CONNECT_SCRIPT

echo ""

# ─── Step 9: Restart user containers to pick up new config ───────────────────
echo "🔄 Step 9: Restarting user containers to regen openclaw.json..."
echo "  (This requires the updated image with new entrypoint.sh defaults)"
echo "  Skipping restart for now — run manually after updating the image:"
echo ""
echo "    ssh $SERVER"
echo "    docker restart clawer_free_tier"
echo "    docker restart clawer_user_39PgWfJYYrb2T36BqfnRgtwlsfM"
echo "    docker restart clawer_user_user_39oXEIzIlIMnVYEMXqfCHxypJWx"

echo ""

# ─── Verification ─────────────────────────────────────────────────────────────
echo "✅ Setup complete! Verifying from inside a user container..."
ssh "$SERVER" bash << 'VERIFY_SCRIPT'
  CONTAINER=$(docker ps --filter "name=clawer_free_tier" --format "{{.Names}}" | head -1)
  if [ -z "$CONTAINER" ]; then
    CONTAINER=$(docker ps --filter "name=clawer_" --format "{{.Names}}" | head -1)
  fi
  
  if [ -z "$CONTAINER" ]; then
    echo "  ⚠️  No user container running to test from"
    exit 0
  fi
  
  echo "  Testing from container: $CONTAINER"
  
  echo "  → SearXNG proxy:"
  docker exec "$CONTAINER" sh -c 'curl -sf http://searxng-proxy:8889/health 2>/dev/null && echo "    ✅ OK" || echo "    ❌ FAILED"'
  
  echo "  → Ollama API:"
  docker exec "$CONTAINER" sh -c 'curl -sf http://ollama:11434/api/version 2>/dev/null && echo "    ✅ OK" || echo "    ❌ FAILED"'
VERIFY_SCRIPT

echo ""
echo "🎉 Shared services deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Update entrypoint.sh with changes from entrypoint-patch.md"
echo "  2. Build new container image"  
echo "  3. Rolling restart of user containers"
echo "  4. Monitor with: ssh $SERVER docker stats"
