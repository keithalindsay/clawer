#!/bin/bash
# =============================================================================
# Clawer.ai Marketing Pipeline
# Runs: Dev.to crosspost → Hashnode crosspost → Reddit monitor → Directory status
# Logs to: ~/projects/clawer/logs/marketing-pipeline.log
#
# Usage:
#   ./run-marketing-pipeline.sh              # Full pipeline
#   ./run-marketing-pipeline.sh --dry-run    # Preview mode
#   ./run-marketing-pipeline.sh --reddit-only # Reddit scan only
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/marketing-pipeline.log"

# Parse args
DRY_RUN=false
REDDIT_ONLY=false
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --reddit-only) REDDIT_ONLY=true ;;
  esac
done

# ANSI colors (only when stdout is a terminal)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  GREEN='' YELLOW='' RED='' CYAN='' BOLD='' RESET=''
fi

# =============================================================================
# Helpers
# =============================================================================

mkdir -p "$LOG_DIR"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  local msg="[$(timestamp)] $1"
  echo -e "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log_section() {
  log ""
  log "════════════════════════════════════════"
  log "  $1"
  log "════════════════════════════════════════"
}

run_step() {
  local step_name="$1"
  local cmd="$2"
  local exit_code=0

  log_section "$step_name"

  if [ "$DRY_RUN" = true ]; then
    log "${CYAN}[DRY RUN] Would run: $cmd${RESET}"
    STEP_RESULTS["$step_name"]="DRY_RUN"
    return 0
  fi

  # Run the command, tee output to log and stdout
  eval "$cmd" 2>&1 | tee -a "$LOG_FILE" || exit_code=$?

  if [ $exit_code -eq 0 ]; then
    log "${GREEN}✓ $step_name completed successfully${RESET}"
    STEP_RESULTS["$step_name"]="OK"
  else
    log "${YELLOW}⚠ $step_name exited with code $exit_code (continuing pipeline)${RESET}"
    STEP_RESULTS["$step_name"]="FAILED (exit $exit_code)"
  fi

  # Always return 0 so pipeline continues even on individual failures
  return 0
}

# =============================================================================
# Load env vars if .env exists
# =============================================================================

ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  log "Loading env from $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# =============================================================================
# Python setup
# =============================================================================

PYTHON="python3"
if ! command -v python3 &>/dev/null; then
  log "${RED}ERROR: python3 not found. Please install Python 3.${RESET}"
  exit 1
fi

PYTHON_VERSION=$($PYTHON --version 2>&1)
log "Using: $PYTHON_VERSION"

# Install minimal deps if needed (requests)
if ! $PYTHON -c "import requests" 2>/dev/null; then
  log "${YELLOW}requests not installed — installing...${RESET}"
  $PYTHON -m pip install requests --quiet || log "${YELLOW}Could not install requests (continuing)${RESET}"
fi

# =============================================================================
# Pipeline execution
# =============================================================================

declare -A STEP_RESULTS

START_TIME=$(date +%s)
log ""
log "╔══════════════════════════════════════════╗"
log "║    Clawer.ai Marketing Pipeline          ║"
log "║    $(timestamp)               ║"
log "╚══════════════════════════════════════════╝"

if [ "$DRY_RUN" = true ]; then
  log "${CYAN}Mode: DRY RUN${RESET}"
fi

if [ "$REDDIT_ONLY" = true ]; then
  # ── Reddit only mode ──────────────────────────────────────────────────────
  run_step "Reddit Monitor" "$PYTHON $SCRIPT_DIR/reddit-monitor.py"
else
  # ── Full pipeline ─────────────────────────────────────────────────────────

  # Step 1: Dev.to cross-post
  DEVTO_CMD="$PYTHON $SCRIPT_DIR/devto-crosspost.py"
  [ "$DRY_RUN" = true ] && DEVTO_CMD="$DEVTO_CMD --dry-run"
  run_step "Dev.to Cross-Post" "$DEVTO_CMD"

  # Step 2: Hashnode cross-post
  HASHNODE_CMD="$PYTHON $SCRIPT_DIR/hashnode-crosspost.py"
  [ "$DRY_RUN" = true ] && HASHNODE_CMD="$HASHNODE_CMD --dry-run"
  run_step "Hashnode Cross-Post" "$HASHNODE_CMD"

  # Step 3: Reddit monitor
  REDDIT_CMD="$PYTHON $SCRIPT_DIR/reddit-monitor.py"
  run_step "Reddit Monitor" "$REDDIT_CMD"

  # Step 4: Directory tracker status
  DIR_CMD="$PYTHON $SCRIPT_DIR/directory-tracker.py status"
  run_step "Directory Status" "$DIR_CMD"
fi

# =============================================================================
# Summary
# =============================================================================

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

log ""
log "╔══════════════════════════════════════════╗"
log "║              Pipeline Summary            ║"
log "╚══════════════════════════════════════════╝"

ALL_OK=true
for step in "${!STEP_RESULTS[@]}"; do
  result="${STEP_RESULTS[$step]}"
  if [[ "$result" == "OK" || "$result" == "DRY_RUN" ]]; then
    log "  ${GREEN}✓${RESET} $step: $result"
  else
    log "  ${YELLOW}⚠${RESET} $step: $result"
    ALL_OK=false
  fi
done

log ""
log "Duration: ${ELAPSED}s"
log "Log: $LOG_FILE"

if [ "$ALL_OK" = true ]; then
  log "${GREEN}Pipeline completed successfully.${RESET}"
  exit 0
else
  log "${YELLOW}Pipeline completed with warnings. Check log for details.${RESET}"
  exit 0  # Still exit 0 — individual failures are non-fatal
fi
