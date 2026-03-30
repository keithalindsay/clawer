#!/usr/bin/env python3
"""
Hashnode Cross-Poster for clawer.ai blog posts.
Uses Hashnode's GraphQL API to publish articles with canonical URLs pointing back to clawer.ai.

Usage:
  python3 hashnode-crosspost.py             # Post all new articles
  python3 hashnode-crosspost.py --dry-run   # Show what would be posted
  python3 hashnode-crosspost.py --force-slug <slug>  # Re-post specific slug
  python3 hashnode-crosspost.py --list-publications  # List your Hashnode publications
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
TRACKER_FILE = os.path.join(SCRIPT_DIR, ".hashnode-posted.json")

HASHNODE_API_URL = "https://gql.hashnode.com"
CANONICAL_BASE = "https://clawer.ai/blog"
HASHNODE_TAGS = [
    {"slug": "ai", "name": "AI"},
    {"slug": "agents", "name": "Agents"},
    {"slug": "opensource", "name": "Open Source"},
    {"slug": "devops", "name": "DevOps"},
]

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
    return {"posted": {}, "publication_id": None}


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
    tsx_path = os.path.join(BLOG_SRC_DIR, slug, "page.tsx")
    if not os.path.exists(tsx_path):
        log(f"  WARNING: No page.tsx found for slug '{slug}'", YELLOW)
        return None
    with open(tsx_path) as f:
        return f.read()


def tsx_to_markdown(tsx_content, post_meta):
    """Convert TSX/JSX blog content to clean Markdown."""
    text = tsx_content

    # Remove imports
    text = re.sub(r'^import\s+.*?;?\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'export\s+const\s+metadata\s*=\s*\{.*?\};', '', text, flags=re.DOTALL)
    text = re.sub(r'const\s+\w+Schema\s*=\s*\{.*?\};', '', text, flags=re.DOTALL)

    # Extract main JSX return block
    return_match = re.search(r'return\s*\(\s*(<[\s\S]*?>[\s\S]*)\s*\);?\s*\}', text, re.DOTALL)
    if return_match:
        text = return_match.group(1)

    # Strip script tags
    text = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', text)
    text = re.sub(r'<(nav|header|footer)[^>]*>[\s\S]*?</\1>', '', text)

    # Headings
    for level in range(6, 0, -1):
        hashes = "#" * level
        text = re.sub(rf'<h{level}[^>]*>([\s\S]*?)</h{level}>',
                      lambda m, h=hashes: f"\n{h} {_strip_tags(m.group(1)).strip()}\n",
                      text)

    # Blockquotes
    text = re.sub(r'<blockquote[^>]*>([\s\S]*?)</blockquote>',
                  lambda m: "\n" + "\n".join(f"> {l}" for l in _strip_tags(m.group(1)).strip().splitlines()) + "\n",
                  text)

    # Code blocks
    text = re.sub(r'<pre[^>]*><code[^>]*>([\s\S]*?)</code></pre>',
                  lambda m: f"\n```\n{_unescape_html(m.group(1)).strip()}\n```\n",
                  text)
    text = re.sub(r'<pre[^>]*>([\s\S]*?)</pre>',
                  lambda m: f"\n```\n{_unescape_html(_strip_tags(m.group(1))).strip()}\n```\n",
                  text)

    # Inline code
    text = re.sub(r'<code[^>]*>([\s\S]*?)</code>',
                  lambda m: f"`{_unescape_html(m.group(1)).strip()}`",
                  text)

    # Bold / italic
    text = re.sub(r'<(strong|b)[^>]*>([\s\S]*?)</\1>',
                  lambda m: f"**{_strip_tags(m.group(2)).strip()}**", text)
    text = re.sub(r'<(em|i)[^>]*>([\s\S]*?)</\1>',
                  lambda m: f"_{_strip_tags(m.group(2)).strip()}_", text)

    # Links
    text = re.sub(r'<a\s+(?:[^>]*\s+)?href=["\']([^"\']+)["\'][^>]*>([\s\S]*?)</a>',
                  lambda m: _convert_link(m.group(1), m.group(2)), text)

    # Lists
    text = re.sub(r'<ul[^>]*>([\s\S]*?)</ul>',
                  lambda m: _convert_list(m.group(1), ordered=False), text)
    text = re.sub(r'<ol[^>]*>([\s\S]*?)</ol>',
                  lambda m: _convert_list(m.group(1), ordered=True), text)

    # Paragraphs
    text = re.sub(r'<p[^>]*>([\s\S]*?)</p>',
                  lambda m: f"\n{_strip_tags(m.group(1)).strip()}\n", text)

    # HR + BR
    text = re.sub(r'<hr\s*/?>', '\n---\n', text)
    text = re.sub(r'<br\s*/?>', '\n', text)

    # Strip remaining tags
    text = re.sub(r'<[^>]+>', '', text)
    text = _unescape_html(text)

    # Strip JSX expressions
    text = re.sub(r'\{`[^`]*`\}', '', text)
    text = re.sub(r'\{[^}]*\}', '', text)

    # Clean whitespace
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    text = text.strip()

    title = post_meta.get("title", "")
    if title and not text.startswith("# "):
        text = f"# {title}\n\n{text}"

    return text


def _strip_tags(html):
    return re.sub(r'<[^>]+>', '', html)


def _unescape_html(text):
    for entity, char in [('&amp;', '&'), ('&lt;', '<'), ('&gt;', '>'),
                          ('&quot;', '"'), ('&#39;', "'"), ('&nbsp;', ' '),
                          ('&mdash;', '—'), ('&ndash;', '–'), ('&hellip;', '…')]:
        text = text.replace(entity, char)
    return text


def _convert_link(href, inner_text):
    text = _strip_tags(inner_text).strip()
    if not text:
        text = href
    if href.startswith('/') or 'clawer.ai' in href:
        full_url = href if href.startswith('http') else f"https://clawer.ai{href}"
        return f"[{text}]({full_url})"
    return f"[{text}]({href})"


def _convert_list(items_html, ordered=False):
    items = re.findall(r'<li[^>]*>([\s\S]*?)</li>', items_html)
    lines = []
    for i, item in enumerate(items, 1):
        content = _strip_tags(item).strip()
        lines.append(f"{i}. {content}" if ordered else f"- {content}")
    return "\n" + "\n".join(lines) + "\n"


def hashnode_request(api_key, query, variables=None):
    """Execute a GraphQL query against Hashnode API."""
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }
    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    resp = requests.post(HASHNODE_API_URL, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def get_publication_id(api_key):
    """Get the user's Hashnode publication ID."""
    query = """
    query Me {
      me {
        publications(first: 10) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
      }
    }
    """
    try:
        result = hashnode_request(api_key, query)
        edges = result.get("data", {}).get("me", {}).get("publications", {}).get("edges", [])
        if edges:
            return edges[0]["node"]
        return None
    except Exception as e:
        log(f"  ERROR fetching publication: {e}", RED)
        return None


