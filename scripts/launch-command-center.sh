#!/bin/bash
# Launch Command Center — Real-time multi-platform launch coordination
# Usage: ./launch-command-center.sh [status|checklist|metrics|monitor|log|open-all]

set -euo pipefail

LAUNCH_DIR="/home/keith/projects/clawer/launch"
STATE_FILE="$LAUNCH_DIR/.launch-state.json"
LOG_FILE="$LAUNCH_DIR/launch-log.md"
CHECKLIST_FILE="$LAUNCH_DIR/launch-checklist.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Initialize state file if it doesn't exist
init_state() {
    if [[ ! -f "$STATE_FILE" ]]; then
        cat > "$STATE_FILE" <<'EOF'
{
  "launch_time": null,
  "status": "pre-launch",
  "platforms": {
    "producthunt": {
      "live": false,
      "url": "",
      "rank": null,
      "upvotes": 0,
      "comments": 0,
      "last_check": null
    },
    "x": {
      "posted": false,
      "thread_url": "",
      "impressions": 0,
      "engagements": 0,
      "last_check": null
    },
    "reddit": {
      "posted": false,
      "url": "",
      "upvotes": 0,
      "comments": 0
    },
    "hackernews": {
      "posted": false,
      "url": "",
      "points": 0,
      "comments": 0
    },
    "indiehackers": {
      "posted": false,
      "url": "",
      "upvotes": 0
    }
  },
  "metrics": {
    "signups": 0,
    "containers_started": 0,
    "total_engagement": 0
  },
  "timeline": []
}
EOF
    fi
}

# Log an event
log_event() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Update JSON timeline
    jq --arg ts "$timestamp" --arg msg "$message" \
        '.timeline += [{"time": $ts, "event": $msg}]' \
        "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    
    # Append to markdown log
    if [[ ! -f "$LOG_FILE" ]]; then
        echo "# Launch Log — $(date '+%Y-%m-%d')" > "$LOG_FILE"
        echo "" >> "$LOG_FILE"
    fi
    echo "**$timestamp** — $message" >> "$LOG_FILE"
}

