# Blog Quality Validation Report
**Post:** `openclaw-agents-md-tips`  
**File:** `src/app/blog/openclaw-agents-md-tips/page.tsx`  
**Validated:** 2026-02-22  
**Validator:** Independent quality agent (no agenda, no mercy)

---

## VERDICT: ✅ PUBLISH

**Average Score: 7.28 / 10**  
No dimension below 5. Clears the bar — but read the notes before you hit publish.

---

## Dimension Scores

### 1. EXPERTISE — 7/10

**What works:**  
Real commands throughout: `grep -r "AuthenticationError" src/`, `ls -lh`, `wc -l`, `npm cache clean --force`, `nano ~/clawd/AGENTS.md`. Specific file paths (`~/clawd/AGENTS.md`, `memory/YYYY-MM-DD.md`). The `HEARTBEAT_OK` reference reads as authentic — someone who actually runs OpenClaw knows that term. The EACCES npm error escalation example is realistic and specific. The 3-attempt limit rationale is genuinely insightful, not generic.

**What's sketchy:**  
- "We analyzed 500+ public OpenClaw configurations" — unverifiable, and OpenClaw is niche enough that this number seems inflated. If you can't back it with data, it weakens the article when a sharp reader calls it out.
- "One user reported a 40% reduction" — vague attribution. "One user on our Discord" or "in a documented case study" would be better.
- `docs.openclaw.ai/reference/templates/AGENTS` — if this URL 404s when a reader clicks it, trust is gone. Verify it exists before publishing.
- "After running OpenClaw in production for six months" — this framing is fine, but it's also exactly how AI-generated authority gets established. No specific version, no release context, no quirks of the journey.

---

### 2. ORIGINALITY — 7/10

**The angle:** AGENTS.md as a continuous improvement process, not a one-time config. That's genuinely distinct from generic "configure your AI" content.

**What's original:**  
- The HEARTBEAT_OK group chat silence concept is product-specific and not generic.
- Three-file rule (SOUL.md / AGENTS.md / USER.md / MEMORY.md) is an architecture decision someone actually lives by — not a thought experiment.
- The "agent modifies its own configuration file" framing is interesting and underexplained (which is actually fine — leaves curiosity).
- Error recovery with explicit attempt limits: specific enough that it doesn't appear in generic prompt engineering guides.

**What's not original:**  
- "LLMs forget things between sessions" is deeply obvious at this point.
- Token cost awareness is increasingly standard advice.
- The banned phrases list (Rule 6) appears in dozens of Claude jailbreak/tuning posts.

**Net:** The OpenClaw-specificity is the moat. On that niche, this is among the better pieces. It won't rank for "Claude tips" but it might own "OpenClaw AGENTS.md."

---

### 3. ACTIONABILITY — 9/10

This is the strongest dimension. Full stop.

- Every rule has a copy-paste code block. No paraphrasing required.
- Two implementation paths (direct edit vs. ask the agent to update itself).
- Conclusion maps symptoms to rules: "Group chat spam? Add Rule 1." That's immediately useful.
- FAQ answers real questions at the bottom.
- The "start with one rule" framing lowers the barrier to action.

If readers don't act after this article, it's not the article's fault.

**Minor gap:** The article says readers can ask their agent to "read this article and apply Rule 1" — but doesn't tell them *where* their agent is listening. A WhatsApp number, a command, anything. It's a tiny miss for a product post.

---

### 4. READABILITY — 7/10

**What flows:**  
- The "lol" opener is strong. Immediate relatability.
- Problem/Fix/Before/After structure works. No hunting for the point.
- Code blocks break up what would otherwise be a wall of text.
- The conclusion "start with one that solves your biggest frustration" is a genuinely satisfying wrap.

**Where you'd bounce:**  
- Rule 5 (Three-File Rule) is the weakest. By that point the reader is tired, and this rule is the least emotionally resonant — it's organizational hygiene, not a frustration fix. Consider swapping it to Rule 3 or leading with a stronger opening scenario.
- The Bonus section (Rules 6-8) feels tacked on. It either belongs in the main list or in a separate post. "Here are 5 rules... and also 3 more" undermines the "5 rules" promise.
- The "Why Most AGENTS.md Files Are Empty" section is decent but interrupts the flow after Rule 5. It would work better as the article's intro setup, not a mid-article pivot.
- 12 min read is honest but ambitious. The article earns it, but it will lose people who came for a quick tip.

---

### 5. AI SLOP CHECK — 6/10

Starting at 10, deducting per instance:

| Instance | Deduction |
|---|---|
| "10x Better" in title | -1 (clickbait cliché, overused, mathematically meaningless) |
| "After running OpenClaw in production for six months and helping hundreds of users" — classic AI authority-establishing opener | -1 |
| "works remarkably well" — filler qualifier | -1 |
| "The difference between a default AGENTS.md and a well-tuned one is the difference between..." — LinkedIn cadence | -1 |

**Score: 6/10**

