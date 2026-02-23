#!/bin/bash
# Provision a single agent's workspace
# Called by entrypoint.sh during container startup for multi-agent teams

set -e

AGENT_ID="$1"
AGENT_NAME="$2"
AGENT_EMOJI="$3"
TEAM_TEMPLATE="$4"

if [ -z "$AGENT_ID" ] || [ -z "$AGENT_NAME" ]; then
  echo "Usage: $0 <agent_id> <agent_name> <agent_emoji> <team_template>"
  exit 1
fi

WORKSPACE="/home/user/clawd-${AGENT_ID}"
SOUL_TEMPLATE="/opt/teams/${TEAM_TEMPLATE}/agents/${AGENT_ID}-soul.md"

echo "📦 Provisioning workspace for ${AGENT_EMOJI} ${AGENT_NAME} (${AGENT_ID})"

# Create workspace directory
mkdir -p "$WORKSPACE"
mkdir -p "$WORKSPACE/memory"
mkdir -p "$WORKSPACE/files"
mkdir -p "$WORKSPACE/files/research"
mkdir -p "$WORKSPACE/files/drafts"
mkdir -p "$WORKSPACE/files/wellness"
mkdir -p "$WORKSPACE/files/goals"

# Copy SOUL.md if template exists
if [ -f "$SOUL_TEMPLATE" ]; then
  cp "$SOUL_TEMPLATE" "$WORKSPACE/SOUL.md"
  echo "  ✓ SOUL.md copied from template"
else
  # Fallback: generate basic SOUL.md
  cat > "$WORKSPACE/SOUL.md" << EOF
# ${AGENT_NAME}

${AGENT_EMOJI} **Identity:** Agent in the ${TEAM_TEMPLATE} team

## Your Role

You are **${AGENT_NAME}**.

Read your full team configuration to understand your specialty and teammates.

## Every Session

1. Read \`SOUL.md\` - your identity and role
2. Read \`USER.md\` - your human's context  
3. Read \`memory/\$(date +%Y-%m-%d).md\` - today's context

## Team Collaboration

You work alongside other team members. Use \`sessions_send\` to delegate to teammates when appropriate.

Refer to your team's delegation patterns for when to collaborate.
EOF
  echo "  ⚠ Generated fallback SOUL.md (template not found)"
fi

# Copy shared USER.md if exists
if [ -f "/home/user/clawd/USER.md" ]; then
  cp "/home/user/clawd/USER.md" "$WORKSPACE/USER.md"
  echo "  ✓ USER.md copied from main workspace"
fi

# Copy AGENTS.md template for this team
AGENTS_TEMPLATE="/opt/teams/${TEAM_TEMPLATE}/AGENTS.md"
if [ -f "$AGENTS_TEMPLATE" ]; then
  cp "$AGENTS_TEMPLATE" "$WORKSPACE/AGENTS.md"
  echo "  ✓ AGENTS.md copied from team template"
fi

# Create initial WORKING.md
cat > "$WORKSPACE/WORKING.md" << EOF
# Current Task State

**Agent:** ${AGENT_NAME} (${AGENT_ID})  
**Active Task:** None  
**Status:** Idle  

## Context
No active context.

## Next Steps
Awaiting user interaction or delegation from teammates.

## Recent Sub-Agent Activity
None.
EOF

# Create today's memory file
TODAY=$(date +%Y-%m-%d)
cat > "$WORKSPACE/memory/${TODAY}.md" << EOF
# ${TODAY} - ${AGENT_NAME}

## Session started
Container provisioned and workspace initialized.

## Notes
Ready to serve.
EOF

# Set ownership
chown -R user:user "$WORKSPACE"

echo "✅ ${AGENT_NAME} workspace ready at ${WORKSPACE}"
