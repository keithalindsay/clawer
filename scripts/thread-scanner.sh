#!/usr/bin/env bash
# ============================================================
# Thread Hijack Scanner — find OpenClaw threads worth engaging
# Scans X/Twitter, Reddit (via SearXNG), and Hacker News (API)
# Usage: ./thread-scanner.sh [--quiet]
# ============================================================

set -euo pipefail

# ── Config ──────────────────────────────────────────────────
SEARXNG="http://localhost:8888"
HN_API="https://hn.algolia.com/api/v1"
LOGS_DIR="/home/keith/projects/clawer/logs"
DATE=$(date +%Y-%m-%d)
DATETIME=$(date "+%Y-%m-%d %H:%M %Z")
OUTFILE="${LOGS_DIR}/thread-scan-${DATE}.md"
TMPDIR_WORK=$(mktemp -d)
QUIET=false

# Cleanup temp on exit
trap 'rm -rf "$TMPDIR_WORK"' EXIT

# ── Args ────────────────────────────────────────────────────
for arg in "$@"; do
  [[ "$arg" == "--quiet" ]] && QUIET=true
done

# ── Output helper ───────────────────────────────────────────
out() {
  if [[ "$QUIET" == "false" ]]; then
    echo "$@"
  fi
}

# ── Keywords ────────────────────────────────────────────────
declare -a KEYWORDS=(
  "openclaw hosting"
  "openclaw setup"
  "host openclaw"
  "managed openclaw"
  "simpleclaw"
  "openclaw docker"
  "openclaw VPS"
  "AI agent hosting"
  "openclaw help"
  "openclaw alternative"
)

# ── Scoring ─────────────────────────────────────────────────
# Returns a score 1-10 and a reason string
# Output: "SCORE|REASON|ANGLE"
score_result() {
  local title="$1"
  local content="$2"
  local url="$3"
  local combined
  combined=$(echo "${title} ${content}" | tr '[:upper:]' '[:lower:]')

  # Competitor complaints / hosting pain → 9-10
  if echo "$combined" | grep -qE 'simpleclaw|competitor|alternative to openclaw|openclaw alternative|switch from|replace openclaw'; then
    echo "9|User comparing or switching away from competitor|Introduce Clawer as the managed alternative — zero-config, no Docker headaches"
    return
  fi
  if echo "$combined" | grep -qE 'cant host|can'"'"'t host|hard to host|hosting (is |is )?hard|docker (is )?painful|hate docker|docker fail|deploy fail|install fail'; then
    echo "10|User frustrated with self-hosting difficulty|Offer Clawer as the one-click managed solution — no Docker, no VPS wrangling"
    return
  fi

  # Direct questions about OpenClaw hosting → 8-9
  if echo "$combined" | grep -qE 'how (do i|to) host openclaw|best way to host openclaw|openclaw (managed|cloud|saas|hosted)|managed openclaw|openclaw hosting'; then
    echo "8|Direct question about hosting OpenClaw|Answer the question helpfully, then mention Clawer as the turnkey option"
    return
  fi

  # Setup / help threads → 7-8
  if echo "$combined" | grep -qE 'openclaw (setup|help|error|issue|problem|not working|broken|crash|fail)|setup openclaw|openclaw (docker|vps|server)|host openclaw'; then
    echo "7|OpenClaw setup or technical help thread|Provide technical help first; mention Clawer as the path of least resistance"
    return
  fi

  # AI agent hosting in general → 6
  if echo "$combined" | grep -qE 'ai agent hosting|host.*ai agent|ai agent.*host|run.*ai agent'; then
    echo "6|General AI agent hosting discussion|Join conversation and mention Clawer's specialization in OpenClaw hosting"
    return
  fi

  # General OpenClaw mention → 5
  if echo "$combined" | grep -qiE 'openclaw|open.?claw'; then
    echo "5|OpenClaw mention in broader discussion|Monitor; engage if thread gains traction"
    return
  fi

  # Low relevance catch-all
  echo "4|Tangentially related content|Low priority — review manually"
}

# ── URL dedup tracker ────────────────────────────────────────
SEEN_FILE="${TMPDIR_WORK}/seen_urls.txt"
touch "$SEEN_FILE"

is_seen() {
  grep -qxF "$1" "$SEEN_FILE" 2>/dev/null
}

mark_seen() {
  echo "$1" >> "$SEEN_FILE"
}

