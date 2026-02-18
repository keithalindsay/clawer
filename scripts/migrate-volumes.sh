#!/usr/bin/env bash
# =============================================================================
# migrate-volumes.sh — Migrate clawer containers to persistent volume mounts
# =============================================================================
#
# WHAT THIS DOES:
#   For each running clawer container (clawer_user_* or clawer_free_tier):
#     1. Copies user data from inside the container to the host filesystem
#     2. Stops and removes the container
#     3. Recreates it with -v volume mounts pointing to the host copy
#     4. Verifies the container becomes healthy
#
# AFTER MIGRATION:
#   - User data persists in /opt/clawer/userdata/{containerName}/
#   - Container recreation (updates, restarts) no longer wipes user data
#   - The entrypoint still regenerates openclaw.json on startup from env vars (GOOD)
#
# ⚠️  IMPORTANT NOTE — AGENTS.md overwrite bug:
#   The entrypoint.sh unconditionally copies the team template AGENTS.md on
#   every container start. With volume mounts, this OVERWRITES user customizations!
#   Fix: modify entrypoint.sh to check `[ ! -f /home/user/clawd/AGENTS.md ]` before copying.
#   The migration script preserves AGENTS.md in the volume, but it WILL be overwritten
#   on next container restart until the entrypoint bug is fixed.
#
# USAGE:
#   ./migrate-volumes.sh [--dry-run] [--container CONTAINER_NAME]
#
#   --dry-run              Show what would happen without making any changes
#   --container NAME       Only migrate a specific container (default: all clawer containers)
#
# ROLLBACK:
#   If a container fails to recreate, the script automatically restores the original
#   container (without volumes) and docker cp's the user data back into it.
#   Backups are kept in /opt/clawer/userdata/{name}/.backup/ for manual recovery.
#
# REQUIREMENTS:
#   - Run as root (or docker group member) on the production server
#   - jq must be installed (apt install jq)
#   - Containers must be named clawer_user_* or clawer_free_tier
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
USERDATA_BASE="/opt/clawer/userdata"
LOG_PREFIX="[migrate-volumes]"
DRY_RUN=false
SPECIFIC_CONTAINER=""
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_INTERVAL=6  # seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------
log()  { echo -e "${BLUE}${LOG_PREFIX}${NC} $*"; }
ok()   { echo -e "${GREEN}${LOG_PREFIX} ✅${NC} $*"; }
warn() { echo -e "${YELLOW}${LOG_PREFIX} ⚠️ ${NC} $*"; }
err()  { echo -e "${RED}${LOG_PREFIX} ❌${NC} $*" >&2; }
dry()  { echo -e "${YELLOW}${LOG_PREFIX} [DRY-RUN]${NC} $*"; }

# ---------------------------------------------------------------------------
# Arg parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --container)
      SPECIFIC_CONTAINER="$2"
      shift 2
      ;;
    -h|--help)
      head -60 "$0" | tail -55  # Print script header as help
      exit 0
      ;;
    *)
      err "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Prerequisites check
# ---------------------------------------------------------------------------
check_prereqs() {
  if ! command -v docker &>/dev/null; then
    err "docker not found in PATH"
    exit 1
  fi
  if ! command -v jq &>/dev/null; then
    err "jq not found. Install with: apt install jq"
    exit 1
  fi
  if [[ "$DRY_RUN" == "false" ]] && [[ $EUID -ne 0 ]]; then
    # Check if user is in docker group
    if ! groups | grep -q docker; then
      warn "Not running as root and not in docker group. May fail."
    fi
  fi
}

# ---------------------------------------------------------------------------
# Get all clawer containers (running only)
# ---------------------------------------------------------------------------
get_clawer_containers() {
  if [[ -n "$SPECIFIC_CONTAINER" ]]; then
    # Verify it exists and is running
    local state
    state=$(docker inspect --format='{{.State.Status}}' "$SPECIFIC_CONTAINER" 2>/dev/null || echo "not_found")
    if [[ "$state" != "running" ]]; then
      err "Container '$SPECIFIC_CONTAINER' is not running (state: $state)"
      exit 1
    fi
    echo "$SPECIFIC_CONTAINER"
  else
    # Find all running clawer containers
    docker ps --format '{{.Names}}' | grep -E '^clawer_(user_|free_tier)' || true
  fi
}

# ---------------------------------------------------------------------------
# Check if container already has volume mounts for user data
# ---------------------------------------------------------------------------
has_volume_mounts() {
  local container_name="$1"
  local mounts
  mounts=$(docker inspect --format='{{range .Mounts}}{{.Destination}} {{end}}' "$container_name" 2>/dev/null || echo "")
  if echo "$mounts" | grep -q "/home/user/.openclaw"; then
    return 0  # already has mounts
  fi
  return 1
}

