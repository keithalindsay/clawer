#!/bin/bash
# Wrapper script for running maintenance agent with proper environment

# Change to project directory
cd "$(dirname "$0")/.." || exit 1

# Load NVM and use Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null 2>&1

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Run maintenance check
# Note: May require sudo for Docker access depending on system configuration
npx tsx scripts/maintenance-check.ts "$@"
