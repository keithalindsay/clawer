#!/bin/bash
set -e
mkdir -p /home/user/.openclaw /home/user/clawd

# Generate gateway token if not provided
[ -z "$GATEWAY_TOKEN" ] && GATEWAY_TOKEN=$(head -c 32 /dev/urandom | base64 | tr -d "/+=" | head -c 32)
export GATEWAY_TOKEN

MINIMAX_KEY="${MINIMAX_API_KEY:-}"
OPENAI_KEY="${OPENAI_API_KEY:-}"
GEMINI_KEY="${GEMINI_API_KEY:-}"

# Build providers JSON
PROVIDERS=""
PRIMARY=""
FALLBACKS=""

# MiniMax provider (via Anthropic-compatible API)
if [ -n "$MINIMAX_KEY" ]; then
  PROVIDERS="\"minimax\":{\"baseUrl\":\"https://api.minimax.io/anthropic\",\"api\":\"anthropic-messages\",\"apiKey\":\"${MINIMAX_KEY}\",\"models\":[{\"id\":\"MiniMax-M2.5\",\"name\":\"MiniMax M2.5\",\"reasoning\":false,\"input\":[\"text\"],\"cost\":{\"input\":0.3,\"output\":2.4},\"contextWindow\":1048576,\"maxTokens\":16384}]}"
  PRIMARY="minimax/MiniMax-M2.5"
fi

# OpenAI provider
if [ -n "$OPENAI_KEY" ]; then
  [ -n "$PROVIDERS" ] && PROVIDERS="${PROVIDERS},"
  PROVIDERS="${PROVIDERS}\"openai\":{\"baseUrl\":\"https://api.openai.com/v1\",\"apiKey\":\"${OPENAI_KEY}\",\"models\":[{\"id\":\"gpt-4o-mini\",\"name\":\"GPT-4o Mini\",\"reasoning\":false,\"input\":[\"text\",\"image\"],\"cost\":{\"input\":0.15,\"output\":0.6},\"contextWindow\":128000,\"maxTokens\":16384}]}"
  [ -z "$PRIMARY" ] && PRIMARY="openai/gpt-4o-mini"
  [ -n "$MINIMAX_KEY" ] && FALLBACKS="\"openai/gpt-4o-mini\""
fi

# Gemini provider
if [ -n "$GEMINI_KEY" ]; then
  [ -n "$PROVIDERS" ] && PROVIDERS="${PROVIDERS},"
  PROVIDERS="${PROVIDERS}\"gemini\":{\"baseUrl\":\"https://generativelanguage.googleapis.com/v1beta\",\"apiKey\":\"${GEMINI_KEY}\",\"models\":[{\"id\":\"gemini-2.0-flash\",\"name\":\"Gemini 2.0 Flash\",\"reasoning\":false,\"input\":[\"text\",\"image\"],\"cost\":{\"input\":0.1,\"output\":0.4},\"contextWindow\":1000000,\"maxTokens\":8192}]}"
  [ -z "$PRIMARY" ] && PRIMARY="gemini/gemini-2.0-flash"
fi

if [ -z "$PRIMARY" ]; then
  echo "ERROR: Need at least one of: MINIMAX_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY"
  exit 1
fi

# Override primary model if explicitly set
[ -n "$PRIMARY_MODEL" ] && PRIMARY="$PRIMARY_MODEL"

# Generate config file
cat > /home/user/.openclaw/openclaw.json << EOF
{
  "models": {"providers": {${PROVIDERS}}},
  "agents": {"defaults": {"model": {"primary": "${PRIMARY}", "fallbacks": [${FALLBACKS}]}, "workspace": "/home/user/clawd"}},
  "gateway": {"port": 8080, "mode": "local", "auth": {"token": "${GATEWAY_TOKEN}"}, "controlUi": {"allowInsecureAuth": true, "dangerouslyDisableDeviceAuth": true}},
  "plugins": {"entries": {"whatsapp": {"enabled": true}, "telegram": {"enabled": true}}},
  "tools": {"web": {"search": {"enabled": true, "apiKey": "searxng-local-proxy"}, "fetch": {"enabled": true}}},
  "channels": {"whatsapp": {"dmPolicy": "open", "allowFrom": ["*"]}}
}
EOF

echo "OpenClaw config created. Primary model: ${PRIMARY}"

# Clear sensitive env vars
unset OPENAI_API_KEY GEMINI_API_KEY MINIMAX_API_KEY

# Install team template
TEAM_TEMPLATE="${TEAM_TEMPLATE:-lifeos}"
TEAM_DIR="/opt/teams/${TEAM_TEMPLATE}"
[ -d "$TEAM_DIR" ] && cp "$TEAM_DIR/AGENTS.md" /home/user/clawd/AGENTS.md 2>/dev/null && echo "Team template installed: ${TEAM_TEMPLATE}"

# Patch Brave search URL to use local SearXNG proxy
SEARXNG_PROXY_URL="${SEARXNG_PROXY_URL:-http://172.17.0.1:8889/res/v1/web/search}"
for f in $(grep -rl "api.search.brave.com" /usr/local/lib/node_modules/openclaw/dist/ 2>/dev/null); do
    sed -i "s|https://api.search.brave.com/res/v1/web/search|${SEARXNG_PROXY_URL}|g" "$f"
done
export BRAVE_API_KEY="${BRAVE_API_KEY:-searxng-local-proxy}"

# Initialize ClawSec skills if available
[ -x /usr/local/bin/init_clawsec.sh ] && /usr/local/bin/init_clawsec.sh

# Start API server in background
node /usr/local/bin/api-server.js &
API_PID=$!
trap "kill $API_PID 2>/dev/null" EXIT

# Start gateway (foreground)
exec openclaw gateway
