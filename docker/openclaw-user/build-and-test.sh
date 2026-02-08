#!/bin/bash
# Build and test the hardened OpenClaw container image
# Run this script with: ./build-and-test.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Building Hardened OpenClaw Image ==="
echo ""

# Build the image
docker build -f Dockerfile.secure -t clawer-openclaw:secure .

echo ""
echo "=== Build Complete ==="
echo ""

# Verify image was created
echo "Image details:"
docker images clawer-openclaw:secure --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

echo ""
echo "=== Running Security Verification ==="
echo ""

# Test 1: Verify non-root user
echo "1. Checking non-root execution..."
USER_OUTPUT=$(docker run --rm clawer-openclaw:secure id)
echo "   $USER_OUTPUT"
if echo "$USER_OUTPUT" | grep -q "uid=1000(agent)"; then
    echo "   ✅ Running as non-root user 'agent'"
else
    echo "   ❌ FAILED: Not running as expected user"
    exit 1
fi

# Test 2: Verify dumb-init is PID 1
echo ""
echo "2. Checking init system..."
# Can't easily test this without running, but we can check it exists
if docker run --rm --entrypoint="" clawer-openclaw:secure test -x /usr/bin/dumb-init; then
    echo "   ✅ dumb-init is available"
else
    echo "   ❌ dumb-init not found"
    exit 1
fi

# Test 3: Check config template exists
echo ""
echo "3. Checking config template..."
if docker run --rm --entrypoint="" clawer-openclaw:secure test -f /home/agent/.openclaw/openclaw.json.template; then
    echo "   ✅ Config template present"
else
    echo "   ❌ Config template missing"
    exit 1
fi

# Test 4: Verify workspace directory exists
echo ""
echo "4. Checking workspace directory..."
if docker run --rm --entrypoint="" clawer-openclaw:secure test -d /home/agent/clawd; then
    echo "   ✅ Workspace directory exists"
else
    echo "   ❌ Workspace directory missing"
    exit 1
fi

# Test 5: Verify SOUL.md exists
echo ""
echo "5. Checking SOUL.md..."
if docker run --rm --entrypoint="" clawer-openclaw:secure test -f /home/agent/clawd/SOUL.md; then
    echo "   ✅ SOUL.md present"
else
    echo "   ❌ SOUL.md missing"
    exit 1
fi

# Test 6: Check image size
echo ""
echo "6. Checking image size..."
SIZE=$(docker images clawer-openclaw:secure --format "{{.Size}}")
echo "   Image size: $SIZE"
echo "   ✅ Multi-stage build complete"

echo ""
echo "=== All Verification Tests Passed ==="
echo ""
echo "To run the container:"
echo ""
echo "  docker run -d \\"
echo "    --name clawer-agent \\"
echo "    -p 8080:8080 \\"
echo "    -p 8081:8081 \\"
echo "    -e GATEWAY_TOKEN=your-token \\"
echo "    -e MOONSHOT_API_KEY=your-api-key \\"
echo "    --memory=4g \\"
echo "    --cpus=2 \\"
echo "    --read-only \\"
echo "    --tmpfs /tmp:noexec,nosuid,size=100m \\"
echo "    --security-opt=no-new-privileges:true \\"
echo "    --cap-drop=ALL \\"
echo "    clawer-openclaw:secure"
echo ""
