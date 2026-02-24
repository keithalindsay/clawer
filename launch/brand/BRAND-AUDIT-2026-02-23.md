# Brand Foundation Audit — 2026-02-23
*Audited against: clawer.ai live site, pricing page source, codebase, existing docs*

---

## ✅ Verified — Claims That Match Reality

| Claim | Source | Verified Against |
|-------|--------|-----------------|
| $49/mo Pro pricing | All brand docs | Landing page + pricing page source (`page.tsx`) |
| 100 free messages, no credit card | All brand docs | Landing page + pricing page + FAQ |
| 60-second deploy | POSITIONING, MESSAGING-FRAMEWORK | Landing page "From Idea to AI Team in 60 Seconds" |
| 4 pre-built AI team templates | POSITIONING (team templates) | `src/lib/teams.ts`: Personal Assistant, Solopreneur, Business Ops, Content Creator |
| WhatsApp, Telegram, Discord, Slack channels | All docs | Landing page + pricing page (Pro tier) |
| Container isolation | BRAND-STORY, POSITIONING | Landing page "Isolated Docker containers" + `src/lib/container/` exists |
| BYOK option | POSITIONING, BATTLECARDS | Landing page "BYOK option" |
| CVE-2026-25253 / 42,000+ exposed instances | BRAND-STORY, BATTLECARDS | Blog posts (`openclaw-security-guide/page.tsx`) cite these consistently |
| ClawHavoc / 1,184 malicious skills | BRAND-STORY, BATTLECARDS | Blog post (`openclaw-clawhub-malware-security/page.tsx`) provides detailed timeline |
| "Not a chatbot. An AI team." | MESSAGING-FRAMEWORK | Landing page headline matches |
| "While you sleep" signature phrase | BRAND-VOICE | Landing page title: "AI Teams That Do the Work While You Sleep" |
| 11+ blog posts | BATTLECARDS | Blog page shows 11 posts |
| Built on OpenClaw, 300K+ users | MESSAGING-FRAMEWORK | Landing page + `SocialProof.tsx` |
| Desktop/VNC access | Landing page features | `FeatureCards.tsx` confirms |
| File management feature | Landing page features | Dashboard pages exist |
| Cron/automation | Landing page features | Referenced in product |

---

## ⚠️ Needs Update — Partially True or Inconsistent

### 1. SOC 2 Compliance — **CRITICAL**
- **Brand docs claim:** "SOC 2 compliant" (POSITIONING, BRAND-STORY, landing page `FeatureCards.tsx`)
- **Reality:** `docs/blog/openclaw-without-self-hosting.md` says "SOC 2 Type II compliance **(in progress, expected Q2 2026)**". The `CODEBASE-AUDIT.md` flags API key storage as a "GDPR/SOC2 compliance failure."
- **Risk:** Claiming SOC 2 compliance without certification is potentially **legally actionable**. This is the highest-priority fix.
- **Fix:** Change all instances to "SOC 2 in progress" or "Security-first architecture" until certification is complete. Remove from landing page `FeatureCards.tsx`.

### 2. "No Per-Message Fees" vs 500/day Limit
- **Brand docs claim:** "No per-message fees you can't predict" (POSITIONING, BRAND-STORY)
- **Reality:** Pro plan has 500 messages/day limit (pricing page source). Free has 100 total. This isn't technically "per-message fees" but it IS a usage cap that limits value.
- **Fix:** Acknowledge the message limits in brand docs. Change to "predictable flat pricing — no surprise per-message charges" to be more precise.

### 3. "Everything Included" vs Feature Gating
- **Brand docs claim:** "$49/month. Everything included." (POSITIONING, BRAND-STORY, MESSAGING-FRAMEWORK)
- **Reality:** Free tier exists with significant limitations (web chat only, 100 total messages, basic model). The landing page hero says "Early access pricing — $49/mo" with no mention of the free tier's limitations.
- **Fix:** Clarify "Everything included *on Pro*" or restructure to acknowledge the free tier exists as a trial.

