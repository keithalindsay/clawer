# Blog Quality Validation Report
**Post:** The 7 Files That Make OpenClaw Actually Smart  
**URL slug:** `/blog/openclaw-agents-md-deep-dive`  
**Validated:** 2026-03-10  
**Validator:** Independent QA Agent

---

## SCORES

| Dimension | Score | Notes |
|-----------|-------|-------|
| EXPERTISE | 7/10 | Real examples but some unverifiable claims |
| ORIGINALITY | 6/10 | Solid but format is standard doc-page energy |
| ACTIONABILITY | 8/10 | Strongest dimension — copy-paste ready |
| READABILITY | 7/10 | Good flow, two thin sections |
| AI SLOP CHECK | 7/10 | Minor instances, not rampant |
| SEO | 5/10 | Fixable but real gaps |
| CTA HONESTY | 8/10 | Clean separation, earned |

**Average: 6.86 / 10**

---

## VERDICT: ⚠️ REVISE

Average is 6.86 (above 6.0 threshold) and no dimension is below 5. The content is genuinely good but the SEO execution has fixable gaps that will tank discoverability. Fix these before publishing.

---

## DETAILED SCORING

### 1. EXPERTISE — 7/10

**What works:**
- The TOOLS.md example (`gog gmail`, `bird --cookie-source firefox`, `nvm use 22`) is clearly lifted from a real production setup. That authenticity reads immediately.
- The token awareness section with `ls -lh`, `grep/head/tail` is specific enough to be credible.
- The AGENTS.md/SOUL.md separation insight ("employee handbook vs culture document") shows someone who has actually misconfigured this and learned the lesson.
- The memory architecture (`memory/YYYY-MM-DD.md` naming convention) is consistent and specific.

**What's suspect:**
- `~/.openclaw/workspace` as the default workspace path — the actual OpenClaw workspace is just a user-defined directory (e.g., `~/clawd`), not a fixed `.openclaw` location. If this is wrong, it destroys credibility for readers who actually check.
- `openclaw.json` with `agents.defaults.workspace` key — this config structure is presented as fact with no verification trail. If it's wrong, it's actively harmful.
- `openclaw setup` command — does this CLI command actually exist? Not verified.
- `memory_search` tool mentioned in MEMORY.md section — this tool doesn't appear in current OpenClaw tooling. Fabricated or outdated.
- `docs.openclaw.ai/reference/templates` — linked as authoritative source but may 404.

**Score rationale:** The real examples pull it up; the potentially fabricated specifics pull it down. 7 is generous — if the `~/.openclaw/workspace` path is wrong, this drops to 5.

---

### 2. ORIGINALITY — 6/10

**The unique angle:** Explaining the *relationship* between files (AGENTS.md as operations vs SOUL.md as culture) is a genuine insight that I haven't seen articulated this cleanly elsewhere. That's the article's best idea.

**What kills originality:**
- The core structure ("here's what each config file does") is the most template-y format in technical writing. Every developer tool has this article.
- The progression guide (starter/intermediate/advanced) is ubiquitous.
- The troubleshooting section maps obvious symptoms to obvious fixes — nothing surprising.
- The dependency diagram ("AGENTS.md → tells agent to read → SOUL.md") is thin and adds little.

**What would push this to 8:** A section on *mistakes that hurt real users* with actual failure modes observed in production. Not the generic "you forgot to read memory files" stuff — something specific, like "running 3 agents with the same IDENTITY.md created cascading memory corruption" or whatever the actual war stories are. Right now it reads like docs, not lived experience.

---

### 3. ACTIONABILITY — 8/10

**Strongest dimension.** The article consistently delivers:
- Copy-pasteable code examples at starter/intermediate/advanced levels
- Concrete git commands for workspace backup
- Explicit week-by-week progression with success metrics
- Troubleshooting section maps symptoms directly to fixes with specific instructions
- The "Don't ask permission. Just do it." instruction pattern is immediately usable

**Minor gap:** The file dependencies section promises to explain "how the files work together" but the execution order description (steps 1-5) doesn't match what was explained earlier. Steps say "OpenClaw reads all 7 files and injects them" but the rest of the article implies the *agent* reads them. Which is it? Pick one — inconsistency undermines trust.

---

### 4. READABILITY — 7/10

**Flow is solid.** The table of contents pattern (file → what it is → why it matters → example) is consistent and scannable. The colored callout boxes break monotony appropriately.

**Bounce risk zones:**
1. **IDENTITY.md section** is embarrassingly thin. Three sentences and a 4-line code block for a "deep dive" guide. Either expand it or merge it into AGENTS.md as a subsection. Currently feels like the author ran out of steam.
2. **"How the Files Work Together"** section — the ASCII dependency diagram is weak. A real diagram or a more narrative explanation of a session startup would be more compelling than a text arrow chart.
3. **"Bookmark this. You'll reference it for months."** — minor LinkedIn energy. Cut it.

**What works:** The conclusion ("You're reading this guide, which means you're not most users. Build something good.") is actually good. Not cringe, genuine.

---

### 5. AI SLOP CHECK — 7/10 (started at 10, -3 deductions)

