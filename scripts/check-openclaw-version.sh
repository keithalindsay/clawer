#!/bin/bash
# ============================================================================
# check-openclaw-version.sh — OpenClaw Version Check for Clawer.ai
# ============================================================================
# Checks: npm latest, local moltbot install, Docker image version
# Exit 0 = everything up to date
# Exit 1 = updates available (use this to trigger alerts)
#
# Usage:
#   ./check-openclaw-version.sh           # interactive report
#   ./check-openclaw-version.sh --quiet   # suppress output, use exit code only
#   ./check-openclaw-version.sh --json    # machine-readable JSON output
#
# Cron (weekly, Mondays at 09:00):
#   0 9 * * 1 /home/keith/projects/clawer/scripts/check-openclaw-version.sh >> /home/keith/projects/clawer/logs/version-check.log 2>&1
# ============================================================================

set -uo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/version-check.log"
STATUS_FILE="$LOG_DIR/version-check-status.json"

# Paths (adapt per environment)
LOCAL_MOLTBOT="${HOME}/AIWorkspace/moltbot"
DOCKER_BUILD_DIR="$PROJECT_ROOT/docker/openclaw-user"

# Upstream sources
NPM_REGISTRY_URL="https://registry.npmjs.org/openclaw"
GITHUB_API_URL="https://api.github.com/repos/openclaw/openclaw/releases/latest"
GITHUB_TAGS_URL="https://api.github.com/repos/openclaw/openclaw/tags"

# ─── Flags ───────────────────────────────────────────────────────────────────
QUIET=false
JSON_MODE=false
for arg in "$@"; do
    case "$arg" in
        --quiet|-q) QUIET=true ;;
        --json)     JSON_MODE=true; QUIET=true ;;
    esac
done

# ─── Colors (only if interactive TTY) ────────────────────────────────────────
if [ -t 1 ] && ! $JSON_MODE; then
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    CYAN='\033[0;36m'
    BOLD='\033[1m'
    DIM='\033[2m'
    NC='\033[0m'
else
    GREEN='' YELLOW='' RED='' CYAN='' BOLD='' DIM='' NC=''
fi

# ─── Helpers ─────────────────────────────────────────────────────────────────
log()  { $QUIET || echo -e "$@"; }
err()  { echo -e "${RED}ERROR:${NC} $*" >&2; }
warn() { $QUIET || echo -e "${YELLOW}WARN:${NC}  $*"; }

# Convert YYYY.M.D → YYYYMMDD integer for comparison
version_to_int() {
    local v="$1"
    # Strip leading 'v' if present
    v="${v#v}"
    echo "$v" | awk -F. '{printf "%04d%02d%02d", $1, $2, $3}' 2>/dev/null || echo "0"
}

# Returns: 0 if v1 >= v2, 1 if v1 < v2
version_gte() {
    [ "$(version_to_int "$1")" -ge "$(version_to_int "$2")" ]
}

# Returns days behind (v2 - v1, where v1 is older)
version_days_behind() {
    local v_old="$1" v_new="$2"
    local d_old d_new t_old t_new
    v_old="${v_old#v}"; v_new="${v_new#v}"
    d_old=$(echo "$v_old" | awk -F. '{printf "%04d-%02d-%02d", $1, $2, $3}')
    d_new=$(echo "$v_new" | awk -F. '{printf "%04d-%02d-%02d", $1, $2, $3}')
    # GNU date (Linux)
    if t_old=$(date -d "$d_old" +%s 2>/dev/null) && t_new=$(date -d "$d_new" +%s 2>/dev/null); then
        echo $(( (t_new - t_old) / 86400 ))
    else
        # BSD date (macOS)
        t_old=$(date -j -f "%Y-%m-%d" "$d_old" +%s 2>/dev/null || echo 0)
        t_new=$(date -j -f "%Y-%m-%d" "$d_new" +%s 2>/dev/null || echo 0)
        echo $(( (t_new - t_old) / 86400 ))
    fi
}

# Status badge for a version (relative to latest)
status_badge() {
    local version="$1" latest="$2" label="$3"
    local days behind_str badge
    if [ "$version" = "unknown" ]; then
        echo "${YELLOW}❓ (unknown)${NC}"
        return
    fi
    if version_gte "$version" "$latest"; then
        echo "${GREEN}✅${NC}"
    else
        days=$(version_days_behind "$version" "$latest" 2>/dev/null || echo "?")
        if [ "$days" -ge 7 ] 2>/dev/null; then
            echo "${RED}⚠️  ($days days behind)${NC}"
        else
            echo "${YELLOW}⚠️  ($days days behind)${NC}"
        fi
    fi
}

