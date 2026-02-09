#!/bin/bash
# Build all Clawer template images

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Building Clawer OpenClaw Template Images ==="
echo ""

# Check prerequisites
if [ ! -f "openclaw-2026.2.6-3.tgz" ]; then
    echo "ERROR: openclaw-2026.2.6-3.tgz not found"
    echo "Please place the OpenClaw tarball in this directory"
    exit 1
fi

if [ ! -f "config-template.json" ]; then
    echo "ERROR: config-template.json not found"
    exit 1
fi

if [ ! -f "api-server.js" ]; then
    echo "ERROR: api-server.js not found"
    exit 1
fi

if [ ! -f "SOUL.md" ]; then
    echo "WARNING: SOUL.md not found, creating minimal version"
    cat > SOUL.md <<'EOF'
# SOUL.md - Who You Are

You are an OpenClaw AI agent, part of a team designed to help your user accomplish their goals.

Check your team configuration in `/home/user/clawd/team/` for more details about your role.

---
*This is a base SOUL. Your team may have a more specific identity.*
EOF
fi

# Templates to build
TEMPLATES=("ecommerce" "lifeos" "mom")

# Build each template
for TEMPLATE in "${TEMPLATES[@]}"; do
    echo "----------------------------------------"
    echo "Building template: $TEMPLATE"
    echo "----------------------------------------"
    
    if [ ! -d "teams/$TEMPLATE" ]; then
        echo "ERROR: teams/$TEMPLATE not found"
        exit 1
    fi
    
    if [ ! -d "skills/$TEMPLATE" ]; then
        echo "WARNING: skills/$TEMPLATE not found, no template-specific skills will be included"
    fi
    
    docker build \
        --build-arg TEMPLATE="$TEMPLATE" \
        -f Dockerfile.template \
        -t "clawer-openclaw:${TEMPLATE}" \
        -t "clawer-openclaw:${TEMPLATE}-$(date +%Y%m%d)" \
        .
    
    echo ""
    echo "✓ Built clawer-openclaw:${TEMPLATE}"
    echo ""
done

echo "========================================"
echo "All templates built successfully!"
echo "========================================"
echo ""
echo "Available images:"
for TEMPLATE in "${TEMPLATES[@]}"; do
    echo "  - clawer-openclaw:${TEMPLATE}"
done
echo ""
echo "Run with:"
echo "  docker run -it --rm \\"
echo "    -e OPENAI_API_KEY=your-key-here \\"
echo "    -p 8080:8080 -p 8081:8081 \\"
echo "    clawer-openclaw:<template>"
echo ""
echo "Or use docker-compose.yml with TEMPLATE environment variable"
