#!/usr/bin/env python3
"""
Dev.to Cross-Poster for clawer.ai blog posts.
Reads blog-manifest.json, extracts TSX content, converts to Markdown, posts to Dev.to.
Sets canonical_url back to clawer.ai for SEO.

Usage:
  python3 devto-crosspost.py             # Post all new articles
  python3 devto-crosspost.py --dry-run   # Show what would be posted
  python3 devto-crosspost.py --force-slug <slug>  # Re-post specific slug
"""

import os
import sys
import json
import re
import time
import datetime
import argparse
import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
BLOG_MANIFEST = os.path.join(PROJECT_ROOT, "public", "blog-manifest.json")
BLOG_SRC_DIR = os.path.join(PROJECT_ROOT, "src", "app", "blog")
TRACKER_FILE = os.path.join(SCRIPT_DIR, ".devto-posted.json")

DEVTO_API_URL = "https://dev.to/api/articles"
DEVTO_TAGS = ["ai", "openclaw", "agents", "hosting"]  # max 4
CANONICAL_BASE = "https://clawer.ai/blog"

# ANSI colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def log(msg, color=""):
    print(f"{color}{msg}{RESET}" if color else msg)


def load_tracker():
    if os.path.exists(TRACKER_FILE):
        with open(TRACKER_FILE) as f:
            return json.load(f)
    return {"posted": {}}


def save_tracker(tracker):
    with open(TRACKER_FILE, "w") as f:
        json.dump(tracker, f, indent=2)


def load_manifest():
    if not os.path.exists(BLOG_MANIFEST):
        log(f"ERROR: blog-manifest.json not found at {BLOG_MANIFEST}", RED)
        sys.exit(1)
    with open(BLOG_MANIFEST) as f:
        data = json.load(f)
    return data.get("posts", [])


def extract_tsx_content(slug):
    """Extract and return the TSX file content for a given slug."""
    tsx_path = os.path.join(BLOG_SRC_DIR, slug, "page.tsx")
    if not os.path.exists(tsx_path):
        log(f"  WARNING: No page.tsx found for slug '{slug}' at {tsx_path}", YELLOW)
        return None
    with open(tsx_path) as f:
        return f.read()


