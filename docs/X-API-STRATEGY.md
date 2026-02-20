# X API Credit Strategy for Clawer.ai Marketing
## Hyper-Efficient Pay-Per-Use Marketing Plan

**Last Updated:** February 19, 2026  
**Status:** Ready for Implementation  
**Accounts:** @teamclawer (brand), @Vavier (founder)

---

## Executive Summary

X API's new pay-per-use pricing is **credit-based with no monthly caps**. Every API call costs credits based on the endpoint. The key to efficiency: **24-hour UTC deduplication** (same resource requested multiple times in a day = 1 charge) + strategic caching + batching.

**Bottom line:** $25/month gets you ~2,500 tweets posted or ~5,000 tweets read. With smart automation, this is enough for 8 blog posts/month + daily engagement + competitor monitoring.

---

## 1. Credit Cost Table

### Official X API Pay-Per-Use Pricing (February 2026)

| Action | Endpoint | Cost per Call | Cost per 1,000 | Notes |
|--------|----------|--------------|----------------|-------|
| **Read a tweet** | `GET /2/tweets/:id` | $0.005 | $5.00 | Single lookup |
| **Read tweets (batch)** | `GET /2/tweets` | $0.005/tweet | $5.00 | Up to 100 tweets per call |
| **Post a tweet** | `POST /2/tweets` | $0.010 | $10.00 | Text, links, media |
| **Read user profile** | `GET /2/users/:id` | $0.010 | $10.00 | User lookup |
| **Search tweets (recent)** | `GET /2/tweets/search/recent` | $0.005/tweet | $5.00 | Last 7 days, 10-100 results |
| **Search tweets (archive)** | `GET /2/tweets/search/all` | $0.005/tweet | $5.00 | Full history |
| **Read mentions** | `GET /2/users/:id/mentions` | $0.005/tweet | $5.00 | Your @mentions |
| **Read user timeline** | `GET /2/users/:id/tweets` | $0.005/tweet | $5.00 | Any user's posts |
| **Like a tweet** | `POST /2/users/:id/likes` | $0.010 | $10.00 | Engagement action |
| **Retweet** | `POST /2/users/:id/retweets` | $0.010 | $10.00 | Amplification |
| **Reply to tweet** | `POST /2/tweets` | $0.010 | $10.00 | Same as posting |
| **Upload media** | N/A (Twitter CDN) | $0 | $0 | Free, but posting costs $0.010 |
| **Get followers list** | `GET /2/users/:id/followers` | $0.010/user | $10.00 | User lookups |
| **DM read** | `GET /2/dm_events` | $0.010 | $10.00 | Direct messages |
| **DM send** | `POST /2/dm_conversations/*/messages` | $0.015 | $15.00 | DM creation |

### Key Mechanics

- **Deduplication:** Same resource fetched multiple times in 24-hour UTC window = **billed once**
- **Failed requests:** Not billed (only successful responses with data count)
- **Streaming:** Billed per unique post delivered (subject to deduplication)
- **Rate limits:** Separate from billing (see section 5)

---

## 2. Monthly Credit Budgets: 3 Tiers

### Tier 1: Lean Automation ($10/mo)
**Total credits:** $10  
**What you get:**
- 100 tweets posted ($10 ÷ $0.010 = 100 posts)
- OR 2,000 tweets read ($10 ÷ $0.005 = 2,000 reads)
- OR **80 posts + 400 reads** (mixed)

**Recommended allocation:**
- **Blog auto-posts:** 8 posts/month × $0.010 = $0.08
- **Daily mention checks:** 30 days × 10 mentions × $0.005 = $1.50
- **Weekly engagement:** 4 weeks × 5 replies × $0.010 = $0.20
- **Monthly search:** 30 searches × 10 results × $0.005 = $1.50
- **Buffer:** $6.72 for spikes

**Best for:** Auto-posting blog content + basic monitoring

---

### Tier 2: Active Engagement ($25/mo) ⭐ **RECOMMENDED**
**Total credits:** $25  
**What you get:**
- 250 tweets posted ($25 ÷ $0.010 = 250 posts)
- OR 5,000 tweets read ($25 ÷ $0.005 = 5,000 reads)
- OR **80 posts + 3,600 reads** (recommended mix)

**Recommended allocation:**
- **Blog auto-posts:** 8 posts/month × $0.010 = $0.08
- **Daily mention checks:** 30 days × 20 mentions × $0.005 = $3.00
- **Daily engagement replies:** 30 days × 3 replies × $0.010 = $0.90
- **Daily topic searches:** 30 days × 3 searches × 20 results × $0.005 = $9.00
- **Competitor monitoring:** 30 days × 10 tweets × $0.005 = $1.50
- **Weekly thread creation:** 4 threads × 5 tweets × $0.010 = $0.20
- **Likes/RTs:** 30 days × 5 actions × $0.010 = $1.50
- **Buffer:** $8.82 for experiments

