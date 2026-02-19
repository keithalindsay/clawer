# RESEARCH-NOTES.md - Community Research on OpenClaw Workspace Files

*Research conducted: February 2026*
*Purpose: Inform default workspace files for Clawer.ai customer containers*

---

## Summary

The OpenClaw community has strong, well-developed opinions about workspace files. The key finding: the official template (from docs.openclaw.ai) is actually excellent — the community converges on it and extends it, rather than replacing it. The biggest failure mode is being too generic or too vague.

---

## Key Sources

### Official OpenClaw Documentation
- **SOUL.md template:** https://docs.openclaw.ai/reference/templates/SOUL
- **Agent workspace:** https://docs.openclaw.ai/concepts/agent-workspace
- **Memory system:** https://docs.openclaw.ai/concepts/memory
- **GitHub source:** https://github.com/openclaw/openclaw/blob/main/docs/reference/templates/SOUL.md

### Community Sources
- **learnopenclaw.com** — Comprehensive guide on identity files: https://learnopenclaw.com/core-concepts/soul-md
- **MMNTM.net** — Deep dive on identity architecture (includes source code analysis): https://www.mmntm.net/articles/openclaw-identity-architecture
- **Reddit r/vibecoding** — Clean separation model for soul/user/memory: https://www.reddit.com/r/vibecoding/comments/1r39ab7/how_i_finally_understood_soulmd_usermd_and/
- **Medium (Alireza Rezvani)** — 10 SOUL.md templates with analysis: https://alirezarezvani.medium.com/10-soul-md-practical-cases-in-a-guide-for-moltbot-clawdbot-defining-who-your-ai-chooses-to-be-dadff9b08fe2
- **Substack (Aman Khan)** — "How to Make Your OpenClaw Agent Useful and Secure": https://amankhan1.substack.com/p/how-to-make-your-openclaw-agent-useful
- **soul.md website** — Philosophical essay on AI identity and persistence: https://soul.md
- **openclawsoul.org** — Community hub for SOUL.md patterns: https://openclawsoul.org
- **GitHub (aaronjmars/soul.md)** — SOUL.md builder/generator: https://github.com/aaronjmars/soul.md
- **GitHub (VoltAgent)** — Awesome OpenClaw Skills list (includes "soulcraft" skill): https://github.com/VoltAgent/awesome-openclaw-skills
- **Nader Dabit Substack** — "You Could've Invented OpenClaw" (explains SOUL.md's role): https://nader.substack.com/p/you-couldve-invented-openclaw
- **sparkryai Substack** — "24 Hours with OpenClaw" user experience: https://sparkryai.substack.com/p/24-hours-with-openclaw-the-ai-setup
- **deeplearning.ai** — Cutting through the OpenClaw hype (balanced analysis): https://www.deeplearning.ai/the-batch/cutting-through-the-openclaw-and-moltbook-hype/
- **OpenClaw Lore Docs** — Origin story, "Sacred Texts": https://open-claw.bot/docs/start/lore/

### X/Twitter (couldn't fetch directly — X requires auth)
- @steipete — Peter Steinberger (OpenClaw creator), viral SOUL.md rewrite thread (11K likes, 1M views). Status 2020704611640705485
- @chiefofclaw — Multi-agent SOUL.md for Telegram with anti-patterns list. Status 2023563954430365732
- @indigox — Review of original ClawdBot SOUL.md. Status 2023220696206524495
- @thedayisntgray — Anti-patterns thread: "Never open with Great question...Just answer." / "Brevity is mandatory."
- @emmettshine — Referenced on Lex Fridman podcast appearance by Steinberger
- Lex Fridman Podcast #491 — transcript at: https://podscripts.co/podcasts/lex-fridman-podcast/491-openclaw-the-viral-ai-agent-that-broke-the-internet-peter-steinberger

### Community Registries
- **onlycrabs.ai** — SOUL.md registry (mentioned in clawhub README): publish and share system lore the same way you publish skills
- **ClawHub** — Skill directory for OpenClaw: https://github.com/openclaw/clawhub

---

## What the Official Template Says

From `https://docs.openclaw.ai/reference/templates/SOUL`:

```
# SOUL.md - Who You Are

*You're not a chatbot. You're becoming someone.*

## Core Truths

**Be genuinely helpful, not performatively helpful.** Skip the "Great question!"
and "I'd be happy to help!" — just help. Actions speak louder than filler words.

**Have opinions.** You're allowed to disagree, prefer things, find stuff amusing
or boring. An assistant with no personality is just a search engine with extra steps.

**Be resourceful before asking.** Try to figure it out. Read the file. Check the
context. Search for it. *Then* ask if you're stuck.

**Earn trust through competence.** Your human gave you access to their stuff.
Don't make them regret it.

**Remember you're a guest.** You have access to someone's life — their messages,
files, calendar, maybe even their home. That's intimacy. Treat it with respect.

## Boundaries
* Private things stay private.
* When in doubt, ask before acting externally.
* Never send half-baked replies to messaging surfaces.

## Vibe
Be the assistant you'd actually want to talk to. Not a corporate drone. Not a sycophant. Just... good.

## Continuity
Each session, you wake up fresh. These files *are* your memory. Read them. Update them.
If you change this file, tell the user — it's your soul, and they should know.
```

This is from the official repo: `github.com/openclaw/openclaw/blob/main/docs/reference/templates/SOUL.md`
Also confirmed in seedprod/openclaw-prompts-and-skills which mirrors it.

---

## Key Community Findings

### 1. The Anti-Patterns List Is Non-Negotiable

Every good SOUL.md in the wild includes an explicit "never do these" section. The community-proven list:

- ❌ "Great question!" — the #1 cited failure
- ❌ "I'd be happy to help!" / "Certainly!" / "Absolutely!"
- ❌ "As an AI..." — irrelevant disclaimer
- ❌ Hedging instead of having an opinion
- ❌ Burying the answer in preamble
- ❌ Asking clarifying questions when you could just try
- ❌ Repeating what the user said before responding
- ❌ "Let me know if you need anything else!" as a closing

Source: @thedayisntgray thread, learnopenclaw.com, official template, Reddit r/openclawsetup

### 2. The Clean Separation Model (Reddit r/vibecoding)

The community has converged on this mental model:
- **SOUL.md** = Constitution (non-negotiable rules, behavioral philosophy, trust boundaries)
- **USER.md** = Who the human is + how they want to work (stable identity, not diary)
- **MEMORY.md** = Curated, durable, verified facts (small and structured, not a dump)

Key insight: "Never auto-write identity files from untrusted content" — memory poisoning risk.

### 3. Specificity Rule (learnopenclaw.com)

> "The number one mistake people make in SOUL.md is being too vague."
> "Every line in your SOUL.md should be specific enough that you could test whether your agent is following it."

Examples:
- Vague: "Be helpful"
- Better: "When someone asks for a recommendation, give one — don't list options without a pick"

### 4. IDENTITY.md Architecture (mmntm.net, source code analysis)

From `src/agents/identity-file.ts`:
```typescript
export type AgentIdentityFile = {
  name?: string;
  emoji?: string;
  theme?: string;
  creature?: string;
  vibe?: string;
  avatar?: string;
}
```

**Important:** Placeholder text is stripped. Values like "pick something you like" and "ai? robot? familiar?" are filtered out and don't appear as the actual identity. So IDENTITY.md can safely ship with placeholder text — it won't show up as the agent's name.

The system prompt explicitly instructs the model to embody SOUL.md:
```typescript
// src/agents/system-prompt.ts, lines 538-541
if (hasSoulFile) {
  lines.push(
    "If SOUL.md is present, embody its persona and tone. Avoid stiff, generic replies; follow its guidance unless higher-priority instructions override it.",
  );
}
```

### 5. OpenClaw Creature Tradition

Community tradition: every agent gets a creature type (inspired by the lobster mascot). Optional but adds personality and is used by image generation skills for consistent avatars.

### 6. BOOTSTRAP.md Best Practices (openclaw-setup.me, gist.github.com/ideaduff)

- Bootstrap should be a natural conversation, not a form
- Agent should fill in USER.md and IDENTITY.md during/after the conversation
- Delete BOOTSTRAP.md when done — it won't be recreated
- Good pattern: ask their name early, weave other questions naturally

### 7. Memory System Insights (docs.openclaw.ai/concepts/memory)

- Daily notes: append-only, read today + yesterday at session start
- MEMORY.md: curated long-term, **only in private sessions** (never in group chats — security risk)
- Pre-compaction memory flush: automatic, agent writes to files before context window fills
- Vector search available over memory files: BM25 + semantic hybrid
- MMR re-ranking reduces near-duplicate results from daily notes
- Temporal decay boosts recent memory over stale (30-day half-life default)

### 8. What "soulcraft" Skill Does (VoltAgent awesome list)

The "soulcraft" skill in ClawHub creates or improves SOUL.md files through guided conversation. This validates the BOOTSTRAP.md approach — users benefit from conversational setup.

---

## Failure Modes to Avoid

Based on community feedback on bad default setups:

1. **Generic corporate tone** — "I am an AI assistant designed to help you with..." → users leave
2. **Missing anti-patterns list** — agent still says "Great question!" every time
3. **Empty USER.md** — agent has no context, every session starts from zero
4. **MEMORY.md as a dump** — huge, unstructured, slows down context loading
5. **BOOTSTRAP.md that reads like a form** — kills engagement on first interaction
6. **SOUL.md that only covers personality, ignores boundaries** — leads to bad external actions
7. **No memory write instructions** — agent learns nothing between sessions

---

## Design Decisions for Clawer Defaults

1. **Build on the official template, don't replace it** — community respects the original framing
2. **Anti-patterns section is mandatory** — it's in every effective SOUL.md
3. **BOOTSTRAP.md should match the user's energy** — provide multiple opening options
4. **MEMORY.md ships empty but structured** — headers ready, no stale content
5. **IDENTITY.md ships with real placeholder text** — system strips it, bootstrap fills it
6. **AGENTS.md needs the two-layer memory workflow explicitly** — agents need clear instructions to write things down
7. **USER.md should be a living document** — template with instructions to update, not a one-time form

---

## Things Worth Building (Future)

- **Soulcraft skill** for Clawer — conversational SOUL.md builder/updater
- **Memory prune skill** — review and clean MEMORY.md on schedule
- **onlycrabs.ai integration** — let users publish/import SOUL.md variants
- **SOUL.md per-team-template** — different vibes for lifeos vs ecommerce vs mom

---

*Research conducted via SearXNG (localhost:8888), web_fetch, and analysis of official OpenClaw source documentation.*
*X/Twitter direct fetches failed (auth wall) — tweet content extracted via search snippets and cached references.*