def tsx_to_markdown(tsx_content, post_meta):
    """
    Convert TSX/JSX blog content to clean Markdown.
    Handles common patterns: <h1-h6>, <p>, <strong>, <em>, <code>, <pre>,
    <ul>/<ol>/<li>, <a href>, <blockquote>, <hr>, and strips JSX boilerplate.
    """
    text = tsx_content

    # Remove imports and metadata blocks at the top
    text = re.sub(r'^import\s+.*?;?\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'export\s+const\s+metadata\s*=\s*\{.*?\};', '', text, flags=re.DOTALL)
    text = re.sub(r'const\s+\w+Schema\s*=\s*\{.*?\};', '', text, flags=re.DOTALL)

    # Extract JSX content — find the return() block of the default export
    # Look for the main content area
    return_match = re.search(r'return\s*\(\s*(<[\s\S]*?>[\s\S]*)\s*\);?\s*\}', text, re.DOTALL)
    if return_match:
        text = return_match.group(1)
    else:
        # Fallback: just use what we have
        pass

    # Strip script/JSON-LD tags
    text = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', text)

    # Strip navigation/header/footer wrapper elements but keep content
    text = re.sub(r'<(nav|header|footer)[^>]*>[\s\S]*?</\1>', '', text)

    # Convert headings
    for level in range(6, 0, -1):
        hashes = "#" * level
        text = re.sub(rf'<h{level}[^>]*>([\s\S]*?)</h{level}>', 
                      lambda m, h=hashes: f"\n{h} {_strip_tags(m.group(1)).strip()}\n",
                      text)

    # Convert blockquote
    text = re.sub(r'<blockquote[^>]*>([\s\S]*?)</blockquote>',
                  lambda m: "\n" + "\n".join(f"> {line}" for line in _strip_tags(m.group(1)).strip().splitlines()) + "\n",
                  text)

    # Convert pre/code blocks
    text = re.sub(r'<pre[^>]*><code[^>]*>([\s\S]*?)</code></pre>',
                  lambda m: f"\n```\n{_unescape_html(m.group(1)).strip()}\n```\n",
                  text)
    text = re.sub(r'<pre[^>]*>([\s\S]*?)</pre>',
                  lambda m: f"\n```\n{_unescape_html(_strip_tags(m.group(1))).strip()}\n```\n",
                  text)

    # Convert inline code
    text = re.sub(r'<code[^>]*>([\s\S]*?)</code>',
                  lambda m: f"`{_unescape_html(m.group(1)).strip()}`",
                  text)

    # Convert bold/strong
    text = re.sub(r'<(strong|b)[^>]*>([\s\S]*?)</\1>', 
                  lambda m: f"**{_strip_tags(m.group(2)).strip()}**", text)

    # Convert italic/em
    text = re.sub(r'<(em|i)[^>]*>([\s\S]*?)</\1>', 
                  lambda m: f"_{_strip_tags(m.group(2)).strip()}_", text)

    # Convert links — but skip clawer.ai internal links and convert to just text
    text = re.sub(r'<a\s+(?:[^>]*\s+)?href=["\']([^"\']+)["\'][^>]*>([\s\S]*?)</a>',
                  lambda m: _convert_link(m.group(1), m.group(2)),
                  text)

    # Convert unordered lists
    text = re.sub(r'<ul[^>]*>([\s\S]*?)</ul>',
                  lambda m: _convert_list(m.group(1), ordered=False),
                  text)

    # Convert ordered lists
    text = re.sub(r'<ol[^>]*>([\s\S]*?)</ol>',
                  lambda m: _convert_list(m.group(1), ordered=True),
                  text)

    # Convert paragraphs
    text = re.sub(r'<p[^>]*>([\s\S]*?)</p>',
                  lambda m: f"\n{_strip_tags(m.group(1)).strip()}\n",
                  text)

    # Convert hr
    text = re.sub(r'<hr\s*/?>', '\n---\n', text)

    # Convert line breaks
    text = re.sub(r'<br\s*/?>', '\n', text)

    # Strip remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)

    # Unescape HTML entities
    text = _unescape_html(text)

    # Clean up JSX expressions like {` `} or className= etc
    text = re.sub(r'\{`[^`]*`\}', '', text)
    text = re.sub(r'\{[^}]*\}', '', text)

    # Collapse excessive blank lines
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    text = text.strip()

    # Add the title as H1 if not already there
    title = post_meta.get("title", "")
    if title and not text.startswith("# "):
        text = f"# {title}\n\n{text}"

    return text


def _strip_tags(html):
    return re.sub(r'<[^>]+>', '', html)


def _unescape_html(text):
    replacements = [
        ('&amp;', '&'), ('&lt;', '<'), ('&gt;', '>'),
        ('&quot;', '"'), ('&#39;', "'"), ('&nbsp;', ' '),
        ('&mdash;', '—'), ('&ndash;', '–'), ('&hellip;', '…'),
    ]
    for entity, char in replacements:
        text = text.replace(entity, char)
    return text


def _convert_link(href, inner_text):
    text = _strip_tags(inner_text).strip()
    if not text:
        text = href
    # Keep external links, convert clawer.ai internal links  
    if href.startswith('/') or 'clawer.ai' in href:
        full_url = href if href.startswith('http') else f"https://clawer.ai{href}"
        return f"[{text}]({full_url})"
    return f"[{text}]({href})"


def _convert_list(items_html, ordered=False):
    items = re.findall(r'<li[^>]*>([\s\S]*?)</li>', items_html)
    lines = []
    for i, item in enumerate(items, 1):
        content = _strip_tags(item).strip()
        if ordered:
            lines.append(f"{i}. {content}")
        else:
            lines.append(f"- {content}")
    return "\n" + "\n".join(lines) + "\n"


def post_to_devto(api_key, post_meta, markdown_content, dry_run=False):
    """Post a single article to Dev.to. Returns (success, article_url, article_id)."""
    slug = post_meta["slug"]
    title = post_meta["title"]
    canonical_url = f"{CANONICAL_BASE}/{slug}"

    payload = {
        "article": {
            "title": title,
            "body_markdown": markdown_content,
            "published": True,
            "canonical_url": canonical_url,
            "tags": DEVTO_TAGS,
            "description": post_meta.get("excerpt", "")[:500],
        }
    }

    if dry_run:
        log(f"  [DRY RUN] Would POST to Dev.to:", CYAN)
        log(f"    Title: {title}")
        log(f"    Canonical: {canonical_url}")
        log(f"    Tags: {DEVTO_TAGS}")
        log(f"    Content length: {len(markdown_content)} chars")
        return True, f"https://dev.to/dry-run/{slug}", "dry-run-id"

    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/vnd.forem.api-v1+json"
    }

    try:
        resp = requests.post(DEVTO_API_URL, json=payload, headers=headers, timeout=30)
        if resp.status_code in (200, 201):
            data = resp.json()
            return True, data.get("url", ""), data.get("id", "")
        else:
            log(f"  ERROR: Dev.to API returned {resp.status_code}: {resp.text[:300]}", RED)
            return False, None, None
    except requests.RequestException as e:
        log(f"  ERROR: Request failed: {e}", RED)
        return False, None, None


