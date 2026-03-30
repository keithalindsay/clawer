# Automated Backlink Pipeline Design
**Status:** Design spec (not yet implemented)  
**Goal:** Run backlink acquisition with minimal human intervention

---

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │         AUTOMATED PIPELINE               │
                    │                                         │
  ┌──────────┐      │  ┌──────────┐    ┌──────────────────┐  │
  │  Cron    │─────▶│  │ Scanner  │───▶│  Opportunity DB  │  │
  │ Schedule │      │  │  Agent   │    │ (JSON files)     │  │
  └──────────┘      │  └──────────┘    └─────────┬────────┘  │
                    │                            │            │
                    │  ┌──────────┐    ┌─────────▼────────┐  │
                    │  │ Drafter  │◀───│  Prioritizer     │  │
                    │  │  Agent   │    │                  │  │
                    │  └─────┬────┘    └──────────────────┘  │
                    │        │                                │
                    │  ┌─────▼────┐                          │
                    │  │ Human    │ ← Keith reviews/approves  │
                    │  │ Review   │                          │
                    │  └─────┬────┘                          │
                    │        │                                │
                    │  ┌─────▼────┐    ┌──────────────────┐  │
                    │  │ Executor │───▶│  Audit Log       │  │
                    │  │  Agent   │    │                  │  │
                    │  └──────────┘    └──────────────────┘  │
                    └─────────────────────────────────────────┘
```

---

## Cron Schedule

Add to crontab (`crontab -e`):

```bash
# ─────────────────────────────────────────────────────────────────
# Clawer.ai Backlink Automation Pipeline
# ─────────────────────────────────────────────────────────────────

# DAILY (7am CDT): Scan for new opportunities + monitor HARO queries
0 7 * * * /home/keith/projects/clawer/scripts/backlinks/daily-opportunity-scan.sh >> /home/keith/projects/clawer/logs/backlinks-daily.log 2>&1

# DAILY (8am CDT): Check backlink status for new submissions
0 8 * * * /home/keith/projects/clawer/scripts/backlinks/monitor-backlinks.sh >> /home/keith/projects/clawer/logs/backlinks-monitor.log 2>&1

# WEEKLY (Monday 9am CDT): Draft next batch of directory submissions
0 9 * * 1 /home/keith/projects/clawer/scripts/backlinks/weekly-submission-drafter.sh >> /home/keith/projects/clawer/logs/backlinks-weekly.log 2>&1

# WEEKLY (Wednesday 9am CDT): Draft guest post pitch
0 9 * * 3 /home/keith/projects/clawer/scripts/backlinks/draft-guest-pitch.sh >> /home/keith/projects/clawer/logs/backlinks-pitch.log 2>&1

# WEEKLY (Friday 9am CDT): Syndicate latest blog post to Dev.to + Hashnode
0 9 * * 5 /home/keith/projects/clawer/scripts/backlinks/syndicate-blog.sh >> /home/keith/projects/clawer/logs/backlinks-syndicate.log 2>&1

# MONTHLY (1st, 9am CDT): Full backlink audit + DA check
0 9 1 * * /home/keith/projects/clawer/scripts/backlinks/monthly-audit.sh >> /home/keith/projects/clawer/logs/backlinks-monthly.log 2>&1
```

---

## Agent Scripts (To Be Built)

### 1. `daily-opportunity-scan.sh` — Daily Scanner
**What it does:**
- Searches Qwoted/Connectively for AI/hosting journalist queries
- Scans Reddit for unanswered questions about AI agents, OpenClaw, hosting
- Finds new AI directories that launched this week
- Checks for new "awesome" GitHub lists to target

**Output:** Appends to `opportunity-queue.json`

**Pseudo-code:**
```bash
#!/bin/bash
# 1. Check HARO-replacement services
curl -s "https://qwoted.com/api/queries?q=AI+agent" | jq '.[] | select(.deadline > now)' >> opportunity-queue.json

# 2. Search Reddit for relevant questions (via SearXNG)
./searxng-query.sh "site:reddit.com AI agent hosting question" >> opportunity-queue.json

# 3. Search for new AI directories
./searxng-query.sh "new AI tools directory launched 2026" >> opportunity-queue.json

# 4. Send daily digest to Keith via WhatsApp
openclaw send-message "Daily backlink opportunities: [X] new items added"
```

---

### 2. `weekly-submission-drafter.sh` — Directory Submission Drafter
**What it does:**
- Reads `directory-submissions.json` for pending submissions
- Picks 5 highest-priority unsubmitted directories
- Opens each URL in browser (or pre-fills forms via automation)
- Drafts the submission text from template
- Creates a "submission packet" file for Keith to review and submit

**Output:** `~/projects/clawer/reports/backlinks/submission-packet-YYYY-MM-DD.md`

**Pseudo-code:**
```bash
#!/bin/bash
# Get 5 pending directories ordered by priority
TARGETS=$(jq '.directories[] | select(.status == "pending") | 
  {name, submit_url, tier, priority}' directory-submissions.json | 
  head -5)

for target in $TARGETS; do
    # Generate pre-filled submission text
    cat > "submission-$name.md" << EOF
    # Submission for $name
    URL: $submit_url
    
    ## Copy to paste:
    [contents from directory-submission-description.txt]
    EOF
done

