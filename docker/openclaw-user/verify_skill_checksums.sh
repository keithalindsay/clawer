#!/bin/bash
# verify_skill_checksums.sh - Verify skill artifact checksums during Docker build
set -euo pipefail

SKILL_NAME="$1"
CHECKSUMS_FILE="$2"
ARTIFACT_FILE="$3"

# Extract expected hash for the .skill artifact
EXPECTED_HASH=$(jq -r --arg file "$(basename "$ARTIFACT_FILE")" '.files[$file].sha256' "$CHECKSUMS_FILE")

if [ -z "$EXPECTED_HASH" ] || [ "$EXPECTED_HASH" = "null" ]; then
    echo "ERROR: Could not find checksum for $(basename "$ARTIFACT_FILE") in $CHECKSUMS_FILE"
    exit 1
fi

# Calculate actual hash
ACTUAL_HASH=$(sha256sum "$ARTIFACT_FILE" | awk '{print $1}')

if [ "$EXPECTED_HASH" != "$ACTUAL_HASH" ]; then
    echo "ERROR: Checksum mismatch for $SKILL_NAME"
    echo "Expected: $EXPECTED_HASH"
    echo "Actual:   $ACTUAL_HASH"
    exit 1
fi

echo "✓ Verified $SKILL_NAME artifact integrity (SHA256: $ACTUAL_HASH)"