### 4. "10GB Storage" — Missing from Pricing Page
- **Brand docs claim:** "10GB storage" listed as Pro feature (POSITIONING)
- **Reality:** The actual pricing page (`src/app/pricing/page.tsx`) does NOT list 10GB storage in the Pro features. The landing page does mention it.
- **Fix:** Either add to pricing page or remove from brand docs. Verify actual storage allocation.

### 5. AI Model Claims — Inconsistent
- **Brand docs claim:** "Clawer uses the same models — Claude, GPT, Gemini" (BATTLECARDS)
- **Reality:** Pricing page says Pro uses "MiniMax M2.5" with "Smart model routing." Free uses "Basic model." No explicit Claude/GPT/Gemini mentioned in pricing.
- **Fix:** Update BATTLECARDS to reflect actual model (MiniMax M2.5) or clarify that model routing may use different providers. The "same models" claim is misleading if the default is MiniMax.

### 6. Landing Page vs Pricing Page Mismatch
- **Landing page:** Shows single "Clawer Pro" plan at $49/mo with a feature list including "10GB storage" and "Email support"
- **Pricing page:** Shows Free ($0) + Pro ($49/mo) with different feature lists (500/day messages, MiniMax M2.5, etc.)
- **Fix:** Align the two pages. The pricing page is more accurate; update landing page to match.

### 7. "99.9% Uptime SLA"
- **Brand docs claim:** "99.9% uptime SLA" (MESSAGING-FRAMEWORK, landing page)
- **Reality:** No SLA document found in the codebase or docs. No terms of service referencing this SLA.
- **Fix:** Either publish the SLA formally or soften to "99.9% uptime target."

### 8. Brand Story "5 Minutes" vs "60 Seconds"
- **Old POSITIONING.md** (in `docs/`): Says "Managed OpenClaw in 5 minutes"
- **New brand docs + landing page:** Say "60 seconds"
- **Fix:** Old doc in `docs/POSITIONING.md` should be archived or updated. The "60 seconds" claim is now canonical.

---

## ❌ Inaccurate — Claims That Don't Match Reality

### 1. "1.5M Leaked Tokens"
- **BRAND-STORY claims:** "1.5M leaked tokens from exposed instances"
- **Reality:** This statistic does not appear in any blog post, security guide, or cited source in the codebase. No attribution.
- **Fix:** Either cite the source or remove. If it came from a Shodan scan or security report, add the citation.

### 2. "Andrej Karpathy publicly warned" / "CrowdStrike and Palo Alto Networks published advisories"
- **BRAND-STORY claims** these as proof points.
- **Reality:** Not cited in any blog post on the site. Could not verify from codebase. These are high-profile claims that need sourcing.
- **Fix:** Add citations with URLs, or mark as "reported in [source]" with links. If these can't be sourced, remove them.

### 3. Persona "Creator Chris" — WhatsApp Ban
- **POSITIONING says:** "WhatsApp banned him for trying to connect an OpenClaw bot"
- **Reality:** The WhatsApp setup blog post discusses `status=515` errors and connection issues but doesn't specifically address banning. This persona detail may be anecdotal.
- **Fix:** Minor — this is a persona narrative, not a product claim. But verify the WhatsApp banning scenario is real before using it in marketing.

### 4. "41% of audited skills have vulnerabilities"
- **BATTLECARDS claim:** "41% of audited skills have vulnerabilities"
- **Reality:** Not found in any blog post or docs. The blog references 341 malicious skills and 1,184 in ClawHavoc, but no "41%" stat.
- **Fix:** Cite source or remove.

---

## 🔍 Unverifiable — Couldn't Confirm Either Way

