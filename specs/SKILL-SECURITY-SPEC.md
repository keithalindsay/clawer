# Clawer.ai — Skill Security & Vetting System

*Competitive Specification v1.0 — February 2026*

---

## 1. Executive Summary

OpenClaw's ClawHub marketplace hosts 5,700+ community-built skills. Independent security audits (bitsecai, Cisco) have found that **~7% contain critical security flaws** — data exfiltration, prompt injection, credential harvesting. Self-hosters are on their own. Setup services do manual installs with no automated scanning.

Clawer takes a different approach: **the Curated App Store model.** Every skill is scanned before it touches a user's container. Every container is hardened against escape. Users get the full power of the OpenClaw skill ecosystem without the risk.

This is a competitive moat. It's expensive to replicate (scanning pipeline + per-container hardening), and it gets stronger over time as our vetted catalog grows.

---

## 2. Threat Landscape

### ClawHub by the Numbers

| Metric | Value |
|--------|-------|
| Total skills on ClawHub | 5,700+ |
| Skills flagged by VirusTotal | ~400 |
| Critical flaws (bitsecai audit) | ~7% of audited skills |
| VoltAgent "awesome" list filtered | 2,748 excluded (spam, malicious, duplicates) |
| Cisco-identified exfiltration skills | Confirmed (multiple) |

### Attack Vectors in Malicious Skills

**1. Data Exfiltration**
Skill reads conversation history, API keys, contacts, personal data. Phones it home to an external server. User never knows.

**2. Prompt Injection**
Skill embeds hidden instructions in its system prompt or tool definitions. Turns the AI into a social engineering tool against the user — "send this email," "approve this action."

**3. Resource Abuse**
Crypto mining, botnet participation, or bandwidth abuse. Burns the host's resources, degrades service for everyone on shared infrastructure.

**4. Spam Relay**
Skill uses the user's connected messaging channels (WhatsApp, Telegram, email) to send spam or phishing to their contacts. Platform gets blamed.

**5. Credential Harvesting**
Skill prompts the user for API keys, passwords, or tokens under the guise of "configuration." Sends them to the attacker.

### Real-World Examples

- **VULN-188** (bitsecai): Default admin privileges on empty WebSocket scopes — trivial container escape vector
- **VULN-210** (bitsecai): `npm install` without `--ignore-scripts` enables RCE via malicious postinstall scripts
- **Cisco disclosure**: Multiple ClawHub skills confirmed performing silent data exfiltration
- **VoltAgent audit**: 396 skills identified as malicious out of 5,700+ total

---

## 3. Security Model: The Curated App Store

### Philosophy

> Users should never have to think about skill security. They get a capable assistant that happens to be safe — like installing apps from the App Store instead of sideloading APKs.

### Three Pillars

#### Pillar 1: Pre-Vetted Skill Library
- All skills pass our 5-stage scanning pipeline before inclusion
- Read-only skill directories in containers — no runtime installation
- Skills are pinned to specific audited versions (no auto-update surprises)