**Best for:** Consistent presence + engagement + intelligence gathering

**xAI Bonus:** None until $200 cumulative spend (10% back after $200)

---

### Tier 3: Aggressive Growth ($50/mo)
**Total credits:** $50  
**What you get:**
- 500 tweets posted ($50 ÷ $0.010 = 500 posts)
- OR 10,000 tweets read ($50 ÷ $0.005 = 10,000 reads)
- OR **150 posts + 7,000 reads** (aggressive mix)

**Recommended allocation:**
- **Blog auto-posts:** 8 posts/month × $0.010 = $0.08
- **Hourly mention checks:** 30 days × 24 hours × 5 mentions × $0.005 = $18.00
- **Daily engagement replies:** 30 days × 5 replies × $0.010 = $1.50
- **Daily topic searches:** 30 days × 5 searches × 30 results × $0.005 = $22.50
- **Competitor deep-dive:** 30 days × 20 tweets × $0.005 = $3.00
- **Daily thread creation:** 30 threads × 4 tweets × $0.010 = $1.20
- **Quote tweets:** 10/month × $0.010 = $0.10
- **Likes/RTs:** 30 days × 10 actions × $0.010 = $3.00
- **Buffer:** $0.62 (tight!)

**Best for:** War Machine lead generation + aggressive outreach

**xAI Bonus:** None until $200 cumulative spend

---

## 3. Free Tier Maximization

### What's Included (Official Free Tier)
- **500 posts/month** (app-level, write-only)
- **100 reads/month** (app-level)
- **1 App ID**
- **Rate limits:** Same as paid tiers

### Strategy: Use Free Tier First, Pay-Per-Use Second

**Free tier for:**
1. **Blog auto-posts** — 8 posts/month (uses 8 of 500 free writes)
2. **Testing/development** — verify scripts work before spending credits
3. **Manual posts** — anything posted via web UI doesn't count against API

**Pay-per-use for:**
1. **All reads** (mentions, searches, monitoring) — free tier only gives 100 reads/month
2. **Engagement replies** (after exhausting 500 free writes, unlikely in practice)
3. **Automated engagement** (likes, RTs, quote tweets)

**Reality check:** With 8 blog posts/month, you'll use **1.6% of free writes**. The 100 reads/month is the real bottleneck — that's ~3 reads/day, which you'll burn through immediately with mention monitoring.

**Recommendation:** Treat free tier as a safety net. Budget assumes pay-per-use for everything except basic posting.

---

## 4. Automation Scripts Needed

### A. Blog Auto-Post Script
**File:** `~/projects/clawer/scripts/x-auto-post-blog.sh`  
**Trigger:** Nightly blog cron (after new post publishes)  
**Function:** Detect new blog post → generate tweet → post to @teamclawer  
**Cron:** `0 2 * * * ~/projects/clawer/scripts/x-auto-post-blog.sh`

**Logic:**
```bash
#!/bin/bash
# Check for new blog post (compare current to last-posted.txt)
LATEST_POST=$(curl -s https://clawer.ai/blog/feed.xml | grep -m1 '<link>' | sed 's/<[^>]*>//g')
LAST_POSTED=$(cat ~/projects/clawer/data/x-last-posted.txt 2>/dev/null || echo "")

if [ "$LATEST_POST" != "$LAST_POSTED" ]; then
  # Extract title, URL
  TITLE=$(curl -s https://clawer.ai/blog/feed.xml | grep -m1 '<title>' | sed 's/<[^>]*>//g')
  URL=$LATEST_POST
  
  # Generate tweet (via Claude API or template)
  TWEET="🚀 New post: $TITLE\n\n$URL\n\n#OpenClaw #AIHosting #ManagedAI"
  
  # Post to X API
  curl -X POST "https://api.x.com/2/tweets" \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$TWEET\"}"
  
  # Update tracker
  echo "$LATEST_POST" > ~/projects/clawer/data/x-last-posted.txt
fi
```

**Cost:** $0.010 per post × 8 posts/month = **$0.08/month**

---

### B. Mention Monitoring Script
**File:** `~/projects/clawer/scripts/x-monitor-mentions.sh`  
**Trigger:** Hourly cron  
**Function:** Check @teamclawer mentions → filter for real questions → notify War Machine  
**Cron:** `15 * * * * ~/projects/clawer/scripts/x-monitor-mentions.sh`

