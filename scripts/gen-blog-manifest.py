import os
import re
import json
from datetime import datetime

BLOG_DIR = 'src/app/blog'

def extract_metadata(filepath, slug):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Extract publishedTime
    date_match = re.search(r'publishedTime:\s*["\'](\d{4}-\d{2}-\d{2})', content)
    if not date_match:
        date_match = re.search(r'datePublished:\s*["\'](\d{4}-\d{2}-\d{2})', content)
    date_str = date_match.group(1) if date_match else '2026-01-01'
    
    # Parse to format "Month D, YYYY"
    dt = datetime.strptime(date_str, '%Y-%m-%d')
    formatted_date = dt.strftime('%B %-d, %Y')
    
    # Extract title - use metadata.title (first title: in file) with double quotes
    title = None
    # Try double-quoted title on single line
    title_match = re.search(r'^\s*title:\s*"([^"]+)"', content, re.MULTILINE)
    if title_match:
        title = title_match.group(1)
    if not title:
        # Try single-quoted
        title_match = re.search(r"^\s*title:\s*'([^']+)'", content, re.MULTILINE)
        if title_match:
            title = title_match.group(1)
    if not title:
        title = slug.replace('-', ' ').title()
    
    # Clean up Next.js site name suffixes
    title = re.sub(r'\s*\|\s*(Clawer.*|Clawer Blog.*)$', '', title).strip()
    
    # Extract description - first description: field
    desc_match = re.search(r'^\s*description:\s*\n?\s*"([^"]+)"', content, re.MULTILINE)
    if not desc_match:
        desc_match = re.search(r"^\s*description:\s*\n?\s*'([^']+)'", content, re.MULTILINE)
    excerpt = desc_match.group(1) if desc_match else ''
    
    # Extract tags - first tags: array
    tags_match = re.search(r'tags:\s*\[([^\]]+)\]', content)
    tags = []
    if tags_match:
        raw_tags = tags_match.group(1)
        # Handle both "Tag" and 'Tag' items
        tags = re.findall(r'["\']([^"\']+)["\']', raw_tags)
        tags = tags[:5]  # max 5 tags
    
    # Extract readTime from page content
    rt_match = re.search(r'(\d+)\s*min\s*read', content)
    read_time = f"{rt_match.group(1)} min read" if rt_match else "8 min read"
    
    return {
        'slug': slug,
        'title': title,
        'date': formatted_date,
        'dateISO': date_str,
        'readTime': read_time,
        'excerpt': excerpt,
        'tags': tags,
        'url': f'https://clawer.ai/blog/{slug}'
    }

posts = []
for slug in os.listdir(BLOG_DIR):
    dir_path = os.path.join(BLOG_DIR, slug)
    page_path = os.path.join(dir_path, 'page.tsx')
    if os.path.isdir(dir_path) and os.path.exists(page_path):
        try:
            meta = extract_metadata(page_path, slug)
            posts.append(meta)
        except Exception as e:
            print(f"✗ {slug}: ERROR - {e}")

# Sort by date descending
posts.sort(key=lambda x: x['dateISO'], reverse=True)

for p in posts:
    print(f"{p['dateISO']} | {p['title'][:65]}")

with open('public/blog-manifest.json', 'w') as f:
    json.dump({'posts': posts, 'generated': datetime.utcnow().isoformat() + 'Z'}, f, indent=2)

print(f"\nGenerated manifest with {len(posts)} posts")