| Claim | Doc | Notes |
|-------|-----|-------|
| "100+ integrations via skills marketplace" | MESSAGING-FRAMEWORK, landing page | `FeatureCards.tsx` says "100+ more services" but no skills marketplace page exists to count. Likely aspirational. |
| "Agents respond in <2 seconds" | POSITIONING | No latency benchmarks found in codebase |
| Setup takes "10-40 hours" for self-hosting | BATTLECARDS | Reasonable estimate but not from a study |
| "$250-500/month in time" for self-hosters | BATTLECARDS | Math checks out at $50/hr × 5-10hrs, but the 5-10 hrs/month maintenance claim is unverified |
| "300,000+ OpenClaw users" | Landing page, MESSAGING-FRAMEWORK | This is OpenClaw's stat, not Clawer's. Verify it's current. |
| "@masteryoda_69's OpenClawSDK got flagged" | BATTLECARDS | Anecdotal — verify before using in any public content |

---

## Recommendations — Specific Edits Per Doc

### BRAND-VOICE.md
- ✅ **No major issues.** Voice guidance is strong and consistent with actual site copy.
- ⚠️ Remove "$49/month" from banned phrase alternatives — it's still the price, but add note about message limits.

### BRAND-STORY.md
1. **Remove or cite** "1.5M leaked tokens" — unverifiable
2. **Remove or cite** Karpathy warning and CrowdStrike/Palo Alto advisories — need URLs
3. **Add caveat** to "$49/month. Everything included" → "$49/month. All features included." (acknowledges limits exist)
4. **Fix SOC 2 claim** in Beliefs section — change "SOC 2 compliant" to describe actual security measures

### POSITIONING.md
1. **Fix SOC 2** — remove "SOC 2 compliant" from security value prop, replace with specific measures
2. **Update model claim** — mention MiniMax M2.5 as default, smart routing for others
3. **Add 500/day message limit** to pricing value prop for honesty
4. **Remove "10GB storage"** or verify it matches the actual pricing page
5. **Fix "No per-message fees"** → "Flat monthly pricing — no per-message surprises"

### BATTLECARDS.md
1. **Fix "same models" claim** — Clawer defaults to MiniMax M2.5, not Claude/GPT directly
2. **Cite or remove "41% of audited skills"** stat
3. **Cite or remove @masteryoda_69** anecdote
4. **Add note** that Free tier exists when countering "$20 ChatGPT" objection (the gap is $49 vs $20, not free vs $20)

### MESSAGING-FRAMEWORK.md
1. **Update proof points** — remove "SOC 2 compliant" until certified
2. **Add Free tier** to CTAs — some CTAs say "Start free" which is correct, but the framework should acknowledge the 100-message limit
3. **99.9% uptime** — either publish SLA or soften language
4. **"100+ integrations"** — verify or soften to "growing skills marketplace"

### CONTENT-GUIDELINES.md
1. **Legal boundaries section** already warns about SOC 2 — good! But the rest of the docs violate this guidance. Fix the other docs.
2. **SEO keywords** look solid and match actual blog content targeting
3. **No major issues** — this doc is the most internally consistent

---

## Priority Actions

| Priority | Action | Risk if Ignored |
|----------|--------|-----------------|
| 🔴 P0 | Remove SOC 2 compliance claims everywhere | Legal liability — false compliance claim |
| 🔴 P0 | Align landing page with pricing page (features, limits) | User trust — conflicting info on own site |
| 🟡 P1 | Cite or remove "1.5M leaked tokens", Karpathy, CrowdStrike claims | Credibility if challenged |
| 🟡 P1 | Update model references (MiniMax M2.5 vs Claude/GPT) | Misleading battlecard responses |
| 🟡 P1 | Clarify message limits in "everything included" messaging | Churn risk when users hit limits |
| 🟢 P2 | Verify "100+ integrations" or soften claim | Minor credibility risk |
| 🟢 P2 | Archive old `docs/POSITIONING.md` and `docs/MARKETING-VOICE.md` | Internal confusion with two positioning docs |
| 🟢 P2 | Publish uptime SLA or soften to "target" | Minor trust risk |