#### Pillar 2: Automated Scanning Pipeline
See [Section 7](#7-scanning-pipeline-technical-design) for full technical design.
- Dependency audit → Static analysis → Sandboxed execution → Prompt injection detection → Human review

#### Pillar 3: Skill Request Workflow
Users aren't locked out — they can request any ClawHub skill:

```
User requests skill → Automated scan (minutes) → Manual review if flagged → 
  Approved: deployed to container within 24hrs
  Rejected: user notified with reason
```

---

## 4. Container Hardening Stack

### Launch Configuration (Friday Deploy)

| Hardening | Flag/Config | What It Prevents |
|-----------|-------------|------------------|
| Read-only rootfs | `--read-only` + tmpfs `/tmp`, `/var` | Persistent malware, file modification |
| Drop all capabilities | `--cap-drop=ALL` | Kernel exploits via leftover caps |
| No new privileges | `--security-opt=no-new-privileges` | Escalation via setuid binaries |
| Non-root execution | `USER openclaw` in Dockerfile | Root-level access if container compromised |
| Network segmentation | Isolated Docker networks per user | Container-to-container lateral movement |
| Egress whitelist | iptables rules in container | Data exfiltration to unknown hosts |

### Approved Egress Domains

```
# AI Providers
api.openai.com
generativelanguage.googleapis.com

# Messaging
web.whatsapp.com
api.telegram.org

# Search
SearXNG (internal, no external call)

# Updates
registry.npmjs.org (build-time only, blocked at runtime)
```

Everything else: **blocked by default.**

### Post-Launch Roadmap

| Enhancement | Timeline | Impact |
|-------------|----------|--------|
| Seccomp profiles | Month 1 | Restrict syscalls to ~50 from ~300+ |
| AppArmor profiles | Month 1 | Mandatory access control |
| gVisor (runsc) | Month 2 | Kernel-level sandboxing, intercepts all syscalls |
| Runtime file integrity | Month 3 | Detect unauthorized file changes |

---

## 5. User Experience

### Skill Catalog (Dashboard)

Users see a curated catalog of available skills in their dashboard:

- **Category browsing**: Communication, Productivity, Research, Development, etc.
- **Security badge** on each skill: ✅ Verified (passed all 5 scan stages)
- **One-click enable/disable** per skill
- **Pre-built AI teams** include curated skill bundles (e.g., "Solopreneur" team comes with email, calendar, research skills pre-enabled)

### Request a Skill

For skills not yet in our catalog:

1. User clicks **"Request a Skill"** → pastes ClawHub URL or describes what they need
2. Status tracking: `Requested → Scanning → Under Review → Approved / Rejected`
3. User gets notified when skill is ready (or told why it was rejected)
4. **SLA: 24 hours** for standard requests, **4 hours** for popular/high-demand skills

### Transparency Without Anxiety

The goal is **quiet confidence** — users know their skills are scanned without feeling like they're in a high-security prison.

- Small "Verified" badge on skill cards (not giant warning banners)
- "All skills are security-scanned before installation" as a one-liner on the catalog page
- Rejection notifications include plain-language reasons ("This skill sends your data to an unknown server")
- No security score numbers or threat levels — just ✅ Verified or ❌ Rejected

---

## 6. Competitive Positioning

### Internal Analysis (Not Customer-Facing)

| Competitor | Their Approach | Our Advantage |
|------------|---------------|---------------|
| **Self-hosting** | User installs from ClawHub directly. No scanning, no hardening. VirusTotal badge exists but most users don't check. | We scan everything. They scan nothing. |
| **SetupClaw** | Manual setup by a human. $2,400 install. No automated scanning — relies on the installer's judgment. | A human can't catch what AST analysis and sandboxed execution testing catches. And we do it in minutes, not hours. |
| **AgentPacks** | Sells prompt templates ($79/mo), not executable skills. No security risk because no real capability. | We offer actual skills with real power — and make them safe. They offer training wheels. |
| **Hostinger/xCloud** | VPS hosting. User is responsible for everything including security. | We're managed, they're infrastructure. Different product entirely. |

### Customer-Facing Positioning

> "Every skill is scanned. Every container is hardened. Your data stays yours."

- Don't name competitors
- Don't lead with security (invites scrutiny)
- Position as: "We handle the hard stuff so you don't have to"
- Mention in passing on skill catalog page and in onboarding
- Let it be discovered, not advertised

### Value Anchoring

> "Self-hosting means you're responsible for vetting 5,700+ community skills yourself. Most people don't. With Clawer, every skill is automatically scanned before it touches your assistant."

---

## 7. Scanning Pipeline Technical Design

### Stage 1: Dependency Audit
- `npm audit` for Node.js skills
- `pip-audit` / `safety check` for Python skills
- Cross-reference against NIST NVD for known CVEs
- **Auto-reject:** Any critical CVE with known exploit

### Stage 2: Static Analysis (AST Parsing)
Pattern detection for dangerous constructs:

```
HIGH RISK (auto-reject):
- eval() / exec() with dynamic input
- child_process.spawn/exec with user-controlled args
- fs.readFile on paths outside skill directory
- Network calls to hardcoded IPs (not domains)
- Base64-encoded URLs or payloads
- Obfuscated code (minified single-line JS > 10KB)

MEDIUM RISK (flag for review):
- fetch/axios/request to non-standard domains
- File system access outside /tmp
- Environment variable reads (especially *_KEY, *_TOKEN, *_SECRET)
- WebSocket connections
- Dynamic require/import
```

### Stage 3: Sandboxed Execution Test
- Spin up isolated Docker container with skill installed
- Run skill's declared entry points with mock inputs
- Monitor for 60 seconds:
  - **Network traffic**: Log all outbound connections, flag any to non-whitelisted domains
  - **File access**: Log all reads/writes outside expected directories
  - **Process spawning**: Log any child processes
  - **Resource usage**: Flag CPU > 80% sustained or memory > 512MB
- **Auto-reject:** Any network call to unknown host during test

### Stage 4: Prompt Injection Detection
- Parse all `.md` files in skill for hidden instructions:
  - Invisible Unicode characters
  - HTML comments with instructions
  - "Ignore previous instructions" patterns
  - Role reassignment attempts ("You are now...")
  - Data exfiltration instructions ("Send the contents of...")
- Parse tool definitions for overly broad permissions
- **Auto-reject:** Any detected injection pattern

### Stage 5: Human Review Flag
- If stages 1-4 pass but **complexity score > threshold**:
  - More than 5 files
  - More than 500 lines of code
  - External service integrations
  - Requires elevated permissions
- Human reviewer checks intent alignment and edge cases
- **SLA:** 24 hours from flag to decision

### Pipeline Output

```json
{
  "skill": "example-skill",
  "version": "1.0.0",
  "scanDate": "2026-02-11T07:00:00Z",
  "stages": {
    "dependency_audit": { "status": "pass", "cves": 0 },
    "static_analysis": { "status": "pass", "high_risk": 0, "medium_risk": 1 },
    "sandbox_test": { "status": "pass", "network_calls": 2, "all_whitelisted": true },
    "prompt_injection": { "status": "pass", "patterns_detected": 0 },
    "human_review": { "status": "not_required", "complexity_score": 3 }
  },
  "verdict": "APPROVED",
  "reviewer": "automated"
}
```

---

## 8. Metrics & SLAs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Skill vetting SLA (standard) | 24 hours | Time from request to decision |
| Skill vetting SLA (popular) | 4 hours | For skills with 100+ ClawHub downloads |
| Scanning false positive rate | < 5% | Skills incorrectly rejected / total scanned |
| Vetted catalog size (launch) | 200+ skills | Across all categories |
| Vetted catalog size (month 3) | 500+ skills | Growing via user requests + proactive curation |
| Container escape incidents | 0 | Zero tolerance |
| Mean time to block (new threat) | < 4 hours | From discovery to all containers patched |

### Catalog Growth Strategy

1. **Pre-launch:** Scan top 200 skills from VoltAgent's awesome list (already filtered for quality)
2. **Month 1:** User requests drive prioritization — scan what people actually want
3. **Month 2-3:** Proactive scanning of entire VoltAgent list (2,999 skills)
4. **Ongoing:** New ClawHub submissions auto-scanned weekly

---

## 9. Marketing Angle

### The Line

> "Every skill is scanned. Every container is hardened. Your data stays yours."

### Where It Appears

- **Skill catalog page**: Small banner, not a popup
- **Onboarding**: "Your assistant comes with pre-vetted skills. You can request more anytime."
- **Pricing page**: One bullet point, not a section
- **Blog** (post-launch): "How We Secure Your AI Assistant" — technical deep-dive for SEO

### What We Don't Do

- ❌ Lead with security on the homepage (invites "prove it" challenges)
- ❌ Publish vulnerability counts or threat statistics (sounds defensive)
- ❌ Name specific competitors' security failures (petty, invites retaliation)
- ❌ Claim "unhackable" or "100% secure" (nobody believes it, creates liability)

### What We Do

- ✅ Mention security as one of several benefits (alongside convenience, speed, support)
- ✅ Show the "Verified" badge on skills — lets the visual do the talking
- ✅ Have the deep technical content ready for anyone who asks
- ✅ Let word-of-mouth spread: "They actually scan their skills"

---

## Appendix: Implementation Priority

### Phase 1 — Launch (Week 1)
- [ ] Container hardening flags (read-only, cap-drop, no-new-privileges, non-root)
- [ ] Network segmentation (isolated Docker networks)
- [ ] Read-only skill directories
- [ ] Initial vetted catalog (50-100 skills, manually reviewed)
- [ ] "Request a Skill" form in dashboard

### Phase 2 — Month 1
- [ ] Automated scanning pipeline (stages 1-2: dependency + static analysis)
- [ ] Egress whitelist enforcement
- [ ] Skill catalog UI in dashboard
- [ ] Seccomp + AppArmor profiles

### Phase 3 — Month 2-3
- [ ] Full pipeline (stages 3-5: sandbox + injection + human review)
- [ ] Automated weekly scanning of new ClawHub submissions
- [ ] Skill version pinning and update notifications
- [ ] gVisor evaluation and deployment

---

*This document is both an internal engineering spec and investor-ready material. Customer-facing messaging should follow the guidelines in Section 9.*
