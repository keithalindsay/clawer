#!/usr/bin/env python3
"""
Reddit Monitoring Bot for clawer.ai.
Monitors target subreddits for OpenClaw-related posts and comments.
Saves opportunities to reddit-opportunities.json for human review.
DOES NOT auto-post — human review only.

Usage:
  python3 reddit-monitor.py              # Run full scan
  python3 reddit-monitor.py --dry-run    # Show what would be saved without writing
  python3 reddit-monitor.py --show       # Show existing opportunities
  python3 reddit-monitor.py --subreddit selfhosted  # Scan specific subreddit
"""

import os
import sys
import json
import time
import datetime
import argparse
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OPPORTUNITIES_FILE = os.path.join(SCRIPT_DIR, "reddit-opportunities.json")

SUBREDDITS = [
    "selfhosted",
    "SideProject",
    "artificial",
    "LocalLLaMA",
    "AI_Agents",
]

SEARCH_TERMS = [
    "openclaw",
    "openclaw hosting",
    "ai agent hosting",
    "managed openclaw",
    "whatsapp bot ai",
    "telegram ai agent",
    "self host ai assistant",
    "claude hosting",
]

# Response templates for different contexts
RESPONSE_TEMPLATES = {
    "openclaw_self_hosting": """Great question about {topic}! A few things worth knowing:

{helpful_info}

If you'd rather skip the setup complexity, I should mention I work on [Clawer.ai](https://clawer.ai) — managed OpenClaw hosting where you get an instance running in ~2 minutes with automatic security patches, WhatsApp/Telegram already configured, and no Docker debugging. Might be worth a look if the self-hosting overhead isn't your thing.

Happy to answer questions either way!""",

    "whatsapp_bot": """For WhatsApp + AI, the tricky part is usually session management — WhatsApp frequently breaks unofficial API connections.

{helpful_info}

Worth noting: [Clawer.ai](https://clawer.ai) handles the WhatsApp session stability piece as managed infrastructure (they use OpenClaw under the hood). Could save you the debugging headache if that's your main pain point.""",

    "general_ai_agent": """Good thread — {topic} is a real consideration.

{helpful_info}

For context on the hosting side: [Clawer.ai](https://clawer.ai) offers managed OpenClaw instances if the self-hosting overhead is a blocker. Not always the right fit but worth knowing it exists.""",

    "helpful_only": """{helpful_info}"""
}

# ANSI colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def log(msg, color=""):
    print(f"{color}{msg}{RESET}" if color else msg)


def load_opportunities():
    if os.path.exists(OPPORTUNITIES_FILE):
        with open(OPPORTUNITIES_FILE) as f:
            return json.load(f)
    return {"opportunities": [], "scanned_ids": [], "last_scan": None}


def save_opportunities(data):
    with open(OPPORTUNITIES_FILE, "w") as f:
        json.dump(data, f, indent=2)


def calculate_relevance_score(title, body, subreddit):
    """
    Score 0-100 for how relevant a post is.
    Higher = more worth responding to.
    """
    score = 0
    text = f"{title} {body}".lower()

    # Direct mentions — highest value
    if "openclaw" in text:
        score += 40
    if "clawer" in text:
        score += 30

    # Problem signals (good opportunity to help)
    problem_signals = [
        ("self.host", 10), ("self-host", 10),
        ("docker", 8), ("vps", 8),
        ("whatsapp", 10), ("telegram", 8),
        ("ai agent", 12), ("ai assistant", 10),
        ("hosting", 8), ("managed", 8),
        ("setup", 5), ("install", 5),
        ("broken", 15), ("not working", 15), ("help", 10),
        ("alternative", 12), ("recommend", 12), ("suggestion", 10),
        ("cost", 8), ("price", 8), ("expensive", 10),
        ("security", 8), ("cve", 15), ("vulnerability", 15),
    ]
    for term, pts in problem_signals:
        if term in text:
            score += pts

    # Subreddit bonuses
    subreddit_bonus = {
        "selfhosted": 10,
        "LocalLLaMA": 8,
        "AI_Agents": 15,
        "SideProject": 5,
        "artificial": 3,
    }
    score += subreddit_bonus.get(subreddit, 0)

    return min(score, 100)


