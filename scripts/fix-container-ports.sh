#!/bin/bash
# Fix container ports - bind to localhost only for security
# This script recreates all running clawer_user containers with localhost-only port bindings

set -e

echo "🔒 Fixing container port bindings to localhost only..."
echo ""

# Get all clawer_user containers
containers=$(docker ps -a --filter "name=clawer_user_" --format "{{.Names}}")

if [ -z "$containers" ]; then
  echo "No clawer_user containers found."
  exit 0
fi

echo "Found containers:"
echo "$containers"
echo ""

for container in $containers; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Processing: $container"
  echo ""
  
  # Get container details
  inspect=$(docker inspect "$container" 2>/dev/null || true)
  
  if [ -z "$inspect" ]; then
    echo "⚠️  Container not found, skipping"
    continue
  fi
  
  # Extract current ports (format: host:container)
  gateway_port=$(echo "$inspect" | jq -r '.[0].HostConfig.PortBindings["8080/tcp"][0].HostPort // empty')
  api_port=$(echo "$inspect" | jq -r '.[0].HostConfig.PortBindings["8081/tcp"][0].HostPort // empty')
  
  if [ -z "$gateway_port" ] || [ -z "$api_port" ]; then
    echo "⚠️  Could not determine ports, skipping"
    continue
  fi
  
  echo "Current ports: gateway=$gateway_port, api=$api_port"
  
  # Check if already bound to localhost
  current_bind=$(echo "$inspect" | jq -r '.[0].HostConfig.PortBindings["8080/tcp"][0].HostIp // "0.0.0.0"')
  
  if [ "$current_bind" = "127.0.0.1" ]; then
    echo "✅ Already bound to localhost, skipping"
    continue
  fi
  
  # Extract environment variables
  env_vars=$(echo "$inspect" | jq -r '.[0].Config.Env[] | select(. != null)' | while read -r line; do echo "-e $line"; done | tr '\n' ' ')
  
  # Extract volume mounts
  volumes=$(echo "$inspect" | jq -r '.[0].HostConfig.Binds[]? // empty' | while read -r line; do echo "-v $line"; done | tr '\n' ' ')
  
  # Get image
  image=$(echo "$inspect" | jq -r '.[0].Config.Image')
  
  echo "Environment vars: ${env_vars:0:100}..."
  echo "Volumes: ${volumes:0:100}..."
  echo "Image: $image"
  echo ""
  
  # Stop and remove old container
  echo "🛑 Stopping old container..."
  docker stop "$container" 2>/dev/null || true
  
  echo "🗑️  Removing old container..."
  docker rm "$container" 2>/dev/null || true
  
  # Recreate with localhost-only ports
  echo "🚀 Creating new container with localhost-only ports..."
  docker run -d \
    --name "$container" \
    --memory=1g \
    --cpus=1 \
    -p "127.0.0.1:${gateway_port}:8080" \
    -p "127.0.0.1:${api_port}:8081" \
    $env_vars \
    $volumes \
    --restart=unless-stopped \
    "$image"
  
  echo "✅ Container recreated successfully"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All containers fixed!"
echo ""
echo "Verifying port bindings..."
docker ps --filter "name=clawer_user_" --format "table {{.Names}}\t{{.Ports}}"
echo ""
echo "🔒 All container ports now bound to localhost only (127.0.0.1)"
echo "   Containers are no longer accessible from the internet."
