#!/bin/bash
# Clawer Container Health & Management Dashboard
# Monitors all user containers on production server (YOUR_DOCKER_HOST)

set -euo pipefail

SERVER="root@YOUR_DOCKER_HOST"
CLAWER_DB="postgresql://clawer:YOUR_DB_PASSWORD@localhost:5432/clawer"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() { echo -e "${BLUE}ℹ${NC} $*"; }
success() { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
error() { echo -e "${RED}✗${NC} $*"; }

usage() {
    cat <<EOF
Clawer Container Health Dashboard

USAGE:
    $(basename "$0") [COMMAND] [OPTIONS]

COMMANDS:
    status              Show all containers with health status (default)
    logs <userId>       Show logs for user's container
    restart <userId>    Restart user's container
    stop <userId>       Stop user's container
    inspect <userId>    Full inspection (security check, config, resources)
    versions            Check OpenClaw versions across containers
    security            Security audit (exposed keys, misconfigurations)
    upgrade <userId>    Upgrade container to latest OpenClaw version

OPTIONS:
    --json              Output in JSON format
    --watch             Continuous monitoring (refresh every 30s)
    -h, --help          Show this help

EXAMPLES:
    # Quick health check
    $(basename "$0")

    # Watch containers in real-time
    $(basename "$0") status --watch

    # Check specific user
    $(basename "$0") inspect user_39idIfXQ8pPbCZM6HCBWw0Qy9bS

    # Security audit all containers
    $(basename "$0") security

    # Upgrade user's container
    $(basename "$0") upgrade user_39idIfXQ8pPbCZM6HCBWw0Qy9bS
EOF
    exit 0
}

# Get all Clawer containers from remote server
get_containers() {
    ssh "$SERVER" "docker ps -a --filter 'name=clawer_user_' --format '{{.Names}}|{{.Status}}|{{.Ports}}|{{.Image}}|{{.ID}}'" 2>/dev/null || {
        error "Failed to connect to $SERVER"
        exit 1
    }
}

# Check container health (Docker + HTTP)
check_health() {
    local container=$1
    local port=$2
    
    # Check Docker status
    local docker_status=$(ssh "$SERVER" "docker inspect $container --format '{{.State.Status}}'" 2>/dev/null || echo "unknown")
    
    # Check HTTP health endpoint
    local http_status=0
    if [[ "$docker_status" == "running" ]]; then
        ssh "$SERVER" "curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 http://localhost:$port/api/health" 2>/dev/null || http_status=0
    fi
    
    # Determine overall health
    if [[ "$docker_status" == "running" && "$http_status" == "200" ]]; then
        echo "healthy"
    elif [[ "$docker_status" == "running" ]]; then
        echo "degraded"
    else
        echo "unhealthy"
    fi
}

# Extract port from container info
extract_port() {
    local ports=$1
    # Format: 0.0.0.0:4010->8081/tcp or empty
    if [[ "$ports" =~ ([0-9]+)-\>8081 ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "unknown"
    fi
}

# Extract user ID from container name
extract_user_id() {
    local container=$1
    # Format: clawer_user_xxxxx
    echo "${container#clawer_user_}"
}

# Show container status dashboard
show_status() {
    local watch_mode=${1:-false}
    
    while true; do
        clear
        echo "════════════════════════════════════════════════════════════════"
        echo "  Clawer Container Health Dashboard"
        echo "  Server: $SERVER"
        echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "════════════════════════════════════════════════════════════════"
        echo ""
        
        local containers=$(get_containers)
        
        if [[ -z "$containers" ]]; then
            warn "No containers found"
            [[ "$watch_mode" == "false" ]] && break
            sleep 30
            continue
        fi
        
        # Table header
        printf "%-35s %-12s %-10s %-8s %-15s\n" "CONTAINER" "STATUS" "HEALTH" "PORT" "IMAGE"
        echo "────────────────────────────────────────────────────────────────"
        
        local total=0
        local healthy=0
        local degraded=0
        local unhealthy=0
        
        while IFS='|' read -r name status ports image id; do
            ((total++))
            
            local port=$(extract_port "$ports")
            local health=$(check_health "$name" "$port")
            
            # Color-code health status
            local health_display=""
            case $health in
                healthy)
                    health_display="${GREEN}✓ healthy${NC}"
                    ((healthy++))
                    ;;
                degraded)
                    health_display="${YELLOW}⚠ degraded${NC}"
                    ((degraded++))
                    ;;
                unhealthy)
                    health_display="${RED}✗ unhealthy${NC}"
                    ((unhealthy++))
                    ;;
            esac
            
            # Extract Docker status
            local docker_status=$(echo "$status" | awk '{print $1}')
            
            # Truncate image name
            local image_short=$(echo "$image" | cut -d':' -f2)
            
            printf "%-35s %-12s %-20s %-8s %-15s\n" \
                "$name" "$docker_status" "$(echo -e "$health_display")" "$port" "$image_short"
        done <<< "$containers"
        
        echo ""
        echo "════════════════════════════════════════════════════════════════"
        printf "Total: %d | " "$total"
        printf "${GREEN}Healthy: %d${NC} | " "$healthy"
        printf "${YELLOW}Degraded: %d${NC} | " "$degraded"
        printf "${RED}Unhealthy: %d${NC}\n" "$unhealthy"
        echo "════════════════════════════════════════════════════════════════"
        
        [[ "$watch_mode" == "false" ]] && break
        
        echo ""
        info "Refreshing in 30 seconds... (Ctrl+C to exit)"
        sleep 30
    done
}

