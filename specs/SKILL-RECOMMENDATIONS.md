# ClawHub Skill Recommendations per Team Template

> Reviewed from [awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) (2,999 curated skills from 5,705 total)
> 
> **Security note:** 396 skills were already flagged as malicious by researchers. Always check VirusTotal reports on ClawHub before installing. We recommend auditing source code of any skill before bundling.

---

## ⚠️ Skills to AVOID (All Templates)

**Entire categories to skip:**
- **Moltbook** (51 skills) — AI-to-AI social networks, prompt injection vectors, zero user value
- **Agent-to-Agent Protocols** (19 skills) — Same risk profile
- **Crypto/Blockchain** — Already filtered out by awesome-list maintainers (672 removed)

**Red flags in any skill:**
- Makes external API calls to unknown services
- Requires API keys for services the user didn't request
- Posts to social platforms on behalf of the agent
- "Self-evolving" or "autonomous" behavior patterns
- Skills from authors with many near-identical skills (spam pattern)

---

## 🛒 E-Commerce Team

### High Value (Recommend Bundling)
| Skill | Why | Risk |
|-------|-----|------|
| **shopify-admin-api** | Full Shopify read/write — core for e-com users | Low (uses user's own API key) |
| **marketing-skills** (jchopard69) | 23 marketing playbooks — SEO, email, copy, CRO | Low (pure text/guidance) |
| **content-creator** | SEO-optimized marketing content | Low (guidance skill) |
| **copywriter** | UX copy, product messaging | Low (guidance) |
| **seo-optimizer-pro** | AI-powered SEO/AEO optimization | Low (guidance) |
| **price-tracker** | Monitor prices across Amazon/eBay/Walmart | Medium (web scraping) |
| **amazon-competitor-analyzer** | ASIN scraping for competitive intel | Medium (web scraping) |
| **google-ads** | Query/audit/optimize Google Ads | Low (uses user's GA credentials) |
| **ga4** | Google Analytics 4 data queries | Low (uses user's GA credentials) |
| **gsc** | Google Search Console SEO data | Low (uses user's GSC credentials) |

### Nice to Have
| Skill | Why |
|-------|-----|
| **shopping-expert** | Google Shopping product comparison |
| **review-summarizer** | Scrape/analyze product reviews |
| **newsletter-generator** | Automated email newsletters |
| **landing-page-generator** | High-converting landing pages |
| **jtbd-analyzer** | Jobs-to-be-done customer research |
| **business-model-canvas** | Strategy tool |
| **clawpify** | Shopify via GraphQL (alternative to shopify-admin-api) |

---

## 🏠 Life OS Team

### High Value (Recommend Bundling)
| Skill | Why | Risk |
|-------|-----|------|
| **gog** (steipete) | Google Workspace — Gmail, Calendar, Drive, Sheets, Docs | Low (official bundled skill) |
| **todoist** | Task management integration | Low (uses user's API key) |
| **daily-briefing** | Weather + calendar + tasks morning report | Low (guidance) |
| **morning-briefing** | Personalized morning report generator | Low (guidance) |
| **task-tracker** | Personal task management with standups | Low (local files) |
| **deepwork-tracker** | Focus sessions (start/stop/status) | Low (local) |
| **cron-scheduling** | Manage recurring tasks | Low (guidance) |
| **weather** (built-in) | Already bundled in OpenClaw | None |
| **web_search** (built-in) | Already patched to use SearXNG | None |

### Nice to Have
| Skill | Why |
|-------|-----|
| **plan-my-day** | Energy-optimized time blocking |
| **pomodoro** | Focus timer with task tracking |
| **habit-tracker** | Build habits with streaks |
| **daily-stoic** | Daily philosophy quotes |
| **qmd** | Local search/indexing for notes |
| **obsidian** | If user has Obsidian vault |
| **notion** | If user has Notion |
| **remind-me** | Natural language reminders |
| **morning-manifesto** | Daily reflection workflow |
| **weekly-synthesis** | Weekly work synthesis |
| **munger-observer** | Mental models daily review |
| **crucial-conversations-coach** | Communication coaching |

---

## 👩‍👧‍👦 Mom's Command Center

### High Value (Recommend Bundling)
| Skill | Why | Risk |
|-------|-----|------|
| **gog** (steipete) | Google Calendar for family scheduling, Gmail | Low |
| **grocery-list** | Standalone grocery + meal planning + recipes | Low (local files) |
| **anylist** | Manage AnyList grocery/shopping lists | Low (user's account) |
| **weather** (built-in) | "Do I need an umbrella for soccer?" | None |
| **remind-me** | "Remind me about the dentist Thursday" | Low |
| **todoist** | Family task management | Low |
| **web_search** (built-in) | Recipe searches, activity lookups | None |

### Nice to Have  
| Skill | Why |
|-------|-----|
| **paprika** | Recipes, meal plans, grocery lists (Paprika app) |
| **plan2meal** | Meal planning |
| **event-planner** | Event/party planning |
| **healthy-eating** | Nutrition logging |
| **only-baby-skill** | Baby/contraction tracking (specific use case) |
| **skylight-skill** | Skylight Calendar frame integration |
| **recgov-availability** | Campsite/activity booking |
| **recipe-to-list** | Recipe → Todoist shopping list |
| **streaming-buddy** | Family movie night picks |

---

## 🏗️ Skills Architecture Decision

### Option A: Curated Skill Packs (Recommended)
Pre-bundle 3-5 "core" skills per template in the Docker image. Users can install more via ClawHub CLI.

**Pros:** Instant value, tested compatibility, no user setup
**Cons:** Larger image, more to maintain

### Option B: Skill Manifest + Auto-Install
Ship a `skills-manifest.json` per team. On first boot, entrypoint installs from ClawHub.

**Pros:** Smaller image, always latest versions
**Cons:** Startup delay, needs internet, ClawHub availability dependency

### Option C: Hybrid (Recommended for MVP)
Bundle the **built-in** skills (weather, web_search already work) + ship `recommended-skills.json` that the Office Manager suggests during onboarding.

**Pros:** Fast start, user chooses what to add, no bloat
**Cons:** Slight friction to activate full power

---

## Universal Skills (All Templates)

These provide value regardless of template:

| Skill | Why |
|-------|-----|
| **weather** | Everyone checks weather |
| **web_search** | Already configured via SearXNG |
| **gog** | Google Workspace is universal |
| **remind-me** | Everyone needs reminders |
| **summarize** | Summarize URLs/articles |
| **get-tldr** | Quick summaries |
| **whatsapp-styling-guide** | If using WhatsApp channel |

---

*Generated 2026-02-08 by Lex*
