# Pre-Launch Audit — clawer.ai
**Date:** 2026-02-18 09:28 CST  
**Auditor:** Lex (automated)  
**Verdict:** 🟡 LAUNCH WITH FIXES — 3 blockers, several warnings

---

## Page-by-Page Results

| Page | Status | Verdict |
|------|--------|---------|
| `/` (homepage) | 200 ✅ | ✅ PASS |
| `/pricing` | 200 ✅ | ✅ PASS |
| `/use-cases` | 200 ✅ | ⚠️ WARNINGS |
| `/blog` | 200 ✅ | ✅ PASS |
| `/blog/best-openclaw-hosting` | 200 ✅ | ⚠️ WARNINGS |
| `/blog/managed-openclaw-hosting` | 200 ✅ | ⚠️ WARNINGS |
| `/blog/openclaw-security-guide` | 200 ✅ | ❌ BLOCKER |
| `/blog/openclaw-self-hosted-vs-managed` | 200 ✅ | ⚠️ WARNINGS |
| `/blog/openclaw-security` | 200 ✅ | ✅ PASS (not in sitemap though) |
| `/terms` | 200 ✅ | ⚠️ WARNING |
| `/privacy` | 200 ✅ | ✅ PASS |
| `/sign-up` | 200 ✅ | ✅ PASS |
| `/sign-in` | 200 ✅ | ✅ PASS |
| `/sitemap.xml` | 200 ✅ | ❌ BLOCKER (incomplete) |
| `/robots.txt` | 200 ✅ | ✅ PASS |
| `/og-image.png` | **404** ❌ | ❌ BLOCKER |

---

## 🚨 BLOCKERS (fix before launch)

### 1. `/og-image.png` returns 404
**Severity:** BLOCKER  
**Impact:** Every social share (Twitter, Facebook, LinkedIn, Discord) will show a broken/missing preview image. First impressions on launch day will be broken links.  
**Fix:** Upload `og-image.png` to the public directory. Verify the `<meta property="og:image">` tag in `layout.tsx` points to the correct path.

### 2. Sitemap missing 5 pages
**Severity:** BLOCKER  
**Impact:** Google won't discover all pages. Missing from sitemap.xml:
- `/blog/best-openclaw-hosting`
- `/blog/openclaw-self-hosted-vs-managed`
- `/blog/openclaw-security` (listed on blog index but not in sitemap)
- `/use-cases` — IS in sitemap ✅
- `/sign-in` — missing

**Fix:** Add the missing blog posts and `/sign-in` to the sitemap generation in `app/sitemap.ts`.

### 3. Old pricing "$19/mo" on security guide blog post
**Severity:** BLOCKER  
**Impact:** The security guide CTA says "AI Teams and custom skills on Pro ($19/mo)" — contradicts the $49/mo price everywhere else. Visitors who see this will be confused or feel baited.  
**Location:** `/blog/openclaw-security-guide` — bottom CTA: *"100 messages per day, free forever. No credit card. Security patches applied automatically. AI Teams and custom skills on Pro ($19/mo)."*  
**Fix:** Change `$19/mo` → `$49/mo` in the blog post content. Also fix "100 messages per day, free forever" which contradicts the free tier (200 total messages, not 100/day).

---

## ⚠️ WARNINGS (fix today, not launch-blocking)

### 4. Free tier messaging inconsistency across pages
**Severity:** WARNING  
**Impact:** Confusing/contradictory free tier description across the site.

| Page | Free tier described as |
|------|----------------------|
| Homepage | "200 free messages included" |
| Pricing page | "200 total messages" ✅ |
| Terms of Service | "25 messages per day" ❌ |
| Blog: managed-openclaw-hosting | "25 messages/day, GPT-4o-mini" ❌ |
| Blog: best-openclaw-hosting | "25 messages/day" ❌ |
| Blog: self-hosted-vs-managed | "25 messages/day" ❌ |
| Blog: security-guide | "100 messages per day, free forever" ❌ |
| Use cases | "200 messages" ✅ |

**The correct spec is:** 200 total messages, 1 team member, no daily limit mentioned on pricing page.  
**Fix:** Search all blog posts and Terms for "25 messages" and "100 messages" and update to match the pricing page (200 total messages). Update Terms §4 to say "200 total messages" not "25 messages per day."

### 5. Use-cases page title is generic
**Severity:** WARNING  
**Page:** `/use-cases`  
**Issue:** Title is "Clawer.ai — Hosted OpenClaw, Personal AI Assistant" (same as homepage). Should be unique for SEO.  
**Fix:** Set title to something like "Clawer.ai Use Cases — AI Teams for Founders, Creators & Families"

### 6. Blog index page title is generic  
**Severity:** WARNING  
**Page:** `/blog`  
**Issue:** Same generic title as homepage.  
**Fix:** Set to "Clawer.ai Blog — OpenClaw Hosting Guides & Security"

