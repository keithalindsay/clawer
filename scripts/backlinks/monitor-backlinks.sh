#!/bin/bash
# monitor-backlinks.sh
# Check which directory submissions and backlinks are live for clawer.ai
# Usage: ./monitor-backlinks.sh [--full] [--directory-only] [--github-only]
# Dependencies: curl, jq (for JSON output), searxng running locally

set -e

SITE="clawer.ai"
REPORT_DIR="$HOME/projects/clawer/reports/backlinks"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
REPORT_FILE="$REPORT_DIR/backlink-check-$TIMESTAMP.md"
SUBMISSIONS_JSON="$HOME/projects/clawer/scripts/backlinks/directory-submissions.json"
SEARXNG_URL="http://localhost:8888"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

mkdir -p "$REPORT_DIR"

echo "# Backlink Monitor Report — $TIMESTAMP" > "$REPORT_FILE"
echo "Site: $SITE" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

log() {
    echo "$1" | tee -a "$REPORT_FILE"
}

check_section() {
    log ""
    log "## $1"
    log ""
}

# ──────────────────────────────────────────────────────────────
# FUNCTION: Check if a specific site mentions clawer.ai
# Uses SearXNG local instance first, falls back to direct check
# ──────────────────────────────────────────────────────────────
check_listing() {
    local directory_name="$1"
    local directory_url="$2"
    local search_query="site:${directory_url##https://} clawer.ai"
    
    # Try to fetch the directory's search or browse results
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time 10 \
        "$directory_url" \
        2>/dev/null || echo "000")
    
    if [ "$response_code" = "200" ]; then
        # Site is reachable, check via SearXNG
        local searx_result=$(curl -s \
            "$SEARXNG_URL/search?q=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$search_query'))")&format=json" \
            --max-time 15 \
            2>/dev/null | jq -r '.results | length' 2>/dev/null || echo "0")
        
        if [ "$searx_result" -gt "0" ] 2>/dev/null; then
            echo -e "${GREEN}✅ LIVE${NC} — $directory_name ($directory_url)"
            log "✅ LIVE — $directory_name ($directory_url)"
        else
            echo -e "${YELLOW}❓ UNVERIFIED${NC} — $directory_name (site up, listing not confirmed)"
            log "❓ UNVERIFIED — $directory_name (site up, can't confirm listing)"
        fi
    else
        echo -e "${RED}❌ SITE DOWN${NC} — $directory_name (HTTP $response_code)"
        log "❌ SITE DOWN — $directory_name (HTTP $response_code)"
    fi
}

# ──────────────────────────────────────────────────────────────
# FUNCTION: Check Google search for backlinks (via SearXNG)
# ──────────────────────────────────────────────────────────────
search_backlinks() {
    local query="$1"
    local description="$2"
    
    local encoded_query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))" 2>/dev/null || \
        echo "$query" | sed 's/ /+/g')
    
    local result=$(curl -s \
        "$SEARXNG_URL/search?q=$encoded_query&format=json" \
        --max-time 20 \
        2>/dev/null)
    
    local count=$(echo "$result" | jq -r '.results | length' 2>/dev/null || echo "0")
    local urls=$(echo "$result" | jq -r '.results[].url' 2>/dev/null | head -5 || echo "")
    
    if [ "$count" -gt "0" ] 2>/dev/null; then
        log "### $description: $count results found"
        log "$urls" | while read url; do
            log "  - $url"
        done
    else
        log "### $description: No results found"
    fi
}

# ──────────────────────────────────────────────────────────────
# SECTION 1: Check major directory listings
# ──────────────────────────────────────────────────────────────
check_section "Directory Listing Status"

echo "Checking major AI directories..."

DIRECTORIES=(
    "TAAFT|https://theresanaiforthat.com"
    "Futurepedia|https://futurepedia.io"
    "ListMyAI|https://listmyai.net"
    "ProductHunt|https://producthunt.com"
    "G2|https://g2.com"
    "AlternativeTo|https://alternativeto.net"
    "Capterra|https://capterra.com"
    "BetaList|https://betalist.com"
    "SaaSHub|https://saashub.com"
    "Uneed|https://uneed.best"
    "Dang.ai|https://dang.ai"
    "Toolify.ai|https://toolify.ai"
    "TopAI.tools|https://topai.tools"
    "FutureTools|https://futuretools.io"
    "AI Scout|https://aiscout.net"
    "AI Agent Store|https://aiagentstore.ai"
    "AI Agents Live|https://aiagentslive.com"
    "IndieHackers|https://indiehackers.com"
    "StartupFame|https://startupfa.me"
    "Altern.ai|https://altern.ai"
    "DevHunt|https://devhunt.org"
)