# Show logs for specific user
show_logs() {
    local user_id=$1
    local container="clawer_user_$user_id"
    
    info "Fetching logs for $container..."
    ssh "$SERVER" "docker logs --tail 100 -f $container" 2>/dev/null || {
        error "Container not found or logs unavailable"
        exit 1
    }
}

# Restart container
restart_container() {
    local user_id=$1
    local container="clawer_user_$user_id"
    
    info "Restarting $container..."
    ssh "$SERVER" "docker restart $container" >/dev/null 2>&1 || {
        error "Failed to restart container"
        exit 1
    }
    success "Container restarted"
    
    # Wait for health check
    sleep 3
    local port=$(ssh "$SERVER" "docker port $container 8081" 2>/dev/null | cut -d':' -f2)
    local health=$(check_health "$container" "$port")
    
    if [[ "$health" == "healthy" ]]; then
        success "Container is healthy"
    else
        warn "Container may not be healthy yet (status: $health)"
    fi
}

# Stop container
stop_container() {
    local user_id=$1
    local container="clawer_user_$user_id"
    
    warn "Stopping $container..."
    ssh "$SERVER" "docker stop $container" >/dev/null 2>&1 || {
        error "Failed to stop container"
        exit 1
    }
    success "Container stopped"
}

# Full inspection (security + config + resources)
inspect_container() {
    local user_id=$1
    local container="clawer_user_$user_id"
    
    echo "════════════════════════════════════════════════════════════════"
    echo "  Container Inspection: $container"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    # Basic info
    info "Basic Information"
    ssh "$SERVER" "docker inspect $container --format 'Image: {{.Config.Image}}
Status: {{.State.Status}}
Started: {{.State.StartedAt}}
Memory Limit: {{.HostConfig.Memory}}
CPU Limit: {{.HostConfig.NanoCpus}}
Restart Policy: {{.HostConfig.RestartPolicy.Name}}'" 2>/dev/null
    echo ""
    
    # Security check - exposed API keys
    info "Security Check (Environment Variables)"
    local env_vars=$(ssh "$SERVER" "docker inspect $container --format '{{range .Config.Env}}{{println .}}{{end}}'" 2>/dev/null)
    
    local exposed_keys=0
    while IFS= read -r line; do
        if [[ "$line" =~ (API_KEY|TOKEN|SECRET|PASSWORD)=(.+) ]]; then
            local key_name="${BASH_REMATCH[1]}"
            local key_value="${BASH_REMATCH[2]}"
            
            # Mask key value
            local masked_value=$(echo "$key_value" | sed 's/\(.\{4\}\).*/\1***/')
            
            if [[ ${#key_value} -gt 10 ]]; then
                warn "  Exposed: $key_name=$masked_value"
                ((exposed_keys++))
            fi
        fi
    done <<< "$env_vars"
    
    if [[ $exposed_keys -eq 0 ]]; then
        success "  No exposed API keys found"
    else
        warn "  Found $exposed_keys exposed keys (visible via docker inspect)"
    fi
    echo ""
    
    # Resource usage
    info "Resource Usage"
    ssh "$SERVER" "docker stats $container --no-stream --format 'CPU: {{.CPUPerc}}
Memory: {{.MemUsage}}
Network I/O: {{.NetIO}}
Block I/O: {{.BlockIO}}'" 2>/dev/null
    echo ""
    
    # OpenClaw version
    info "OpenClaw Version"
    local version=$(ssh "$SERVER" "docker exec $container openclaw --version 2>/dev/null || echo 'unknown'" 2>/dev/null)
    echo "  $version"
    echo ""
    
    # Recent logs (last 20 lines)
    info "Recent Logs (last 20 lines)"
    ssh "$SERVER" "docker logs --tail 20 $container" 2>/dev/null | sed 's/^/  /'
    echo ""
    
    echo "════════════════════════════════════════════════════════════════"
}

# Check OpenClaw versions across all containers
check_versions() {
    echo "════════════════════════════════════════════════════════════════"
    echo "  OpenClaw Version Check"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    local containers=$(get_containers | cut -d'|' -f1)
    
    printf "%-35s %-20s %-15s\n" "CONTAINER" "OPENCLAW VERSION" "IMAGE"
    echo "────────────────────────────────────────────────────────────────"
    
    local version_counts=()
    
    while IFS= read -r container; do
        [[ -z "$container" ]] && continue
        
        local version=$(ssh "$SERVER" "docker exec $container openclaw --version 2>/dev/null | head -1" 2>/dev/null || echo "unknown")
        local image=$(ssh "$SERVER" "docker inspect $container --format '{{.Config.Image}}'" 2>/dev/null)
        local image_short=$(echo "$image" | cut -d':' -f2)
        
        printf "%-35s %-20s %-15s\n" "$container" "$version" "$image_short"
        
        # Track version counts
        version_counts["$version"]=$((${version_counts["$version"]:-0} + 1))
    done <<< "$containers"
    
    echo ""
    info "Version Summary:"
    for version in "${!version_counts[@]}"; do
        echo "  $version: ${version_counts[$version]} containers"
    done
    echo ""
    echo "════════════════════════════════════════════════════════════════"
}

# Security audit
security_audit() {
    echo "════════════════════════════════════════════════════════════════"
    echo "  Security Audit"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    
    local containers=$(get_containers | cut -d'|' -f1)
    local total_issues=0
    
    while IFS= read -r container; do
        [[ -z "$container" ]] && continue
        
        info "Auditing: $container"
        
        # Check for exposed API keys
        local env_vars=$(ssh "$SERVER" "docker inspect $container --format '{{range .Config.Env}}{{println .}}{{end}}'" 2>/dev/null)
        local exposed_keys=0
        
        while IFS= read -r line; do
            if [[ "$line" =~ (API_KEY|TOKEN|SECRET|PASSWORD)=(.+) ]]; then
                local key_name="${BASH_REMATCH[1]}"
                ((exposed_keys++))
            fi
        done <<< "$env_vars"
        
        if [[ $exposed_keys -gt 0 ]]; then
            warn "  ⚠ $exposed_keys API keys exposed via docker inspect"
            ((total_issues++))
        fi
        
        # Check for privileged mode
        local privileged=$(ssh "$SERVER" "docker inspect $container --format '{{.HostConfig.Privileged}}'" 2>/dev/null)
        if [[ "$privileged" == "true" ]]; then
            warn "  ⚠ Running in privileged mode"
            ((total_issues++))
        fi
        
        # Check for missing resource limits
        local memory_limit=$(ssh "$SERVER" "docker inspect $container --format '{{.HostConfig.Memory}}'" 2>/dev/null)
        if [[ "$memory_limit" == "0" ]]; then
            warn "  ⚠ No memory limit set"
            ((total_issues++))
        fi
        
        # Check restart policy
        local restart_policy=$(ssh "$SERVER" "docker inspect $container --format '{{.HostConfig.RestartPolicy.Name}}'" 2>/dev/null)
        if [[ "$restart_policy" != "unless-stopped" && "$restart_policy" != "always" ]]; then
            warn "  ⚠ Weak restart policy: $restart_policy"
            ((total_issues++))
        fi
        
        if [[ $exposed_keys -eq 0 ]]; then
            success "  No critical issues found"
        fi
        
        echo ""
    done <<< "$containers"
    
    echo "════════════════════════════════════════════════════════════════"
    if [[ $total_issues -eq 0 ]]; then
        success "Security audit complete: No issues found"
    else
        warn "Security audit complete: $total_issues issues found"
        echo ""
        info "Recommendations:"
        echo "  1. Migrate API keys to secrets manager or .env file mounts"
        echo "  2. Ensure all containers have resource limits"
        echo "  3. Use 'unless-stopped' restart policy for production"
    fi
    echo "════════════════════════════════════════════════════════════════"
}

# Main command dispatcher
main() {
    local command="${1:-status}"
    shift || true
    
    case "$command" in
        status)
            local watch=false
            [[ "${1:-}" == "--watch" ]] && watch=true
            show_status "$watch"
            ;;
        logs)
            [[ -z "${1:-}" ]] && { error "Usage: $(basename "$0") logs <userId>"; exit 1; }
            show_logs "$1"
            ;;
        restart)
            [[ -z "${1:-}" ]] && { error "Usage: $(basename "$0") restart <userId>"; exit 1; }
            restart_container "$1"
            ;;
        stop)
            [[ -z "${1:-}" ]] && { error "Usage: $(basename "$0") stop <userId>"; exit 1; }
            stop_container "$1"
            ;;
        inspect)
            [[ -z "${1:-}" ]] && { error "Usage: $(basename "$0") inspect <userId>"; exit 1; }
            inspect_container "$1"
            ;;
        versions)
            check_versions
            ;;
        security)
            security_audit
            ;;
        -h|--help|help)
            usage
            ;;
        *)
            error "Unknown command: $command"
            usage
            ;;
    esac
}

main "$@"
