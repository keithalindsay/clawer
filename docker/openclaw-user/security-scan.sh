#!/bin/bash
# Security scan of all fetched SKILL.md files

echo "=== Security Scan of Skills ==="
echo ""

ISSUES=0

# Check for suspicious patterns
echo "Checking for auto-execution patterns..."
AUTOEXEC=$(find skills -name "SKILL.md" -exec grep -l "curl.*|.*sh\|wget.*|.*bash\|eval.*http\|system.*http" {} \;)
if [ -n "$AUTOEXEC" ]; then
    echo "⚠️  WARNING: Potential auto-execution patterns found:"
    echo "$AUTOEXEC"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ No auto-execution patterns found"
fi
echo ""

# Check for prompt injection attempts
echo "Checking for prompt injection patterns..."
INJECTION=$(find skills -name "SKILL.md" -exec grep -il "IGNORE.*PREVIOUS\|IGNORE.*ALL.*INSTRUCTION\|disregard.*previous\|new.*system.*instruction\|override.*directive" {} \;)
if [ -n "$INJECTION" ]; then
    echo "⚠️  WARNING: Potential prompt injection found:"
    echo "$INJECTION"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ No prompt injection patterns found"
fi
echo ""

# Check for credential harvesting
echo "Checking for credential harvesting patterns..."
CREDS=$(find skills -name "SKILL.md" -exec grep -il "send.*password\|send.*token\|send.*api.*key.*to\|POST.*password\|POST.*token.*http" {} \;)
if [ -n "$CREDS" ]; then
    echo "⚠️  WARNING: Potential credential harvesting:"
    echo "$CREDS"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ No credential harvesting patterns found"
fi
echo ""

# Check for external script loading
echo "Checking for external script loading..."
EXTERNAL=$(find skills -name "SKILL.md" -exec grep -l "source.*http\|wget.*\.sh\|curl.*\.sh.*chmod\|git clone.*; cd.*; .*sh" {} \;)
if [ -n "$EXTERNAL" ]; then
    echo "⚠️  WARNING: External script loading found:"
    echo "$EXTERNAL"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ No external script loading patterns found"
fi
echo ""

# Verify all skills have proper structure
echo "Verifying skill structure..."
TOTAL=$(find skills -name "SKILL.md" | wc -l)
echo "Total skills: $TOTAL"

MISSING_FRONTMATTER=0
for skill in $(find skills -name "SKILL.md"); do
    if ! head -5 "$skill" | grep -q "^name:\|^# "; then
        echo "⚠️  Missing frontmatter or title: $skill"
        MISSING_FRONTMATTER=$((MISSING_FRONTMATTER + 1))
    fi
done

if [ $MISSING_FRONTMATTER -gt 0 ]; then
    echo "⚠️  $MISSING_FRONTMATTER skills missing proper frontmatter"
    ISSUES=$((ISSUES + 1))
else
    echo "✓ All skills have proper structure"
fi
echo ""

# Summary
echo "=== Security Scan Summary ==="
if [ $ISSUES -eq 0 ]; then
    echo "✓ All security checks passed"
    echo "Skills appear safe for distribution"
else
    echo "⚠️  $ISSUES potential security concerns found"
    echo "Review flagged skills before distribution"
fi

exit $ISSUES
