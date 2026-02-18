#!/usr/bin/env bash
# =============================================================================
# update-containers.sh — Build a new clawer image and update all containers
# =============================================================================
#
# WHAT THIS DOES:
#   1. Builds a new Docker image from the Dockerfile
#   2. Acquires the OpenClaw npm package tgz for the requested version
#   3. Updates each running clawer container to use the new image
#   4. Verifies each container becomes healthy
#
# ⚠️  IMPORTANT NOTE — AGENTS.md overwrite bug:
#   The entrypoint.sh unconditionally copies the team template AGENTS.md on
#   every container start. With volume mounts, this will overwrite user-
#   customized AGENTS.md on every container update/restart.
#   FIX: In entrypoint.sh, change the cp line to:
#     [ -f /home/user/clawd/AGENTS.md ] || cp "$TEAM_DIR/AGENTS.md" /home/user/clawd/AGENTS.md
#   This is a known issue. Fix the entrypoint before running updates in production.
#
# USAGE:
#   ./update-containers.sh <version|latest> [--dry-run] [--rollback <version>]
#
#   version       Version to build, e.g. v2026.2.18 or 2026.2.18
#   latest        Detect latest available tgz in the docker dir
#   --dry-run     Show what would happen without making any changes
#   --rollback v  Roll all containers back to image clawer-openclaw:<v>
#
# EXAMPLES:
#   ./update-containers.sh v2026.2.18
#   ./update-containers.sh v2026.2.18 --dry-run
#   ./update-containers.sh --rollback v2026.2.16
#
# HOW IMAGE IS OBTAINED:
#   Priority order:
#     1. Use existing .tgz in docker/openclaw-user/ if it matches the version
#     2. Run: npm pack openclaw@{version} (downloads from npm registry)
#   If neither works, the script exits with an error and instructions.
#
# REQUIREMENTS:
#   - Run as root (or docker group member) on the production server
#   - jq must be installed (apt install jq)
#   - npm must be installed
#   - Containers must already have volume mounts (run migrate-volumes.sh first)
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DOCKER_DIR="/home/keith/projects/clawer/docker/openclaw-user"
USERDATA_BASE="/opt/clawer/userdata"
IMAGE_NAME="clawer-openclaw"
LOG_PREFIX="[update-containers]"
DRY_RUN=false
ROLLBACK_VERSION=""
TARGET_VERSION=""
HEALTH_CHECK_RETRIES=12
HEALTH_CHECK_INTERVAL=10  # seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------
log()  { echo -e "${BLUE}${LOG_PREFIX}${NC} $*"; }
ok()   { echo -e "${GREEN}${LOG_PREFIX} ✅${NC} $*"; }
warn() { echo -e "${YELLOW}${LOG_PREFIX} ⚠️ ${NC} $*"; }
err()  { echo -e "${RED}${LOG_PREFIX} ❌${NC} $*" >&2; }
dry()  { echo -e "${YELLOW}${LOG_PREFIX} [DRY-RUN]${NC} $*"; }
info() { echo -e "${CYAN}${LOG_PREFIX}${NC} $*"; }

# ---------------------------------------------------------------------------
# Arg parsing
# ---------------------------------------------------------------------------
parse_args() {
  if [[ $# -eq 0 ]]; then
    err "Usage: $0 <version|latest> [--dry-run] [--rollback <version>]"
    err "Example: $0 v2026.2.18"
    err "Example: $0 --rollback v2026.2.16"
    exit 1
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --rollback)
        if [[ -z "${2:-}" ]]; then
          err "--rollback requires a version argument"
          exit 1
        fi
        ROLLBACK_VERSION="$2"
        shift 2
        ;;
      -h|--help)
        head -75 "$0" | tail -70
        exit 0
        ;;
      -*)
        err "Unknown flag: $1"
        exit 1
        ;;
      *)
        if [[ -z "$TARGET_VERSION" ]]; then
          TARGET_VERSION="$1"
        else
          err "Unexpected argument: $1"
          exit 1
        fi
        shift
        ;;
    esac
  done

  # Rollback mode doesn't need a version arg
  if [[ -n "$ROLLBACK_VERSION" ]]; then
    TARGET_VERSION="$ROLLBACK_VERSION"
  elif [[ -z "$TARGET_VERSION" ]]; then
    err "No version specified"
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Normalize version: strip leading 'v' for npm, keep 'v' for image tags
# ---------------------------------------------------------------------------
normalize_version() {
  local raw="$1"
  # Remove leading 'v' if present
  echo "${raw#v}"
}

