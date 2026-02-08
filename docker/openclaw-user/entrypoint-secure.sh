#!/bin/bash
# Hardened entrypoint script for Clawer OpenClaw containers
# Runs as non-root user 'agent'

set -euo pipefail

# Ensure we're running as non-root
if [ "$(id -u)" = "0" ]; then
    echo "ERROR: Container must not run as root" >&2
    exit 1
fi

# Validate required environment variables
: "${GATEWAY_TOKEN:?ERROR: GATEWAY_TOKEN must be set}"
: "${MOONSHOT_API_KEY:?ERROR: MOONSHOT_API_KEY must be set}"

# Create config from template with injected secrets
CONFIG_TEMPLATE="/home/agent/.openclaw/openclaw.json.template"
CONFIG_FILE="/home/agent/.openclaw/openclaw.json"

if [ ! -f "$CONFIG_TEMPLATE" ]; then
    echo "ERROR: Config template not found at $CONFIG_TEMPLATE" >&2
    exit 1
fi

# Inject environment variables into config
sed -e "s/GATEWAY_TOKEN_PLACEHOLDER/${GATEWAY_TOKEN}/g" \
    -e "s/MOONSHOT_API_KEY_PLACEHOLDER/${MOONSHOT_API_KEY}/g" \
    "$CONFIG_TEMPLATE" > "$CONFIG_FILE"

# Restrict config file permissions
chmod 600 "$CONFIG_FILE"

# Create workspace structure if needed
mkdir -p /home/agent/clawd/memory
mkdir -p /tmp/openclaw

# Log startup (without secrets)
echo "[$(date -Iseconds)] Starting OpenClaw gateway (hardened mode)"
echo "[$(date -Iseconds)] User: $(whoami) (UID: $(id -u), GID: $(id -g))"
echo "[$(date -Iseconds)] Workspace: /home/agent/clawd"
echo "[$(date -Iseconds)] Security mode: strict"

# Start the OpenClaw gateway
exec openclaw gateway start --foreground