### 7. Use-cases page says "CLAWER.AI" in body text
**Severity:** WARNING  
**Issue:** Body text says "CLAWER.AI gives you an AI team" — should be "Clawer" per branding guidelines (no ".ai", no all-caps in body).  
**Fix:** Change "CLAWER.AI" → "Clawer" in the use-cases hero subtitle.

### 8. Sign-up/Sign-in pages say "CLAWER.AI" 
**Severity:** COSMETIC  
**Issue:** "Join CLAWER.AI" and "Welcome to CLAWER.AI" — all caps with .ai. Minor since these are auth pages.  
**Fix:** Change to "Join Clawer" / "Welcome to Clawer" for brand consistency.

### 9. Blog: best-openclaw-hosting has inconsistent Clawer free tier description
**Severity:** WARNING  
**Issue:** The comparison table and body text reference "25 messages/day" for the free tier, which conflicts with pricing page "200 total messages." Also says "Free tier (25 messages/day, GPT-4o-mini)" in the Clawer section.  
**Fix:** Update all "25 messages/day" references to "200 total messages."

### 10. Terms page missing "Last updated" date
**Severity:** WARNING  
**Issue:** Terms §15 says "updating the 'Last updated' date" but no such date appears on the page.  
**Fix:** Add "Last updated: February 18, 2026" at the top of the terms page.

### 11. Privacy page missing "Last updated" date
**Severity:** WARNING  
**Same issue as Terms.**

### 12. Blog: openclaw-security not in sitemap but linked from blog index
**Severity:** WARNING  
**Fix:** Add to sitemap, or if it's been superseded by openclaw-security-guide, add a redirect or canonical.

---

## 💅 COSMETIC (post-launch backlog)

### 13. Homepage: "0 agents handling messages right now"
**Severity:** COSMETIC  
**Issue:** The live counter shows "0" — looks dead on launch day. Consider hiding the counter until there's real traffic, or seeding with a reasonable number.

### 14. Homepage title says "Clawer.ai" (with .ai)
**Severity:** COSMETIC  
**Issue:** Title tag is "Clawer.ai — Hosted OpenClaw, Personal AI Assistant". The ".ai" in titles is fine for brand recognition/SEO — just noting it differs from the body text rule of "Clawer" only.

### 15. Terms and Privacy titles are generic
**Severity:** COSMETIC  
**Fix:** Give unique `<title>` tags: "Terms of Service — Clawer.ai" and "Privacy Policy — Clawer.ai"

---

## Cross-Page Consistency Check

| Check | Result |
|-------|--------|
| Nav consistent across pages | ✅ (web_fetch can't fully verify nav, but all pages load consistently) |
| Footer consistent | ✅ |
| Pricing: $49/mo Pro | ✅ on homepage, pricing, most blogs. ❌ $19/mo on security-guide |
| Free tier: 200 total messages | ❌ Inconsistent — see issue #4 |
| Pro: 500/day, full team, WA+TG+Slack | ✅ Consistent on pricing page |
| 🦞 Lobster branding | ✅ Present on use-cases and 404 page |
| "Clawer" not "Clawer.ai" in body | ⚠️ "CLAWER.AI" on use-cases, sign-up, sign-in |
| Lorem ipsum / placeholder | ✅ None found |
| "undefined" / "null" / error text | ✅ None found |
| TODO comments | ✅ None found |
| "Coming soon" text | ✅ Present on Team/Business tiers — intentional |
| "Parent Central" | ✅ Present on homepage (correct) |
| "Mom's Command Center" | ✅ Not found anywhere (correct) |
| "Employee" vs "Team Member" | ✅ "Team member" used consistently |
| Blog posts render full content | ✅ All have real content, not "Loading..." |

## Technical Checks

| Check | Result |
|-------|--------|
| sitemap.xml exists | ✅ |
| sitemap.xml complete | ❌ Missing 3 blog posts + /sign-in |
| robots.txt | ✅ Properly configured |
| OG image | ❌ 404 — BLOCKER |
| All pages return 200 | ✅ (except og-image.png) |

---

## Priority Fix Order

1. **🔴 Upload og-image.png** — 2 min fix, massive social share impact
2. **🔴 Fix $19/mo → $49/mo in security guide** — 1 min fix, pricing trust issue  
3. **🔴 Fix "100 messages per day free forever" → "200 total messages" in security guide** — 1 min
4. **🟡 Fix free tier inconsistency across all blog posts and Terms** — 15 min, search-and-replace "25 messages/day" and "25 messages per day"
5. **🟡 Update sitemap.xml** to include all blog posts and /sign-in — 5 min
6. **🟡 Fix unique page titles** for /use-cases, /blog, /terms, /privacy — 5 min
7. **🟡 Add "Last updated" dates** to Terms and Privacy — 2 min
8. **🟡 Fix "CLAWER.AI" → "Clawer"** on use-cases, sign-up, sign-in — 3 min
9. **🔵 Consider hiding "0 agents" counter** until real traffic — 2 min

**Total estimated fix time: ~35 minutes for all issues**