# Update platform status
update_platform() {
    local platform="$1"
    local field="$2"
    local value="$3"
    
    jq --arg p "$platform" --arg f "$field" --arg v "$value" \
        '.platforms[$p][$f] = $v' \
        "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}

# Update metric
update_metric() {
    local metric="$1"
    local value="$2"
    
    jq --arg m "$metric" --arg v "$value" \
        '.metrics[$m] = ($v | tonumber)' \
        "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}

# Display dashboard
show_status() {
    clear
    echo -e "${BOLD}${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║          🦞 CLAWER.AI LAUNCH COMMAND CENTER 🦞                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Current status
    local status=$(jq -r '.status' "$STATE_FILE")
    local launch_time=$(jq -r '.launch_time // "Not set"' "$STATE_FILE")
    
    echo -e "${BOLD}Status:${NC} $status"
    echo -e "${BOLD}Launch Time:${NC} $launch_time"
    echo ""
    
    # Platform status
    echo -e "${BOLD}${BLUE}═══ PLATFORMS ═══${NC}"
    echo ""
    
    # Product Hunt
    local ph_live=$(jq -r '.platforms.producthunt.live' "$STATE_FILE")
    local ph_rank=$(jq -r '.platforms.producthunt.rank // "N/A"' "$STATE_FILE")
    local ph_votes=$(jq -r '.platforms.producthunt.upvotes' "$STATE_FILE")
    local ph_comments=$(jq -r '.platforms.producthunt.comments' "$STATE_FILE")
    
    if [[ "$ph_live" == "true" ]]; then
        echo -e "${GREEN}✓${NC} ${BOLD}Product Hunt${NC} — LIVE"
        echo "  Rank: #$ph_rank | Upvotes: $ph_votes | Comments: $ph_comments"
        echo "  URL: $(jq -r '.platforms.producthunt.url' "$STATE_FILE")"
    else
        echo -e "${YELLOW}○${NC} ${BOLD}Product Hunt${NC} — Not live"
    fi
    echo ""
    
    # X/Twitter
    local x_posted=$(jq -r '.platforms.x.posted' "$STATE_FILE")
    local x_impressions=$(jq -r '.platforms.x.impressions' "$STATE_FILE")
    local x_engagements=$(jq -r '.platforms.x.engagements' "$STATE_FILE")
    
    if [[ "$x_posted" == "true" ]]; then
        echo -e "${GREEN}✓${NC} ${BOLD}X/Twitter${NC} — Posted"
        echo "  Impressions: $x_impressions | Engagements: $x_engagements"
        echo "  URL: $(jq -r '.platforms.x.thread_url' "$STATE_FILE")"
    else
        echo -e "${YELLOW}○${NC} ${BOLD}X/Twitter${NC} — Not posted"
    fi
    echo ""
    
    # Reddit
    local reddit_posted=$(jq -r '.platforms.reddit.posted' "$STATE_FILE")
    if [[ "$reddit_posted" == "true" ]]; then
        echo -e "${GREEN}✓${NC} ${BOLD}Reddit${NC} — Posted"
        echo "  Upvotes: $(jq -r '.platforms.reddit.upvotes' "$STATE_FILE") | Comments: $(jq -r '.platforms.reddit.comments' "$STATE_FILE")"
    else
        echo -e "${YELLOW}○${NC} ${BOLD}Reddit${NC} — Not posted"
    fi
    echo ""
    
    # Hacker News
    local hn_posted=$(jq -r '.platforms.hackernews.posted' "$STATE_FILE")
    if [[ "$hn_posted" == "true" ]]; then
        echo -e "${GREEN}✓${NC} ${BOLD}Hacker News${NC} — Posted"
        echo "  Points: $(jq -r '.platforms.hackernews.points' "$STATE_FILE") | Comments: $(jq -r '.platforms.hackernews.comments' "$STATE_FILE")"
    else
        echo -e "${YELLOW}○${NC} ${BOLD}Hacker News${NC} — Not posted"
    fi
    echo ""
    
    # Indie Hackers
    local ih_posted=$(jq -r '.platforms.indiehackers.posted' "$STATE_FILE")
    if [[ "$ih_posted" == "true" ]]; then
        echo -e "${GREEN}✓${NC} ${BOLD}Indie Hackers${NC} — Posted"
        echo "  Upvotes: $(jq -r '.platforms.indiehackers.upvotes' "$STATE_FILE")"
    else
        echo -e "${YELLOW}○${NC} ${BOLD}Indie Hackers${NC} — Not posted"
    fi
    echo ""
    
    # Metrics
    echo -e "${BOLD}${BLUE}═══ METRICS ═══${NC}"
    echo ""
    echo "Signups: $(jq -r '.metrics.signups' "$STATE_FILE")"
    echo "Containers Started: $(jq -r '.metrics.containers_started' "$STATE_FILE")"
    echo "Total Engagement: $(jq -r '.metrics.total_engagement' "$STATE_FILE")"
    echo ""
    
    # Recent timeline (last 5 events)
    echo -e "${BOLD}${BLUE}═══ RECENT ACTIVITY ═══${NC}"
    echo ""
    jq -r '.timeline[-5:] | reverse | .[] | "[\(.time)] \(.event)"' "$STATE_FILE" || echo "No events logged yet"
    echo ""
    
    # Time-based reminders
    show_reminders
    
    echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
    echo "Commands: status | metrics | log | open-all | monitor | help"
}

# Show time-based reminders
show_reminders() {
    local current_hour=$(date '+%H')
    local launch_time=$(jq -r '.launch_time // ""' "$STATE_FILE")
    
    if [[ -z "$launch_time" || "$launch_time" == "null" ]]; then
        echo -e "${YELLOW}⏰ Set launch time with: ./launch-command-center.sh set-launch${NC}"
        return
    fi
    
    echo -e "${BOLD}${YELLOW}⏰ REMINDERS${NC}"
    
    # Pacific Time milestones
    case $current_hour in
        0|1|2)
            echo "  🔴 LAUNCH WINDOW — Post first PH comment, start X thread"
            ;;
        6|7|8)
            echo "  🟠 MORNING PUSH — Best engagement hours, share everywhere"
            ;;
        9|10|11)
            echo "  🟡 MID-MORNING — Reply to all comments, post update tweet"
            ;;
        12|13|14)
            echo "  🟢 MIDDAY — Check rank, post midday push tweet"
            ;;
        17|18|19)
            echo "  🔵 FINAL PUSH — Last hours before PH reset, max visibility"
            ;;
        20|21|22|23)
            echo "  💤 WIND DOWN — Reply to stragglers, prep tomorrow's follow-up"
            ;;
    esac
    echo ""
}

