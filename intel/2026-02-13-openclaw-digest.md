# OpenClaw Intelligence Digest — 2026-02-13

Generated: 2026-02-13 04:30 AM CST

## Executive Summary

**Major security focus dominates ecosystem.** Latest release (2026.2.12) shipped extensive hardening. Two managed service competitors launched in past week. ClawHub malicious skills attack continues. Community sentiment divided between excitement and security fear.

---

## 🔴 Critical: Security & Vulnerabilities

### CVEs Disclosed (Past 2 Weeks)
| CVE | Severity | Impact | Fixed In |
|-----|----------|--------|----------|
| CVE-2026-25253 | Critical | RCE via malicious link | 2026.1.29+ |
| CVE-2026-24763 | High | Command injection in Docker sandbox | 2026.1.29+ |
| CVE-2026-25157 | High | Command injection | 2026.1.29+ |

**Technical details:** CVE-2026-25253 chains WebSocket auth bypass + unsafe network validation for one-click RCE when bot processes attacker-controlled content.

**Relevance to Clawer.ai:** HIGH  
**Action:** Implement + Monitor  
**Urgency:** Immediate

**Our position:** All CVEs patched in 2026.1.29+. We're on 2026.2.12 (current). ClawHub skill vetting is our competitive advantage over DIY installs.

---

### ClawHavoc: 341 Malicious Skills on ClawHub

**Discovery:** Feb 3, 2026 by multiple security firms (Koi.ai, Cisco AI Defense, eSecurity Planet)

**Attack vectors:**
- 29 typosquatting variants (clawhub, clawhub1, clawhubb, clawwhub, etc.)
- Markdown-based prompt injection in skill descriptions
- Data exfiltration targeting API keys, tokens, session data
- Remote code execution via malicious skill code

**OpenClaw response:** Auto-hide skills with 3+ unique reports (implemented Feb 3)

**Relevance to Clawer.ai:** HIGH  
**Action:** Implement  
**Urgency:** This Week

**Opportunity:** Market Clawer as "vetted, security-first" vs ClawHub chaos. Build curated skill marketplace with manual review. Premium feature: "Enterprise-approved skills only."

---

### 2026.2.12 Security Hardening (Released Feb 12)

**Major fixes:**
- SSRF protections for URL-based file/image inputs
- Unauthenticated Nostr profile API remote config tampering
- Removed bundled "soul-evil" hook (🚩 WTF was this?)
- Hook session-routing hardening
- Sandbox skill sync path traversal fix
- Browser/web content treated as untrusted by default
- Webhook auth throttling (429 + Retry-After)
- Browser control requires auth, auto-generates token
- Session transcript path traversal protection

**Relevance to Clawer.ai:** MEDIUM  
**Action:** Monitor  
**Urgency:** Backlog

**Our status:** Already on 2026.2.12. Security audit should verify all these are enabled in our deployment.

---

## 🏢 Competitor Moves

### OpenClawd.ai — Launched Feb 12, 2026

**Positioning:** "One-Click OpenClaw Deployment With Built-In Security, Targeting the 63% of Vulnerable Moltbot Instances Worldwide"

**Key claims:**
- Managed deployment platform
- Built-in security hardening
- Targets security-conscious enterprise users
- "63% of Moltbot instances vulnerable" marketing angle

**Pricing:** Unknown (likely premium)

**Relevance to Clawer.ai:** HIGH  
**Action:** Monitor  
**Urgency:** This Week

**Analysis:** 
- Direct competitor, launched THIS WEEK
- Security-first positioning (smart given CVE flood)
- Enterprise angle vs our consumer/prosumer focus
- **Differentiation opportunity:** We offer Teams + templates, not just "secure install"
- **Threat:** If they nail enterprise sales, could dominate high-value segment

---

### MyClaw.ai — Launched Feb 5, 2026

**Positioning:** "World's First One-click Deployment OpenClaw Platform, Bringing Real 'Jarvis' to the Mass Market"

**Key features:**
- Fully managed, plug-and-play
- Consumer/mass market angle
- "Real Jarvis" branding

**Pricing:** Unknown

**Relevance to Clawer.ai:** HIGH  
**Action:** Monitor  
**Urgency:** This Week

**Analysis:**
- Consumer-focused vs OpenClawd's enterprise angle
- "First" claim (false, but good marketing)
- Direct overlap with our positioning
- **Differentiation:** Our AI Team feature is unique, they're just managed hosting
- **Threat:** If they nail UX + onboarding, could capture non-technical users

---

## 🚀 New Features/Releases

