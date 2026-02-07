#!/bin/bash
set -e

# Create OpenClaw config directory if it doesn't exist
mkdir -p /home/user/.openclaw

# Check required environment variables
if [ -z "$MOONSHOT_API_KEY" ]; then
    echo "ERROR: MOONSHOT_API_KEY environment variable not set"
    exit 1
fi

# Generate gateway token if not provided
if [ -z "$GATEWAY_TOKEN" ]; then
    GATEWAY_TOKEN=$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)
    echo "Generated gateway token: $GATEWAY_TOKEN"
fi

# Copy template and substitute placeholders
sed -e "s/MOONSHOT_API_KEY_PLACEHOLDER/${MOONSHOT_API_KEY}/g" \
    -e "s/GATEWAY_TOKEN_PLACEHOLDER/${GATEWAY_TOKEN}/g" \
    /home/user/.openclaw/openclaw.json.template \
    > /home/user/.openclaw/openclaw.json

echo "OpenClaw configuration created"

# Start OpenClaw gateway in foreground mode (not as a systemd service)
exec openclaw gateway --port 8080