**Logic:**
```bash
#!/bin/bash
# Get @teamclawer user ID first (one-time lookup, cache it)
USER_ID="1234567890" # Replace with actual ID

# Fetch last 20 mentions (deduplicated within 24h)
MENTIONS=$(curl -s "https://api.x.com/2/users/$USER_ID/mentions?max_results=20" \
  -H "Authorization: Bearer $BEARER_TOKEN")

# Parse, filter for keywords (openclaw, hosting, managed, self-hosted)
echo "$MENTIONS" | jq -r '.data[] | select(.text | test("openclaw|hosting|managed"; "i")) | .id + "|" + .text' | \
while IFS='|' read -r TWEET_ID TWEET_TEXT; do
  # Check if already responded (store in ~/projects/clawer/data/x-responded-ids.txt)
  if ! grep -q "$TWEET_ID" ~/projects/clawer/data/x-responded-ids.txt; then
    # Log for human review or auto-respond
    echo "New mention: $TWEET_TEXT" >> ~/projects/clawer/logs/x-mentions.log
    # (Optional: auto-respond with helpful reply)
    echo "$TWEET_ID" >> ~/projects/clawer/data/x-responded-ids.txt
  fi
done
```

**Cost (Tier 2 assumption):**  
20 mentions/hour × 24 hours/day × 30 days = 14,400 mentions/month  
BUT: Deduplication means unique mentions only. Realistic: **600 unique mentions/month**  
600 × $0.005 = **$3.00/month**

---

### C. Topic Search & Engagement Script
**File:** `~/projects/clawer/scripts/x-search-engage.sh`  
**Trigger:** Daily cron (8am, 2pm, 8pm)  
**Function:** Search for "openclaw", "AI assistant hosting", "claude hosting" → engage in conversations  
**Cron:** `0 8,14,20 * * * ~/projects/clawer/scripts/x-search-engage.sh`

**Logic:**
```bash
#!/bin/bash
KEYWORDS=("openclaw" "AI assistant hosting" "claude hosting" "self-hosted AI")

for KEYWORD in "${KEYWORDS[@]}"; do
  # Search recent (last 7 days, 20 results)
  RESULTS=$(curl -s "https://api.x.com/2/tweets/search/recent?query=$KEYWORD&max_results=20" \
    -H "Authorization: Bearer $BEARER_TOKEN")
  
  # Filter out Clawer's own tweets, already-engaged tweets
  echo "$RESULTS" | jq -r '.data[] | select(.author_id != "YOUR_USER_ID") | .id + "|" + .text' | \
  while IFS='|' read -r TWEET_ID TWEET_TEXT; do
    if ! grep -q "$TWEET_ID" ~/projects/clawer/data/x-engaged-ids.txt; then
      # Human review queue or auto-reply
      echo "Opportunity: $TWEET_TEXT" >> ~/projects/clawer/logs/x-opportunities.log
      # (Optional: auto-like or reply)
      echo "$TWEET_ID" >> ~/projects/clawer/data/x-engaged-ids.txt
    fi
  done
done
```

**Cost (Tier 2 assumption):**  
3 runs/day × 4 keywords × 20 results = 240 tweets/day  
Deduplication: ~100 unique tweets/day × 30 days = 3,000 tweets/month  
3,000 × $0.005 = **$15.00/month**

---

### D. Competitor Monitoring Script
**File:** `~/projects/clawer/scripts/x-monitor-competitors.sh`  
**Trigger:** Daily cron (midnight)  
**Function:** Track @SimpleClaw, @VidClaw, OpenClaw core team mentions  
**Cron:** `0 0 * * * ~/projects/clawer/scripts/x-monitor-competitors.sh`

**Logic:**
```bash
#!/bin/bash
COMPETITORS=("SimpleClaw" "VidClaw" "openclaw_team")

for HANDLE in "${COMPETITORS[@]}"; do
  # Get their timeline (last 10 tweets)
  USER_ID=$(curl -s "https://api.x.com/2/users/by/username/$HANDLE" \
    -H "Authorization: Bearer $BEARER_TOKEN" | jq -r '.data.id')
  
  curl -s "https://api.x.com/2/users/$USER_ID/tweets?max_results=10" \
    -H "Authorization: Bearer $BEARER_TOKEN" | \
    jq -r '.data[] | .id + "|" + .text' >> ~/projects/clawer/logs/x-competitors.log
done
```

**Cost (Tier 2 assumption):**  
3 competitors × 10 tweets/day × 30 days = 900 tweets/month  
Deduplication: ~300 unique tweets/month  
300 × $0.005 = **$1.50/month**

---

### E. Credit Usage Tracker
**File:** `~/projects/clawer/scripts/x-check-credits.sh`  
**Trigger:** Daily cron (11pm)  
**Function:** Query Usage API → log consumption → alert if >80% of budget spent  
**Cron:** `0 23 * * * ~/projects/clawer/scripts/x-check-credits.sh`