The good news: No "Great question!", no "Let's dive in", no "it's worth noting", no "in conclusion." The writing is mostly clean and direct. The deductions are stylistic annoyances, not structural slop. 6/10 is passing — barely. The title is the biggest drag; "10x better" belongs in a 2018 growth hacking blog.

---

### 6. SEO — 7/10

**What's correct:**
- Meta title: 57 chars ✅ (under 60)
- H1 contains "AGENTS.md" and "OpenClaw" ✅
- "AGENTS.md" and "OpenClaw" appear in the first ~20 words of body text ✅
- All H2s contain relevant terms ✅
- Schema: Article + FAQPage + BreadcrumbList ✅ — this is solid, most blogs skip the FAQ schema
- Canonical URL present ✅
- OpenGraph + Twitter card configured ✅
- Internal links: /pricing (3x), /blog/how-to-set-up-openclaw (2x), /blog/openclaw-self-hosted-vs-managed (1x), /blog/best-openclaw-hosting (1x) ✅

**What's broken or risky:**
- Meta description: **157 chars** ❌ — 2 over the 155-char limit. Trim it. ("Real before/after examples with copy-paste snippets you can use today." → "Real before/after examples and copy-paste snippets for immediate use." saves 8 chars)
- Internal links to `/blog/how-to-set-up-openclaw` and `/blog/openclaw-self-hosted-vs-managed` and `/blog/best-openclaw-hosting` — do these pages **exist**? If they 404, that's an SEO penalty and a terrible reader experience.
- `docs.openclaw.ai/reference/templates/AGENTS` — external link without `rel="noopener"` check. More importantly: does it exist?
- r/vibecoding and OpenClaw Discord mentioned in body but not linked. Either link them (with rel="nofollow") or cut the references. Mentioning communities without linking them feels oddly vague.
- No image provided — `/blog/openclaw-agents-md-tips-hero.png` is referenced in the `<img>` tag. If this file doesn't exist, there's a broken image on every load.

---

### 7. CTA HONESTY — 8/10

**Three CTAs total:**  
1. After Rule 1 (blue box)
2. After "Why Most Files Are Empty" section (inline)
3. Final CTA block at end

**Assessment:** The article would be 100% useful without Clawer existing. Every rule works for self-hosted OpenClaw. The CTAs are clearly demarcated in blue boxes — they don't interrupt the content. The value prop ("pre-configured AGENTS.md from day one") is genuinely relevant to the article's subject. That's honest product placement.

**Minor deductions:**  
- CTA #1 appears after Rule 1 (the first rule). That's slightly early — feels like a hustle before you've delivered value. Moving it to after Rule 3 or 4 would feel less eager.
- "battle-tested" appears twice in CTAs — find a second descriptor.

**Net:** Clawer mentions are natural. This passes the "would I resent this?" test.

---

## Summary

| Dimension | Score |
|---|---|
| EXPERTISE | 7/10 |
| ORIGINALITY | 7/10 |
| ACTIONABILITY | 9/10 |
| READABILITY | 7/10 |
| AI SLOP CHECK | 6/10 |
| SEO | 7/10 |
| CTA HONESTY | 8/10 |
| **AVERAGE** | **7.28/10** |

---

## Pre-Publish Checklist (Required Before Going Live)

### Must Fix (blockers):
1. **Meta description is 157 chars** — trim 2+ chars before publish
2. **Verify `/blog/how-to-set-up-openclaw` exists** — if not, either create it or remove the 2 internal links
3. **Verify `/blog/openclaw-self-hosted-vs-managed` exists** — same issue
4. **Verify `/blog/best-openclaw-hosting` exists** — same issue
5. **Verify `docs.openclaw.ai/reference/templates/AGENTS` resolves** — broken external link is worse than no link
6. **Confirm `/blog/openclaw-agents-md-tips-hero.png` exists** in the public folder — or the article loads with a broken image

### Should Fix (quality improvements):
7. **Title:** Consider "5 AGENTS.md Rules That Actually Make OpenClaw Behave" — drops the "10x" slop, adds specificity
8. **Move CTA #1** from after Rule 1 to after Rule 3 — less aggressive
9. **Cut or consolidate the Bonus section** — "5 rules + also 3 more" undermines the premise. Either make it 8 rules or cut 6-8 entirely
10. **Remove or attribute** "We analyzed 500+ public OpenClaw configurations" — unverifiable claims corrode trust

### Nice to Have:
11. Link r/vibecoding and OpenClaw Discord (with rel="nofollow") or remove the references
12. The "Why Most AGENTS.md Files Are Empty" section would work better as article intro setup, not a mid-page section
13. Replace "remarkably well" with something direct

---

## Final Notes

This is a **genuinely useful article**. The copy-paste snippets alone justify publishing. The before/after structure works. The actionability score (9/10) means readers can immediately go do something. That's rare.

The main risks are: (a) broken links to posts that don't exist yet, and (b) the hero image 404. Both are silent killers — page loads broken and nobody knows why bounce rate is high. Verify these before pushing to production.

Fix the blockers. It's ready.
