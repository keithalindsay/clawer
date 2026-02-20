# Launch Command Center

**Real-time multi-platform launch coordination dashboard**

## Problem Solved

Product launches across multiple platforms (Product Hunt, X/Twitter, Reddit, Hacker News, Indie Hackers) are chaotic:
- No single view of what's posted where
- Manual tracking of engagement metrics scattered across tabs
- Easy to miss optimal posting windows
- No audit trail of launch events
- Platform URLs get lost in Slack/notes

The launch checklist is great for planning, but on launch day you need a **command center**, not a markdown file.

## What It Does

**Real-time dashboard showing:**
- ✅ Which platforms are live (green) vs pending (yellow)
- 📊 Current metrics: upvotes, comments, impressions, rank
- ⏰ Time-based reminders (6am push, midday update, final sprint)
- 📝 Event timeline (audit log of everything that happened)
- 🎯 Quick launch actions (open all platforms, update metrics)

**State management:**
- Persistent JSON state file tracks all launch data
- Survives crashes/reboots
- Exportable for post-launch analysis

## Quick Start

### 1. Set Launch Time
```bash
cd ~/projects/clawer/scripts
./launch-command-center.sh set-launch
# Enter: 2026-02-21 00:01
```

### 2. Monitor Dashboard
```bash
./launch-command-center.sh status     # One-time view
./launch-command-center.sh monitor    # Auto-refresh every 30s
```

### 3. Mark Platforms as Posted
```bash
./launch-command-center.sh set-ph     # Product Hunt
./launch-command-center.sh set-x      # X/Twitter
./launch-command-center.sh set-reddit # Reddit
./launch-command-center.sh set-hn     # Hacker News
./launch-command-center.sh set-ih     # Indie Hackers
```

### 4. Update Metrics (During Launch)
```bash
./launch-command-center.sh metrics
# Interactive prompts for:
# - PH upvotes, comments, rank
# - X impressions, engagements
# - Signups, containers started
```

### 5. Quick Actions
```bash
./launch-command-center.sh open-all   # Open all platforms in browser
./launch-command-center.sh timeline   # Full event log
./launch-command-center.sh export     # Export state snapshot
```

## Launch Day Workflow

**Pre-launch (T-24h):**
```bash
./launch-command-center.sh set-launch
# Set: 2026-02-21 00:01 (12:01am PT)
```

**Launch (12:01am PT / 2:01am CT):**
```bash
./launch-command-center.sh monitor &
# Dashboard auto-refreshes, shows reminder: "LAUNCH WINDOW"

# When PH goes live:
./launch-command-center.sh set-ph
# Paste PH URL, auto-marks as posted

# When X thread posted:
./launch-command-center.sh set-x
# Paste tweet URL
```

**During Launch (every 30-60 min):**
```bash
./launch-command-center.sh metrics
# Update: PH votes, rank, X impressions
# Dashboard shows current state instantly
```

**Engagement Mode:**
```bash
./launch-command-center.sh open-all
# Opens all posted URLs + main platforms
# Reply to comments across all tabs
```

**Post-Launch:**
```bash
./launch-command-center.sh export
# Snapshot of final metrics
./launch-command-center.sh timeline > launch-retrospective.txt
# Full event log for analysis
```

## Commands Reference

### Monitoring
| Command | Description |
|---------|-------------|
| `status` | Show current dashboard |
| `monitor` | Auto-refresh every 30s (live mode) |
| `open-all` | Open all platform URLs in browser |

### Updates
| Command | Description |
|---------|-------------|
| `metrics` | Interactive metrics update |
| `set-launch` | Set launch date/time |
| `log` | Manual event log entry |

### Platform URLs
| Command | Description |
|---------|-------------|
| `set-ph` | Set Product Hunt URL (auto-marks posted) |
| `set-x` | Set X/Twitter thread URL |
| `set-reddit` | Set Reddit post URL |
| `set-hn` | Set Hacker News URL |
| `set-ih` | Set Indie Hackers URL |

### Logs
| Command | Description |
|---------|-------------|
| `timeline` | Show full event timeline |
| `export` | Export state to timestamped JSON |

## State File

**Location:** `~/projects/clawer/launch/.launch-state.json`

**Schema:**
```json
{
  "launch_time": "2026-02-21 00:01",
  "status": "launching",
  "platforms": {
    "producthunt": {
      "live": true,
      "url": "https://www.producthunt.com/posts/clawer",
      "rank": 3,
      "upvotes": 142,
      "comments": 28,
      "last_check": "2026-02-21T08:30:00Z"
    },
    "x": { ... },
    "reddit": { ... },
    "hackernews": { ... },
    "indiehackers": { ... }
  },
  "metrics": {
    "signups": 47,
    "containers_started": 35,
    "total_engagement": 312
  },
  "timeline": [
    {"time": "2026-02-21 00:01:15", "event": "Product Hunt posted"},
    {"time": "2026-02-21 00:05:42", "event": "First PH comment replied"},
    ...
  ]
}
```