# ── Timestamp for HN (24h ago) ───────────────────────────────
TS_24H_AGO=$(date -d "24 hours ago" +%s 2>/dev/null || date -v-24H +%s 2>/dev/null || echo $(($(date +%s) - 86400)))

# ── SearXNG availability check ───────────────────────────────
SEARXNG_UP=false
if curl -sf --max-time 5 "${SEARXNG}/search?q=test&format=json" >/dev/null 2>&1; then
  SEARXNG_UP=true
fi

# ============================================================
# PHASE 1: Fire parallel curl requests
# ============================================================

out "⏳ Firing search requests..."

# Encode a keyword for URL
urlencode() {
  python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$1" 2>/dev/null \
    || echo "$1" | sed 's/ /+/g; s/&/%26/g; s/"/%22/g'
}

# Launch SearXNG + HN requests in parallel
declare -A PIDS

if [[ "$SEARXNG_UP" == "true" ]]; then
  for kw in "${KEYWORDS[@]}"; do
    enc=$(urlencode "$kw")
    idx_tw="${TMPDIR_WORK}/tw_$(echo "$kw" | tr ' ' '_').json"
    idx_rd="${TMPDIR_WORK}/rd_$(echo "$kw" | tr ' ' '_').json"

    curl -sf --max-time 15 \
      "${SEARXNG}/search?q=${enc}&engines=twitter&format=json&time_range=day" \
      -o "$idx_tw" 2>/dev/null &
    PIDS["tw_${kw}"]=$!

    curl -sf --max-time 15 \
      "${SEARXNG}/search?q=site%3Areddit.com+${enc}&format=json&time_range=day" \
      -o "$idx_rd" 2>/dev/null &
    PIDS["rd_${kw}"]=$!
  done
else
  out "⚠️  SearXNG is down — skipping Twitter/Reddit sources"
fi

# HN parallel (stories + comments)
for kw in "${KEYWORDS[@]}"; do
  enc=$(urlencode "$kw")
  hn_s="${TMPDIR_WORK}/hn_s_$(echo "$kw" | tr ' ' '_').json"
  hn_c="${TMPDIR_WORK}/hn_c_$(echo "$kw" | tr ' ' '_').json"

  curl -sf --max-time 15 \
    "${HN_API}/search_by_date?query=${enc}&tags=story&numericFilters=created_at_i>${TS_24H_AGO}" \
    -o "$hn_s" 2>/dev/null &
  PIDS["hn_s_${kw}"]=$!

  curl -sf --max-time 15 \
    "${HN_API}/search_by_date?query=${enc}&tags=comment&numericFilters=created_at_i>${TS_24H_AGO}" \
    -o "$hn_c" 2>/dev/null &
  PIDS["hn_c_${kw}"]=$!
done

# Wait for all background jobs
wait

out "✅ Requests complete. Parsing results..."

# ============================================================
# PHASE 2: Parse and score results
# ============================================================

# Results stored as lines: "SCORE|PLATFORM|TITLE|URL|CONTENT_SNIPPET|REASON|ANGLE"
RESULTS_FILE="${TMPDIR_WORK}/results.tsv"
touch "$RESULTS_FILE"

add_result() {
  local score="$1" platform="$2" title="$3" url="$4" content="$5" reason="$6" angle="$7"

  # Skip if already seen
  is_seen "$url" && return
  mark_seen "$url"

  # Skip scores below threshold
  [[ "$score" -lt 5 ]] && return

  # Escape tabs in fields
  title=$(echo "$title" | tr '\t' ' ' | head -c 200)
  content=$(echo "$content" | tr '\t' ' ' | head -c 300)
  reason=$(echo "$reason" | tr '\t' ' ')
  angle=$(echo "$angle" | tr '\t' ' ')

  echo "${score}	${platform}	${title}	${url}	${content}	${reason}	${angle}" >> "$RESULTS_FILE"
}