LIVE_COUNT=0
TOTAL_COUNT=${#DIRECTORIES[@]}

for dir_entry in "${DIRECTORIES[@]}"; do
    IFS='|' read -r name url <<< "$dir_entry"
    result=$(check_listing "$name" "$url" 2>/dev/null)
    echo "$result"
    if echo "$result" | grep -q "LIVE"; then
        ((LIVE_COUNT++)) || true
    fi
    sleep 1  # Rate limiting
done

log ""
log "**Summary: $LIVE_COUNT / $TOTAL_COUNT directories confirmed live**"

# ──────────────────────────────────────────────────────────────
# SECTION 2: Search for organic backlinks
# ──────────────────────────────────────────────────────────────
if [ "$1" = "--full" ] || [ -z "$1" ]; then
    check_section "Organic Backlink Search"
    
    echo ""
    echo "Searching for organic backlinks via SearXNG..."
    
    if curl -s "$SEARXNG_URL" --max-time 5 > /dev/null 2>&1; then
        search_backlinks "\"clawer.ai\" -site:clawer.ai" "Pages mentioning clawer.ai"
        sleep 2
        search_backlinks "link:clawer.ai OR \"clawer.ai\" hosting openclaw" "OpenClaw + clawer.ai mentions"
        sleep 2
        search_backlinks "\"clawer\" \"openclaw\" \"managed hosting\"" "Managed hosting context mentions"
    else
        log "⚠️  SearXNG not available at $SEARXNG_URL — skipping organic search"
        log "   Start it with: cd ~/projects/searxng && sudo docker compose up -d"
    fi
fi

# ──────────────────────────────────────────────────────────────
# SECTION 3: GitHub PR/mention tracking
# ──────────────────────────────────────────────────────────────
if [ "$1" = "--github-only" ] || [ "$1" = "--full" ] || [ -z "$1" ]; then
    check_section "GitHub Awesome Lists"
    
    echo ""
    echo "Checking GitHub awesome list submissions..."
    
    GITHUB_REPOS=(
        "e2b-dev/awesome-ai-agents"
        "kaushikb11/awesome-llm-agents"
        "mahseema/awesome-ai-tools"
        "e2b-dev/awesome-ai-sdks"
        "AI-Agents-Simplified/Awesome-AI-Agents"
        "slavakurilyak/awesome-ai-agents"
        "awesome-selfhosted/awesome-selfhosted"
    )
    
    for repo in "${GITHUB_REPOS[@]}"; do
        # Check if clawer.ai is mentioned in the README
        readme_url="https://raw.githubusercontent.com/$repo/main/README.md"
        
        contains=$(curl -s "$readme_url" --max-time 10 2>/dev/null | \
            grep -i "clawer" | wc -l || echo "0")
        
        if [ "$contains" -gt "0" ]; then
            echo -e "${GREEN}✅ LISTED${NC} — github.com/$repo"
            log "✅ LISTED — https://github.com/$repo"
        else
            echo -e "${YELLOW}📋 NOT LISTED${NC} — github.com/$repo"
            log "📋 NOT LISTED — https://github.com/$repo"
        fi
        sleep 0.5
    done
fi

# ──────────────────────────────────────────────────────────────
# SECTION 4: Community presence check
# ──────────────────────────────────────────────────────────────
check_section "Community Presence"

echo ""
echo "Checking community mentions..."

# Check Reddit via SearXNG
if curl -s "$SEARXNG_URL" --max-time 5 > /dev/null 2>&1; then
    search_backlinks "site:reddit.com \"clawer.ai\"" "Reddit mentions"
    sleep 2
    search_backlinks "site:news.ycombinator.com \"clawer.ai\" OR \"clawer\"" "Hacker News mentions"
    sleep 2
    search_backlinks "site:indiehackers.com \"clawer.ai\"" "Indie Hackers mentions"
fi

# ──────────────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────────────
check_section "Action Items"

log "Run this script weekly to track progress."
log ""
log "Quick links:"
log "- Ahrefs free checker: https://ahrefs.com/backlink-checker"
log "- Moz Link Explorer: https://moz.com/link-explorer"  
log "- Google Search Console: https://search.google.com/search-console"
log ""
log "Report saved: $REPORT_FILE"

echo ""
echo "=================================="
echo "Report saved: $REPORT_FILE"
echo "=================================="

# ──────────────────────────────────────────────────────────────
# UPDATE SUBMISSIONS JSON with last checked date
# ──────────────────────────────────────────────────────────────
if [ -f "$SUBMISSIONS_JSON" ] && command -v jq &> /dev/null; then
    # Update last_checked in the JSON meta
    tmp=$(mktemp)
    jq ".meta.last_checked = \"$(date -I)\"" "$SUBMISSIONS_JSON" > "$tmp" && mv "$tmp" "$SUBMISSIONS_JSON"
    echo "Updated $SUBMISSIONS_JSON with last_checked date."
fi