# ---------------------------------------------------------------------------
# Wait for container to become healthy
# ---------------------------------------------------------------------------
wait_for_healthy() {
  local container_name="$1"
  local max_retries="$HEALTH_CHECK_RETRIES"
  local interval="$HEALTH_CHECK_INTERVAL"

  log "Waiting for $container_name to become healthy (up to $((max_retries * interval))s)..."

  for ((i = 1; i <= max_retries; i++)); do
    local status
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "unknown")

    case "$status" in
      healthy)
        ok "$container_name is healthy"
        return 0
        ;;
      starting)
        log "  Attempt $i/$max_retries: starting... (waiting ${interval}s)"
        ;;
      unhealthy)
        err "$container_name is unhealthy after attempt $i"
        # Show last health check log
        docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "$container_name" 2>/dev/null | tail -5 || true
        if [[ $i -eq $max_retries ]]; then
          return 1
        fi
        ;;
      "")
        # No healthcheck configured — check if running
        local running
        running=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null || echo "false")
        if [[ "$running" == "true" ]]; then
          ok "$container_name is running (no healthcheck configured)"
          return 0
        fi
        ;;
      *)
        log "  Status: $status (attempt $i/$max_retries)"
        ;;
    esac

    sleep "$interval"
  done

  err "$container_name did not become healthy in time"
  return 1
}

# ---------------------------------------------------------------------------
# Save full container inspect to a backup file
# ---------------------------------------------------------------------------
save_inspect() {
  local container_name="$1"
  local backup_dir="$2"
  docker inspect "$container_name" > "${backup_dir}/inspect.json"
  ok "Saved inspect to ${backup_dir}/inspect.json"
}

# ---------------------------------------------------------------------------
# Write container env vars to a temp env file (safe with special chars)
# ---------------------------------------------------------------------------
write_env_file() {
  local inspect_json_file="$1"
  local env_file="$2"
  # Extract env vars from inspect JSON; each line is KEY=VALUE
  jq -r '.[0].Config.Env[]' "$inspect_json_file" > "$env_file"
}

# ---------------------------------------------------------------------------
# Reconstruct the docker run command from a saved inspect JSON
# ---------------------------------------------------------------------------
reconstruct_docker_run() {
  local container_name="$1"
  local inspect_file="$2"
  local env_file="$3"
  local extra_flags="${4:-}"  # e.g., volume mounts

  local image restart_policy

  image=$(jq -r '.[0].Config.Image' "$inspect_file")
  restart_policy=$(jq -r '.[0].HostConfig.RestartPolicy.Name' "$inspect_file")
  # Map RestartPolicy.MaximumRetryCount for on-failure
  local restart_count
  restart_count=$(jq -r '.[0].HostConfig.RestartPolicy.MaximumRetryCount // 0' "$inspect_file")
  if [[ "$restart_policy" == "on-failure" && "$restart_count" -gt 0 ]]; then
    restart_policy="on-failure:${restart_count}"
  fi

  local cmd="docker run -d --name ${container_name}"

  # --- Resource limits ---
  local mem mem_swap nano_cpus pids
  mem=$(jq -r '.[0].HostConfig.Memory // 0' "$inspect_file")
  mem_swap=$(jq -r '.[0].HostConfig.MemorySwap // 0' "$inspect_file")
  nano_cpus=$(jq -r '.[0].HostConfig.NanoCpus // 0' "$inspect_file")
  pids=$(jq -r '.[0].HostConfig.PidsLimit // 0' "$inspect_file")

  [[ "$mem" != "0" ]]       && cmd+=" --memory=${mem}"
  [[ "$mem_swap" != "0" ]]  && cmd+=" --memory-swap=${mem_swap}"
  if [[ "$nano_cpus" != "0" ]]; then
    # Convert nanocpus to decimal CPUs (e.g., 1000000000 -> 1.0)
    local cpus
    cpus=$(awk "BEGIN {printf \"%.2f\", $nano_cpus / 1000000000}")
    cmd+=" --cpus=${cpus}"
  fi
  [[ "$pids" != "0" ]]      && cmd+=" --pids-limit=${pids}"

  # --- Ulimits ---
  while IFS= read -r ulimit_flag; do
    [[ -n "$ulimit_flag" ]] && cmd+=" $ulimit_flag"
  done < <(jq -r '.[0].HostConfig.Ulimits[]? | "--ulimit \(.Name)=\(.Soft):\(.Hard)"' "$inspect_file")

  # --- Security options ---
  while IFS= read -r secopt; do
    [[ -n "$secopt" ]] && cmd+=" --security-opt=${secopt}"
  done < <(jq -r '.[0].HostConfig.SecurityOpt[]?' "$inspect_file")

  # --- Capabilities ---
  while IFS= read -r cap; do
    [[ -n "$cap" ]] && cmd+=" --cap-drop=${cap}"
  done < <(jq -r '.[0].HostConfig.CapDrop[]?' "$inspect_file")

  while IFS= read -r cap; do
    [[ -n "$cap" ]] && cmd+=" --cap-add=${cap}"
  done < <(jq -r '.[0].HostConfig.CapAdd[]?' "$inspect_file")

  # --- Tmpfs ---
  while IFS= read -r tmpfs_flag; do
    [[ -n "$tmpfs_flag" ]] && cmd+=" $tmpfs_flag"
  done < <(jq -r '.[0].HostConfig.Tmpfs | to_entries[]? | "--tmpfs \(.key):\(.value)"' "$inspect_file")

  # --- Port bindings ---
  while IFS= read -r port_flag; do
    [[ -n "$port_flag" ]] && cmd+=" $port_flag"
  done < <(jq -r '.[0].HostConfig.PortBindings | to_entries[]? | .key as $cp | .value[]? | "-p \(.HostIp):\(.HostPort):\($cp)"' "$inspect_file")

  # --- Extra flags (e.g., volume mounts) ---
  [[ -n "$extra_flags" ]] && cmd+=" $extra_flags"

  # --- Env file ---
  cmd+=" --env-file ${env_file}"

  # --- Restart policy ---
  cmd+=" --restart=${restart_policy}"

  # --- Image ---
  cmd+=" ${image}"

  echo "$cmd"
}

