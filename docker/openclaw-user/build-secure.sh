#!/bin/bash
# Build script for hardened OpenClaw container
# Run this with Docker permissions (user in docker group or with sudo)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🔒 Building hardened OpenClaw container..."
echo ""
echo "Required files:"
echo "  ✓ Dockerfile.secure"
echo "  ✓ config-template.secure.json"
echo "  ✓ openclaw-2026.2.1.tgz"
echo "  ✓ SOUL.md"
echo "  ✓ api-server.js"
echo "  ✓ entrypoint.sh"
echo ""

# Check required files
REQUIRED_FILES=(
    "Dockerfile.secure"
    "config-template.secure.json"
    "openclaw-2026.2.1.tgz"
    "SOUL.md"
    "api-server.js"
    "entrypoint.sh"
)

MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        MISSING=1
    fi
done

if [ $MISSING -eq 1 ]; then
    echo ""
    echo "❌ Missing required files. Cannot build."
    exit 1
fi

echo "✅ All required files present"
echo ""

# Build
echo "🔨 Building image..."
docker build -f Dockerfile.secure -t clawer-openclaw:secure .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "Image: clawer-openclaw:secure"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Test the image:"
    echo "     docker run --rm clawer-openclaw:secure whoami"
    echo "     # Expected output: openclaw"
    echo ""
    echo "  2. Run the container:"
    echo "     docker run --rm -p 8080:8080 -p 8081:8081 \\"
    echo "       -e MOONSHOT_API_KEY=your_key \\"
    echo "       -e GATEWAY_TOKEN=test_token \\"
    echo "       clawer-openclaw:secure"
    echo ""
    echo "  3. Security scan:"
    echo "     trivy image clawer-openclaw:secure"
    echo ""
    echo "  4. Review SECURITY-NOTES.md for details"
else
    echo ""
    echo "❌ Build failed"
    exit 1
fi