### OpenClaw 2026.2.12 (Feb 12)

**New capabilities:**
- Feishu/Lark plugin (China market expansion)
- Agent dashboard in Web UI (file/tool/skill/model/channel/cron management)
- Grok (xAI) web_search provider
- iOS alpha node app + pairing
- Device pairing + phone control plugins
- Telegram blockquote rendering
- Local timezone logging
- Voyage AI embedding support
- Token usage dashboard

**Relevance to Clawer.ai:** MEDIUM  
**Action:** Implement (selective)  
**Urgency:** Backlog

**Opportunities:**
- **iOS node app:** Mobile companion for Clawer? Could differentiate from competitors
- **Feishu/Lark:** China market entry strategy (low priority for now)
- **Agent dashboard:** Our UI should match/exceed this
- **Grok search:** Add as search provider option

---

### OpenClaw 2026.2.9 (Feb 9)

**Key additions:**
- iOS node app alpha
- BlueBubbles channel
- Device pairing plugins
- Agent management RPC methods
- Compaction divider in chat history
- OPENCLAW_HOME environment variable

**Relevance to Clawer.ai:** LOW  
**Action:** Monitor  
**Urgency:** Backlog

---

### OpenClaw 2026.2.6 (Feb 6)

**Highlights:**
- Opus 4.6 support
- OpenAI Codex gpt-5.3-codex (forward-compat)
- xAI (Grok) provider support
- Token usage dashboard
- Voyage AI embeddings

**Relevance to Clawer.ai:** MEDIUM  
**Action:** Monitor  
**Urgency:** Backlog

---

## 📊 Community Sentiment

### Hacker News (Past 2 Weeks)

**Threads:**
- "Ask HN: Any real OpenClaw users? What's your experience?" — Low actual usage, setup friction cited
- "OpenClaw is what Apple Intelligence should have been" — Divided comments, security concerns dominate
- "OpenClaw renamed again" — Name churn causing confusion

**Tone:** Skeptical curiosity mixed with security paranoia

**Quote:** "Reddit is unanimous derision towards OpenClaw and its security nightmares."

**Relevance to Clawer.ai:** HIGH  
**Action:** Implement  
**Urgency:** This Week

**Opportunity:** Market Clawer as "OpenClaw's safe, managed cousin." Highlight security + ease-of-use vs DIY chaos.

---

### Reddit (r/openclaw, r/ThinkingDeeplyAI)

**Topics:**
- Setup guides and tutorials
- Security nightmares and exploit discussions
- "Ultimate Guide to OpenClaw" (Feb 1)
- M365 integration questions

**Tone:** Technical, security-focused, cautious adoption

**Relevance to Clawer.ai:** MEDIUM  
**Action:** Monitor  
**Urgency:** Backlog

---

### Twitter/X

**Volume:** High (rebranding chaos, security news)

**Key moments:**
- @clawdbot handle hijacked by crypto scammers during Jan 27 rebrand
- Fake $CLAWD token pushed to 60K+ followers
- Security researchers publicly disclosing CVEs
- Managed service providers promoting "secure alternatives"

**Tone:** Viral buzz mixed with security FUD

**Relevance to Clawer.ai:** HIGH  
**Action:** Implement  
**Urgency:** This Week

**Opportunity:** Content marketing around "Don't get scammed by fake OpenClaw services." Position Clawer as trustworthy, vetted.

---

## 🔌 Integration Opportunities

### Trending Skills (Pre-ClawHavoc)

**Top legitimate skills:**
- GitHub integrations (gh CLI wrappers)
- Google Workspace (Gmail, Calendar, Drive)
- Weather APIs
- Video frame extraction (ffmpeg)
- YouTube transcript fetching
- Fantasy football intelligence
- Reddit browsing/posting
- Macro/geopolitical monitoring

**Relevance to Clawer.ai:** MEDIUM  
**Action:** Implement (selective)  
**Urgency:** Backlog

**Strategy:** Curate top 20-30 skills, manual security review, offer as "Clawer Verified Skills" premium library.

---

### New APIs/Data Sources

**Grok (xAI):**
- Web search provider
- Integrated in 2026.2.9
- Potential alternative to Brave/Perplexity

**Voyage AI:**
- Embedding provider
- Native support added 2026.2.6
- Better semantic search than default embeddings

**Feishu/Lark:**
- China market messaging platform
- Full plugin support added 2026.2.12
- Enterprise-focused (Asia-Pacific expansion opportunity)

**Relevance to Clawer.ai:** LOW  
**Action:** Monitor  
**Urgency:** Backlog

