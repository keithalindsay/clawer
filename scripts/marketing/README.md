# Clawer.ai Marketing Pipeline

Automated go-to-market tools for clawer.ai. Runs as a daily cron at 6 AM CT.

## What's Here

| Script | Purpose |
|--------|---------|
| `devto-crosspost.py` | Cross-post blog articles to Dev.to with canonical URLs |
| `hashnode-crosspost.py` | Cross-post blog articles to Hashnode with canonical URLs |
| `reddit-monitor.py` | Monitor Reddit for OpenClaw opportunities (collect only, no auto-post) |
| `directory-tracker.py` | CLI for managing directory submission status |
| `run-marketing-pipeline.sh` | Orchestrator — runs all of the above |
| `marketing-crontab.txt` | Crontab entries to install |

---

## Quick Setup

```bash
# 1. Copy env template and fill in credentials
cp .env.example .env
nano .env

# 2. Test in dry-run mode (no API calls)
python3 devto-crosspost.py --dry-run
python3 hashnode-crosspost.py --dry-run
python3 reddit-monitor.py --dry-run
python3 directory-tracker.py status

# 3. Install cron (verify the crontab first!)
cat marketing-crontab.txt
crontab -e  # paste the entries manually
```

---

## Dev.to Cross-Poster

**File:** `devto-crosspost.py`  
**Env var:** `DEVTO_API_KEY`  
**Tracker:** `.devto-posted.json`

Reads `public/blog-manifest.json`, extracts content from each blog's `page.tsx`, converts JSX to Markdown, and posts to Dev.to with:
- `canonical_url` pointing back to `clawer.ai/blog/{slug}` (SEO-critical)
- Tags: `ai`, `openclaw`, `agents`, `hosting`

```bash
# Post all new articles
python3 devto-crosspost.py

# Dry run
python3 devto-crosspost.py --dry-run

# Re-post a specific slug
python3 devto-crosspost.py --force-slug openclaw-diy-vs-hosted
```

**Get API key:** https://dev.to/settings/extensions → "DEV API Keys"

---

## Hashnode Cross-Poster

**File:** `hashnode-crosspost.py`  
**Env var:** `HASHNODE_API_KEY`, `HASHNODE_PUBLICATION_ID` (optional)  
**Tracker:** `.hashnode-posted.json`

Same as Dev.to but uses Hashnode's GraphQL API. Auto-detects your publication ID on first run.

```bash
# List your publications (to get publication ID)
python3 hashnode-crosspost.py --list-publications

# Post all new articles
python3 hashnode-crosspost.py

# Dry run
python3 hashnode-crosspost.py --dry-run
```

**Get API key:** https://hashnode.com/settings/developer → Personal Access Tokens

---

## Reddit Monitor

**File:** `reddit-monitor.py`  
**Env vars:** `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`  
**Output:** `reddit-opportunities.json`

⚠️ **This does NOT auto-post.** It only collects opportunities for human review.

Monitors these subreddits:
- `r/selfhosted`, `r/SideProject`, `r/artificial`, `r/LocalLLaMA`, `r/AI_Agents`

Search terms:
- `openclaw`, `openclaw hosting`, `ai agent hosting`, `managed openclaw`, `whatsapp bot ai`, `telegram ai agent`

Each opportunity gets a `relevance_score` (0-100) and a `suggested_response` tailored to the post context.

```bash
# Scan all subreddits
python3 reddit-monitor.py

# View saved opportunities
python3 reddit-monitor.py --show

# Scan specific subreddit
python3 reddit-monitor.py --subreddit LocalLLaMA

# Dry run (don't save)
python3 reddit-monitor.py --dry-run
```

**Without credentials:** Falls back to Reddit's public JSON API (lower rate limits).

**Get credentials:**
1. Go to https://www.reddit.com/prefs/apps
2. "create another app" → type: "script"
3. Redirect URI: `http://localhost:8080`

---

## Directory Tracker

**File:** `directory-tracker.py`  
**Data:** `../backlinks/directory-submissions.json`

CLI tool for managing directory submission status.

```bash
# Show status overview with counts
python3 directory-tracker.py status

# Show next 5 priority submissions to work on
python3 directory-tracker.py next

# Show next 10
python3 directory-tracker.py next --limit 10

# Mark as submitted (after you manually submit)
python3 directory-tracker.py submit "Product Hunt"
python3 directory-tracker.py submit taaft

# Mark as live (once your listing appears)
python3 directory-tracker.py live "TAAFT" https://theresanaiforthat.com/ai/clawer/

# Generate weekly report
python3 directory-tracker.py report

# List all directories
python3 directory-tracker.py list
python3 directory-tracker.py list --status pending

# Dry run (won't save changes)
python3 directory-tracker.py --dry-run submit "Product Hunt"
```

---

## Full Pipeline

**File:** `run-marketing-pipeline.sh`  
**Log:** `../../logs/marketing-pipeline.log`

```bash
# Run full pipeline
./run-marketing-pipeline.sh

# Dry run
./run-marketing-pipeline.sh --dry-run

# Reddit only (for frequent 4-hour checks)
./run-marketing-pipeline.sh --reddit-only
```

### Install Cron

```bash
# Review the crontab first
cat marketing-crontab.txt

# Edit your crontab
crontab -e

# Paste the contents of marketing-crontab.txt
# Or replace entirely (BACKUP FIRST):
# crontab -l > ~/crontab.bak && crontab marketing-crontab.txt
```

Cron schedule:
- **Daily at 6 AM CT** — full pipeline (Dev.to + Hashnode + Reddit + Directory)
- **Every 4 hours** — Reddit monitor only

---

## Tracker Files

These JSON files track what's been posted. Don't delete them or articles will be re-posted.

- `.devto-posted.json` — Dev.to posting history
- `.hashnode-posted.json` — Hashnode posting history
- `reddit-opportunities.json` — Collected Reddit opportunities

---

## Architecture Notes

- **Canonical URLs are always set** back to `clawer.ai/blog/{slug}` — this is critical for SEO. Crossposting without canonical URLs can split link equity.
- **Rate limits** — scripts sleep 2s between posts. Don't hammer the APIs.
- **No heavy dependencies** — only `requests` is required beyond stdlib. PRAW is optional for Reddit.
- **Graceful degradation** — all scripts work without API keys (skip with warning).
- **TSX → Markdown** — the converter handles common JSX patterns. If a post looks odd on Dev.to, check the raw TSX for unusual components.

---

## Dependencies

```bash
# Minimal (required)
pip install requests

# Optional (for PRAW Reddit integration)
pip install praw
```

All other dependencies are Python stdlib only.