# ─── 1. Get Latest Available Version (npm + GitHub) ─────────────────────────
get_latest_version() {
    local version=""

    # Try npm registry via curl (no npm binary needed)
    if command -v curl &>/dev/null; then
        version=$(curl -sf --max-time 10 "$NPM_REGISTRY_URL/latest" 2>/dev/null \
            | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('version',''))" 2>/dev/null || true)
    fi

    # Fallback: GitHub latest release
    if [ -z "$version" ] && command -v curl &>/dev/null; then
        version=$(curl -sf --max-time 10 "$GITHUB_API_URL" 2>/dev/null \
            | python3 -c "import sys,json; d=json.load(sys.stdin); v=d.get('tag_name',''); print(v.lstrip('v'))" 2>/dev/null || true)
    fi

    # Fallback: npm binary (via nvm or system)
    if [ -z "$version" ]; then
        local npm_bin
        npm_bin=$(ls ~/.nvm/versions/node/*/bin/npm 2>/dev/null | sort -V | tail -1 || true)
        if [ -n "$npm_bin" ] && [ -x "$npm_bin" ]; then
            version=$("$npm_bin" view openclaw version 2>/dev/null || true)
        elif command -v npm &>/dev/null; then
            version=$(npm view openclaw version 2>/dev/null || true)
        fi
    fi

    # Fallback: git ls-remote tags
    if [ -z "$version" ] && command -v git &>/dev/null; then
        version=$(git ls-remote --tags https://github.com/openclaw/openclaw.git 2>/dev/null \
            | grep -v '\^{}' \
            | awk -F'/' '{print $3}' \
            | grep -E '^v[0-9]' \
            | sed 's/^v//' \
            | grep -v '-' \
            | sort -t. -k1,1n -k2,2n -k3,3n \
            | tail -1 || true)
    fi

    echo "${version:-unknown}"
}

# ─── 2. Get Local Moltbot Version ────────────────────────────────────────────
get_local_version() {
    local pkg="$LOCAL_MOLTBOT/package.json"

    if [ ! -f "$pkg" ]; then
        echo "unknown"
        return
    fi

    if command -v jq &>/dev/null; then
        jq -r '.version // "unknown"' "$pkg" 2>/dev/null || echo "unknown"
    else
        python3 -c "import json,sys; d=json.load(open('$pkg')); print(d.get('version','unknown'))" 2>/dev/null || echo "unknown"
    fi
}

# Get local git commit info for extra context
get_local_git_info() {
    if [ -d "$LOCAL_MOLTBOT/.git" ]; then
        cd "$LOCAL_MOLTBOT"
        local branch commits_ahead
        branch=$(git branch --show-current 2>/dev/null || echo "?")
        commits_ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
        echo "branch=$branch commits_ahead=$commits_ahead"
    fi
}

# ─── 3. Get Docker Image Version ─────────────────────────────────────────────
get_docker_version() {
    local version=""

    # Method 1: docker inspect label (works if image has version label)
    if command -v docker &>/dev/null; then
        # Try common image names
        for img in "clawer-openclaw:latest" "clawer-openclaw" "openclaw-user:latest"; do
            version=$(docker inspect "$img" --format '{{index .Config.Labels "version"}}' 2>/dev/null || true)
            [ -n "$version" ] && break
            # Also try checking image tags directly
            version=$(docker inspect "$img" --format '{{.RepoTags}}' 2>/dev/null \
                | grep -oE '[0-9]{4}\.[0-9]+\.[0-9]+' | head -1 || true)
            [ -n "$version" ] && break
        done
    fi

    # Method 2: Parse the .tgz filename in the Docker build directory
    if [ -z "$version" ] && [ -d "$DOCKER_BUILD_DIR" ]; then
        version=$(ls "$DOCKER_BUILD_DIR"/openclaw-*.tgz 2>/dev/null \
            | sort -V | tail -1 \
            | grep -oE '[0-9]{4}\.[0-9]+\.[0-9]+' \
            | head -1 || true)
    fi

    # Method 3: Parse version from Dockerfile COPY/RUN line
    if [ -z "$version" ] && [ -f "$DOCKER_BUILD_DIR/Dockerfile" ]; then
        version=$(grep -oE 'openclaw-[0-9]{4}\.[0-9]+\.[0-9]+' "$DOCKER_BUILD_DIR/Dockerfile" \
            | grep -oE '[0-9]{4}\.[0-9]+\.[0-9]+' | head -1 || true)
    fi

    # Method 4: Check a stored version file (created by build pipeline)
    if [ -z "$version" ] && [ -f "$PROJECT_ROOT/.docker-openclaw-version" ]; then
        version=$(cat "$PROJECT_ROOT/.docker-openclaw-version" | tr -d '[:space:]' || true)
    fi

    # Method 5: SSH to production and check there
    if [ -z "$version" ]; then
        local prod_version
        prod_version=$(ssh -o ConnectTimeout=5 -o BatchMode=yes \
            root@YOUR_DOCKER_HOST \
            "docker images --format '{{.Tag}}' clawer-openclaw 2>/dev/null | head -1 || \
             docker inspect openclaw-user:latest --format '{{index .Config.Labels \"version\"}}' 2>/dev/null || \
             cat /opt/clawer/.docker-openclaw-version 2>/dev/null" \
            2>/dev/null || true)
        [ -n "$prod_version" ] && version="$prod_version"
    fi

    echo "${version:-unknown}"
}

# Get production server Docker version (when running locally)
get_prod_docker_version() {
    local version=""
    # Check if we're already on the production server
    local my_ip
    my_ip=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
    if [ "$my_ip" = "YOUR_DOCKER_HOST" ]; then
        # We ARE on prod - check local docker
        if command -v docker &>/dev/null; then
            version=$(docker images --format '{{.Tag}}' clawer-openclaw 2>/dev/null | head -1 || true)
            if [ -z "$version" ]; then
                version=$(docker inspect openclaw-user:latest \
                    --format '{{index .Config.Labels "version"}}' 2>/dev/null || true)
            fi
        fi
    fi
    echo "${version:-}"
}

# ─── Recommendations ─────────────────────────────────────────────────────────
build_recommendations() {
    local latest="$1" local_v="$2" docker_v="$3"
    local recs=()

    if [ "$local_v" != "unknown" ] && ! version_gte "$local_v" "$latest"; then
        recs+=("Update local OpenClaw: cd ~/AIWorkspace/moltbot && git pull && npm install")
    fi

    if [ "$docker_v" != "unknown" ] && ! version_gte "$docker_v" "$latest"; then
        local new_tgz="openclaw-${latest}.tgz"
        recs+=("Rebuild Docker image with $new_tgz: npm pack in moltbot, copy to docker/openclaw-user/, then rebuild")
        recs+=("Run: scripts/build-and-deploy-worker.sh to push updated image to production")
    fi

    if [ "${#recs[@]}" -eq 0 ]; then
        echo "All systems up to date. No action required."
    else
        printf '%s\n' "${recs[@]}"
    fi
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local hostname_str
    hostname_str=$(hostname 2>/dev/null || echo "unknown")

    mkdir -p "$LOG_DIR"

    # ── Gather versions ──────────────────────────────────────────────────────
    log "${DIM}Checking versions...${NC}"

    local latest_version local_version docker_version
    latest_version=$(get_latest_version)
    local_version=$(get_local_version)
    docker_version=$(get_docker_version)

    # ── Compute status ───────────────────────────────────────────────────────
    local local_ok=true docker_ok=true needs_update=false

    if [ "$local_version" != "unknown" ] && ! version_gte "$local_version" "$latest_version"; then
        local_ok=false
        needs_update=true
    fi

    if [ "$docker_version" != "unknown" ] && ! version_gte "$docker_version" "$latest_version"; then
        docker_ok=false
        needs_update=true
    fi

    local local_badge docker_badge
    if $local_ok; then
        local_badge="${GREEN}✅${NC}"
    else
        local days_behind
        days_behind=$(version_days_behind "$local_version" "$latest_version" 2>/dev/null || echo "?")
        local_badge="${YELLOW}⚠️  ($days_behind days behind)${NC}"
    fi

    if $docker_ok; then
        docker_badge="${GREEN}✅${NC}"
    else
        local days_behind
        days_behind=$(version_days_behind "$docker_version" "$latest_version" 2>/dev/null || echo "?")
        if [ "$days_behind" -ge 7 ] 2>/dev/null; then
            docker_badge="${RED}⚠️  ($days_behind days behind)${NC}"
        else
            docker_badge="${YELLOW}⚠️  ($days_behind days behind)${NC}"
        fi
    fi

    # ── Recommendations ──────────────────────────────────────────────────────
    local recommendations
    recommendations=$(build_recommendations "$latest_version" "$local_version" "$docker_version")

    # ── Build report ─────────────────────────────────────────────────────────
    local report
    report=$(cat <<EOF

${BOLD}${CYAN}🔍 OpenClaw Version Check${NC}
${DIM}Run at: $timestamp  |  Host: $hostname_str${NC}
──────────────────────────────────────────────────
  Latest available:   ${BOLD}${latest_version}${NC}
  Local install:      ${BOLD}${local_version}${NC}  $(echo -e "$local_badge")
  Docker image:       ${BOLD}${docker_version}${NC}  $(echo -e "$docker_badge")
──────────────────────────────────────────────────

EOF
)

    if $needs_update; then
        report+=$(echo -e "${YELLOW}📋 Recommendations:${NC}")
        while IFS= read -r line; do
            report+=$'\n'"  → $line"
        done <<< "$recommendations"
    else
        report+=$(echo -e "${GREEN}✅ All systems up to date!${NC}")
    fi

    report+=$'\n'

    # ── Output ───────────────────────────────────────────────────────────────
    if $JSON_MODE; then
        # JSON output for machine consumption (fix bash true/false → Python True/False)
        local py_local_ok_j py_docker_ok_j py_needs_update_j py_recs_j
        py_local_ok_j=$([ "$local_ok" = "true" ] && echo "True" || echo "False")
        py_docker_ok_j=$([ "$docker_ok" = "true" ] && echo "True" || echo "False")
        py_needs_update_j=$([ "$needs_update" = "true" ] && echo "True" || echo "False")
        py_recs_j=$(echo "$recommendations" | python3 -c "import sys,json; lines=[l.strip() for l in sys.stdin.read().strip().split('\n') if l.strip()]; print(json.dumps(lines))")
        python3 - <<PYEOF
import json, sys
data = {
    "timestamp": "$timestamp",
    "hostname": "$hostname_str",
    "latest_version": "$latest_version",
    "local_version": "$local_version",
    "docker_version": "$docker_version",
    "local_up_to_date": $py_local_ok_j,
    "docker_up_to_date": $py_docker_ok_j,
    "needs_update": $py_needs_update_j,
    "recommendations": $py_recs_j
}
print(json.dumps(data, indent=2))
PYEOF
    else
        echo -e "$report"
    fi

    # ── Write to log file (plain text, no color codes) ────────────────────────
    {
        echo "========================================"
        echo "OpenClaw Version Check — $timestamp"
        echo "Host: $hostname_str"
        echo "========================================"
        echo "Latest available:  $latest_version"
        echo "Local install:     $local_version  $([ "$local_ok" = "true" ] && echo "OK" || echo "BEHIND")"
        echo "Docker image:      $docker_version  $([ "$docker_ok" = "true" ] && echo "OK" || echo "BEHIND")"
        echo ""
        echo "Recommendations:"
        echo "$recommendations"
        echo "needs_update=$([ "$needs_update" = "true" ] && echo "yes" || echo "no")"
        echo ""
    } >> "$LOG_FILE"

    # ── Write status JSON for AI/automation consumption ───────────────────────
    local py_local_ok py_docker_ok py_needs_update
    py_local_ok=$([ "$local_ok" = "true" ] && echo "True" || echo "False")
    py_docker_ok=$([ "$docker_ok" = "true" ] && echo "True" || echo "False")
    py_needs_update=$([ "$needs_update" = "true" ] && echo "True" || echo "False")
    local escaped_recs
    escaped_recs=$(echo "$recommendations" | python3 -c "import sys,json; lines=[l.strip() for l in sys.stdin.read().strip().split('\n') if l.strip()]; print(json.dumps(lines))")

    python3 - <<PYEOF
import json
data = {
    "timestamp": "$timestamp",
    "hostname": "$hostname_str",
    "latest_version": "$latest_version",
    "local_version": "$local_version",
    "docker_version": "$docker_version",
    "local_up_to_date": $py_local_ok,
    "docker_up_to_date": $py_docker_ok,
    "needs_update": $py_needs_update,
    "recommendations": $escaped_recs
}
with open("$STATUS_FILE", "w") as f:
    json.dump(data, f, indent=2)
PYEOF

    # ── Exit code ─────────────────────────────────────────────────────────────
    if $needs_update; then
        return 1
    else
        return 0
    fi
}

main "$@"
