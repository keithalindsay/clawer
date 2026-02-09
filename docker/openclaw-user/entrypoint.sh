#!/bin/bash
set -e

# Create OpenClaw config directory if it doesn't exist
mkdir -p /home/user/.openclaw

# Check required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "ERROR: OPENAI_API_KEY environment variable not set"
    exit 1
fi

# Generate gateway token if not provided
if [ -z "$GATEWAY_TOKEN" ]; then
    GATEWAY_TOKEN=$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)
    echo "Generated gateway token: $GATEWAY_TOKEN"
fi

export GATEWAY_TOKEN

# Copy template and substitute placeholders
sed -e "s/OPENAI_API_KEY_PLACEHOLDER/${OPENAI_API_KEY}/g" \
    -e "s/GATEWAY_TOKEN_PLACEHOLDER/${GATEWAY_TOKEN}/g" \
    /home/user/.openclaw/openclaw.json.template \
    > /home/user/.openclaw/openclaw.json

# SECURITY: Remove sensitive env vars from process environment after config is written
# This prevents them from being visible via 'docker inspect'
unset OPENAI_API_KEY
unset GATEWAY_TOKEN

# Copy AI team template files into workspace if TEAM_TEMPLATE is set
TEAM_TEMPLATE="${TEAM_TEMPLATE:-lifeos}"
TEAM_DIR="/opt/teams/${TEAM_TEMPLATE}"
WORKSPACE="/home/user/clawd"
mkdir -p "$WORKSPACE"

if [ -d "$TEAM_DIR" ]; then
    echo "Installing team template: ${TEAM_TEMPLATE}"
    # Copy AGENTS.md (team routing rules)
    cp "$TEAM_DIR/AGENTS.md" "$WORKSPACE/AGENTS.md"
    # Copy member files if they exist
    if [ -d "$TEAM_DIR/members" ]; then
        mkdir -p "$WORKSPACE/members"
        cp -r "$TEAM_DIR/members/"* "$WORKSPACE/members/" 2>/dev/null || true
    fi
    # Copy templates if they exist
    if [ -d "$TEAM_DIR/templates" ]; then
        mkdir -p "$WORKSPACE/templates"
        cp -r "$TEAM_DIR/templates/"* "$WORKSPACE/templates/" 2>/dev/null || true
    fi
    echo "Team template installed: $(ls -la $WORKSPACE/AGENTS.md)"
else
    echo "WARNING: Team template directory not found: $TEAM_DIR"
fi

# Patch web_search to use local SearXNG proxy instead of Brave API
SEARXNG_PROXY_URL="${SEARXNG_PROXY_URL:-http://172.17.0.1:8889/res/v1/web/search}"
PATCHED=0
for f in $(grep -rl 'api.search.brave.com' /usr/local/lib/node_modules/openclaw/dist/ 2>/dev/null); do
    sed -i "s|https://api.search.brave.com/res/v1/web/search|${SEARXNG_PROXY_URL}|g" "$f"
    PATCHED=$((PATCHED + 1))
done
echo "Patched $PATCHED files to use SearXNG proxy: ${SEARXNG_PROXY_URL}"

# Set a dummy Brave API key so the tool is enabled
export BRAVE_API_KEY="${BRAVE_API_KEY:-searxng-local-proxy}"

echo "OpenClaw configuration created"

# Start API server in background (exposes REST endpoints for dashboard)
node /usr/local/bin/api-server.js &
API_PID=$!
echo "API server started (PID: $API_PID)"

# Cleanup on exit
trap "kill $API_PID 2>/dev/null" EXIT

# Start OpenClaw gateway in foreground mode (not as a systemd service)
exec openclaw gateway --port 8080
