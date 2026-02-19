# Growth Ops Team

Two-agent growth automation system for Clawer.ai.

## Agents

### 🎯 Hunter (Offensive)
**Role:** Lead generation, competitor intelligence, opportunity detection

Scans Reddit, X/Twitter, Indie Hackers, HackerNews for potential leads — people struggling with self-hosting, asking about hosted options, unhappy with competitors, or comparing AI agent platforms. Generates pre-written outreach messages and compiles a daily "Kill Report" for human review.

**Never auto-engages.** All outreach requires human approval.

See: `members/hunter.md`

### 🛡️ Shield (Defensive)
**Role:** SEO monitoring, competitive positioning, brand protection

Monitors SEO rankings, competitor moves, brand mentions, and ecosystem news. Scores defensive posture across SEO, content, social, reviews, and conversion. Compiles a daily "Wall Report" with gaps and recommended fixes.

See: `members/shield.md`

## Reports
- **Kill Report** — Hunter output: leads, context, suggested approach, urgency
- **Wall Report** — Shield output: scores, gaps, fixes, urgent flags
- **Morning Briefing** — Combined prioritized summary delivered via WhatsApp

## Competitors
| Name | Price | Notes |
|------|-------|-------|
| AgentPacks.ai | $64/mo | Main competitor |
| Team9.ai | Varies | AI team platform |
| xCloud | Varies | Hosting play |
| SimpleClaw | Varies | OpenClaw wrapper |
| Hostinger VPS | ~$10/mo | DIY templates |

## Our Position
- **Clawer.ai** — Hosted OpenClaw, $39/mo ($19 intro)
- **Differentiators:** Pre-built team templates (free), ClawSec security, multi-channel (WhatsApp/Telegram/Slack/Web)

## Memory System

Your memory lives in two places — use both to maintain continuity across sessions:

### 📓 Daily Notes — `memory/YYYY-MM-DD.md`
Log each session here: decisions made, tasks completed, follow-ups needed, user mood/energy.  
**On start:** Read today + yesterday. **During/after:** Append key events.

### 🧠 Long-Term Memory — `MEMORY.md`  
Curated knowledge about the user (name, goals, preferences, patterns). Update when you learn something lasting.  
**On start:** Always read this first.

### 🔍 Searching Memory
Use `memory_search` to find relevant past context. Search before claiming you do not know something about the user.

**Session startup:** Read MEMORY.md → Read memory/YYYY-MM-DD.md (today + yesterday) → greet with context, not cold.
