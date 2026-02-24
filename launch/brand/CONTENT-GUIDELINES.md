# Clawer.ai Content Guidelines
*Last updated: 2026-02-23*

---

## Blog Writing Guide

### Structure Template
Every blog post follows this skeleton:

```
# [Headline — specific, benefit-driven, often includes a number]

[Opening hook: 1-2 sentences. Start with the problem, a surprising stat, or a story. NEVER "In this article we will..."]

## [Problem Section — what's broken/hard/dangerous]
[2-3 paragraphs with specific examples, numbers, real tweets/incidents]

## [Solution/How-To Section — the meat]
[Step-by-step or deep explanation. Use subheadings every 2-3 paragraphs.]

## [Clawer Angle — how we solve this]
[1-2 paragraphs. Honest positioning. Acknowledge we're a hosting provider.]

## [Conclusion + CTA]
[Summarize the key takeaway. One clear CTA.]
```

### Blog Tone Rules
- **Open with a hook, not a summary.** First sentence should make people keep reading.
- **Use "you" freely.** Talk to the reader, not about them.
- **Specific > vague.** "42,000 exposed instances" not "many instances." "$49/month" not "affordable."
- **Short paragraphs.** 2-4 sentences max. White space is your friend.
- **Subheadings for scanning.** Most people skim. Make the subheadings tell the story.
- **Acknowledge our bias.** "We're a hosting provider, so take this with that context. Here's the data anyway."
- **Code blocks when relevant.** But always explain what the code does and why.

### CTA Patterns
- **Security posts:** "Check if your instance is exposed → [link]. Or skip the risk entirely → [Clawer signup]"
- **Tutorial posts:** "Want this pre-configured? Clawer deploys it in 60 seconds → [link]"
- **Comparison posts:** "Try it free — 100 messages, no credit card → [link]"
- **Use case posts:** "Deploy this AI team template → [link]"

---

## Social Media Guide

### Tweet Formats That Work

**1. The Pain → Solution**
```
[Pain point in 1 sentence.]
[How Clawer fixes it in 1 sentence.]
[Link or CTA]
```
Example: "42,000 OpenClaw instances sitting on the open internet. No auth. No encryption. We scanned ClawHub so you don't have to → [link]"

**2. The Stat Drop**
```
[Surprising number + context]
[Brief implication]
```
Example: "1,184 malicious skills found on ClawHub. The #1 most downloaded skill was literally a crypto wallet stealer. Before you install anything → [link]"

**3. The Hot Take (Keith's account only)**
```
[Contrarian opinion, stated directly]
[1-sentence reasoning]
```
Example: "Hot take: 90% of AI wrappers will die. The survivors will be the ones who picked one thing and made it stupidly easy."

**4. The Before/After**
```
Before: [painful experience in 1 sentence]
After: [Clawer experience in 1 sentence]
```
Example: "Before: 3 hours debugging Docker networking to connect WhatsApp. After: Scan QR code. Done."

**5. The Tip**
```
[Useful OpenClaw tip — works for self-hosters too]
[Optional Clawer mention at end]
```
Example: "Your AGENTS.md should have: 1) clear persona, 2) tool permissions, 3) memory rules, 4) escalation triggers. Most people skip 3 and 4. That's why their agent goes rogue."

### Thread Template
```
Tweet 1: [Hook — surprising stat or bold claim]
Tweet 2: [Context — why this matters]
Tweet 3-5: [The substance — tips, data, examples]
Tweet 6: [The turn — how Clawer relates (optional)]
Tweet 7: [CTA — link, free trial, etc.]
```

### Posting Rules
- **@teamclawer:** 1-2 tweets/day. Mix of tips, blog promos, community engagement.
- **@Vavier (Keith):** Authentic cadence. Don't force it. Personal observations, hot takes, founder moments. Mention Clawer ~20% of the time, max.
- **Always engage replies.** Short, helpful, human. Never corporate.
- **Quote-tweet community wins.** When someone builds something cool with OpenClaw/Clawer, amplify it.
- **Never dunk on competitors by name.** Compare categories, not companies.

---

## How to Reference Competitors

### Self-Hosting OpenClaw
- ✅ "Self-hosting is great if you enjoy the infrastructure work."
- ✅ "OpenClaw is incredible software. Running it yourself is the hard part."
- ❌ "Don't waste your time self-hosting."
- ❌ "Self-hosting is dangerous/irresponsible."

### ChatGPT / Claude Direct
- ✅ "ChatGPT is great for conversations. Clawer is for ongoing work."
- ✅ "The difference isn't the AI model — it's what the agent can *do*."
- ❌ "ChatGPT is just a dumb chatbot."
- ❌ "Claude/GPT can't do anything useful."

### Other OpenClaw Hosts
- ✅ "We think our approach (team templates, skill scanning, one-click channels) is different."
- ✅ Compare features and approaches, never trash-talk.
- ❌ Never name specific competitors in attack content.
- ❌ Never claim others are insecure without evidence.

**General rule:** Be the confident adult in the room. Punch up (vs categories/problems), never down (vs specific small companies).

---

## SEO Guidelines

### Primary Keywords (target in blog titles, H1s, meta)
- openclaw hosting
- managed openclaw
- openclaw setup guide
- openclaw security
- openclaw whatsapp
- openclaw telegram
- AI agent hosting
- openclaw vs (self-hosted, chatgpt, etc.)

### Long-Tail Keywords (target in H2s, body text)
- openclaw port 18789
- openclaw agents.md tutorial
- openclaw clawhub malware
- openclaw docker setup
- openclaw whatsapp ban
- how to set up openclaw 2026
- openclaw cost breakdown
- openclaw multi agent

### Meta Description Formula
```
[What the post covers] + [key benefit/stat] + [implicit CTA]
```
Example: "The real cost of self-hosting OpenClaw vs managed hosting. We compare setup time, monthly costs, and security across 4 user scenarios."

### Internal Linking
- Every blog post links to at least 2 other blog posts
- Every blog post links to the signup page at least once
- Security posts link to the security guide
- Tutorial posts link to the relevant "or use Clawer" alternative

---

## What NOT to Say

### Legal Boundaries
- Never claim SOC 2 compliance unless certification is current and verified
- Never guarantee "unhackable" or "100% secure" — use "security-first" and describe specific measures
- Never make claims about uptime that exceed our actual SLA (99.9%)
- Never share specific customer data or usage without explicit permission

### Ethical Boundaries
- Never manufacture fear about self-hosting — report real incidents with sources
- Never imply OpenClaw itself is bad/dangerous — the software is great, the default config needs hardening
- Never disparage the OpenClaw maintainers or community
- Never claim AI agents can replace human judgment for critical decisions (medical, legal, financial)

### Competitive Boundaries
- Never name-and-shame specific competing OpenClaw hosts
- Never claim competitors have security vulnerabilities without published evidence
- Never use "killer" language about competing with OpenClaw (we're built on it, we support it)
- Never imply other hosts' customers are at risk

### Messaging Traps to Avoid
- "AI will replace your job" → We say "AI handles tasks so you focus on what matters"
- "Set it and forget it" → We say "works while you sleep, review when you wake up"
- "No technical knowledge needed" → We say "no servers or Docker required" (more specific, more believable)
- "Enterprise-grade" → We describe the specific security measures instead
- Any promise that implies AI agents are infallible or don't need human oversight
