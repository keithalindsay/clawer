#!/bin/bash
# init_clawsec.sh - Initialize ClawSec security skills on container first boot
set -euo pipefail

WORKSPACE="${WORKSPACE_DIR:-/home/user/clawd}"
STATE_DIR="${SOUL_GUARDIAN_STATE_DIR:-/var/lib/openclaw/soul-guardian}"
FEED_URL="${CLAWSEC_FEED_URL:-https://raw.githubusercontent.com/prompt-security/clawsec/main/advisories/feed.json}"

echo "Initializing ClawSec security skills..."

# Initialize soul-guardian baselines if not already done
if [ ! -f "$STATE_DIR/baselines.json" ]; then
    echo "  → Initializing soul-guardian baselines..."
    
    # Ensure critical workspace files exist before baselining
    mkdir -p "$WORKSPACE"
    cd "$WORKSPACE"
    
    # Only initialize if SOUL.md exists (core identity file)
    if [ -f "SOUL.md" ]; then
        python3 /home/user/.openclaw/skills/soul-guardian/scripts/soul_guardian.py \
            --state-dir "$STATE_DIR" \
            init \
            --actor "container-init" \
            --note "Initial baseline on first boot" \
            2>/dev/null || echo "  ⚠ soul-guardian init skipped (workspace not ready)"
    else
        echo "  ⚠ soul-guardian init skipped (SOUL.md not found, will initialize on first use)"
    fi
else
    echo "  ✓ soul-guardian already initialized"
fi

# Pre-fetch advisory feed (so first check is fast)
if [ ! -f /home/user/.openclaw/clawsec-feed-state.json ]; then
    echo "  → Pre-fetching security advisory feed..."
    mkdir -p /home/user/.openclaw
    
    # Fetch feed with timeout and retry
    if curl -fsSL --max-time 10 --retry 2 "$FEED_URL" -o /tmp/feed.json 2>/dev/null; then
        # Extract advisory IDs and create state file
        KNOWN_IDS=$(jq -r '.advisories[].id' /tmp/feed.json 2>/dev/null | jq -Rs 'split("\n") | map(select(length > 0))' 2>/dev/null || echo '[]')
        echo "{\"schema_version\":\"1.0\",\"last_feed_check\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"known_advisories\":${KNOWN_IDS}}" \
            > /home/user/.openclaw/clawsec-feed-state.json
        rm -f /tmp/feed.json
        echo "  ✓ Advisory feed cached"
    else
        echo "  ⚠ Advisory feed fetch failed (network unavailable, will use bundled feed)"
    fi
else
    echo "  ✓ Advisory feed already cached"
fi

echo "✓ ClawSec skills initialized successfully"