def generate_suggested_response(post, relevance_score):
    """Generate a contextually appropriate suggested response."""
    title = post.get("title", "").lower()
    body = (post.get("body", "") or "").lower()
    subreddit = post.get("subreddit", "")
    text = f"{title} {body}"

    # Determine the context
    helpful_info = ""

    if "whatsapp" in text or "telegram" in text:
        helpful_info = """The main challenges with WhatsApp unofficial APIs (Baileys etc.):
- Sessions expire randomly, especially after WhatsApp updates
- Your account can get flagged/banned for automation
- Self-hosting means you handle reconnects manually

For Telegram bots, the official Bot API is much more stable and won't get you banned."""
        template_key = "whatsapp_bot"
        topic = "WhatsApp session management"

    elif "security" in text or "cve" in text or "vulnerability" in text:
        helpful_info = """OpenClaw security basics:
- Always run behind a reverse proxy (nginx/caddy) with auth
- Never expose port 3000 directly to internet
- Use Docker user namespaces for isolation
- Keep updated — CVE-2026-25253 affected unpatched instances
- Audit any ClawHub skills before installing (several had malicious code)"""
        template_key = "openclaw_self_hosting"
        topic = "OpenClaw security"

    elif "docker" in text or "setup" in text or "install" in text:
        helpful_info = """Common OpenClaw setup gotchas:
- Use Node 20+ (18 has issues with some dependencies)
- WhatsApp QR code expires fast — have your phone ready
- Set ANTHROPIC_API_KEY before starting, not after
- `~/.openclaw/` holds your data — back it up
- Memory files (AGENTS.md, SOUL.md) are the key to good behavior"""
        template_key = "openclaw_self_hosting"
        topic = "OpenClaw setup"

    elif "cost" in text or "price" in text or "expensive" in text:
        helpful_info = """Realistic OpenClaw cost breakdown:
- API costs: ~$10-30/month for moderate use (Claude Sonnet)
- VPS: $5-20/month (2GB RAM minimum)
- Your time: 2-5 hours setup + 1-2 hours/month maintenance
- Total self-hosted: $15-50/month + time

The real question is whether your time is worth more than the hosting delta."""
        template_key = "openclaw_self_hosting"
        topic = "OpenClaw hosting costs"

    elif "alternative" in text or "recommend" in text or "suggestion" in text:
        helpful_info = """Depends what you need:
- Full control + privacy → self-host on a VPS (Hetzner/DigitalOcean are popular)
- Quick start + no ops → managed hosting options exist
- Specific use case → might be worth checking OpenClaw's ClawHub for pre-built skill packs

What's your main use case?"""
        template_key = "general_ai_agent"
        topic = "AI agent options"

    else:
        helpful_info = "Happy to share more if you describe your specific use case."
        template_key = "helpful_only"
        topic = "this"

    # Only mention clawer.ai if relevance is high enough
    if relevance_score < 30:
        template_key = "helpful_only"

    template = RESPONSE_TEMPLATES.get(template_key, RESPONSE_TEMPLATES["helpful_only"])
    return template.format(helpful_info=helpful_info, topic=topic)


# ── Reddit API ──────────────────────────────────────────────────────────────

def try_praw():
    """Try to use PRAW if available."""
    try:
        import praw
        client_id = os.environ.get("REDDIT_CLIENT_ID")
        client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
        username = os.environ.get("REDDIT_USERNAME")
        password = os.environ.get("REDDIT_PASSWORD")

        if not all([client_id, client_secret]):
            return None

        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            username=username,
            password=password,
            user_agent="clawer-monitor/1.0 (by /u/{})" .format(username or "clawerai"),
        )
        # Test connection
        reddit.user.me()
        log("  Using PRAW (authenticated)", GREEN)
        return reddit
    except ImportError:
        return None
    except Exception as e:
        log(f"  PRAW auth failed ({e}), falling back to JSON API", YELLOW)
        return None


def search_reddit_json(subreddit, search_term, limit=25):
    """Fallback: use Reddit's public JSON API."""
    import urllib.request
    import urllib.parse

    encoded = urllib.parse.quote(search_term)
    url = f"https://www.reddit.com/r/{subreddit}/search.json?q={encoded}&restrict_sr=1&sort=new&limit={limit}"
    
    headers = {"User-Agent": "clawer-monitor/1.0"}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            posts = []
            for child in data.get("data", {}).get("children", []):
                p = child.get("data", {})
                posts.append({
                    "id": p.get("id"),
                    "subreddit": subreddit,
                    "title": p.get("title", ""),
                    "body": p.get("selftext", ""),
                    "url": f"https://reddit.com{p.get('permalink', '')}",
                    "author": p.get("author", "[deleted]"),
                    "created_utc": p.get("created_utc", 0),
                    "score": p.get("score", 0),
                    "num_comments": p.get("num_comments", 0),
                    "type": "post"
                })
            return posts
    except Exception as e:
        log(f"    JSON API error for r/{subreddit} '{search_term}': {e}", RED)
        return []


def scan_with_praw(reddit, subreddit_name, search_terms, already_scanned):
    """Scan a subreddit using PRAW."""
    results = []
    subreddit = reddit.subreddit(subreddit_name)

    for term in search_terms:
        try:
            for submission in subreddit.search(term, sort="new", time_filter="week", limit=20):
                if submission.id in already_scanned:
                    continue
                results.append({
                    "id": submission.id,
                    "subreddit": subreddit_name,
                    "title": submission.title,
                    "body": submission.selftext or "",
                    "url": f"https://reddit.com{submission.permalink}",
                    "author": str(submission.author) if submission.author else "[deleted]",
                    "created_utc": submission.created_utc,
                    "score": submission.score,
                    "num_comments": submission.num_comments,
                    "type": "post"
                })
            time.sleep(0.5)  # PRAW rate limit courtesy
        except Exception as e:
            log(f"    PRAW error for r/{subreddit_name} '{term}': {e}", RED)

    return results


