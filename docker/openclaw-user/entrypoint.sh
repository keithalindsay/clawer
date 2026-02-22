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

# ─── Shared Services (Ollama) ──────────────────────────────────────────────
# Ollama runs as a shared container accessible via Docker DNS on clawer_shared network
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://ollama:11434}"
HEARTBEAT_MODEL="${HEARTBEAT_MODEL:-ollama/qwen2.5:3b}"

# Add Ollama as a provider for heartbeats and local inference
OLLAMA_PROVIDER="\"ollama\":{\"baseUrl\":\"${OLLAMA_BASE_URL}\",\"api\":\"ollama\",\"models\":[{\"id\":\"qwen2.5:3b\",\"name\":\"Qwen2.5 3B (local)\",\"reasoning\":false,\"input\":[\"text\"],\"cost\":{\"input\":0,\"output\":0},\"contextWindow\":32768,\"maxTokens\":4096}]}"
[ -n "$PROVIDERS" ] && PROVIDERS="${PROVIDERS},"
PROVIDERS="${PROVIDERS}${OLLAMA_PROVIDER}"

# ─── Memory search config (embeddings) ────────────────────────────────────
# Priority: OpenAI (best quality) > Gemini > Ollama local (free) > disabled
# Must be built before env vars are cleared
MEMORY_SEARCH_CONFIG=""
if [ -n "$OPENAI_KEY" ]; then
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"openai\",\"remote\":{\"apiKey\":\"${OPENAI_KEY}\"}}"
  echo "Memory search configured with provider: openai"
elif [ -n "$GEMINI_KEY" ]; then
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"gemini\",\"remote\":{\"apiKey\":\"${GEMINI_KEY}\"}}"
  echo "Memory search configured with provider: gemini"
elif [ -n "$OLLAMA_BASE_URL" ]; then
  # Use Ollama nomic-embed-text via OpenAI-compatible API
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"openai\",\"model\":\"nomic-embed-text\",\"remote\":{\"baseUrl\":\"${OLLAMA_BASE_URL}/v1\",\"apiKey\":\"not-needed\"}}"
  echo "Memory search configured with provider: ollama (via OpenAI-compatible API)"
else
  echo "WARNING: No embedding provider available — memory_search will be disabled"
fi

# Generate config file
cat > /home/user/.openclaw/openclaw.json << EOF
{
  "models": {"providers": {${PROVIDERS}}},
  "agents": {"defaults": {"model": {"primary": "${PRIMARY}", "fallbacks": [${FALLBACKS}]}, "workspace": "/home/user/clawd", "compaction": {"mode": "default", "maxHistoryShare": 0.1, "memoryFlush": {"enabled": true}}${MEMORY_SEARCH_CONFIG}}},
  "gateway": {"port": 8080, "mode": "local", "auth": {"token": "${GATEWAY_TOKEN}"}},
  "plugins": {"entries": {"whatsapp": {"enabled": true}, "telegram": {"enabled": true}}},
  "tools": {"web": {"search": {"enabled": true, "apiKey": "searxng-local-proxy"}, "fetch": {"enabled": true}}},
  "channels": {"whatsapp": {"dmPolicy": "open", "allowFrom": ["*"], "dmScope": "per-channel-peer"}, "telegram": {"dmPolicy": "open", "allowFrom": ["*"], "dmScope": "per-channel-peer"}},
  "dmScope": "per-channel-peer"
}
EOF

echo "OpenClaw config created. Primary model: ${PRIMARY}"

# Clear sensitive env vars
unset OPENAI_API_KEY GEMINI_API_KEY MINIMAX_API_KEY

# Install default workspace files (copy-on-missing — never overwrites existing user files)
# Runs every boot; safe because we check before copying each file.
# AGENTS.md is now installed from defaults (stock OpenClaw instructions with memory management).
# BRAIN.md is installed from defaults (active state dashboard — agent reads every session).
# Team-specific content goes in team/AGENTS.md — see below.
DEFAULTS_DIR="/opt/defaults"
if [ -d "$DEFAULTS_DIR" ]; then
  for f in "$DEFAULTS_DIR"/*; do
    fname=$(basename "$f")
    dest="/home/user/clawd/$fname"
    if [ ! -f "$dest" ]; then
      cp "$f" "$dest" && echo "Installed default: $fname"
    fi
  done
fi

# Install team-specific content to team/AGENTS.md (NOT the root AGENTS.md)
# Root AGENTS.md stays as stock OpenClaw with memory/session instructions.
# The stock AGENTS.md references team/AGENTS.md automatically.
TEAM_TEMPLATE="${TEAM_TEMPLATE:-lifeos}"
TEAM_DIR="/opt/clawer-docker/teams/${TEAM_TEMPLATE}"
mkdir -p /home/user/clawd/team
if [ -d "$TEAM_DIR" ] && [ ! -f /home/user/clawd/team/AGENTS.md ]; then
  cp "$TEAM_DIR/AGENTS.md" /home/user/clawd/team/AGENTS.md 2>/dev/null && echo "Team template installed to team/AGENTS.md: ${TEAM_TEMPLATE}"
else
  echo "team/AGENTS.md already exists, skipping template install"
fi

# Ensure memory directory exists
mkdir -p /home/user/clawd/memory

# Patch Brave search URL to use local SearXNG proxy
# Default uses Docker DNS name (works when container is on clawer_shared network)
# Override with SEARXNG_PROXY_URL env var for containers not on the shared network
SEARXNG_PROXY_URL="${SEARXNG_PROXY_URL:-http://searxng-proxy:8889/res/v1/web/search}"
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