# ---------------------------------------------------------------------------
# Rollback a failed migration: restore original container from backup
# ---------------------------------------------------------------------------
rollback() {
  local container_name="$1"
  local backup_dir="$2"
  local env_file="$3"

  warn "Rolling back $container_name to original state..."

  # Remove failed new container if it exists
  if docker ps -a --format '{{.Names}}' | grep -q "^${container_name}$"; then
    log "Removing failed container..."
    docker stop "$container_name" 2>/dev/null || true
    docker rm -f "$container_name" 2>/dev/null || true
  fi

  # Reconstruct original docker run (without volume mounts)
  if [[ ! -f "${backup_dir}/inspect.json" ]]; then
    err "No backup inspect.json found — cannot auto-rollback"
    err "Manual recovery: restore from ${backup_dir}/"
    return 1
  fi

  local orig_cmd
  orig_cmd=$(reconstruct_docker_run "$container_name" "${backup_dir}/inspect.json" "$env_file" "")

  log "Recreating original container (no volume mounts)..."
  log "  CMD: $orig_cmd"
  eval "$orig_cmd"

  # Wait for container to come up
  sleep 3

  # Restore user data back into the container (from our backup copy on host)
  if [[ -d "${backup_dir}/.openclaw" ]]; then
    log "Restoring .openclaw data into container..."
    docker cp "${backup_dir}/.openclaw" "${container_name}:/home/user/"
  fi
  if [[ -d "${backup_dir}/clawd" ]]; then
    log "Restoring clawd data into container..."
    docker cp "${backup_dir}/clawd" "${container_name}:/home/user/"
  fi

  ok "Rollback complete for $container_name"
  warn "Container is restored WITHOUT volume mounts (data is back inside container)"
}

