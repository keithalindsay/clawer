#!/bin/bash
# Batch refactor API error responses to use standardized utility

set -e

API_DIR="$HOME/projects/clawer/src/app/api"
ERROR_LIB="@/lib/api-errors"

echo "🔧 Refactoring API error responses..."
echo "Target directory: $API_DIR"
echo ""

# Find all route.ts files (excluding tests)
route_files=$(find "$API_DIR" -name "route.ts" -type f | grep -v "__tests__")

refactored_count=0
total_files=$(echo "$route_files" | wc -l)

for file in $route_files; do
  echo "Processing: ${file#$HOME/projects/clawer/}"
  
  # Check if file already imports from api-errors
  if grep -q "$ERROR_LIB" "$file"; then
    echo "  ✓ Already refactored"
    continue
  fi
  
  # Check if file has any error responses to refactor
  if ! grep -q "NextResponse.json.*error" "$file"; then
    echo "  ⊘ No error responses found"
    continue
  fi
  
  # Create backup
  cp "$file" "$file.bak"
  
  # Add import statement after existing imports
  # Find the last import line and add our import after it
  last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
  
  if [ -n "$last_import_line" ]; then
    # Determine which functions to import based on error patterns in file
    imports=""
    grep -q "status: 401" "$file" && imports="${imports}unauthorized, "
    grep -q "status: 400" "$file" && imports="${imports}badRequest, "
    grep -q "status: 403" "$file" && imports="${imports}forbidden, "
    grep -q "status: 404" "$file" && imports="${imports}notFound, "
    grep -q "status: 429" "$file" && imports="${imports}rateLimited, "
    grep -q "status: 500" "$file" && imports="${imports}serverError, "
    grep -q "status: 503" "$file" && imports="${imports}serviceUnavailable, "
    grep -q "status: 409" "$file" && imports="${imports}conflict, "
    
    # Remove trailing comma and space
    imports=$(echo "$imports" | sed 's/, $//')
    
    if [ -n "$imports" ]; then
      sed -i "${last_import_line}a import { ${imports} } from '$ERROR_LIB';" "$file"
      ((refactored_count++))
      echo "  ✓ Added imports: $imports"
    fi
  fi
done

echo ""
echo "✅ Refactoring complete!"
echo "Files modified: $refactored_count / $total_files"
echo ""
echo "Note: Imports added. Manual replacement of error responses still required."
echo "Run with --help for manual replacement patterns."