def post_to_hashnode(api_key, publication_id, post_meta, markdown_content, dry_run=False):
    """Post a single article to Hashnode. Returns (success, article_url, article_id)."""
    slug = post_meta["slug"]
    title = post_meta["title"]
    canonical_url = f"{CANONICAL_BASE}/{slug}"
    excerpt = post_meta.get("excerpt", "")[:500]
    date_iso = post_meta.get("dateISO", datetime.datetime.utcnow().strftime("%Y-%m-%d"))
    published_at = f"{date_iso}T00:00:00.000Z"

    if dry_run:
        log(f"  [DRY RUN] Would POST to Hashnode:", CYAN)
        log(f"    Title: {title}")
        log(f"    Canonical: {canonical_url}")
        log(f"    Publication ID: {publication_id}")
        log(f"    Content length: {len(markdown_content)} chars")
        return True, f"https://hashnode.com/dry-run/{slug}", "dry-run-id"

    mutation = """
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          id
          url
          slug
          title
        }
      }
    }
    """

    variables = {
        "input": {
            "title": title,
            "subtitle": excerpt,
            "publicationId": publication_id,
            "contentMarkdown": markdown_content,
            "originalArticleURL": canonical_url,
            "publishedAt": published_at,
            "tags": HASHNODE_TAGS,
            "slug": slug,
        }
    }

    try:
        result = hashnode_request(api_key, mutation, variables)

        errors = result.get("errors")
        if errors:
            log(f"  ERROR: Hashnode API errors: {errors}", RED)
            return False, None, None

        post_data = result.get("data", {}).get("publishPost", {}).get("post", {})
        if post_data:
            return True, post_data.get("url", ""), post_data.get("id", "")
        else:
            log(f"  ERROR: Unexpected response: {result}", RED)
            return False, None, None

    except requests.HTTPError as e:
        log(f"  ERROR: HTTP {e.response.status_code}: {e.response.text[:300]}", RED)
        return False, None, None
    except Exception as e:
        log(f"  ERROR: {e}", RED)
        return False, None, None