image_tag() {
  local ver="$1"
  # Always use 'v' prefix for image tags
  if [[ "$ver" == v* ]]; then
    echo "${IMAGE_NAME}:${ver}"
  else
    echo "${IMAGE_NAME}:v${ver}"
  fi
}

# ---------------------------------------------------------------------------
# Prerequisites check
# ---------------------------------------------------------------------------
check_prereqs() {
  local missing=()

  command -v docker &>/dev/null || missing+=("docker")
  command -v jq     &>/dev/null || missing+=("jq")

  if [[ -z "$ROLLBACK_VERSION" ]]; then
    # Only needed for build
    command -v npm    &>/dev/null || missing+=("npm")
  fi

  if [[ ${#missing[@]} -gt 0 ]]; then
    err "Missing required tools: ${missing[*]}"
    err "Install with: apt install ${missing[*]}"
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Get all running clawer containers
# ---------------------------------------------------------------------------
get_clawer_containers() {
  docker ps --format '{{.Names}}' | grep -E '^clawer_(user_|free_tier)' || true
}

# ---------------------------------------------------------------------------
# Find or download the tgz for the given version
# Returns the full path to the tgz
# ---------------------------------------------------------------------------
acquire_tgz() {
  local npm_version="$1"  # without leading 'v'
  local docker_dir="$2"
  local tgz_name="openclaw-${npm_version}.tgz"
  local tgz_path="${docker_dir}/${tgz_name}"

  # 1. Check if already present in docker dir
  if [[ -f "$tgz_path" ]]; then
    ok "Found existing tgz: $tgz_path"
    echo "$tgz_path"
    return 0
  fi

  # 2. Try npm pack
  log "Tgz not found locally. Attempting: npm pack openclaw@${npm_version}"
  local prev_dir
  prev_dir=$(pwd)
  cd "$docker_dir"

  if npm pack "openclaw@${npm_version}" 2>/dev/null; then
    # npm pack produces openclaw-<version>.tgz
    local packed
    packed=$(ls -t openclaw-*.tgz 2>/dev/null | head -1)
    if [[ -n "$packed" && -f "$packed" ]]; then
      ok "npm pack succeeded: $packed"
      cd "$prev_dir"
      echo "${docker_dir}/${packed}"
      return 0
    fi
  fi

  cd "$prev_dir"

  err "Could not obtain openclaw tgz for version ${npm_version}"
  err "Tried:"
  err "  1. ${tgz_path} (not found)"
  err "  2. npm pack openclaw@${npm_version} (failed)"
  err ""
  err "Manual options:"
  err "  a) Place the tgz at: ${tgz_path}"
  err "  b) Run: cd ${docker_dir} && npm pack openclaw@${npm_version}"
  err "  c) Download from: https://registry.npmjs.org/openclaw/-/openclaw-${npm_version}.tgz"
  err "     and place it in: ${docker_dir}/"
  exit 1
}

# ---------------------------------------------------------------------------
# Detect latest version (newest tgz in docker dir)
# ---------------------------------------------------------------------------
detect_latest_version() {
  local docker_dir="$1"
  local latest
  # Sort by version number (newest first), extract version
  latest=$(ls "${docker_dir}"/openclaw-*.tgz 2>/dev/null | \
    sort -t'-' -k2 -V | tail -1 | \
    sed 's|.*/openclaw-||; s|\.tgz$||')

  if [[ -z "$latest" ]]; then
    err "No openclaw-*.tgz found in ${docker_dir}/"
    exit 1
  fi

  echo "$latest"
}

# ---------------------------------------------------------------------------
# Update Dockerfile to reference the correct tgz filename
# ---------------------------------------------------------------------------
update_dockerfile() {
  local docker_dir="$1"
  local tgz_name="$2"  # e.g., openclaw-2026.2.18.tgz
  local dockerfile="${docker_dir}/Dockerfile"

  log "Updating Dockerfile to use: $tgz_name"

  # Replace the COPY and RUN lines that reference the old tgz
  # Pattern: COPY openclaw-*.tgz /tmp/
  sed -i.bak \
    -e "s|COPY openclaw-[0-9.]\\+\\(-[0-9]\\+\\)\\?\.tgz /tmp/|COPY ${tgz_name} /tmp/|g" \
    -e "s|npm install -g /tmp/openclaw-[0-9.]\\+\\(-[0-9]\\+\\)\\?\.tgz|npm install -g /tmp/${tgz_name}|g" \
    "$dockerfile"

  ok "Dockerfile updated (backup: ${dockerfile}.bak)"
}

# ---------------------------------------------------------------------------
# Build the Docker image
# ---------------------------------------------------------------------------
build_image() {
  local docker_dir="$1"
  local image_tag="$2"
  local tgz_path="$3"

  log "Building Docker image: $image_tag"
  log "  Context: $docker_dir"
  log "  Tgz: $tgz_path"

  if [[ "$DRY_RUN" == "true" ]]; then
    dry "Would run: docker build -t ${image_tag} ${docker_dir}"
    return 0
  fi

  # Ensure tgz is in the build context
  local tgz_name
  tgz_name=$(basename "$tgz_path")
  if [[ "$tgz_path" != "${docker_dir}/${tgz_name}" ]]; then
    log "Copying tgz to build context..."
    cp "$tgz_path" "${docker_dir}/${tgz_name}"
  fi

  # Build with progress output
  docker build \
    --progress=plain \
    -t "${image_tag}" \
    "${docker_dir}" 2>&1 | tee /tmp/docker-build-${image_tag//[:\/ ]/_}.log

  local exit_code=${PIPESTATUS[0]}
  if [[ $exit_code -ne 0 ]]; then
    err "Docker build failed (exit code $exit_code)"
    err "Build log: /tmp/docker-build-${image_tag//[:\/ ]/_}.log"
    exit 1
  fi

  ok "Image built: $image_tag"
}

# ---------------------------------------------------------------------------
# Wait for container health
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
        err "$container_name is unhealthy"
        docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "$container_name" 2>/dev/null | tail -5 || true
        if [[ $i -ge $max_retries ]]; then
          return 1
        fi
        ;;
      "")
        local running
        running=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null || echo "false")
        if [[ "$running" == "true" ]]; then
          ok "$container_name is running (no healthcheck)"
          return 0
        fi
        ;;
      *)
        log "  Status: $status (attempt $i/$max_retries)"
        ;;
    esac

    sleep "$interval"
  done

  return 1
}

# ---------------------------------------------------------------------------
# Save container env vars to file
# ---------------------------------------------------------------------------
write_env_file() {
  local inspect_file="$1"
  local env_file="$2"
  jq -r '.[0].Config.Env[]' "$inspect_file" > "$env_file"
}

# ---------------------------------------------------------------------------
# Reconstruct docker run command from inspect JSON
# ---------------------------------------------------------------------------
reconstruct_docker_run() {
  local container_name="$1"
  local inspect_file="$2"
  local new_image="$3"
  local env_file="$4"

  local restart_policy
  restart_policy=$(jq -r '.[0].HostConfig.RestartPolicy.Name' "$inspect_file")
  local restart_count
  restart_count=$(jq -r '.[0].HostConfig.RestartPolicy.MaximumRetryCount // 0' "$inspect_file")
  if [[ "$restart_policy" == "on-failure" && "$restart_count" -gt 0 ]]; then
    restart_policy="on-failure:${restart_count}"
  fi

  local cmd="docker run -d --name ${container_name}"

  # Resource limits
  local mem mem_swap nano_cpus pids
  mem=$(jq -r '.[0].HostConfig.Memory // 0' "$inspect_file")
  mem_swap=$(jq -r '.[0].HostConfig.MemorySwap // 0' "$inspect_file")
  nano_cpus=$(jq -r '.[0].HostConfig.NanoCpus // 0' "$inspect_file")
  pids=$(jq -r '.[0].HostConfig.PidsLimit // 0' "$inspect_file")

  [[ "$mem" != "0" ]]      && cmd+=" --memory=${mem}"
  [[ "$mem_swap" != "0" ]] && cmd+=" --memory-swap=${mem_swap}"
  if [[ "$nano_cpus" != "0" ]]; then
    local cpus
    cpus=$(awk "BEGIN {printf \"%.2f\", $nano_cpus / 1000000000}")
    cmd+=" --cpus=${cpus}"
  fi
  [[ "$pids" != "0" ]] && cmd+=" --pids-limit=${pids}"

  # Ulimits
  while IFS= read -r ul; do
    [[ -n "$ul" ]] && cmd+=" $ul"
  done < <(jq -r '.[0].HostConfig.Ulimits[]? | "--ulimit \(.Name)=\(.Soft):\(.Hard)"' "$inspect_file")

  # Security
  while IFS= read -r sec; do
    [[ -n "$sec" ]] && cmd+=" --security-opt=${sec}"
  done < <(jq -r '.[0].HostConfig.SecurityOpt[]?' "$inspect_file")

  # Caps
  while IFS= read -r cap; do
    [[ -n "$cap" ]] && cmd+=" --cap-drop=${cap}"
  done < <(jq -r '.[0].HostConfig.CapDrop[]?' "$inspect_file")

  while IFS= read -r cap; do
    [[ -n "$cap" ]] && cmd+=" --cap-add=${cap}"
  done < <(jq -r '.[0].HostConfig.CapAdd[]?' "$inspect_file")

  # Tmpfs
  while IFS= read -r tf; do
    [[ -n "$tf" ]] && cmd+=" $tf"
  done < <(jq -r '.[0].HostConfig.Tmpfs | to_entries[]? | "--tmpfs \(.key):\(.value)"' "$inspect_file")

  # Ports
  while IFS= read -r port; do
    [[ -n "$port" ]] && cmd+=" $port"
  done < <(jq -r '.[0].HostConfig.PortBindings | to_entries[]? | .key as $cp | .value[]? | "-p \(.HostIp):\(.HostPort):\($cp)"' "$inspect_file")

  # Volume mounts (preserve existing ones)
  while IFS= read -r vol; do
    [[ -n "$vol" ]] && cmd+=" $vol"
  done < <(jq -r '.[0].HostConfig.Binds[]?' "$inspect_file" | awk '{print "-v "$0}')

  # Env file
  cmd+=" --env-file ${env_file}"

  # Restart
  cmd+=" --restart=${restart_policy}"

  # New image
  cmd+=" ${new_image}"

  echo "$cmd"
}

# ---------------------------------------------------------------------------
# Update a single container to the new image
# ---------------------------------------------------------------------------
update_container() {
  local container_name="$1"
  local new_image="$2"
  local old_image
  local inspect_file
  local env_file

  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Updating: $container_name → $new_image"

  # Save current inspect
  inspect_file=$(mktemp /tmp/clawer-inspect-XXXXXX.json)
  env_file=$(mktemp /tmp/clawer-env-XXXXXX)
  trap "rm -f $inspect_file $env_file" RETURN

  docker inspect "$container_name" > "$inspect_file"
  write_env_file "$inspect_file" "$env_file"
  old_image=$(jq -r '.[0].Config.Image' "$inspect_file")

  log "  Current image: $old_image"
  log "  New image:     $new_image"

  # Check if already on this image
  if [[ "$old_image" == "$new_image" ]]; then
    warn "$container_name already running $new_image — skipping"
    return 0
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    dry "Would stop, remove, and recreate $container_name with image $new_image"
    dry "  Old image: $old_image"
    dry "  New image: $new_image"
    # Show volume mounts it would preserve
    local mounts
    mounts=$(docker inspect --format='{{range .Mounts}}  -v {{.Source}}:{{.Destination}} {{end}}' "$container_name")
    dry "  Volume mounts preserved: $mounts"
    return 0
  fi

  # Stop
  log "Stopping $container_name..."
  docker stop "$container_name"
  ok "Stopped"

  # Remove
  log "Removing $container_name..."
  docker rm "$container_name"
  ok "Removed"

  # Reconstruct run command with new image
  local docker_cmd
  docker_cmd=$(reconstruct_docker_run "$container_name" "$inspect_file" "$new_image" "$env_file")

  log "Recreating with new image..."
  log "  CMD: $docker_cmd"

  if ! eval "$docker_cmd"; then
    err "Failed to recreate $container_name with $new_image"
    warn "Attempting rollback to $old_image..."

    # Try to restore with old image
    local rollback_cmd
    rollback_cmd=$(reconstruct_docker_run "$container_name" "$inspect_file" "$old_image" "$env_file")
    if eval "$rollback_cmd"; then
      warn "Rolled back $container_name to $old_image"
    else
      err "CRITICAL: Could not rollback $container_name! Manual intervention required."
      err "Inspect JSON saved at: $inspect_file (copy before it's deleted)"
      err "Env file saved at: $env_file (copy before it's deleted)"
      trap - RETURN  # Don't delete temp files
    fi
    return 1
  fi

  ok "Container recreated"

  # Verify health
  if ! wait_for_healthy "$container_name"; then
    err "$container_name failed health check after update"
    docker logs --tail 30 "$container_name" 2>&1 | tail -30 || true
    warn "Attempting rollback to $old_image..."

    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true
    local rollback_cmd
    rollback_cmd=$(reconstruct_docker_run "$container_name" "$inspect_file" "$old_image" "$env_file")
    if eval "$rollback_cmd"; then
      warn "Rolled back $container_name to $old_image"
    else
      err "CRITICAL: Rollback failed for $container_name!"
    fi
    return 1
  fi

  ok "✅ $container_name updated to $new_image"
}

# ---------------------------------------------------------------------------
# Rollback mode: switch all containers to a previous image
# ---------------------------------------------------------------------------
do_rollback() {
  local rollback_version="$1"
  local rollback_image
  rollback_image=$(image_tag "$rollback_version")

  # Verify the image exists
  if ! docker image inspect "$rollback_image" &>/dev/null; then
    err "Rollback image not found: $rollback_image"
    err "Available clawer images:"
    docker images "${IMAGE_NAME}" --format '  {{.Repository}}:{{.Tag}} ({{.CreatedAt}})' || true
    exit 1
  fi

  warn "ROLLBACK MODE: Rolling all containers back to $rollback_image"
  echo ""

  local containers
  mapfile -t containers < <(get_clawer_containers)

  if [[ ${#containers[@]} -eq 0 ]]; then
    warn "No running clawer containers found"
    exit 0
  fi

  local success=0
  local fail=0

  for container_name in "${containers[@]}"; do
    if update_container "$container_name" "$rollback_image"; then
      ((success++)) || true
    else
      ((fail++)) || true
    fi
    echo ""
  done

  log "Rollback Summary: $success succeeded, $fail failed"
  [[ $fail -gt 0 ]] && exit 1 || exit 0
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  parse_args "$@"
  check_prereqs

  if [[ "$DRY_RUN" == "true" ]]; then
    warn "DRY-RUN MODE — no changes will be made"
    echo ""
  fi

  # Rollback mode
  if [[ -n "$ROLLBACK_VERSION" ]]; then
    do_rollback "$ROLLBACK_VERSION"
    return
  fi

  # Resolve 'latest' to a version
  local npm_version
  if [[ "$TARGET_VERSION" == "latest" ]]; then
    npm_version=$(detect_latest_version "$DOCKER_DIR")
    log "Detected latest version: $npm_version"
  else
    npm_version=$(normalize_version "$TARGET_VERSION")
  fi

  local target_image
  target_image=$(image_tag "$npm_version")

  log "Clawer Container Update"
  log "  Target version: $npm_version"
  log "  Target image:   $target_image"
  log "  Docker dir:     $DOCKER_DIR"
  echo ""

  # --- Step 1: Acquire the tgz ---
  log "Step 1: Acquiring openclaw package tgz..."
  local tgz_path
  if [[ "$DRY_RUN" == "true" ]]; then
    dry "Would acquire: openclaw-${npm_version}.tgz"
    tgz_path="${DOCKER_DIR}/openclaw-${npm_version}.tgz"
  else
    tgz_path=$(acquire_tgz "$npm_version" "$DOCKER_DIR")
  fi
  echo ""

  # --- Step 2: Update Dockerfile ---
  log "Step 2: Updating Dockerfile..."
  local tgz_name
  tgz_name=$(basename "$tgz_path")
  if [[ "$DRY_RUN" == "true" ]]; then
    dry "Would update Dockerfile to reference: $tgz_name"
  else
    update_dockerfile "$DOCKER_DIR" "$tgz_name"
  fi
  echo ""

  # --- Step 3: Build image ---
  log "Step 3: Building image $target_image..."
  build_image "$DOCKER_DIR" "$target_image" "$tgz_path"
  echo ""

  # --- Step 4: Update containers ---
  log "Step 4: Updating running containers..."
  local containers
  mapfile -t containers < <(get_clawer_containers)

  if [[ ${#containers[@]} -eq 0 ]]; then
    warn "No running clawer containers found"
    log "Image built but no containers to update."
    exit 0
  fi

  log "Found ${#containers[@]} container(s) to update:"
  for c in "${containers[@]}"; do
    log "  - $c"
  done
  echo ""

  local success=0
  local fail=0
  local failed_containers=()

  for container_name in "${containers[@]}"; do
    if update_container "$container_name" "$target_image"; then
      ((success++)) || true
    else
      ((fail++)) || true
      failed_containers+=("$container_name")
    fi
    echo ""
  done

  # --- Summary ---
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Update Summary:"
  ok "  Updated: $success"
  if [[ $fail -gt 0 ]]; then
    err "  Failed:  $fail"
    for c in "${failed_containers[@]}"; do
      err "    - $c"
    done
    err ""
    err "To rollback all containers: $0 --rollback <previous_version>"
    exit 1
  else
    ok "All containers updated to $target_image"
    log ""
    info "Previous image (for rollback): kept as $IMAGE_NAME (was running in containers)"
    info "To rollback: $0 --rollback v<previous_version>"
  fi
}

main "$@"
