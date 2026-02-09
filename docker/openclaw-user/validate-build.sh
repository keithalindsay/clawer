#!/bin/bash
# Validate that all required files exist for template builds

echo "=== Validating Clawer Template Build ==="
echo ""

ERRORS=0

# Check core files
echo "Checking core files..."
CORE_FILES=(
    "Dockerfile.template"
    "Dockerfile.ecommerce"
    "Dockerfile.lifeos"
    "Dockerfile.mom"
    "entrypoint-template.sh"
    "build-templates.sh"
    "docker-compose.templates.yml"
    "fetch-skills-robust.sh"
    "security-scan.sh"
    "TEMPLATE-BUILD-SUMMARY.md"
)

for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ MISSING: $file"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check team directories
echo "Checking team directories..."
TEAMS=("ecommerce" "lifeos" "mom")
for team in "${TEAMS[@]}"; do
    if [ -d "teams/$team" ] && [ -f "teams/$team/AGENTS.md" ]; then
        echo "  ✓ teams/$team (with AGENTS.md)"
    else
        echo "  ✗ MISSING or incomplete: teams/$team"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check skills directories
echo "Checking skills directories..."
SKILL_DIRS=("universal" "ecommerce" "lifeos" "mom")
for dir in "${SKILL_DIRS[@]}"; do
    if [ -d "skills/$dir" ]; then
        COUNT=$(find "skills/$dir" -name "SKILL.md" | wc -l)
        echo "  ✓ skills/$dir ($COUNT skills)"
    else
        echo "  ✗ MISSING: skills/$dir"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check prerequisites for build
echo "Checking build prerequisites..."
PREREQS=(
    "openclaw-2026.2.6-3.tgz"
    "config-template.json"
    "api-server.js"
)

for prereq in "${PREREQS[@]}"; do
    if [ -f "$prereq" ]; then
        echo "  ✓ $prereq"
    else
        echo "  ⚠️  MISSING (required for build): $prereq"
        # Don't count as error since they might not be checked in
    fi
done
echo ""

# Summary
echo "=== Validation Summary ==="
if [ $ERRORS -eq 0 ]; then
    echo "✓ All required template files present"
    echo "✓ Ready to build (if prerequisites are in place)"
    exit 0
else
    echo "✗ $ERRORS errors found"
    echo "Fix missing files before building"
    exit 1
fi