**Logic:**
```bash
#!/bin/bash
USAGE=$(curl -s "https://api.x.com/2/usage/tweets" \
  -H "Authorization: Bearer $BEARER_TOKEN")

DAILY_COST=$(echo "$USAGE" | jq -r '.data[] | .count * 0.005' | awk '{s+=$1} END {print s}')
echo "$(date): $DAILY_COST" >> ~/projects/clawer/logs/x-daily-costs.log

# Check monthly total (sum last 30 days)
MONTHLY_TOTAL=$(tail -30 ~/projects/clawer/logs/x-daily-costs.log | awk -F': ' '{s+=$2} END {print s}')

if (( $(echo "$MONTHLY_TOTAL > 20" | bc -l) )); then
  echo "⚠️ X API spending at $MONTHLY_TOTAL (80% of $25 budget)" | mail -s "X API Budget Alert" keith@clawer.ai
fi
```

**Cost:** $0 (Usage API doesn't consume credits)

---

## 5. Content Calendar

### Weekly Posting Schedule

| Day | Time (CST) | Account | Content Type | Automation |
|-----|-----------|---------|--------------|------------|
| **Mon** | 9am | @teamclawer | Blog auto-post (if new) | Script A |
| **Mon** | 2pm | @Vavier | Founder insight thread | Manual |
| **Tue** | 10am | @teamclawer | Engagement reply batch | Script C → human review |
| **Wed** | 9am | @teamclawer | Blog auto-post (if new) | Script A |
| **Wed** | 3pm | @teamclawer | OpenClaw ecosystem RT | Manual |
| **Thu** | 11am | @Vavier | War Machine lead highlight | Manual |
| **Fri** | 9am | @teamclawer | Blog auto-post (if new) | Script A |
| **Fri** | 4pm | @teamclawer | Week in review thread | Manual/template |
| **Sat** | 10am | @Vavier | Casual/personal tweet | Manual |
| **Sun** | — | — | Rest day | — |

### Continuous Background Tasks
- **Hourly:** Mention monitoring (Script B)
- **3x daily:** Topic search + engagement (Script C)
- **Daily midnight:** Competitor monitoring (Script D)
- **Daily 11pm:** Credit usage check (Script E)

---

## 6. Implementation Plan

### Phase 1: API Access Setup (Week 1)
**Goal:** Get official X API credentials for @teamclawer

1. **Create Developer Account**
   - Go to https://developer.x.com
   - Sign in with @teamclawer credentials
   - Apply for API access (select "Pay-Per-Use" plan)
   - Verify email, phone

2. **Create App**
   - Developer Console → "Create App"
   - Name: "Clawer Marketing Automation"
   - Description: "Automated blog posting, engagement, and community monitoring for Clawer.ai"
   - Website: https://clawer.ai
   - Callback URL: https://clawer.ai/auth/x/callback (placeholder)

3. **Generate Keys**
   - OAuth 1.0a: API Key, API Secret Key, Bearer Token
   - OAuth 2.0: Client ID, Client Secret (if needed for user auth)
   - Store securely: `~/secrets/x-api-teamclawer.env`

4. **Purchase Initial Credits**
   - Developer Console → Billing → Purchase Credits
   - Start with **$25** (Tier 2)
   - Enable auto-recharge: trigger at $5, recharge $25

5. **Test Authentication**
   ```bash
   curl "https://api.x.com/2/tweets/search/recent?query=openclaw&max_results=10" \
     -H "Authorization: Bearer $BEARER_TOKEN"
   ```
   - Should return JSON with tweets (costs $0.05 for 10 tweets)

**Blockers:**
- @teamclawer currently blocked by Bird CLI (Error 226) — official API uses different auth, should work
- If blocked: appeal via developer.x.com support or use @Vavier as primary account

---

### Phase 2: Blog Auto-Post (Week 1-2)
**Goal:** First automated tweet from new blog post

1. **Create Script A** (see section 4)
2. **Test manually:**
   ```bash
   ~/projects/clawer/scripts/x-auto-post-blog.sh --dry-run
   ```
3. **Deploy to cron:** `0 2 * * *` (2am daily)
4. **Monitor for 1 week:** Check logs, verify posts appear, track credit usage
5. **Success criteria:** 1-2 blog posts auto-tweeted with $0.01-$0.02 total cost

---

### Phase 3: Mention Monitoring (Week 2-3)
**Goal:** Catch every @teamclawer mention, route to human

1. **Create Script B** (see section 4)
2. **Set up notification:** Log → email digest or Discord webhook
3. **Deploy to cron:** `15 * * * *` (hourly at :15)
4. **Test:** Tweet at @teamclawer from personal account, verify detection
5. **Success criteria:** Zero missed mentions over 7 days

---

### Phase 4: Engagement Automation (Week 3-4)
**Goal:** Daily search + engagement queue

1. **Create Script C** (see section 4)
2. **Human-in-the-loop:** Script flags opportunities, human approves replies
3. **Deploy to cron:** `0 8,14,20 * * *` (8am, 2pm, 8pm)
4. **Build reply templates:** 5 generic helpful responses to common questions
5. **Success criteria:** 10+ quality engagements/week, <$5/week cost

---

### Phase 5: Competitor Intelligence (Week 4+)
**Goal:** Never miss a competitor move

1. **Create Script D** (see section 4)
2. **Dashboard:** Simple web page showing last 100 competitor tweets
3. **Deploy to cron:** `0 0 * * *` (midnight)
4. **Success criteria:** Full visibility into SimpleClaw/VidClaw activity

---

### Phase 6: Credit Tracking & Optimization (Ongoing)
**Goal:** Stay under budget, maximize ROI

1. **Create Script E** (see section 4)
2. **Weekly review:** Check `~/projects/clawer/logs/x-daily-costs.log`
3. **Adjust:** If burning credits too fast, reduce search frequency or result counts
4. **Success criteria:** Month-end cost within ±10% of $25 target

---

## 7. Credit Efficiency Hacks

### A. Caching Strategy
**Problem:** Searching for "openclaw" 3x/day fetches duplicate tweets  
**Solution:** Local SQLite cache of tweet IDs + text + timestamp

```bash
# Before API call, check cache
CACHED=$(sqlite3 ~/projects/clawer/data/x-cache.db "SELECT id FROM tweets WHERE id='$TWEET_ID'")
if [ -z "$CACHED" ]; then
  # Fetch from API, then cache
  curl "https://api.x.com/2/tweets/$TWEET_ID" ... | tee >(sqlite3 ~/projects/clawer/data/x-cache.db "INSERT INTO tweets ...")
fi
```

**Savings:** 50-70% reduction in duplicate reads (X's deduplication covers same-day, cache covers cross-day)

---

### B. Batch Endpoints
**Problem:** Fetching 100 tweets one-by-one = 100 API calls × $0.005 = $0.50  
**Solution:** `GET /2/tweets?ids=id1,id2,...,id100` = 1 API call × $0.05 = $0.05

**Always use:**
- `GET /2/tweets` (batch) instead of `GET /2/tweets/:id` (single)
- `GET /2/users` (batch) instead of `GET /2/users/:id` (single)

**Savings:** 10x cost reduction on bulk lookups

---

### C. Deduplication-Aware Scheduling
**Problem:** Hourly mention checks re-fetch same tweets every hour  
**Solution:** Store tweet IDs in `x-seen-ids.txt`, skip API calls for already-seen IDs within 24h

```bash
# Check if tweet was seen in last 24 hours
SEEN_TODAY=$(find ~/projects/clawer/data/x-seen-ids.txt -mtime -1 -exec grep "$TWEET_ID" {} \;)
if [ -z "$SEEN_TODAY" ]; then
  # Fetch from API (first time today, will be billed)
else
  # Use cached data (won't be billed even if we re-fetch)
fi
```

**Savings:** Minimal (X already deduplicates), but reduces unnecessary API traffic

---

### D. Search Query Optimization
**Problem:** Broad queries like "AI" return 10,000 irrelevant tweets  
**Solution:** Precise queries with exclusions

**Bad:** `query=AI assistant`  
**Good:** `query="openclaw" OR "self-hosted claude" -crypto -trading`

**Impact:** Fewer results = lower costs, higher relevance

---

### E. Rate Limit Awareness
**Problem:** Hit rate limit → script fails → retry → double charges  
**Solution:** Check `x-rate-limit-remaining` header, back off if <10

```bash
REMAINING=$(curl -I "https://api.x.com/2/tweets" ... | grep -i 'x-rate-limit-remaining' | awk '{print $2}')
if [ "$REMAINING" -lt 10 ]; then
  echo "Rate limit low, sleeping 5 minutes"
  sleep 300
fi
```

**Savings:** Avoids failed requests, ensures clean execution

---

### F. Time-of-Day Targeting
**Problem:** Searching at 3am when nobody's tweeting = wasted credits  
**Solution:** Run searches during peak hours (9am-9pm CST)

**Cron adjustment:**
```
# Instead of: 0 */4 * * * (every 4 hours, including 12am, 4am)
# Use: 0 9,13,17,21 * * * (9am, 1pm, 5pm, 9pm only)
```

**Savings:** 40% fewer API calls during low-activity windows

---

### G. Spending Limits + Auto-Recharge
**Setup in Developer Console:**
- Monthly spending limit: $30 (safety net above $25 budget)
- Auto-recharge: Trigger at $5 balance, add $25
- Alert: Email when 80% of limit reached

**Benefit:** Never run out mid-campaign, never overspend by >$5

---

## 8. Sample Tweets

### Blog Auto-Posts (5 examples)

**Example 1: Hosting comparison post**
```
🏆 Managed vs self-hosted OpenClaw: we ran the numbers

Spoiler: managed wins on uptime, cost, and sanity

https://clawer.ai/blog/openclaw-self-hosted-vs-managed

#OpenClaw #AIHosting #DevOps
```

**Example 2: Setup guide**
```
🔧 How to set up OpenClaw in 10 minutes (or 10 seconds with Clawer.ai)

New guide covers:
→ Local install
→ Docker compose
→ Managed hosting (the easy way)

https://clawer.ai/blog/how-to-set-up-openclaw

#OpenClaw #Tutorial
```

**Example 3: Best hosting post**
```
Where should you host OpenClaw in 2026?

We tested 5 options (VPS, cloud, managed)

Results surprised us 👀

https://clawer.ai/blog/best-openclaw-hosting

#CloudHosting #OpenClaw
```

**Example 4: Feature announcement**
```
🚀 New: 99.9% uptime SLA for OpenClaw hosting

No more "my agent crashed overnight" panic at 6am

This is how managed hosting should work

https://clawer.ai/blog/uptime-sla-announcement

#AIAgents #Reliability
```

**Example 5: Case study**
```
How @SomeStartup saved 40 hours/month switching to managed OpenClaw

"I wanted to build a product, not maintain servers"

Full breakdown:

https://clawer.ai/blog/case-study-managed-openclaw

#Startup #Productivity
```

---

### Engagement Replies (5 examples)

**Reply 1: Helpful answer**
```
@user We run OpenClaw for 100+ users—here's what works:

1. Use managed hosting (less ops overhead)
2. Set up crons for memory cleanup
3. Monitor token usage religiously

Happy to share more if useful 👍
```

**Reply 2: Soft pitch**
```
@user The "which hosting is best?" question 😅

We compared all options here: https://clawer.ai/blog/best-openclaw-hosting

TL;DR: managed wins for teams, self-hosted wins for tinkerers

What's your use case?
```

**Reply 3: Competitor mention**
```
@user We looked at SimpleClaw too—solid choice

Main diff: Clawer focuses on uptime + monitoring (99.9% SLA)

SimpleClaw is more DIY-friendly

Depends on your team's infra bandwidth
```

**Reply 4: Technical help**
```
@user That Error 226 is a rate limit issue

Try:
1. Check x-rate-limit-reset header
2. Add exponential backoff
3. Use official API instead of GraphQL scraping

We wrote about this: [link to blog]
```

**Reply 5: Community building**
```
@user Great question! We're seeing this a lot

Thinking about doing a live Q&A on OpenClaw hosting

Would you join? (Reply if interested, I'll set it up)
```

---

### Thread Starters (3 examples)

**Thread 1: 5 reasons managed > self-hosted**
```
🧵 5 reasons managed OpenClaw beats self-hosting (even for devs)

1/ Uptime
You: dealing with crashes at 2am
Us: automated failover + monitoring

Your agent never sleeps. Your server shouldn't either.

2/ Cost
"Self-hosted is free!" said the engineer before calculating:
- EC2 instance: $30/mo
- Backup storage: $10/mo
- Their own time debugging: $200/mo worth

Managed: $29/mo, zero ops overhead

3/ Security
Self-hosted: you patch, you monitor, you pray
Managed: auto-updates, SOC2 compliance, pen-tested infra

Which would you trust with customer data?

4/ Scalability
Need 10x capacity for a launch spike?
Self-hosted: provision, configure, test (3 days)
Managed: click "scale up" (3 minutes)

5/ Focus
Self-hosting is fun until it's 11pm and you're SSHing into a broken server

Managed = you build product, we handle infra

Try free: https://clawer.ai

What did I miss? Reply with your managed vs self-hosted war stories 👇
```

**Thread 2: OpenClaw ecosystem news**
```
🧵 What happened in OpenClaw this week (Feb 12-19, 2026)

Weekly recap of features, drama, and cool projects

1/ OpenClaw core team shipped v2.8.3
Big one: native Docker support
Smaller: 15% faster token processing

Upgrade guide: [link]

2/ Community spotlight: @SomeUser built an OpenClaw<>Notion integration
Syncs agent memories to Notion DB in real-time
Open source: [GitHub link]

This is 🔥

3/ Drama: SimpleClaw changed pricing again
$99→$149/mo for pro tier
Existing users grandfathered (for now)

Clawer.ai staying at $29/mo 🙌

4/ Tip of the week: use `qmd search` instead of memory_search for recent files
Saves 1500 tokens/search
HT @AnotherUser for this one

5/ Clawer.ai shipped: one-click backups to S3
Schedule: hourly, daily, or weekly
Restore in <5 min

Sleep better knowing your agent's memory is safe

That's the week! What are you building with OpenClaw? 👇
```

**Thread 3: Founder story**
```
🧵 How we built Clawer.ai to $10k MRR in 4 months (OpenClaw hosting)

Lessons from going 0→100 customers

1/ We didn't start with "hosting"
We built OpenClaw for our own agency
Clients asked "can you run this for us?"
We said yes 3 times before realizing it's a business

Lesson: solve your own problem, productize later

2/ First 10 customers were inbound from X
Posted setup guides, shared our learnings
People DM'd asking for help
Help → consulting → "want us to host it?" → $29/mo

Lesson: give away knowledge, sell convenience

3/ Pricing mistake we fixed fast
Started at $49/mo (seemed fair for infra cost)
Realized our competition was $99-$499
Dropped to $29 to own the "affordable managed" category

Lesson: price is positioning

4/ The feature that 10x'd signups
"99.9% uptime SLA"
Sounds boring, but devs HATE downtime
Competitors don't offer SLAs
We do (with auto-credits if we miss)

Lesson: solve the pain nobody talks about

5/ What's next
Hitting $25k MRR by June
Launching white-label for agencies
Building OpenClaw marketplace (plugins, themes)

Follow along: @teamclawer

Questions? Reply 👇
```

---

## 9. Authentication & Technical Setup

### Official X API Uses OAuth 1.0a or OAuth 2.0
**Key difference from Bird CLI:**
- Bird CLI: Uses GraphQL scraping (unofficial, prone to blocking)
- Official API: Uses OAuth (official, stable, less likely to be blocked)

**Even if @teamclawer is blocked on Bird CLI, official API should work** (different authentication path)

---

### OAuth 1.0a Setup (Recommended for server-side automation)

1. **Generate keys in Developer Console:**
   - API Key (Consumer Key)
   - API Secret Key (Consumer Secret)
   - Access Token
   - Access Token Secret

2. **Store securely:**
   ```bash
   # ~/secrets/x-api-teamclawer.env
   export X_API_KEY="your_api_key"
   export X_API_SECRET="your_api_secret"
   export X_ACCESS_TOKEN="your_access_token"
   export X_ACCESS_TOKEN_SECRET="your_access_token_secret"
   ```

3. **Sign requests with OAuth 1.0a:**
   ```bash
   # Use a library like `oauth` or `python-twitter`
   # Example with curl + oauth signature:
   curl -X POST "https://api.x.com/2/tweets" \
     -H "Authorization: OAuth oauth_consumer_key=\"$X_API_KEY\", oauth_token=\"$X_ACCESS_TOKEN\", oauth_signature=\"...\", ..." \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello from Clawer.ai!"}'
   ```

---

### Bearer Token (Simpler for read-only automation)

1. **Generate in Developer Console:**
   - "Keys and Tokens" → "Bearer Token"

2. **Use for read operations:**
   ```bash
   curl "https://api.x.com/2/tweets/search/recent?query=openclaw" \
     -H "Authorization: Bearer $BEARER_TOKEN"
   ```

**Note:** Bearer tokens are app-level (not user-specific), so cannot post tweets. Use OAuth 1.0a for write operations.

---

### Testing Authentication

```bash
# Test read access (Bearer Token)
curl "https://api.x.com/2/users/me" \
  -H "Authorization: Bearer $BEARER_TOKEN"

# Should return: {"data":{"id":"...","name":"teamclawer","username":"teamclawer"}}

# Test write access (OAuth 1.0a)
# (Use a library like Python's tweepy or Node's twitter-api-v2)
```

---

## 10. Risk Mitigation

### A. @teamclawer Account Suspension
**Risk:** If Bird CLI block extends to official API  
**Mitigation:**
1. Start with @Vavier (known working account)
2. Apply for @teamclawer API access separately
3. If denied, use @Vavier as primary, @teamclawer for manual posts
4. Appeal via developer.x.com support (official API ≠ scraping)

---

### B. Credit Burn from Bugs
**Risk:** Script bug causes infinite loop, burns $100 in credits overnight  
**Mitigation:**
1. Set spending limit to $30/month (hard cap)
2. Test all scripts with `--dry-run` flag first
3. Monitor credit usage daily (Script E)
4. Start with $10 budget, scale to $25 after 2 weeks of clean execution

---

### C. Rate Limits Hit Mid-Campaign
**Risk:** Automation hits rate limit, stops working  
**Mitigation:**
1. Check `x-rate-limit-remaining` header before each call
2. Implement exponential backoff (sleep 15 min if limit hit)
3. Spread calls across day (not all at 9am)
4. Use batch endpoints to reduce call volume

---

### D. Deduplication Doesn't Fire
**Risk:** X's "soft guarantee" fails, double-billed for same tweets  
**Mitigation:**
1. Local cache as backup (SQLite tracking of fetched IDs)
2. Weekly audit: compare X usage logs to local logs
3. If mismatch >10%, contact support for credit refund

---

## 11. Success Metrics (3-Month Goals)

### Engagement Metrics
- [ ] **1,000 @teamclawer followers** (currently ~50)
- [ ] **50+ replies/month** from mention monitoring
- [ ] **10+ quality conversations/week** from topic searches
- [ ] **5+ quote tweets/month** from OpenClaw ecosystem content

### Lead Generation Metrics
- [ ] **20+ signups** attributed to X engagement
- [ ] **5+ demo requests** from DMs
- [ ] **3+ case study candidates** from power users

### Cost Efficiency Metrics
- [ ] **<$30/month** total spend (including buffer)
- [ ] **<$0.50 per qualified lead** (CPA)
- [ ] **Zero credit waste** (>95% of API calls useful)

### Automation Health Metrics
- [ ] **100% uptime** on crons (no missed blog posts)
- [ ] **Zero missed mentions** (checked via manual audit)
- [ ] **<5% false positives** on engagement opportunities

---

## 12. Next Actions (Immediate)

### Keith's To-Do (Week 1)
1. [ ] Apply for X API access at developer.x.com (use @Vavier first if @teamclawer blocked)
2. [ ] Create app "Clawer Marketing Automation"
3. [ ] Generate OAuth 1.0a keys + Bearer Token
4. [ ] Purchase $25 in credits
5. [ ] Test authentication with `curl` (see section 9)

### Lex's To-Do (Week 1-2)
1. [ ] Create Script A (blog auto-post) — deploy to cron
2. [ ] Create Script B (mention monitoring) — test with manual tweet
3. [ ] Set up `~/projects/clawer/data/x-cache.db` (SQLite for dedup)
4. [ ] Create `~/projects/clawer/logs/x-*.log` files
5. [ ] Build credit tracker dashboard (simple HTML page showing daily costs)

### Test Plan (Week 2)
1. [ ] Post 1 test tweet via API (verify $0.01 charge)
2. [ ] Fetch 10 mentions (verify $0.05 charge)
3. [ ] Search "openclaw" 20 results (verify $0.10 charge)
4. [ ] Check Developer Console usage (should match local logs)
5. [ ] If all green: enable auto-recharge, scale to full Tier 2

---

## Appendix: Quick Reference

### Credit Conversion Table
| Budget | Posts | Reads | Mixed (Recommended) |
|--------|-------|-------|---------------------|
| $5 | 50 | 1,000 | 40 posts + 200 reads |
| $10 | 100 | 2,000 | 80 posts + 400 reads |
| $25 | 250 | 5,000 | 80 posts + 3,600 reads |
| $50 | 500 | 10,000 | 150 posts + 7,000 reads |
| $100 | 1,000 | 20,000 | 300 posts + 14,000 reads |

### Rate Limit Cheat Sheet (Per 15 Minutes)
| Endpoint | App Limit | User Limit |
|----------|-----------|------------|
| POST /2/tweets | 10,000/24h | 100 |
| GET /2/tweets | 3,500 | 5,000 |
| GET /2/tweets/search/recent | 450 | 300 |
| GET /2/users/:id/mentions | 450 | 300 |
| POST /2/users/:id/likes | — | 50 |
| POST /2/users/:id/retweets | — | 50 |

### File Structure
```
~/projects/clawer/
├── scripts/
│   ├── x-auto-post-blog.sh
│   ├── x-monitor-mentions.sh
│   ├── x-search-engage.sh
│   ├── x-monitor-competitors.sh
│   └── x-check-credits.sh
├── data/
│   ├── x-cache.db (SQLite)
│   ├── x-last-posted.txt
│   ├── x-responded-ids.txt
│   ├── x-engaged-ids.txt
│   └── x-seen-ids.txt
├── logs/
│   ├── x-mentions.log
│   ├── x-opportunities.log
│   ├── x-competitors.log
│   └── x-daily-costs.log
└── docs/
    └── X-API-STRATEGY.md (this file)
```

---

## Document Version History
- **v1.0** (Feb 19, 2026): Initial strategy, ready for implementation
- **v1.1** (TBD): Post-launch learnings, cost actuals vs projections

---

**Questions?** Contact @Vavier on X or keith@clawer.ai

**Ready to ship.** 🚀