**Deductions:**
- **-1:** "Your agent can (and should) have a vibe." — This is trying hard to sound casual. It lands as performed casualness.
- **-1:** "10x more useful" — the 10x trope is AI slop tier at this point. Either give a real number or skip the claim.
- **-1:** The "Why it matters" subsection repeated identically for every file gets formulaic by file 3. It's structural slop — the scaffold is showing.

**Survived inspection:**
- No "in today's fast-paced world" or "game-changer" or "revolutionize"
- No "I hope this helps!" energy in the conclusion
- The SOUL.md examples are appropriately direct
- Troubleshooting section reads like a human who has debugged these problems

---

### 6. SEO — 5/10

**Hard problems:**

1. **Meta description is 179 characters.** Limit is 155. Google will truncate mid-sentence and it'll look broken in SERPs. This is a must-fix before publish.
   - Current: "Complete guide to OpenClaw's 7 core files: AGENTS.md, SOUL.md, USER.md, TOOLS.md, IDENTITY.md, BOOTSTRAP.md, and MEMORY.md. Real examples, common mistakes, and progression guide."
   - Fix: "The 7 core OpenClaw files explained: AGENTS.md, SOUL.md, USER.md, TOOLS.md, IDENTITY.md, BOOTSTRAP.md, MEMORY.md. Real examples and progression guide." (156 chars — still 1 over, trim 1 more word)

2. **Target keyword absent from first 100 words.** The intro body text talks about "7 files" and "workspace directory" but never says AGENTS.md, which is presumably the primary keyword. Someone searching "OpenClaw AGENTS.md" hits your article and the first paragraph doesn't confirm they're in the right place.
   - Fix: First sentence should mention AGENTS.md explicitly.

3. **H1 doesn't contain the target keyword.** "The 7 Files That Make OpenClaw Actually Smart" — where's AGENTS.md? The slug says `openclaw-agents-md-deep-dive` but the H1 buries that keyword. H1 and primary keyword should agree.
   - Possible fix: "OpenClaw AGENTS.md and the 6 Files That Make It Smart" — or keep the current H1 but redesign the slug to match.

**What's solid:**
- Meta title at 53 chars ✅
- File names in every H2 ✅  
- Three schema types (Article, FAQ, BreadcrumbList) ✅
- FAQ schema with 6 well-formed questions ✅
- Internal links present throughout ✅
- Canonical URL set ✅
- OG tags complete ✅

---

### 7. CTA HONESTY — 8/10

**Clean.** The Clawer pitch is contained entirely in one clearly-demarcated section ("Want These Files Pre-Configured?") and the footer bio. It doesn't leak into the technical content.

The post's value proposition — understanding OpenClaw's 7 files — is completely independent of Clawer's existence. Someone who self-hosts OpenClaw and never pays Clawer a cent gets full value from this article.

The CTA itself is honest: "pre-configured templates for specific use cases." No overpromising.

**Minor knock:** "Deploy in 60 seconds, no configuration needed" — is this true? Verify before publishing. If it's marketing puffery, readers who click through and find it's more complex will feel deceived, and that damages the blog's trust.

---

## REQUIRED FIXES (in priority order)

### Must Fix Before Publish

1. **Meta description** — Trim to ≤155 chars. Current: 179 chars. Will look broken in Google SERPs.

2. **AGENTS.md in first 100 words** — Rewrite the intro paragraph to mention AGENTS.md by name in the first 1-2 sentences. Example:
   > "Most OpenClaw users never touch AGENTS.md. Their agents work, but they don't remember anything..."

3. **Verify technical specifics** — Before publishing, confirm:
   - `~/.openclaw/workspace` is actually the default path (or change to the real path)
   - `openclaw setup` command exists
   - `openclaw.json` with `agents.defaults.workspace` is real config syntax
   - `memory_search` tool exists in current OpenClaw
   - `docs.openclaw.ai/reference/templates` doesn't 404
   
   If any of these are wrong, fix or remove them. Wrong technical specifics destroy expert credibility.

### Should Fix (Quality Bar)

4. **Expand IDENTITY.md section** — Currently 3 sentences. Either add real content (when does it matter, how does it interact with multi-agent setups, what happens without it) or demote it to a callout within the AGENTS.md section instead of giving it H2 status.

5. **H1 keyword alignment** — Either put "AGENTS.md" in the H1 or update the slug. Current mismatch creates SEO inconsistency.

6. **Remove "10x more useful"** — Replace with a specific claim or remove.

7. **Remove "Bookmark this. You'll reference it for months."** — Earned praise is earned. Asking for it isn't.

### Nice to Have

8. **Add one real war story** — One concrete "we saw this fail in production" example would push ORIGINALITY from 6 to 8. The generic troubleshooting is good; an actual observed failure would be great.

9. **Fix dependency section** — Clarify the startup flow: does OpenClaw inject all 7 files, or does the agent read them on instruction? Pick one, make it consistent with the AGENTS.md examples.

---

## SUMMARY

This is a solid, useful article that falls short of publish-ready because of SEO gaps that will actively hurt its discoverability, and because some technical specifics are either unverified or potentially wrong. The content quality is there. The expertise reads as authentic (mostly). The actionability is genuinely good.

Fix the meta description, plant AGENTS.md in the first sentence, and verify the technical claims. That's a 2-hour task. Then this publishes.

**Don't ship it today.** Fix it tomorrow.