# Open all platforms for monitoring
open_all() {
    echo "Opening all launch platforms..."
    
    local ph_url=$(jq -r '.platforms.producthunt.url // ""' "$STATE_FILE")
    local x_url=$(jq -r '.platforms.x.thread_url // ""' "$STATE_FILE")
    local reddit_url=$(jq -r '.platforms.reddit.url // ""' "$STATE_FILE")
    local hn_url=$(jq -r '.platforms.hackernews.url // ""' "$STATE_FILE")
    local ih_url=$(jq -r '.platforms.indiehackers.url // ""' "$STATE_FILE")
    
    # Open set URLs
    [[ -n "$ph_url" && "$ph_url" != "null" ]] && xdg-open "$ph_url" 2>/dev/null &
    [[ -n "$x_url" && "$x_url" != "null" ]] && xdg-open "$x_url" 2>/dev/null &
    [[ -n "$reddit_url" && "$reddit_url" != "null" ]] && xdg-open "$reddit_url" 2>/dev/null &
    [[ -n "$hn_url" && "$hn_url" != "null" ]] && xdg-open "$hn_url" 2>/dev/null &
    [[ -n "$ih_url" && "$ih_url" != "null" ]] && xdg-open "$ih_url" 2>/dev/null &
    
    # Always open main platforms
    xdg-open "https://www.producthunt.com/" 2>/dev/null &
    xdg-open "https://x.com/home" 2>/dev/null &
    xdg-open "https://clawer.ai" 2>/dev/null &
    
    echo "✓ Opened all platforms for monitoring"
}

# Monitor mode (watch + refresh every 30s)
monitor_mode() {
    while true; do
        show_status
        echo ""
        echo -e "${CYAN}Monitoring mode — Press Ctrl+C to exit | Refreshing in 30s...${NC}"
        sleep 30
    done
}

# Interactive metrics update
update_metrics() {
    echo -e "${BOLD}Update Platform Metrics${NC}"
    echo ""
    
    # Product Hunt
    read -p "Product Hunt upvotes (current: $(jq -r '.platforms.producthunt.upvotes' "$STATE_FILE")): " ph_votes
    [[ -n "$ph_votes" ]] && update_platform "producthunt" "upvotes" "$ph_votes"
    
    read -p "Product Hunt comments (current: $(jq -r '.platforms.producthunt.comments' "$STATE_FILE")): " ph_comments
    [[ -n "$ph_comments" ]] && update_platform "producthunt" "comments" "$ph_comments"
    
    read -p "Product Hunt rank (current: $(jq -r '.platforms.producthunt.rank // "N/A"' "$STATE_FILE")): " ph_rank
    [[ -n "$ph_rank" ]] && update_platform "producthunt" "rank" "$ph_rank"
    
    # X/Twitter
    read -p "X impressions (current: $(jq -r '.platforms.x.impressions' "$STATE_FILE")): " x_impressions
    [[ -n "$x_impressions" ]] && update_platform "x" "impressions" "$x_impressions"
    
    read -p "X engagements (current: $(jq -r '.platforms.x.engagements' "$STATE_FILE")): " x_engagements
    [[ -n "$x_engagements" ]] && update_platform "x" "engagements" "$x_engagements"
    
    # Business metrics
    read -p "Total signups (current: $(jq -r '.metrics.signups' "$STATE_FILE")): " signups
    [[ -n "$signups" ]] && update_metric "signups" "$signups"
    
    read -p "Containers started (current: $(jq -r '.metrics.containers_started' "$STATE_FILE")): " containers
    [[ -n "$containers" ]] && update_metric "containers_started" "$containers"
    
    # Update last check time
    local now=$(date -Iseconds)
    jq --arg now "$now" \
        '.platforms.producthunt.last_check = $now | .platforms.x.last_check = $now' \
        "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    
    log_event "Metrics updated manually"
    echo ""
    echo "✓ Metrics updated"
}