---

## 📈 Market Insights

### Adoption Metrics (Estimates)

**GitHub Stars:** ~60K+ followers across renamed accounts  
**Active Instances:** Unknown (63% vulnerable per OpenClawd claim suggests tens of thousands)  
**Commercial Services:** 3+ launched in Feb 2026 alone (MyClaw, OpenClawd, LobsterLair)

**Relevance to Clawer.ai:** HIGH  
**Action:** Monitor  
**Urgency:** This Week

**Analysis:** Market heating up FAST. First-mover advantage window closing. Security chaos creating opportunity for managed services.

---

### Pricing Intel

**MyClaw.ai:** Unknown (likely $20-50/mo)  
**OpenClawd:** Unknown (likely premium enterprise pricing)  
**LobsterLair:** Unknown (BestClawHosting.com comparison site exists)

**Relevance to Clawer.ai:** HIGH  
**Action:** Implement  
**Urgency:** Immediate

**Recommendation:** Competitive research on pricing. Our $9.99/mo MomBrain pricing might be too low if market will bear $20-50/mo for managed OpenClaw.

---

## 🎯 Top Actionable Items

### 1. ClawHub Security Audit (HIGH PRIORITY)

**What:** Audit all skills we're considering for Clawer marketplace  
**Why:** 341 malicious skills found on ClawHub, ongoing attack  
**How:** Manual code review + automated scanners for typosquats, prompt injection, exfiltration patterns  
**Timeline:** This week  
**Owner:** Keith + Security review sub-agent

---

### 2. Competitive Positioning vs OpenClawd/MyClaw (HIGH PRIORITY)

**What:** Refine Clawer.ai positioning to differentiate from new competitors  
**Why:** Two direct competitors launched in past 10 days  
**How:** 
- Emphasize AI Team feature (unique vs "just managed OpenClaw")
- Security-first messaging (vetted skills, hardened deployments)
- Template library (Life OS, Mom's Command Center, etc.)
**Timeline:** This week  
**Owner:** Keith + Marketing strategy

---

### 3. Security Marketing Content (MEDIUM PRIORITY)

**What:** Blog posts, comparison charts, security guides targeting scared DIY users  
**Why:** Community sentiment is "excited but terrified" — capture the terrified segment  
**How:**
- "Don't Get Hacked: Why Managed OpenClaw Beats DIY"
- "ClawHub Malware Explained: How Clawer Protects You"
- Security comparison table (Clawer vs DIY vs competitors)
**Timeline:** Next 2 weeks  
**Owner:** Content team (or sub-agent)

---

### 4. iOS Node App Exploration (MEDIUM PRIORITY)

**What:** Evaluate iOS node app for Clawer mobile companion  
**Why:** OpenClaw just shipped alpha, mobile access could differentiate  
**How:** Test iOS alpha, assess production readiness, plan mobile roadmap  
**Timeline:** Next 2 weeks  
**Owner:** Product/Engineering

---

### 5. Pricing Competitive Research (IMMEDIATE)

**What:** Reverse-engineer competitor pricing before we lock in Clawer rates  
**Why:** Market might support $20-50/mo vs our planned lower pricing  
**How:** Sign up for competitor trials, check pricing pages, Reddit/HN threads  
**Timeline:** Today  
**Owner:** Keith

---

## 📋 Monitoring Checklist

- [ ] Daily GitHub releases monitoring
- [ ] Weekly ClawHub skill security scans
- [ ] Competitor changelog tracking (OpenClawd, MyClaw)
- [ ] HN/Reddit sentiment analysis (weekly digest)
- [ ] CVE database monitoring (NVD, Tenable plugins)
- [ ] Twitter/X mentions tracking (@OpenClawAI, #OpenClaw)

---

## 🔗 Key Sources

- OpenClaw GitHub: https://github.com/openclaw/openclaw
- ClawHub: https://clawhub.com
- OpenClaw Docs: https://docs.openclaw.ai
- Security Boulevard: https://securityboulevard.com/2026/02/from-clawdbot-to-moltbot-to-openclaw-security-experts-detail-critical-vulnerabilities-and-6-immediate-hardening-steps-for-the-viral-ai-agent/
- The Hacker News: https://thehackernews.com/2026/02/openclaw-bug-enables-one-click-remote.html
- Koi.ai ClawHavoc Report: https://www.koi.ai/blog/clawhavoc-341-malicious-clawedbot-skills-found-by-the-bot-they-were-targeting

---

**Next Digest:** 2026-02-14 (or on-demand if major news breaks)