def main():
    parser = argparse.ArgumentParser(description="Cross-post clawer.ai blogs to Dev.to")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be posted without actually posting")
    parser.add_argument("--force-slug", help="Force re-post a specific slug even if already tracked")
    args = parser.parse_args()

    api_key = os.environ.get("DEVTO_API_KEY")
    if not api_key:
        log("WARNING: DEVTO_API_KEY not set. Use --dry-run to test without posting.", YELLOW)
        if not args.dry_run:
            log("Skipping Dev.to cross-post (no API key configured).", YELLOW)
            sys.exit(0)

    log(f"\n{BOLD}=== Dev.to Cross-Poster ==={RESET}")
    if args.dry_run:
        log("Mode: DRY RUN (no actual posts)", CYAN)

    tracker = load_tracker()
    posts = load_manifest()
    log(f"Found {len(posts)} posts in manifest.\n")

    posted_count = 0
    skipped_count = 0
    error_count = 0

    for post in posts:
        slug = post["slug"]
        title = post["title"]

        # Check if already posted
        if not args.force_slug and slug in tracker["posted"]:
            log(f"  SKIP (already posted): {slug}", YELLOW)
            skipped_count += 1
            continue

        if args.force_slug and slug != args.force_slug:
            continue

        log(f"\n{BOLD}Processing:{RESET} {title}")
        log(f"  Slug: {slug}")

        # Extract TSX content
        tsx_content = extract_tsx_content(slug)
        if not tsx_content:
            log(f"  ERROR: Could not read page.tsx for {slug}", RED)
            error_count += 1
            continue

        # Convert to Markdown
        markdown = tsx_to_markdown(tsx_content, post)
        log(f"  Converted to Markdown: {len(markdown)} chars")

        # Post to Dev.to
        success, article_url, article_id = post_to_devto(api_key, post, markdown, dry_run=args.dry_run)

        if success:
            log(f"  {GREEN}✓ Posted!{RESET} URL: {article_url}")
            tracker["posted"][slug] = {
                "title": title,
                "devto_url": article_url,
                "devto_id": str(article_id),
                "posted_at": datetime.datetime.utcnow().isoformat() + "Z",
                "canonical_url": f"{CANONICAL_BASE}/{slug}"
            }
            if not args.dry_run:
                save_tracker(tracker)
            posted_count += 1

            # Rate limit: wait 2s between posts to be polite
            if not args.dry_run:
                time.sleep(2)
        else:
            error_count += 1

    # Final summary
    log(f"\n{BOLD}=== Summary ==={RESET}")
    log(f"  Posted:  {posted_count}", GREEN if posted_count > 0 else "")
    log(f"  Skipped: {skipped_count}")
    log(f"  Errors:  {error_count}", RED if error_count > 0 else "")

    if not args.dry_run and posted_count > 0:
        save_tracker(tracker)

    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