# Set platform URLs
set_url() {
    local platform="$1"
    echo "Set URL for $platform:"
    read -p "URL: " url
    
    update_platform "$platform" "url" "$url"
    update_platform "$platform" "posted" "true"
    
    log_event "$platform posted: $url"
    echo "✓ $platform marked as posted"
}

# Set launch time
set_launch_time() {
    echo "Set launch time (format: YYYY-MM-DD HH:MM, e.g., 2026-02-21 00:01):"
    read -p "Launch time: " launch_time
    
    jq --arg lt "$launch_time" '.launch_time = $lt | .status = "launching"' \
        "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    
    log_event "Launch time set: $launch_time"
    echo "✓ Launch time set to $launch_time"
}

# Show help
show_help() {
    cat <<EOF
${BOLD}Launch Command Center — Commands${NC}

${CYAN}Monitoring:${NC}
  status          Show current dashboard
  monitor         Auto-refresh dashboard every 30s
  open-all        Open all platform URLs in browser
  
${CYAN}Updates:${NC}
  metrics         Interactive metrics update
  set-launch      Set launch date/time
  log             Manual event log entry
  
${CYAN}Platform URLs:${NC}
  set-ph          Set Product Hunt URL
  set-x           Set X/Twitter thread URL
  set-reddit      Set Reddit post URL
  set-hn          Set Hacker News URL
  set-ih          Set Indie Hackers URL

${CYAN}Logs:${NC}
  timeline        Show full event timeline
  export          Export state to JSON

${CYAN}Examples:${NC}
  ./launch-command-center.sh status
  ./launch-command-center.sh monitor
  ./launch-command-center.sh metrics
  ./launch-command-center.sh set-ph

EOF
}

# Manual log entry
manual_log() {
    echo "Log event:"
    read -p "Message: " message
    log_event "$message"
    echo "✓ Event logged"
}

# Show full timeline
show_timeline() {
    echo -e "${BOLD}${BLUE}Full Event Timeline${NC}"
    echo ""
    jq -r '.timeline | reverse | .[] | "[\(.time)] \(.event)"' "$STATE_FILE"
}

# Export state
export_state() {
    local export_file="$LAUNCH_DIR/launch-state-$(date +%Y%m%d-%H%M%S).json"
    cp "$STATE_FILE" "$export_file"
    echo "✓ State exported to: $export_file"
}

# Main command router
main() {
    init_state
    
    local command="${1:-status}"
    
    case "$command" in
        status)
            show_status
            ;;
        monitor)
            monitor_mode
            ;;
        metrics)
            update_metrics
            ;;
        open-all)
            open_all
            ;;
        set-launch)
            set_launch_time
            ;;
        set-ph)
            set_url "producthunt"
            ;;
        set-x)
            set_url "x"
            ;;
        set-reddit)
            set_url "reddit"
            ;;
        set-hn)
            set_url "hackernews"
            ;;
        set-ih)
            set_url "indiehackers"
            ;;
        log)
            manual_log
            ;;
        timeline)
            show_timeline
            ;;
        export)
            export_state
            ;;
        help)
            show_help
            ;;
        *)
            echo "Unknown command: $command"
            echo "Run './launch-command-center.sh help' for usage"
            exit 1
            ;;
    esac
}

main "$@"
