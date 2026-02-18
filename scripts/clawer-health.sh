#!/bin/bash
# =============================================================================
# clawer-health.sh — Clawer Container Health Monitor & Repair Tool
# =============================================================================
# Usage:
#   ./scripts/clawer-health.sh              # Full health report
#   ./scripts/clawer-health.sh --fix        # Auto-repair fixable issues
#   ./scripts/clawer-health.sh --container <name>  # Single container check
#   ./scripts/clawer-health.sh --db         # DB state vs container state diff
#   ./scripts/clawer-health.sh --api-check  # Test API endpoints
#   ./scripts/clawer-health.sh --rebuild-image  # Rebuild v2026.2.16 image on prod
# =============================================================================

PROD_SERVER="root@YOUR_DOCKER_HOST"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10"
CORRECT_IMAGE="clawer-openclaw:v2026.2.16"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

ssh_run() {
  ssh $SSH_OPTS "$PROD_SERVER" "$1" 2>/dev/null
}

print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${BLUE}  $1${NC}"
  echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════${NC}"
}

print_ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
print_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
print_err()  { echo -e "  ${RED}✗${NC} $1"; }
print_info() { echo -e "  ${CYAN}ℹ${NC} $1"; }

# =============================================================================
check_ssh() {
  print_header "SSH Connectivity"
  if ssh_run "echo ok" | grep -q "ok"; then
    print_ok "Production server reachable ($PROD_SERVER)"
  else
    print_err "Cannot reach production server!"
    exit 1
  fi
}

# =============================================================================
check_images() {
  print_header "Docker Images on Production"
  
  local images=$(ssh_run "docker images | grep clawer")
  echo "$images" | while read line; do
    local tag=$(echo "$line" | awk '{print $2}')
    if [[ "$line" == *"v2026.2.16"* ]]; then
      print_ok "clawer-openclaw:$tag (CURRENT — use this)"
    elif [[ "$line" == *"ecommerce"* ]]; then
      print_warn "clawer-openclaw:$tag (OLD — has nonce bug, don't use for new containers)"
    else
      print_info "clawer-openclaw:$tag"
    fi
  done
}

# =============================================================================
check_container() {
  local name="$1"
  local port="$2"
  local token="$3"
  
  echo ""
  echo -e "  ${BOLD}Container: $name${NC}"
  
  # Check if running
  local status=$(ssh_run "docker inspect --format='{{.State.Status}}' $name 2>/dev/null || echo 'missing'")
  local image=$(ssh_run "docker inspect --format='{{.Config.Image}}' $name 2>/dev/null || echo 'unknown'")
  status="${status//$'\n'/}"
  image="${image//$'\n'/}"
  
  if [[ "$status" != "running" ]]; then
    print_err "Status: $status (not running!)"
    return 1
  fi
  print_ok "Status: running"
  
  # Check image version
  if [[ "$image" == *"v2026.2.16"* ]]; then
    print_ok "Image: $image (correct version)"
  else
    print_err "Image: $image (WRONG — should be v2026.2.16)"
    ISSUES+=("$name: wrong image ($image)")
  fi
  
  # Check api-server protocol
  local has_nonce=$(ssh_run "docker exec $name grep -l 'connectNonce' /usr/local/bin/api-server.js 2>/dev/null || echo ''")
  if [[ -z "$has_nonce" ]]; then
    print_ok "api-server.js: Ed25519 auth (correct)"
  else
    print_err "api-server.js: OLD nonce protocol (will be rejected by gateway)"
    ISSUES+=("$name: nonce api-server bug")
  fi
  
  # Check gateway connectivity via API
  if [[ -n "$port" ]]; then
    local api_health=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
      -H "Authorization: Bearer ${token:-}" \
      "http://localhost:${port}/api/health" 2>/dev/null || echo "000")
    
    if [[ "$api_health" == "200" ]]; then
      print_ok "API health: HTTP 200 (gateway connected)"
    elif [[ "$api_health" == "401" ]]; then
      print_warn "API health: HTTP 401 (auth error — check token)"
    elif [[ "$api_health" == "500" ]]; then
      print_err "API health: HTTP 500 (gateway disconnected)"
      ISSUES+=("$name: API gateway disconnected")
    else
      print_warn "API health: HTTP $api_health (unknown)"
    fi
  fi
  
  # Check api-server process running
  local api_pid=$(ssh_run "docker exec $name pgrep -f api-server.js 2>/dev/null || echo ''")
  if [[ -n "$api_pid" ]]; then
    print_ok "api-server process: running (pid $api_pid)"
  else
    print_err "api-server process: not running!"
    ISSUES+=("$name: api-server process dead")
  fi
  
  # Check openclaw gateway process
  local gw_pid=$(ssh_run "docker exec $name pgrep -f 'openclaw' 2>/dev/null || echo ''")
  if [[ -n "$gw_pid" ]]; then
    print_ok "openclaw gateway: running"
  else
    print_err "openclaw gateway: not running!"
    ISSUES+=("$name: gateway process dead")
  fi
  
  # Check dangerouslyDisableDeviceAuth in config
  local has_dda=$(ssh_run "docker exec $name grep -l 'dangerouslyDisableDeviceAuth' /home/user/.openclaw/openclaw.json 2>/dev/null || echo ''")
  if [[ -n "$has_dda" ]]; then
    print_ok "Gateway config: dangerouslyDisableDeviceAuth present"
  else
    print_warn "Gateway config: dangerouslyDisableDeviceAuth missing (may cause auth issues)"
    ISSUES+=("$name: missing dangerouslyDisableDeviceAuth in config")
  fi
}