**Safe to edit manually** if you need to correct values.

## Time-Based Reminders

Dashboard shows contextual reminders based on Pacific Time:

| Time (PT) | Reminder |
|-----------|----------|
| 12:01am - 2am | 🔴 LAUNCH WINDOW — Post first PH comment, start X thread |
| 6am - 8am | 🟠 MORNING PUSH — Best engagement hours, share everywhere |
| 9am - 11am | 🟡 MID-MORNING — Reply to all comments, post update tweet |
| 12pm - 2pm | 🟢 MIDDAY — Check rank, post midday push tweet |
| 5pm - 7pm | 🔵 FINAL PUSH — Last hours before PH reset |
| 8pm - 11pm | 💤 WIND DOWN — Reply to stragglers, prep follow-up |

## Example Session

```bash
# 12:01am PT — Launch!
./launch-command-center.sh monitor
# Dashboard shows: "LAUNCH WINDOW" reminder

# PH goes live, paste URL
./launch-command-center.sh set-ph
> URL: https://www.producthunt.com/posts/clawer
✓ producthunt marked as posted

# 15 minutes later, check metrics
./launch-command-center.sh metrics
> Product Hunt upvotes: 12
> Product Hunt comments: 3
> Product Hunt rank: 8
✓ Metrics updated

# Dashboard now shows:
# ✓ Product Hunt — LIVE
#   Rank: #8 | Upvotes: 12 | Comments: 3

# 6:00am PT — Morning push
./launch-command-center.sh set-x
> URL: https://x.com/yourhandle/status/...
✓ x marked as posted

# Open all platforms to engage
./launch-command-center.sh open-all
# Opens PH, X, main platforms in browser

# Throughout day: update metrics
./launch-command-center.sh metrics
# Quick interactive update, no manual JSON editing

# End of day: export snapshot
./launch-command-center.sh export
✓ State exported to: launch-state-20260221-235900.json
```

## Integration with Existing Launch Files

**Works alongside:**
- `launch-checklist.md` — Pre-launch planning (this is execution)
- `content-queue.md` — Blog post queue (separate concern)
- Sub-agent war room logs — Aggregates multi-agent work

**Replaces:**
- Manual tracking in text files
- Scattered notes across tools
- Mental load of "did I post to Reddit yet?"

## Post-Launch Analysis

**Timeline export** creates audit trail:
```bash
./launch-command-center.sh timeline > launch-retrospective.txt
```

**Example output:**
```
[2026-02-21 00:01:15] Launch time set: 2026-02-21 00:01
[2026-02-21 00:03:42] producthunt posted: https://...
[2026-02-21 00:08:20] Metrics updated manually
[2026-02-21 06:12:05] x posted: https://...
[2026-02-21 09:45:33] Metrics updated manually
...
```

Use this for:
- "What time did we peak on PH?"
- "How long between launch and first 100 votes?"
- "When did we post to each platform?"

## Cost/Efficiency

**Token cost:** $0 (pure bash script, no API calls)  
**Time saved:** 2-3 hours of manual tracking per launch  
**Reduces:** Tab chaos, missed windows, "wait did I post that?" moments

**Compounding value:**
- Reusable for future launches (Clawer v2, new features, etc.)
- Exportable state = better retrospectives = better next launch
- One command > 5 browser tabs + 3 text files

## Future Enhancements (Not Built Yet)

**Possible additions:**
- Auto-scrape PH rank (puppeteer + browser tool)
- X API integration (auto-fetch impressions if API key provided)
- Slack/Discord webhook on milestone (e.g., "Hit #1 on PH!")
- Chart generation (rank over time, signup velocity)

**Current philosophy:** Simple, manual, reliable. Launch day is stressful enough without debugging API auth.

## Troubleshooting

**"jq: command not found"**
```bash
sudo apt install jq  # Ubuntu/Pop!_OS
```

**State file corrupted:**
```bash
rm ~/projects/clawer/launch/.launch-state.json
./launch-command-center.sh status
# Fresh state file created
```

**Want to reset for new launch:**
```bash
./launch-command-center.sh export  # Backup old launch
rm ~/projects/clawer/launch/.launch-state.json
./launch-command-center.sh set-launch
```

---

**Built:** 2026-02-20 (nightly-improvement-builder)  
**Why:** Clawer launch happening Friday — needed real-time coordination tool, not just static checklist  
**Impact:** Centralized command center for multi-platform chaos
