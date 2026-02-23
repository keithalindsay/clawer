#!/bin/bash
# Enhanced entrypoint for multi-agent team support
# Provisions all team agents during container startup

set -e

echo "🚀 OpenClaw Container Starting (Multi-Agent Team Support)"

# Environment variables from docker run
USER_ID="${USER_ID:-unknown}"
TEAM_TEMPLATE="${TEAM_TEMPLATE:-lifeos}"

echo "   User ID: ${USER_ID}"
echo "   Team Template: ${TEAM_TEMPLATE}"

# Check if team configuration exists
TEAM_CONFIG="/opt/teams/${TEAM_TEMPLATE}/team-config.json"
OPENCLAW_CONFIG_TEMPLATE="/opt/teams/${TEAM_TEMPLATE}/openclaw-config.json"

if [ ! -f "$TEAM_CONFIG" ]; then
  echo "⚠️  Team config not found for '${TEAM_TEMPLATE}', falling back to single-agent mode"
  export OPENCLAW_WORKSPACE=/home/user/clawd
  export OPENCLAW_AGENT_ID=main
else
  echo "📋 Team configuration detected"

  # Create team marker file
  cat > /home/user/clawd/.team-config << EOF
{
  "template": "${TEAM_TEMPLATE}",
  "provisionedAt": "$(date -Iseconds)"
}
EOF

  # Parse team config and provision all agents
  echo "📦 Provisioning team agents..."

  # Read agents from team config
  AGENT_IDS=$(jq -r '.members[].id' "$TEAM_CONFIG")

  for AGENT_ID in $AGENT_IDS; do
    AGENT_NAME=$(jq -r ".members[] | select(.id==\"${AGENT_ID}\") | .name" "$TEAM_CONFIG")
    AGENT_EMOJI=$(jq -r ".members[] | select(.id==\"${AGENT_ID}\") | .emoji" "$TEAM_CONFIG")

    # Provision this agent's workspace
    /opt/scripts/provision-agent-workspace.sh "$AGENT_ID" "$AGENT_NAME" "$AGENT_EMOJI" "$TEAM_TEMPLATE"
  done

  echo "✅ All agents provisioned"

  # Copy openclaw config template if exists
  if [ -f "$OPENCLAW_CONFIG_TEMPLATE" ]; then
    mkdir -p /root/.openclaw
    cp "$OPENCLAW_CONFIG_TEMPLATE" /root/.openclaw/openclaw.json
    echo "✅ OpenClaw multi-agent config installed"

    # Set environment for OpenClaw to use this config
    export OPENCLAW_CONFIG_PATH="/root/.openclaw/openclaw.json"
  else
    echo "⚠️  OpenClaw config template not found, using defaults"
  fi

  # Default workspace points to chief-of-staff (or first agent)
  DEFAULT_AGENT=$(jq -r '.members[0].id' "$TEAM_CONFIG")
  export OPENCLAW_WORKSPACE="/home/user/clawd-${DEFAULT_AGENT}"
  export OPENCLAW_AGENT_ID="${DEFAULT_AGENT}"
  
  echo "   Default agent: ${DEFAULT_AGENT}"
  echo "   Default workspace: ${OPENCLAW_WORKSPACE}"
fi

# Ensure API keys are set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "⚠️  OPENAI_API_KEY not set"
fi

if [ -z "$GATEWAY_TOKEN" ]; then
  echo "⚠️  GATEWAY_TOKEN not set"
fi

# Start OpenClaw Gateway
echo "🌐 Starting OpenClaw Gateway..."

# Gateway will read config from OPENCLAW_CONFIG_PATH if set
openclaw gateway start

echo "✅ Container ready"
echo ""
echo "📋 Team: ${TEAM_TEMPLATE}"
if [ -f "$TEAM_CONFIG" ]; then
  echo "👥 Agents:"
  jq -r '.members[] | "   \(.emoji) \(.name) (\(.id))"' "$TEAM_CONFIG"
fi
echo ""

# Keep container running
tail -f /dev/null