# =============================================================================
run_full_health() {
  ISSUES=()
  
  check_ssh
  check_images
  
  print_header "Container Health Check"
  
  # Get all clawer containers
  local containers=$(ssh_run "docker ps -a --filter 'name=clawer' --format '{{.Names}}\t{{.Status}}\t{{.Ports}}'")
  
  if [[ -z "$containers" ]]; then
    print_warn "No clawer containers found"
    return
  fi
  
  echo "$containers" | while IFS=$'\t' read name status ports; do
    # Try to find port from name pattern (clawer_user_XXXX)
    check_container "$name" "" ""
  done
  
  print_header "Issue Summary"
  if [[ ${#ISSUES[@]} -eq 0 ]]; then
    print_ok "All containers healthy!"
  else
    for issue in "${ISSUES[@]}"; do
      print_err "$issue"
    done
    echo ""
    echo -e "  ${YELLOW}Run with --fix to auto-repair fixable issues${NC}"
  fi
}

# =============================================================================
fix_container() {
  local name="$1"
  
  echo ""
  echo -e "  ${BOLD}Repairing: $name${NC}"
  
  # Fix 1: Wrong image — can't change image of running container, but note it
  local image=$(ssh_run "docker inspect --format='{{.Config.Image}}' $name 2>/dev/null || echo 'unknown'")
  image="${image//$'\n'/}"
  
  if [[ "$image" != *"v2026.2.16"* ]]; then
    print_warn "Image is $image — cannot change image of running container"
    print_info "To fix: destroy and reprovision this container via admin dashboard"
  fi
  
  # Fix 2: Nonce api-server bug — patch it
  local has_nonce=$(ssh_run "docker exec $name grep -l 'connectNonce' /usr/local/bin/api-server.js 2>/dev/null || echo ''")
  if [[ -n "$has_nonce" ]]; then
    print_info "Patching api-server.js (replacing nonce version with Ed25519)..."
    ssh_run "docker run --rm --entrypoint cat $CORRECT_IMAGE /usr/local/bin/api-server.js > /tmp/api-server-fixed.js"
    ssh_run "docker cp /tmp/api-server-fixed.js $name:/usr/local/bin/api-server.js"
    ssh_run "docker exec $name chmod +x /usr/local/bin/api-server.js"
    ssh_run "rm /tmp/api-server-fixed.js"
    print_ok "api-server.js patched"
  fi
  
  # Fix 3: dangerouslyDisableDeviceAuth missing — update config
  local has_dda=$(ssh_run "docker exec $name grep -l 'dangerouslyDisableDeviceAuth' /home/user/.openclaw/openclaw.json 2>/dev/null || echo ''")
  if [[ -z "$has_dda" ]]; then
    print_info "Adding dangerouslyDisableDeviceAuth to gateway config..."
    # Read config, add field, write back
    ssh_run "docker exec $name node -e \"
      const fs = require('fs');
      const cfg = JSON.parse(fs.readFileSync('/home/user/.openclaw/openclaw.json','utf8'));
      if (!cfg.gateway) cfg.gateway = {};
      if (!cfg.gateway.controlUi) cfg.gateway.controlUi = {};
      cfg.gateway.controlUi.dangerouslyDisableDeviceAuth = true;
      fs.writeFileSync('/home/user/.openclaw/openclaw.json', JSON.stringify(cfg, null, 2));
      console.log('Config updated');
    \""
    print_ok "Gateway config updated"
  fi
  
  # Restart container to apply fixes
  print_info "Restarting $name to apply fixes..."
  ssh_run "docker restart $name"
  sleep 3
  
  # Verify
  local api_pid=$(ssh_run "docker exec $name pgrep -f api-server.js 2>/dev/null || echo ''")
  if [[ -n "$api_pid" ]]; then
    print_ok "Container restarted and api-server running"
  else
    print_warn "Container restarted but api-server not yet up (may still be starting)"
  fi
}

# =============================================================================
run_fix_all() {
  check_ssh
  
  print_header "Auto-Repair Mode"
  
  local containers=$(ssh_run "docker ps -a --filter 'name=clawer' --format '{{.Names}}'")
  
  if [[ -z "$containers" ]]; then
    print_warn "No clawer containers found"
    return
  fi
  
  echo "$containers" | while read name; do
    fix_container "$name"
  done
  
  print_header "Repair Complete"
  echo ""
  echo -e "  ${GREEN}Run without --fix to verify all containers are now healthy${NC}"
}

# =============================================================================
check_db_vs_containers() {
  print_header "DB State vs Container State"
  
  # Check if psql/DB tunnel is available
  local db_url="postgresql://clawer_user:XXXXX@localhost:5433/clawer_db"
  
  print_info "Note: DB check requires SSH tunnel (ssh -L 5433:127.0.0.1:5432 root@YOUR_DOCKER_HOST)"
  print_info "Checking container state from Docker..."
  echo ""
  
  # List all containers on prod
  local containers=$(ssh_run "docker ps -a --filter 'name=clawer_user' --format '{{.Names}}\t{{.Status}}'")
  
  if [[ -z "$containers" ]]; then
    print_info "No user containers found"
  else
    echo -e "  ${BOLD}User Containers on Prod:${NC}"
    echo "$containers" | while IFS=$'\t' read name status; do
      echo "    $name — $status"
    done
  fi
  
  echo ""
  # Also show free tier
  local free_status=$(ssh_run "docker inspect --format='{{.State.Status}}' clawer_free_tier 2>/dev/null || echo 'missing'")
  free_status="${free_status//$'\n'/}"
  echo -e "  ${BOLD}Free Tier Container:${NC} clawer_free_tier — $free_status"
}

# =============================================================================
test_api_endpoints() {
  local container="${1:-clawer_free_tier}"
  
  print_header "API Endpoint Test — $container"
  
  # Get port from running container
  local port=$(ssh_run "docker port $container 8081/tcp 2>/dev/null | cut -d: -f2 || echo ''")
  port="${port//$'\n'/}"
  
  if [[ -z "$port" ]]; then
    print_err "Container $container not found or port not mapped"
    return 1
  fi
  
  print_info "API port: $port"
  
  # Test via SSH tunnel (forward port temporarily)
  echo ""
  echo -e "  ${YELLOW}Note: API tests require local port forward.${NC}"
  echo -e "  Run: ssh -L ${port}:127.0.0.1:${port} root@YOUR_DOCKER_HOST"
  echo ""
  
  # Test from the server itself
  echo -e "  ${BOLD}Testing from production server:${NC}"
  
  local health=$(ssh_run "curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:${port}/api/health" || echo "ERR")
  if [[ "$health" == "200" ]]; then
    print_ok "/api/health → HTTP 200"
  else
    print_err "/api/health → HTTP $health"
  fi
  
  local ready=$(ssh_run "curl -s --max-time 5 http://127.0.0.1:${port}/ready" || echo '{}')
  if echo "$ready" | grep -q '"ready":true'; then
    print_ok "/ready → gateway connected"
  else
    print_err "/ready → $ready"
  fi
}

# =============================================================================
rebuild_image() {
  print_header "Rebuild v2026.2.16 Image on Production"
  
  print_info "Checking if Dockerfile is on prod server..."
  local has_dockerfile=$(ssh_run "ls /opt/clawer/docker/openclaw-user/Dockerfile 2>/dev/null || echo ''")
  
  if [[ -z "$has_dockerfile" ]]; then
    print_warn "Dockerfile not found on prod at /opt/clawer/docker/openclaw-user/"
    print_info "To rebuild: scp docker/ files to prod, then run:"
    echo "    ssh $PROD_SERVER 'cd /opt/clawer/docker/openclaw-user && docker build -t clawer-openclaw:v2026.2.16 .'"
    return 1
  fi
  
  print_info "Building image on prod server (this will take a few minutes)..."
  ssh_run "cd /opt/clawer/docker/openclaw-user && docker build -t clawer-openclaw:v2026.2.16 . 2>&1 | tail -5"
  
  local result=$?
  if [[ $result -eq 0 ]]; then
    print_ok "Image rebuilt successfully"
  else
    print_err "Image build failed"
  fi
}

# =============================================================================
show_usage() {
  echo ""
  echo -e "${BOLD}Usage:${NC}"
  echo "  $0                       Full health report"
  echo "  $0 --fix                 Auto-repair fixable issues (patches api-server, config)"
  echo "  $0 --container <name>    Check a specific container"
  echo "  $0 --db                  DB state vs container state diff"
  echo "  $0 --api-check [name]    Test API endpoints (default: clawer_free_tier)"
  echo "  $0 --rebuild-image       Rebuild v2026.2.16 image on prod"
  echo "  $0 --help                Show this help"
  echo ""
}

# =============================================================================
# MAIN
# =============================================================================
case "${1:-}" in
  --fix)
    run_fix_all
    ;;
  --container)
    check_ssh
    check_container "${2:-}" "" ""
    ;;
  --db)
    check_ssh
    check_db_vs_containers
    ;;
  --api-check)
    check_ssh
    test_api_endpoints "${2:-}"
    ;;
  --rebuild-image)
    check_ssh
    rebuild_image
    ;;
  --help|-h)
    show_usage
    ;;
  "")
    run_full_health
    ;;
  *)
    echo "Unknown option: $1"
    show_usage
    exit 1
    ;;
esac

echo ""
