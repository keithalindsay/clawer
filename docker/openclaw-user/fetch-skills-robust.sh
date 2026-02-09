#!/bin/bash
# Fetch skills from openclaw/skills GitHub repo with fallback placeholders

set +e  # Don't exit on errors, we handle them

BASE_URL="https://raw.githubusercontent.com/openclaw/skills/main/skills"
SKILLS_DIR="./skills"

FETCHED=0
FAILED=0
PLACEHOLDERS=0

# Function to create placeholder skill
create_placeholder() {
    local skill=$1
    local category=$2
    local description=$3
    local dir="${SKILLS_DIR}/${category}/${skill}"
    
    mkdir -p "$dir"
    
    cat > "${dir}/SKILL.md" <<EOF
# ${skill}

**Status:** Placeholder - skill not yet available in openclaw/skills repository

**Category:** ${category}

**Description:** ${description}

## Usage

This skill is planned but not yet implemented. Once available, it will provide:
${description}

## References

- OpenClaw Skills Repository: https://github.com/openclaw/skills

---
*This is a placeholder. Check the openclaw/skills repo for updates.*
EOF
    
    echo "  → Created placeholder"
    PLACEHOLDERS=$((PLACEHOLDERS + 1))
}

# Function to fetch a skill
fetch_skill() {
    local author=$1
    local skill=$2
    local category=$3
    local description=$4
    local dir="${SKILLS_DIR}/${category}/${skill}"
    
    mkdir -p "$dir"
    
    echo -n "Fetching ${author}/${skill} for ${category}... "
    
    # Try to fetch SKILL.md
    if curl -f -sS "${BASE_URL}/${author}/${skill}/SKILL.md" -o "${dir}/SKILL.md" 2>/dev/null; then
        echo "✓"
        FETCHED=$((FETCHED + 1))
        
        # Try to fetch additional files (best effort, silent)
        curl -f -sS "${BASE_URL}/${author}/${skill}/README.md" -o "${dir}/README.md" 2>/dev/null || true
        
        return 0
    else
        echo "✗ (not found)"
        create_placeholder "$skill" "$category" "$description"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Universal skills
echo "=== Universal Skills ==="
fetch_skill "steipete" "gog" "universal" "Google Workspace CLI for gmail, calendar, drive, sheets, docs"
fetch_skill "rubenfb23" "whatsapp-styling-guide" "universal" "WhatsApp message formatting guide (bold, italic, code, etc.)"

# E-commerce skills
echo ""
echo "=== E-commerce Skills ==="
fetch_skill "zachgodsell93" "shopify-admin-api" "ecommerce" "Shopify Admin API integration for store management"
fetch_skill "jchopard69" "marketing-skills" "ecommerce" "23 marketing playbooks for growth and strategy"
fetch_skill "alirezarezvani" "content-creator" "ecommerce" "Content creation workflows for e-commerce"
fetch_skill "killerapp" "copywriter" "ecommerce" "Copywriting templates and frameworks"
fetch_skill "vedantsingh60" "seo-optimizer-pro" "ecommerce" "SEO optimization and keyword research"
fetch_skill "jdrhyne" "ga4" "ecommerce" "Google Analytics 4 reporting and analysis"
fetch_skill "jdrhyne" "gsc" "ecommerce" "Google Search Console monitoring and insights"

# Life OS skills
echo ""
echo "=== Life OS Skills ==="
fetch_skill "mjrussell" "todoist" "lifeos" "Todoist task management integration"
fetch_skill "antgly" "daily-briefing" "lifeos" "Daily morning briefing and planning"
fetch_skill "adunne09" "deepwork-tracker" "lifeos" "Deep work session tracking and productivity"
fetch_skill "snail3d" "pomodoro" "lifeos" "Pomodoro timer and focus sessions"
fetch_skill "julianengel" "remind-me" "lifeos" "Reminder creation and management"
fetch_skill "steipete" "qmd" "lifeos" "Quick markdown search and navigation"

# Mom skills
echo ""
echo "=== Mom Skills ==="
fetch_skill "dbhurley" "grocery-list" "mom" "Grocery list management and meal planning"

# remind-me is shared, copy from lifeos
if [ -f "skills/lifeos/remind-me/SKILL.md" ]; then
    mkdir -p "skills/mom/remind-me"
    cp -r skills/lifeos/remind-me/* "skills/mom/remind-me/"
    echo "remind-me (shared from lifeos) ✓"
else
    fetch_skill "julianengel" "remind-me" "mom" "Reminder creation and management"
fi

fetch_skill "udiedrichsen" "event-planner" "mom" "Event planning and coordination"
fetch_skill "jhillin8" "healthy-eating" "mom" "Healthy meal suggestions and nutrition"
fetch_skill "borahm" "recipe-to-list" "mom" "Convert recipes to shopping lists"

echo ""
echo "=== Summary ==="
echo "Fetched: $FETCHED"
echo "Failed: $FAILED"
echo "Placeholders: $PLACEHOLDERS"
echo "Total: $((FETCHED + FAILED))"
