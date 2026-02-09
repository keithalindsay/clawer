#!/bin/bash
# Fetch skills from openclaw/skills GitHub repo

set -e

BASE_URL="https://raw.githubusercontent.com/openclaw/skills/main/skills"
SKILLS_DIR="./skills"

# Function to fetch a skill
fetch_skill() {
    local author=$1
    local skill=$2
    local category=$3
    local dir="${SKILLS_DIR}/${category}/${skill}"
    
    mkdir -p "$dir"
    
    echo "Fetching ${author}/${skill} for ${category}..."
    
    # Try to fetch SKILL.md
    if curl -f -sS "${BASE_URL}/${author}/${skill}/SKILL.md" -o "${dir}/SKILL.md" 2>/dev/null; then
        echo "  ✓ SKILL.md downloaded"
        
        # Try to fetch additional files (best effort)
        for extra in README.md references; do
            if [ "$extra" = "references" ]; then
                # Try to get references directory listing (GitHub doesn't provide this easily)
                continue
            else
                curl -f -sS "${BASE_URL}/${author}/${skill}/${extra}" -o "${dir}/${extra}" 2>/dev/null && echo "  ✓ ${extra} downloaded" || true
            fi
        done
        
        return 0
    else
        echo "  ✗ Failed to fetch SKILL.md"
        return 1
    fi
}

# Universal skills
echo "=== Fetching Universal Skills ==="
fetch_skill "steipete" "gog" "universal"
fetch_skill "rubenfb23" "whatsapp-styling-guide" "universal"

# E-commerce skills
echo ""
echo "=== Fetching E-commerce Skills ==="
fetch_skill "zachgodsell93" "shopify-admin-api" "ecommerce"
fetch_skill "jchopard69" "marketing-skills" "ecommerce"
fetch_skill "alirezarezvani" "content-creator" "ecommerce"
fetch_skill "killerapp" "copywriter" "ecommerce"
fetch_skill "vedantsingh60" "seo-optimizer-pro" "ecommerce"
fetch_skill "jdrhyne" "ga4" "ecommerce"
fetch_skill "jdrhyne" "gsc" "ecommerce"

# Life OS skills
echo ""
echo "=== Fetching Life OS Skills ==="
fetch_skill "mjrussell" "todoist" "lifeos"
fetch_skill "antgly" "daily-briefing" "lifeos"
fetch_skill "adunne09" "deepwork-tracker" "lifeos"
fetch_skill "snail3d" "pomodoro" "lifeos"
fetch_skill "julianengel" "remind-me" "lifeos"
fetch_skill "steipete" "qmd" "lifeos"

# Mom skills
echo ""
echo "=== Fetching Mom Skills ==="
fetch_skill "dbhurley" "grocery-list" "mom"
# remind-me is shared, create symlink
if [ -f "skills/lifeos/remind-me/SKILL.md" ]; then
    mkdir -p "skills/mom/remind-me"
    cp "skills/lifeos/remind-me/SKILL.md" "skills/mom/remind-me/SKILL.md"
    echo "  ✓ remind-me copied from lifeos"
fi
fetch_skill "udiedrichsen" "event-planner" "mom"
fetch_skill "jhillin8" "healthy-eating" "mom"
fetch_skill "borahm" "recipe-to-list" "mom"

echo ""
echo "=== Skill Fetch Complete ==="
