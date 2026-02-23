#!/bin/bash
set -e
mkdir -p /home/user/.openclaw /home/user/clawd /home/user/clawd/files

# Check for team provisioning (Phase 1: AI Teams Native Agents)
if [ -f /home/user/clawd/.team-config ]; then
  echo "📋 Team configuration detected"
  
  # Read team config
  TEAM_TEMPLATE=$(cat /home/user/clawd/.team-config | jq -r '.template // "lifeos"')
  DEFAULT_AGENT=$(cat /home/user/clawd/.team-config | jq -r '.defaultAgent // "main"')
  
  echo "   Template: $TEAM_TEMPLATE"
  echo "   Default agent: $DEFAULT_AGENT"
  
  # Set agent workspace
  export OPENCLAW_AGENT_ID="$DEFAULT_AGENT"
  export OPENCLAW_WORKSPACE="/home/user/clawd/workspace-${DEFAULT_AGENT}"
  
  echo "   Workspace: $OPENCLAW_WORKSPACE"
else
  echo "📋 Legacy single-agent mode (no team config)"
  # Legacy mode: use main workspace
  export OPENCLAW_WORKSPACE="/home/user/clawd"
  export OPENCLAW_AGENT_ID="main"
fi

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
  PROVIDERS="${PROVIDERS}\"gemini\":{\"baseUrl\":\"https://generativelanguage.googleapis.com/v1beta\",\"apiKey\":\"${GEMINI_KEY}\",\"api\":\"google-generative-ai\",\"models\":[{\"id\":\"gemini-2.5-flash\",\"name\":\"Gemini 2.5 Flash\",\"reasoning\":false,\"input\":[\"text\",\"image\"],\"cost\":{\"input\":0.1,\"output\":0.4},\"contextWindow\":1000000,\"maxTokens\":8192}]}"
  [ -z "$PRIMARY" ] && PRIMARY="gemini/gemini-2.5-flash"
fi

if [ -z "$PRIMARY" ]; then
  echo "ERROR: Need at least one of: MINIMAX_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY"
  exit 1
fi

# Override primary model if explicitly set
[ -n "$PRIMARY_MODEL" ] && PRIMARY="$PRIMARY_MODEL"

# Ollama provider
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://ollama:11434}"
HEARTBEAT_MODEL="${HEARTBEAT_MODEL:-ollama/qwen2.5:3b}"

OLLAMA_PROVIDER="\"ollama\":{\"baseUrl\":\"${OLLAMA_BASE_URL}\",\"api\":\"ollama\",\"models\":[{\"id\":\"qwen2.5:3b\",\"name\":\"Qwen2.5 3B (local)\",\"reasoning\":false,\"input\":[\"text\"],\"cost\":{\"input\":0,\"output\":0},\"contextWindow\":32768,\"maxTokens\":4096}]}"
[ -n "$PROVIDERS" ] && PROVIDERS="${PROVIDERS},"
PROVIDERS="${PROVIDERS}${OLLAMA_PROVIDER}"

# Memory search config
MEMORY_SEARCH_CONFIG=""
if [ -n "$OPENAI_KEY" ]; then
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"openai\",\"remote\":{\"apiKey\":\"${OPENAI_KEY}\"}}"
  echo "Memory search configured with provider: openai"
elif [ -n "$GEMINI_KEY" ]; then
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"gemini\",\"remote\":{\"apiKey\":\"${GEMINI_KEY}\"}}"
  echo "Memory search configured with provider: gemini"
elif [ -n "$OLLAMA_BASE_URL" ]; then
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"openai\",\"model\":\"nomic-embed-text\",\"remote\":{\"baseUrl\":\"${OLLAMA_BASE_URL}/v1\",\"apiKey\":\"not-needed\"}}"
  echo "Memory search configured with provider: ollama (via OpenAI-compatible API)"
else
  echo "WARNING: No embedding provider available — memory_search will be disabled"
fi

# Generate config file WITHOUT channels section (FIX for v2026.2.22)
cat > /home/user/.openclaw/openclaw.json << EOF
{
  "models": {"providers": {${PROVIDERS}}},
  "agents": {"defaults": {"model": {"primary": "${PRIMARY}", "fallbacks": [${FALLBACKS}]}, "workspace": "/home/user/clawd", "contextPruning": {"mode": "cache-ttl", "ttl": "6h", "keepLastAssistants": 5}, "compaction": {"mode": "default", "maxHistoryShare": 0.1, "reserveTokensFloor": 20000, "memoryFlush": {"enabled": true, "softThresholdTokens": 40000}}${MEMORY_SEARCH_CONFIG}}},
  "gateway": {"port": 8080, "mode": "local", "auth": {"token": "${GATEWAY_TOKEN}"}},
  "tools": {"exec": {"security": "full", "ask": "off"}, "web": {"search": {"enabled": true, "apiKey": "searxng-local-proxy"}, "fetch": {"enabled": true}}}
}
EOF

echo "OpenClaw config created. Primary model: ${PRIMARY}"

# Clear sensitive env vars
unset OPENAI_API_KEY GEMINI_API_KEY MINIMAX_API_KEY

# Install default workspace files
DEFAULTS_DIR="/opt/defaults"
if [ -d "$DEFAULTS_DIR" ]; then
  for f in "$DEFAULTS_DIR"/*; do
    fname=$(basename "$f")
    dest="/home/user/clawd/$fname"
    if [ ! -f "$dest" ]; then
      cp "$f" "$dest" && echo "Installed default: $fname"
    fi
  done
  # PLATFORM.md is always installed (even if exists) to ensure updates
  if [ -f "$DEFAULTS_DIR/PLATFORM.md" ]; then
    cp "$DEFAULTS_DIR/PLATFORM.md" "/home/user/clawd/PLATFORM.md"
    echo "Installed platform docs: PLATFORM.md"
  fi
fi

# Install team template
TEAM_TEMPLATE="${TEAM_TEMPLATE:-lifeos}"
TEAM_DIR="/opt/clawer-docker/teams/${TEAM_TEMPLATE}"
mkdir -p /home/user/clawd/team
if [ -d "$TEAM_DIR" ] && [ ! -f /home/user/clawd/team/AGENTS.md ]; then
  cp "$TEAM_DIR/AGENTS.md" /home/user/clawd/team/AGENTS.md 2>/dev/null && echo "Team template installed to team/AGENTS.md: ${TEAM_TEMPLATE}"
else
  echo "team/AGENTS.md already exists, skipping template install"
fi

mkdir -p /home/user/clawd/memory

# Brave search URL patching moved to Dockerfile build time (for read-only filesystem)
export BRAVE_API_KEY="${BRAVE_API_KEY:-searxng-local-proxy}"

# Initialize ClawSec
[ -x /usr/local/bin/init_clawsec.sh ] && /usr/local/bin/init_clawsec.sh

# Start API server
node /usr/local/bin/api-server.js &
API_PID=$!
trap "kill $API_PID 2>/dev/null" EXIT

# Start gateway (foreground mode for containers)
exec openclaw gateway run
