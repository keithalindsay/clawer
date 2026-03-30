#!/bin/bash
# update-blog-manifest.sh
# Scans all blog post directories and regenerates public/blog-manifest.json
# Run this after adding new blog posts, or add to cron.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"
python3 "$SCRIPT_DIR/gen-blog-manifest.py"
echo "Blog manifest updated at public/blog-manifest.json"