# Notify Keith
echo "5 directory submissions drafted — review and submit: ~/projects/clawer/reports/backlinks/"
```

---

### 3. `draft-guest-pitch.sh` — Guest Post Pitcher
**What it does:**
- Reads `guest-post-targets.json` for pending outreach
- Picks the highest-priority unpitched publication
- Selects best content angle based on publication audience
- Drafts pitch email using template
- Saves draft for Keith's review and sending

**Output:** `~/projects/clawer/reports/backlinks/pitch-draft-YYYY-MM-DD.md`

---

### 4. `syndicate-blog.sh` — Blog Cross-Poster
**What it does:**
- Reads clawer.ai blog RSS feed
- Gets latest post not yet syndicated
- Posts to Dev.to via API (with canonical URL)
- Posts to Hashnode via API (with canonical URL)
- Updates syndication log
- (Manual step: Keith posts excerpt to LinkedIn)

**This is the most automatable — Dev.to and Hashnode both have APIs.**

**Implementation:**
```python
#!/usr/bin/env python3
import feedparser, requests, json
from datetime import datetime

DEV_TO_KEY = os.getenv("DEV_TO_API_KEY")
HASHNODE_KEY = os.getenv("HASHNODE_API_KEY")
HASHNODE_PUB_ID = os.getenv("HASHNODE_PUBLICATION_ID")
SYNDICATION_LOG = "syndication-log.json"

# Read RSS
feed = feedparser.parse("https://clawer.ai/blog/rss.xml")
latest = feed.entries[0]

# Check if already syndicated
log = json.load(open(SYNDICATION_LOG)) if os.path.exists(SYNDICATION_LOG) else {}
if latest.link in log:
    print(f"Already syndicated: {latest.title}")
    exit(0)

# Post to Dev.to
dev_response = requests.post(
    "https://dev.to/api/articles",
    headers={"api-key": DEV_TO_KEY},
    json={"article": {
        "title": latest.title,
        "body_markdown": latest.content[0].value,
        "canonical_url": latest.link,
        "tags": ["ai", "agents", "openclaw", "hosting"],
        "published": True
    }}
)

# Post to Hashnode
hashnode_response = requests.post(
    "https://gql.hashnode.com",
    headers={"Authorization": HASHNODE_KEY},
    json={"query": """
        mutation PublishPost($input: PublishPostInput!) {
            publishPost(input: $input) { post { url } }
        }
    """, "variables": {"input": {
        "title": latest.title,
        "contentMarkdown": latest.content[0].value,
        "originalArticleURL": latest.link,
        "publicationId": HASHNODE_PUB_ID,
        "tags": [{"slug": "ai-agents"}]
    }}}
)

# Log it
log[latest.link] = {"syndicated_at": datetime.now().isoformat(), 
                     "devto_url": dev_response.json().get("url"),
                     "hashnode_url": hashnode_response.json().get("data", {}).get("publishPost", {}).get("post", {}).get("url")}
json.dump(log, open(SYNDICATION_LOG, "w"), indent=2)
print(f"Syndicated: {latest.title}")
```

---

### 5. `monthly-audit.sh` — Full Audit
**What it does:**
- Runs full `monitor-backlinks.sh --full`
- Checks DA/DR via Ahrefs API (if available) or free checker
- Counts total live backlinks vs last month
- Identifies any lost backlinks (was live, now isn't)
- Sends Keith a monthly report via WhatsApp

**Metrics to capture:**
- Total referring domains: month vs prior month
- Domain Rating (DR): month vs prior month  
- New links acquired this month
- Lost links this month
- Top performing backlink sources (by traffic)

---

## What Requires Human Approval (Never Automate These)

| Action | Why Human Required |
|--------|-------------------|
| Actual Reddit posts | Community trust, tone, timing judgment |
| Hacker News submission | One shot, can't be undone if wrong |
| Guest post pitches (sending) | Relationship management |
| Product Hunt launch | High stakes, coordination needed |
| Journalist outreach (sending) | Reputation on the line |
| GitHub PR content | Technical accuracy matters |
| Directory submissions (Tier 1) | Quality over speed |

**The automation handles: drafting, researching, monitoring, and scheduling.**  
**Keith handles: reviewing, approving, and submitting.**

---

## Environment Variables Needed

Add to `~/.bashrc` or manage with secrets:

```bash
# Backlink automation
export DEV_TO_API_KEY="your_key_here"
export HASHNODE_API_KEY="your_key_here"
export HASHNODE_PUBLICATION_ID="your_pub_id"
export QWOTED_API_KEY="your_key_here"  # if they have API
```

---

## Logs Directory

```
~/projects/clawer/
├── logs/
│   ├── backlinks-daily.log      # Daily opportunity scan
│   ├── backlinks-monitor.log    # Link status checks
│   ├── backlinks-weekly.log     # Weekly submissions
│   ├── backlinks-syndicate.log  # Blog syndication
│   └── backlinks-monthly.log   # Monthly audits
├── reports/
│   └── backlinks/
│       ├── submission-packet-YYYY-MM-DD.md
│       ├── pitch-draft-YYYY-MM-DD.md
│       └── backlink-check-YYYY-MM-DD_HH-MM.md
└── scripts/
    └── backlinks/
        ├── syndication-log.json   # Which posts have been syndicated
        └── opportunity-queue.json # New opportunities found by scanner
```

---

## Implementation Priority

| Phase | What to Build | When |
|-------|--------------|------|
| Phase 1 (Now) | Blog syndication script (Dev.to + Hashnode APIs) | Week 1 — high ROI |
| Phase 2 (Week 2) | `monitor-backlinks.sh` (already built!) | Done ✅ |
| Phase 3 (Week 3) | Opportunity scanner (daily HARO check) | Week 3 |
| Phase 4 (Month 2) | Full pipeline with cron + notifications | Month 2 |
