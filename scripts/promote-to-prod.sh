#!/bin/bash
# Promote staging to production
# Usage: ./scripts/promote-to-prod.sh
#
# Workflow:
#   1. Dev work → push to staging branch → auto-deploys to staging.clawer.ai
#   2. Test on staging.clawer.ai
#   3. Run this script → merges staging into main → auto-deploys to clawer.ai
#
set -euo pipefail

echo "🔄 Promoting staging → production..."

# Make sure we're up to date
git fetch origin

# Check staging is ahead of main (has changes to promote)
STAGING_AHEAD=$(git rev-list --count origin/main..origin/staging 2>/dev/null || echo "0")
if [ "$STAGING_AHEAD" = "0" ]; then
  echo "⚠️  Staging has no new commits to promote. Nothing to do."
  exit 0
fi

echo "📊 Staging is $STAGING_AHEAD commit(s) ahead of main"

# Switch to main and merge staging
git checkout main
git pull origin main
git merge origin/staging --no-edit

echo "✅ Merged staging into main"

# Push to trigger production deploy
git push origin main

echo "🚀 Pushed to main — production deploy triggered!"
echo "   Monitor: https://github.com/Aigeninc/clawer/actions"

# Switch back to staging
git checkout staging

echo ""
echo "📋 Deploy flow:"
echo "   staging.clawer.ai → tested ✅ → clawer.ai (deploying now)"