def main():
    parser = argparse.ArgumentParser(description="Cross-post clawer.ai blogs to Hashnode")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be posted")
    parser.add_argument("--force-slug", help="Force re-post a specific slug")
    parser.add_argument("--list-publications", action="store_true", help="List your Hashnode publications")
    args = parser.parse_args()

    api_key = os.environ.get("HASHNODE_API_KEY")
    if not api_key:
        log("WARNING: HASHNODE_API_KEY not set.", YELLOW)
        if not args.dry_run:
            log("Skipping Hashnode cross-post (no API key configured).", YELLOW)
            sys.exit(0)

    log(f"\n{BOLD}=== Hashnode Cross-Poster ==={RESET}")
    if args.dry_run:
        log("Mode: DRY RUN (no actual posts)", CYAN)

    tracker = load_tracker()

    # Get or resolve publication ID
    if args.list_publications:
        if not api_key:
            log("ERROR: HASHNODE_API_KEY required to list publications.", RED)
            sys.exit(1)
        pub = get_publication_id(api_key)
        if pub:
            log(f"Publication: {pub['title']} (ID: {pub['id']}) - {pub['url']}")
        else:
            log("No publications found.", YELLOW)
        return 0

    publication_id = tracker.get("publication_id") or os.environ.get("HASHNODE_PUBLICATION_ID")
    if not publication_id and api_key and not args.dry_run:
        log("Fetching publication ID from Hashnode...", CYAN)
        pub = get_publication_id(api_key)
        if pub:
            publication_id = pub["id"]
            tracker["publication_id"] = publication_id
            save_tracker(tracker)
            log(f"  Publication: {pub['title']} (ID: {publication_id})")
        else:
            log("ERROR: Could not find Hashnode publication. Set HASHNODE_PUBLICATION_ID env var.", RED)
            sys.exit(1)

    if not publication_id and not args.dry_run:
        log("ERROR: No publication_id. Set HASHNODE_PUBLICATION_ID env var.", RED)
        sys.exit(1)

    posts = load_manifest()
    log(f"Found {len(posts)} posts in manifest.\n")

    posted_count = 0
    skipped_count = 0
    error_count = 0

    for post in posts:
        slug = post["slug"]
        title = post["title"]

        if not args.force_slug and slug in tracker.get("posted", {}):
            log(f"  SKIP (already posted): {slug}", YELLOW)
            skipped_count += 1
            continue

        if args.force_slug and slug != args.force_slug:
            continue

        log(f"\n{BOLD}Processing:{RESET} {title}")

        tsx_content = extract_tsx_content(slug)
        if not tsx_content:
            error_count += 1
            continue

        markdown = tsx_to_markdown(tsx_content, post)
        log(f"  Converted to Markdown: {len(markdown)} chars")

        success, article_url, article_id = post_to_hashnode(
            api_key or "dry-run-key",
            publication_id or "dry-run-pub",
            post, markdown,
            dry_run=args.dry_run
        )

        if success:
            log(f"  {GREEN}✓ Posted!{RESET} URL: {article_url}")
            if "posted" not in tracker:
                tracker["posted"] = {}
            tracker["posted"][slug] = {
                "title": title,
                "hashnode_url": article_url,
                "hashnode_id": str(article_id),
                "posted_at": datetime.datetime.utcnow().isoformat() + "Z",
                "canonical_url": f"{CANONICAL_BASE}/{slug}"
            }
            if not args.dry_run:
                save_tracker(tracker)
            posted_count += 1
            if not args.dry_run:
                time.sleep(2)  # rate limit courtesy
        else:
            error_count += 1

    log(f"\n{BOLD}=== Summary ==={RESET}")
    log(f"  Posted:  {posted_count}", GREEN if posted_count > 0 else "")
    log(f"  Skipped: {skipped_count}")
    log(f"  Errors:  {error_count}", RED if error_count > 0 else "")

    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