# ---------------------------------------------------------------------------
# Migrate a single container
# ---------------------------------------------------------------------------
migrate_container() {
  local container_name="$1"
  local userdata_dir="${USERDATA_BASE}/${container_name}"
  local backup_dir="${userdata_dir}/.backup/$(date +%Y%m%d_%H%M%S)"
  local env_file

  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Processing: $container_name"
  log "User data dir: $userdata_dir"

  # --- Check if already migrated ---
  if has_volume_mounts "$container_name"; then
    warn "$container_name already has volume mounts — skipping"
    return 0
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    dry "Would create host dirs: ${userdata_dir}/.openclaw/ and ${userdata_dir}/clawd/"
    dry "Would docker cp from $container_name: .openclaw/ and clawd/"
    dry "Would stop and remove container $container_name"
    dry "Would recreate with:"
    dry "  -v ${userdata_dir}/.openclaw:/home/user/.openclaw"
    dry "  -v ${userdata_dir}/clawd:/home/user/clawd"
    dry "Would verify healthy"
    return 0
  fi

  # --- Step 1: Create host backup/data directories ---
  log "Step 1: Creating host directories..."
  mkdir -p "${userdata_dir}" "${backup_dir}"
  ok "Directories created"

  # --- Step 2: Save inspect JSON (needed for rollback + reconstruction) ---
  log "Step 2: Saving container inspect (for rollback)..."
  save_inspect "$container_name" "$backup_dir"

  # --- Step 3: Write env file for rollback ---
  env_file="${backup_dir}/container.env"
  write_env_file "${backup_dir}/inspect.json" "$env_file"
  ok "Env file saved to $env_file"

  # --- Step 4: Copy user data FROM container TO host ---
  log "Step 4: Copying user data from container to host..."

  # Copy .openclaw directory
  if docker exec "$container_name" test -d /home/user/.openclaw 2>/dev/null; then
    docker cp "${container_name}:/home/user/.openclaw" "${userdata_dir}/"
    ok "Copied .openclaw → ${userdata_dir}/.openclaw/"
  else
    warn ".openclaw not found in container — creating empty dir"
    mkdir -p "${userdata_dir}/.openclaw"
  fi

  # Copy clawd directory
  if docker exec "$container_name" test -d /home/user/clawd 2>/dev/null; then
    docker cp "${container_name}:/home/user/clawd" "${userdata_dir}/"
    ok "Copied clawd → ${userdata_dir}/clawd/"
  else
    warn "clawd not found in container — creating empty dir"
    mkdir -p "${userdata_dir}/clawd"
  fi

  # Also copy to backup dir (for rollback recovery)
  [[ -d "${userdata_dir}/.openclaw" ]] && cp -r "${userdata_dir}/.openclaw" "${backup_dir}/"
  [[ -d "${userdata_dir}/clawd" ]]    && cp -r "${userdata_dir}/clawd"    "${backup_dir}/"
  ok "Backup saved to $backup_dir"

  # --- Step 5: Stop the container ---
  log "Step 5: Stopping container $container_name..."
  docker stop "$container_name"
  ok "Container stopped"

  # --- Step 6: Remove the container ---
  log "Step 6: Removing container $container_name..."
  docker rm "$container_name"
  ok "Container removed"

  # --- Step 7: Recreate with volume mounts ---
  log "Step 7: Recreating container with volume mounts..."

  # Write fresh env file for new container (same env vars)
  local new_env_file
  new_env_file="${userdata_dir}/.container.env"
  cp "$env_file" "$new_env_file"

  # Build volume mount flags
  local volume_flags="-v ${userdata_dir}/.openclaw:/home/user/.openclaw -v ${userdata_dir}/clawd:/home/user/clawd"

  # Reconstruct docker run command
  local docker_cmd
  docker_cmd=$(reconstruct_docker_run "$container_name" "${backup_dir}/inspect.json" "$new_env_file" "$volume_flags")

  log "Executing: $docker_cmd"

  # Run the new container
  if ! eval "$docker_cmd"; then
    err "Failed to recreate container $container_name"
    rollback "$container_name" "$backup_dir" "$env_file"
    return 1
  fi

  ok "Container recreated with volume mounts"

  # --- Step 8: Verify container is healthy ---
  log "Step 8: Verifying container health..."
  if ! wait_for_healthy "$container_name"; then
    err "$container_name failed health check after recreation"
    warn "Container logs (last 20 lines):"
    docker logs --tail 20 "$container_name" 2>&1 || true
    rollback "$container_name" "$backup_dir" "$env_file"
    return 1
  fi

  # --- Done ---
  ok "✅ Migration complete for $container_name"
  log "  User data: ${userdata_dir}/"
  log "  Backup:    ${backup_dir}/"
  log "  Volume mounts:"
  log "    .openclaw → ${userdata_dir}/.openclaw:/home/user/.openclaw"
  log "    clawd     → ${userdata_dir}/clawd:/home/user/clawd"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  check_prereqs

  if [[ "$DRY_RUN" == "true" ]]; then
    warn "DRY-RUN MODE — no changes will be made"
    echo ""
  fi

  log "Clawer Container Volume Migration"
  log "User data base: $USERDATA_BASE"
  echo ""

  # Get list of containers to process
  local containers
  mapfile -t containers < <(get_clawer_containers)

  if [[ ${#containers[@]} -eq 0 ]]; then
    warn "No running clawer containers found"
    exit 0
  fi

  log "Found ${#containers[@]} container(s) to process:"
  for c in "${containers[@]}"; do
    log "  - $c"
  done
  echo ""

  local success_count=0
  local skip_count=0
  local fail_count=0
  local failed_containers=()

  for container_name in "${containers[@]}"; do
    if migrate_container "$container_name"; then
      ((success_count++)) || true
    else
      ((fail_count++)) || true
      failed_containers+=("$container_name")
    fi
    echo ""
  done

  # --- Summary ---
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Migration Summary:"
  ok "  Migrated:  $success_count"
  warn "  Skipped:   $skip_count"
  if [[ $fail_count -gt 0 ]]; then
    err "  Failed:    $fail_count"
    for c in "${failed_containers[@]}"; do
      err "    - $c (check ${USERDATA_BASE}/${c}/.backup/ for recovery data)"
    done
    exit 1
  else
    ok "All containers migrated successfully!"
  fi
}

main "$@"