def scan_with_json_api(subreddit_name, search_terms, already_scanned):
    """Scan a subreddit using Reddit's JSON API fallback."""
    results = []
    seen_ids = set()

    for term in search_terms:
        posts = search_reddit_json(subreddit_name, term)
        for post in posts:
            if post["id"] in already_scanned or post["id"] in seen_ids:
                continue
            seen_ids.add(post["id"])
            results.append(post)
        time.sleep(1)  # Be polite to Reddit's rate limits

    return results


def main():
    parser = argparse.ArgumentParser(description="Monitor Reddit for OpenClaw opportunities")
    parser.add_argument("--dry-run", action="store_true", help="Show findings without saving")
    parser.add_argument("--show", action="store_true", help="Show existing opportunities")
    parser.add_argument("--subreddit", help="Scan only this subreddit")
    parser.add_argument("--min-score", type=int, default=20, help="Min relevance score to save (default: 20)")
    args = parser.parse_args()

    if args.show:
        data = load_opportunities()
        opps = data.get("opportunities", [])
        if not opps:
            log("No opportunities saved yet.", YELLOW)
            return 0
        log(f"\n{BOLD}=== Reddit Opportunities ({len(opps)} total) ==={RESET}")
        for opp in sorted(opps, key=lambda x: x.get("relevance_score", 0), reverse=True)[:20]:
            log(f"\n[Score: {opp['relevance_score']}] r/{opp['subreddit']}", CYAN)
            log(f"  Title: {opp['title']}")
            log(f"  URL: {opp['url']}")
            log(f"  Author: u/{opp['author']} | {opp.get('created_utc_str', '')}")
            log(f"  Suggested Response Preview:")
            preview = opp.get("suggested_response", "")[:200]
            log(f"    {preview}...")
        return 0

    log(f"\n{BOLD}=== Reddit Monitor ==={RESET}")
    if args.dry_run:
        log("Mode: DRY RUN (opportunities won't be saved)", CYAN)

    data = load_opportunities()
    already_scanned = set(data.get("scanned_ids", []))
    existing_urls = {o["url"] for o in data.get("opportunities", [])}

    # Try PRAW, fall back to JSON API
    reddit = try_praw()
    if not reddit:
        has_creds = bool(os.environ.get("REDDIT_CLIENT_ID"))
        if has_creds:
            log("  Falling back to Reddit JSON API", YELLOW)
        else:
            log("  No Reddit credentials — using public JSON API (limited)", YELLOW)

    subreddits_to_scan = [args.subreddit] if args.subreddit else SUBREDDITS
    new_opportunities = []
    total_scanned = 0

    for subreddit_name in subreddits_to_scan:
        log(f"\nScanning r/{subreddit_name}...", CYAN)

        if reddit:
            raw_posts = scan_with_praw(reddit, subreddit_name, SEARCH_TERMS, already_scanned)
        else:
            raw_posts = scan_with_json_api(subreddit_name, SEARCH_TERMS, already_scanned)

        log(f"  Found {len(raw_posts)} unscanned posts")
        total_scanned += len(raw_posts)

        for post in raw_posts:
            already_scanned.add(post["id"])
            score = calculate_relevance_score(post["title"], post.get("body", ""), subreddit_name)

            if score < args.min_score:
                continue

            if post["url"] in existing_urls:
                continue

            created_str = ""
            try:
                created_str = datetime.datetime.utcfromtimestamp(post["created_utc"]).strftime("%Y-%m-%d %H:%M UTC")
            except Exception:
                pass

            suggested = generate_suggested_response(post, score)

            opportunity = {
                "id": post["id"],
                "subreddit": subreddit_name,
                "title": post["title"],
                "url": post["url"],
                "author": post["author"],
                "created_utc": post["created_utc"],
                "created_utc_str": created_str,
                "score": post.get("score", 0),
                "num_comments": post.get("num_comments", 0),
                "type": post["type"],
                "relevance_score": score,
                "body_preview": (post.get("body", "") or "")[:300],
                "suggested_response": suggested,
                "saved_at": datetime.datetime.utcnow().isoformat() + "Z",
                "status": "unreviewed"
            }
            new_opportunities.append(opportunity)
            log(f"  {GREEN}✓ Opportunity [score={score}]:{RESET} {post['title'][:60]}...")

    # Save results
    log(f"\n{BOLD}=== Summary ==={RESET}")
    log(f"  Subreddits scanned: {len(subreddits_to_scan)}")
    log(f"  Posts examined: {total_scanned}")
    log(f"  New opportunities: {len(new_opportunities)}", GREEN if new_opportunities else "")

    if not args.dry_run and new_opportunities:
        data["opportunities"].extend(new_opportunities)
        data["scanned_ids"] = list(already_scanned)[-5000:]  # Keep last 5k to avoid file bloat
        data["last_scan"] = datetime.datetime.utcnow().isoformat() + "Z"
        save_opportunities(data)
        log(f"  Saved to: {OPPORTUNITIES_FILE}", GREEN)
    elif args.dry_run and new_opportunities:
        log("  (Dry run — not saving)", CYAN)

    return 0


if __name__ == "__main__":
    sys.exit(main())
