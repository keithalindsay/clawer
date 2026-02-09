#!/bin/bash
set -e

# Template-aware entrypoint for Clawer OpenClaw images

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
unset OPENAI_API_KEY
unset GATEWAY_TOKEN

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

# === Template-specific setup ===

# If team AGENTS.md exists, make it the main agent configuration
if [ -f "/home/user/clawd/team/AGENTS.md" ]; then
    echo "Team template detected - installing team AGENTS.md as main agent config"
    cp /home/user/clawd/team/AGENTS.md /home/user/clawd/AGENTS.md
    
    # Create template-specific SOUL.md if team has one
    if [ -f "/home/user/clawd/team/SOUL.md" ]; then
        cp /home/user/clawd/team/SOUL.md /home/user/clawd/SOUL.md
    else
        # Use base SOUL with team reference
        if [ -f "/home/user/clawd/SOUL.md.base" ]; then
            cp /home/user/clawd/SOUL.md.base /home/user/clawd/SOUL.md
        fi
    fi
else
    echo "No team template found - using base configuration"
fi

# Create USER.md template if it doesn't exist
if [ ! -f "/home/user/clawd/USER.md" ]; then
    cat > /home/user/clawd/USER.md <<'EOF'
# USER.md - Who You're Helping

**Name:** [Your name]

**Role:** [Your role/profession]

**Goals:** 
- [What are you trying to achieve?]
- [What problems are you solving?]

**Preferences:**
- [Communication style]
- [Work hours/timezone]
- [Tools you use]

**Context:**
[Any relevant background information that helps your agent serve you better]

---
*Edit this file to help your agent understand you better.*
EOF
    echo "Created USER.md template"
fi

# Create WORKING.md if it doesn't exist
if [ ! -f "/home/user/clawd/WORKING.md" ]; then
    cat > /home/user/clawd/WORKING.md <<'EOF'
# WORKING.md - Current Task State

**Active Task:** None

**Status:** Idle

**Context:**
- No active work

**Next Steps:**
- Awaiting instructions

---

## Recent Sub-Agent Activity
| Spawned | Purpose | Status | Result |
|---------|---------|--------|--------|
| - | - | - | - |
EOF
    echo "Created WORKING.md template"
fi

# Create memory directory structure
mkdir -p /home/user/clawd/memory
TODAY=$(date +%Y-%m-%d)
if [ ! -f "/home/user/clawd/memory/${TODAY}.md" ]; then
    cat > "/home/user/clawd/memory/${TODAY}.md" <<EOF
# ${TODAY} - Daily Notes

## Morning
- Container started

## Tasks
- 

## Notes
- 

---
EOF
    echo "Created today's daily notes"
fi

echo "Workspace initialized for team template"

# Start API server in background (exposes REST endpoints for dashboard)
node /usr/local/bin/api-server.js &
API_PID=$!
echo "API server started (PID: $API_PID)"

# Cleanup on exit
trap "kill $API_PID 2>/dev/null" EXIT

# Start OpenClaw gateway in foreground mode (not as a systemd service)
exec openclaw gateway --port 8080