# ── Parse SearXNG results ────────────────────────────────────
parse_searxng() {
  local file="$1"
  local platform="$2"
  [[ -f "$file" ]] || return 0
  [[ -s "$file" ]] || return 0

  # Check it's valid JSON
  jq -e '.results' "$file" >/dev/null 2>&1 || return 0

  local count
  count=$(jq '.results | length' "$file" 2>/dev/null || echo 0)
  [[ "$count" -eq 0 ]] && return 0

  while IFS= read -r row; do
    local title url content
    title=$(echo "$row" | jq -r '.[0] // ""')
    url=$(echo "$row"   | jq -r '.[1] // ""')
    content=$(echo "$row" | jq -r '.[2] // ""')

    [[ -z "$url" || "$url" == "null" ]] && continue

    local scored
    scored=$(score_result "$title" "$content" "$url")
    local score reason angle
    score=$(echo "$scored" | cut -d'|' -f1)
    reason=$(echo "$scored" | cut -d'|' -f2)
    angle=$(echo "$scored"  | cut -d'|' -f3)

    add_result "$score" "$platform" "$title" "$url" "$content" "$reason" "$angle"
  done < <(jq -c '.results[] | [.title, .url, .content]' "$file" 2>/dev/null)
}

# ── Parse HN results ─────────────────────────────────────────
parse_hn() {
  local file="$1"
  local type="$2"   # story or comment
  [[ -f "$file" ]] || return 0
  [[ -s "$file" ]] || return 0

  jq -e '.hits' "$file" >/dev/null 2>&1 || return 0

  local count
  count=$(jq '.hits | length' "$file" 2>/dev/null || echo 0)
  [[ "$count" -eq 0 ]] && return 0

  while IFS= read -r row; do
    local title url content object_id
    if [[ "$type" == "story" ]]; then
      title=$(echo "$row"    | jq -r '.title // .story_title // ""')
      url=$(echo "$row"      | jq -r '.url // ""')
      object_id=$(echo "$row" | jq -r '.objectID // ""')
      content=$(echo "$row"  | jq -r '.story_text // .comment_text // "" | .[0:300]')
    else
      # comment — link back to the HN item
      title=$(echo "$row"    | jq -r '.story_title // .title // "HN Comment"')
      object_id=$(echo "$row" | jq -r '.objectID // ""')
      url=""
      content=$(echo "$row"  | jq -r '.comment_text // "" | .[0:300]')
    fi

    # Prefer direct URL; fall back to HN item page
    if [[ -z "$url" || "$url" == "null" ]] && [[ -n "$object_id" ]]; then
      url="https://news.ycombinator.com/item?id=${object_id}"
    fi
    [[ -z "$url" || "$url" == "null" ]] && continue

    local scored
    scored=$(score_result "$title" "$content" "$url")
    local score reason angle
    score=$(echo "$scored" | cut -d'|' -f1)
    reason=$(echo "$scored" | cut -d'|' -f2)
    angle=$(echo "$scored"  | cut -d'|' -f3)

    add_result "$score" "HN" "$title" "$url" "$content" "$reason" "$angle"
  done < <(jq -c '.hits[]' "$file" 2>/dev/null)
}

# ── Run parsers ──────────────────────────────────────────────
for kw in "${KEYWORDS[@]}"; do
  kw_safe=$(echo "$kw" | tr ' ' '_')

  if [[ "$SEARXNG_UP" == "true" ]]; then
    parse_searxng "${TMPDIR_WORK}/tw_${kw_safe}.json" "Twitter"
    parse_searxng "${TMPDIR_WORK}/rd_${kw_safe}.json" "Reddit"
  fi

  parse_hn "${TMPDIR_WORK}/hn_s_${kw_safe}.json" "story"
  parse_hn "${TMPDIR_WORK}/hn_c_${kw_safe}.json" "comment"
done

# ============================================================
# PHASE 3: Sort & categorise
# ============================================================

# Sort by score descending (numeric, first field)
sort -t$'\t' -k1 -rn "$RESULTS_FILE" -o "${RESULTS_FILE}.sorted" 2>/dev/null || cp "$RESULTS_FILE" "${RESULTS_FILE}.sorted"

HIGH_FILE="${TMPDIR_WORK}/high.tsv"
MED_FILE="${TMPDIR_WORK}/med.tsv"
LOW_FILE="${TMPDIR_WORK}/low.tsv"
touch "$HIGH_FILE" "$MED_FILE" "$LOW_FILE"

while IFS=$'\t' read -r score platform title url content reason angle; do
  if   [[ "$score" -ge 8 ]]; then echo "${score}	${platform}	${title}	${url}	${content}	${reason}	${angle}" >> "$HIGH_FILE"
  elif [[ "$score" -ge 6 ]]; then echo "${score}	${platform}	${title}	${url}	${content}	${reason}	${angle}" >> "$MED_FILE"
  else                             echo "${score}	${platform}	${title}	${url}	${content}	${reason}	${angle}" >> "$LOW_FILE"
  fi
