#!/bin/bash
# ============================================================================
# check-openclaw-version-cron.sh — Cron wrapper for version check
# ============================================================================
# This wrapper runs the version check and sends a notification to Keith
# ONLY when updates are needed (silent on success).
#
# Add to crontab (weekly, Mondays 09:00 CST):
#   0 9 * * 1 /home/keith/projects/clawer/scripts/check-openclaw-version-cron.sh
#
# To install cron, run:
#   crontab -e
# And add the line above.
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_SCRIPT="$SCRIPT_DIR/check-openclaw-version.sh"
LOG_DIR="$(dirname "$SCRIPT_DIR")/logs"
STATUS_FILE="$LOG_DIR/version-check-status.json"

# Run the check (quiet mode - captures exit code only, log still written)
"$VERSION_SCRIPT" --quiet
EXIT_CODE=$?

# If updates needed (exit 1), alert via OpenClaw notification
if [ "$EXIT_CODE" -ne 0 ]; then
    # Read the status JSON for details
    if [ -f "$STATUS_FILE" ] && command -v python3 &>/dev/null; then
        REPORT=$(python3 - <<'PYEOF'
import json, sys
with open("$STATUS_FILE") as f:
    d = json.load(f)

lines = ["🔍 OpenClaw Version Check — Update Needed!"]
lines.append(f"Latest available: {d['latest_version']}")
lines.append(f"Local install:    {d['local_version']} {'✅' if d['local_up_to_date'] else '⚠️ BEHIND'}")
lines.append(f"Docker image:     {d['docker_version']} {'✅' if d['docker_up_to_date'] else '⚠️ BEHIND'}")
if d.get('recommendations'):
    lines.append("")
    lines.append("Recommendations:")
    for r in d['recommendations']:
        lines.append(f"  → {r}")
print('\n'.join(lines))
PYEOF
        STATUS_FILE="$STATUS_FILE" python3 - <<'PYEOF'
import json, sys, os
f = os.environ.get("STATUS_FILE", "")
with open(f) as fp:
    d = json.load(fp)

lines = ["🔍 OpenClaw Version Check — Update Needed!"]
lines.append(f"Latest available: {d['latest_version']}")
lines.append(f"Local install:    {d['local_version']} {'✅' if d['local_up_to_date'] else '⚠️ BEHIND'}")
lines.append(f"Docker image:     {d['docker_version']} {'✅' if d['docker_up_to_date'] else '⚠️ BEHIND'}")
if d.get('recommendations'):
    lines.append("")
    lines.append("Recommendations:")
    for r in d['recommendations']:
        lines.append(f"  → {r}")
print('\n'.join(lines))
PYEOF
    else
        REPORT="OpenClaw version check: updates available. Check $LOG_DIR/version-check.log"
    fi

    # --- Notification methods (use whichever is configured) ---

    # Method 1: Write to a special "needs-attention" file that OpenClaw AI monitors
    echo "$REPORT" > "$LOG_DIR/version-check-NEEDS-UPDATE.txt"
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Update needed. Alert written to $LOG_DIR/version-check-NEEDS-UPDATE.txt" \
        >> "$LOG_DIR/version-check-cron.log"

    # Method 2: Desktop notification (if running locally with display)
    if command -v notify-send &>/dev/null && [ -n "${DISPLAY:-}" ]; then
        notify-send "OpenClaw Update Available" "$REPORT" --icon=software-update-available
    fi

    # Method 3: System logger (visible in journalctl)
    logger -t "clawer-version-check" "OpenClaw update available: latest=$( \
        python3 -c "import json; d=json.load(open('$STATUS_FILE')); print(d.get('latest_version','?'))" 2>/dev/null \
    )"

    exit 1
else
    # All up to date - clean up any previous alert file
    rm -f "$LOG_DIR/version-check-NEEDS-UPDATE.txt"
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] All up to date. No action needed." \
        >> "$LOG_DIR/version-check-cron.log"
    exit 0
fi