done < "${RESULTS_FILE}.sorted"

HIGH_COUNT=$(wc -l < "$HIGH_FILE" 2>/dev/null || echo 0)
MED_COUNT=$(wc -l  < "$MED_FILE"  2>/dev/null || echo 0)
LOW_COUNT=$(wc -l  < "$LOW_FILE"  2>/dev/null || echo 0)
TOTAL=$(( HIGH_COUNT + MED_COUNT + LOW_COUNT ))

# ============================================================
# PHASE 4: Render output
# ============================================================

render_section() {
  local file="$1"
  local buf=""

  [[ -s "$file" ]] || { echo "_None found._"; return; }

  while IFS=$'\t' read -r score platform title url content reason angle; do
    buf+="**[${platform}] [${score}/10]** ${title}\n"
    buf+="  **URL:** ${url}\n"
    [[ -n "$content" && "$content" != "null" ]] && buf+="  **Snippet:** ${content}\n"
    buf+="  **Why:** ${reason}\n"
    buf+="  **Suggested angle:** ${angle}\n\n"
  done < "$file"

  printf "%b" "$buf"
}

# Build the document
{
  echo "# 🎯 Thread Hijack Opportunities — ${DATETIME}"
  echo ""
  if [[ "$SEARXNG_UP" == "false" ]]; then
    echo "> ⚠️  **SearXNG was unavailable** — Twitter and Reddit results skipped. HN results included."
    echo ""
  fi
  echo "## 🔥 HIGH PRIORITY (complaints/questions)"
  echo ""
  render_section "$HIGH_FILE"
  echo ""
  echo "---"
  echo ""
  echo "## 📢 MEDIUM PRIORITY (discussions)"
  echo ""
  render_section "$MED_FILE"
  echo ""
  echo "---"
  echo ""
  echo "## 📋 LOW PRIORITY (mentions/general)"
  echo ""
  render_section "$LOW_FILE"
  echo ""
  echo "---"
  echo ""
  echo "**Summary:** ${HIGH_COUNT} high, ${MED_COUNT} medium, ${LOW_COUNT} low opportunities found"
  echo ""
  echo "_Scanned keywords: ${KEYWORDS[*]}_"
  echo "_Generated: ${DATETIME}_"
} > "${TMPDIR_WORK}/output.md"

# ── Save to log file ─────────────────────────────────────────
mkdir -p "$LOGS_DIR"
cp "${TMPDIR_WORK}/output.md" "$OUTFILE"

# ── Print to stdout ──────────────────────────────────────────
if [[ "$QUIET" == "false" ]]; then
  # Pretty-print for terminal (strip markdown formatting a bit)
  echo ""
  echo "🎯 Thread Hijack Opportunities — ${DATETIME}"
  echo ""

  if [[ "$SEARXNG_UP" == "false" ]]; then
    echo "⚠️  SearXNG was unavailable — Twitter/Reddit skipped, HN only"
    echo ""
  fi

  print_section() {
    local label="$1"
    local file="$2"
    echo "$label"
    echo "$(printf '─%.0s' {1..60})"
    if [[ ! -s "$file" ]]; then
      echo "  (none)"
    else
      while IFS=$'\t' read -r score platform title url content reason angle; do
        printf "  [%s] %s/10  %s\n" "$platform" "$score" "$title"
        printf "    URL: %s\n" "$url"
        printf "    Why: %s\n" "$reason"
        printf "    Angle: %s\n" "$angle"
        echo ""
      done < "$file"
    fi
    echo ""
  }

  print_section "🔥 HIGH PRIORITY"  "$HIGH_FILE"
  print_section "📢 MEDIUM PRIORITY" "$MED_FILE"
  print_section "📋 LOW PRIORITY"   "$LOW_FILE"

  echo "$(printf '═%.0s' {1..60})"
  printf "Summary: %d high, %d medium, %d low opportunities found\n" "$HIGH_COUNT" "$MED_COUNT" "$LOW_COUNT"
  echo "Saved to: $OUTFILE"
  echo ""
fi

# ── Exit code ────────────────────────────────────────────────
[[ "$TOTAL" -gt 0 ]] && exit 0 || exit 1
