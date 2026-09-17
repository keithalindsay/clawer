# Clawer — a case study in building the right thing in the wrong market

> **Status: archived (shut down 2026).** Clawer.ai was a managed-hosting product that gave
> non-technical people their own [OpenClaw](https://github.com/) AI-agent instance without touching
> Docker. I built it solo over ~two months (Feb–Mar 2026). It worked. It lost — not on engineering, but
> on distribution. This README is the honest postmortem: the opportunity, the approach, the tech I
> actually shipped (gaps included), and what I'd do differently.
>
> I'm keeping it public and putting my name on the loss on purpose. The most useful thing I can offer a
> future team isn't a highlight reel — it's a clear-eyed account of a real bet: what I got right, what I
> got wrong, and why the market decided.

---

## TL;DR

- **The bet:** OpenClaw went viral, but to keep it secure it required several steps including running it in Docker + config most people can't do. I bet I could productize "managed OpenClaw" for non-technical operators — *"what consultants charge $15K for, at $49/month."*
- **What I built:** a full self-serve platform — Stripe billing → one isolated Docker container per user
  → a fleet of AI *agent teams* reachable from a web dashboard and 5 messaging channels, kept alive by a
  **bot-driven orchestration + self-healing layer**, behind real (if incomplete) container isolation.
  ~96k lines of TypeScript, 131 API routes, 9 pre-built agent-team templates.
- **Why it lost:** managed-container hosting has **near-zero moat** against incumbents who already own the
  SEO real estate, the review corpus, the datacenters, and the compliance certs. The moment Hostinger,
  DigitalOcean, AWS, xCloud, and OpenClaw's own cloud shipped one-click OpenClaw containers, my core
  pitch became table stakes — and I had **zero organic distribution** to fall back on.
- **The lesson:** I built a *feature-and-engineering-led* product in a *distribution-and-trust-led*
  commodity market. My one real differentiator (multi-agent "teams") lived in the code but never made it
  into the positioning, content, and social proof that would have let anyone find or trust it.

---

## 1. The Opportunity

In early 2026, OpenClaw — an open-source framework for AI agents that actually *do* things (run tools,
hold memory, work across channels) — went viral, past 60k GitHub stars in weeks. But there was a cliff
between "this is amazing" and "I have one running": you needed a VPS, Docker, LLM-provider wiring, a
search backend, TLS, and ongoing babysitting. The people who most wanted an always-on AI operator were
exactly the people who couldn't stand up that stack.

The existing answer was consultants: **$10–20K to implement, $2–5K/month to maintain.** Most small
operators couldn't afford it, so they DIY'd, hit a wall around day 3, and gave up.

I targeted three personas (from my positioning work):

- **The Compliance-Sensitive Operator** — law/PE/accounting/healthcare, whose data "can't leave the
  building."
- **The Overwhelmed Founder** — 1–10 employees, no IT function.
- **The Technical Non-Developer** — "knows enough to be dangerous, not enough to run Docker."

**The bet:** abstract the entire stack — provisioning, config, model wiring, search hosting, monitoring,
multi-channel — behind a login and a subscription, and sell "OpenClaw without the Docker" for **$49/month**
against a $15K agency market.

That bet had a fatal assumption baked in, which §4 (Lessons) returns to.

---

## 2. The Approach

**Managed OpenClaw hosting, team-first.** A user signed up (Clerk), subscribed (Stripe), and got their
**own isolated container** running a full OpenClaw instance — driven from a web dashboard and reachable
from WhatsApp, Telegram, Slack, and Discord. No Docker, no terminal, no VPS.

The deliberate differentiator was **agent *teams*, not a single bot.** Everyone else was racing to host
*an* OpenClaw. I shipped **9 pre-built teams** of specialized, personality-distinct agents — a "Personal
Assistant" team, a "Solopreneur" team, a "Parent Central" team, a "Growth Ops" team, etc. — each agent
with its own persona, workspace, memory, and proactive/scheduled behavior ("overnight research delivered
by morning"). Nobody else was targeting *"openclaw teams"* or *"multi-agent hosting."*

Around the core sat the things a non-technical buyer shouldn't have to think about: a task/kanban board,
cron automations, a file-workspace browser, semantic memory search, onboarding, and usage tracking.

---

## 3. The Tech (what I actually built)

A serious, months-long solo build. Headline numbers:

| | |
|---|---|
| App code | **~96k LOC** TypeScript/TSX in `src/` |
| Container/infra | ~3.8k LOC shell/JS/Dockerfiles in `docker/` |
| API surface | **131 route handlers**, 24 dashboard pages, 26 components |
| Data | PostgreSQL, 20 Drizzle schema tables, 39 Vitest test files |
| Docs | **361 markdown files** (architecture, runbooks, security scans, marketing) |

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind v4. **PostgreSQL via Drizzle ORM.**
Auth by **Clerk** (with an admin allowlist), billing by **Stripe** (webhook-driven), rate limiting on
**Redis** (fail-open when absent). The app ran on Vercel/PM2; user containers ran on a Docker host.
Crucially, **provisioning was SSH-driven**: the Next app shelled into the Docker host to manage the fleet.

### 3.1 The clawer-managed Docker orchestration (the part I'm proudest of)

The easy part of managed hosting is starting a container. The *hard* part — the part that actually earns
the subscription — is keeping a **fleet of stateful, untrusted, always-on agent containers healthy and
safe with no human watching at 3 a.m.** That's the system I most enjoyed building: a control plane where
an operator bot provisions, watches, heals, and — critically — **asks permission before it touches your
instance.** Three cooperating layers:

**① Provisioning.** A Stripe `checkout.session.completed` webhook triggered `provisionContainer()`, which
SSH'd into the Docker host, minted a 256-bit gateway token, allocated a free port, and launched the
OpenClaw image with hardened runtime flags. The in-container entrypoint then assembled `openclaw.json`
from whatever provider keys were injected, pointed search at a self-hosted SearXNG, and brought up the
gateway plus a token-authed HTTP wrapper — after which `provisionFullTeam()` laid down an **isolated
workspace per agent** (its own `SOUL.md`, `AGENTS.md`, `MEMORY.md`, skills, and files). Signup to a
running, addressable team of agents, hands-off.

```
Stripe webhook ─▶ provisionContainer(user, team)
   ├─ SSH ▶ docker run  (hardened flags; gateway :8080 + token API :8081 @127.0.0.1)
   ├─ entrypoint builds openclaw.json from injected keys, wires SearXNG search
   └─ provisionFullTeam() ▶ per-agent workspace (SOUL/AGENTS/MEMORY/skills/files)
Chat: dashboard ─▶ /api/chat ─▶(Bearer token)─▶ container API ─▶ WS ─▶ OpenClaw ─▶ agent
```

**② The Master Orchestrator — an alert + *permission* control plane.** This is the idea I'd most want to
build again. Five seeded monitors (`ssh_bruteforce`, `unauthorized_access` — explicitly watching for
"suspicious exec sessions, unexpected port openings, escape attempts", `disk_space`, `container_health`,
`config_audit`) feed a **graduated permission model** the *user* controls per alert:

| Level | Behavior |
|---|---|
| `notify` | act, then tell you |
| `auto` | always act on urgent issues |
| `approve` | **ask you before executing** (e.g. a security patch) |
| `manual` | never auto-act — you're in the loop for everything |

That "the bot asks before it touches your container" workflow — a real approval queue backed by
`permission_requests`/`alert_history` tables — is the piece I think was genuinely ahead of the pack for a
consumer hosting product.

**③ The Container Maintenance Agent — graduated self-healing.** A daemon on the Docker socket
continuously classified every user container (HEALTHY / DEGRADED / UNHEALTHY / DEAD) and escalated
remediation only as far as needed:

```
L1  flush caches / logs        ~2s      cheapest
L2  restart the process        ~10s
L3  restart the container      30–60s
L4  recreate the container     (gated on human approval)   most invasive
```

...with real safety rails: **max 3 attempts per level per 30-minute window, then escalate to a human**
rather than thrash. A separate **Fleet Health Monitoring** cron ran every 10 minutes checking gateway
latency, `openclaw doctor`, disk, memory, restart-loops, and heartbeat across the whole fleet, surfaced in
an admin `/admin/health` dashboard.

**Honest boundaries** (the naming was more ambitious than the reality): it could provision, monitor three
overlapping ways, self-heal within bounds, and escalate with a human gate — but it **couldn't** autoscale,
span multiple servers, or auto-recreate (L4 stayed manual), and the "AI-diagnose" endpoint was a stub. It
was Node/shell services plus a permission workflow orchestrating the agent fleet, not one omniscient agent
with fleet-wide root. Still — self-healing with a user-owned approval queue is a system I'd stand behind.

### 3.2 Agent teams — the core product (the differentiator)

What you *got* wasn't just "a bot" — it was a **pre-configured team of specialized agents** you could put to
work immediately, then customize. Nine team templates (`src/lib/teams.ts`), each a named group of
persona-distinct agents. Every agent was provisioned into its **own isolated workspace** — a `SOUL.md`
defining its personality and mandate, plus `AGENTS.md`, `MEMORY.md`, a skills folder, and a files
workspace — and wired for **proactive, scheduled** behavior: a morning briefing before you ask, overnight
research delivered by breakfast, standing daily reports.

| Template | For | The agents |
|---|---|---|
| **Personal Assistant** *(default)* | life ops | Max · Chief of Staff · North · Goal Tracker · Scout · Research · Dash · Task Runner · Zen · Wellness |
| **Solopreneur** | run a one-person business | Claire · Exec Assistant · Leo · Research · Harper · Outreach · Hunter · Lead-Gen & Intel · Shield · SEO |
| **Business Ops** | small e-commerce / ops | Alex · Support Lead · Maya · Marketing · Sam · Analyst · Jordan · Content · Riley · Ops |
| **Content Creator** | audience growth | Mia · Strategist · Blake · Script/Copy · Jordan · Social · Aria · Outreach/PR |
| **Parent Central** | household logistics | Mel · Meal Planner · Cal · Calendar (WhatsApp reminders) · Prof · Homework · Tidy · Household · Care · Family Wellness |
| **Fitness** | training & accountability | Noah · Coach · Nina · Nutrition · Ethan · Accountability |
| **Finance** | books & tax | Sophia · Invoices/Billing · Liam · Bookkeeping · Nora · Tax Planner |
| **Growth Ops** | demand gen | Hunter · Lead-Gen (daily "Kill Report") · Shield · SEO & brand defense (daily "Wall Report") — both gated on approval before acting |

A user picked a team at signup and talked to any member in its own thread from the dashboard or a
messaging channel; `provisionFullTeam()` spun up every agent with its distinct persona and workspace in
one shot. Beyond the presets, the platform shipped **user-created custom agents** (`custom_agents` table,
`/api/team/agents`): name it, give it a role and a SOUL, and it joined your team — with a roadmap toward
inter-agent delegation. Templates were the fastest path to value ("a working team in 60 seconds"); custom
agents were the retention play.

*(One honest note: teams were a product/UX construct, not a security boundary — all of a user's agents ran
in that user's single container as the same OS user.)*

### 3.3 Model flexibility

The container entrypoint **dynamically assembled OpenClaw's provider config from whichever keys were
present** — MiniMax, OpenAI, Google Gemini, plus a local Ollama provider for zero-cost heartbeats and
embeddings. I also built a **14-dimension prompt classifier** (`src/lib/router/`) that routed prompts
cheap→premium across six providers (Gemini, OpenAI, Anthropic, DeepSeek, xAI Grok, MiniMax) with a full
cost table — though, honestly, it was **built but never wired in**; containers used a hardcoded default. A
sophisticated router with no path to the user was classic solo-founder over-building.

### 3.4 Multi-channel

Telegram and WhatsApp (via a QR-link flow) were the real, marketed integrations; Slack and Discord were
partially built. "Same assistant everywhere" was true for the two that mattered most.

### 3.5 Container hardening — what shipped, what was designed, what I learned

The part that held up in production was the part Docker itself enforces at the runtime layer — flags
passed to `docker run`. The parts that failed were the parts that only *looked* like enforcement: a config
file with security-shaped keys the runtime never reads, and a commit message that claimed more than its
diff delivered. Here's what we did and what we were attempting to do, without blurring the line between
them.

| Control | Shipped? | Where |
|---|---|---|
| Cap-drop ALL + 4 named cap-adds | yes | `src/lib/provisioner.ts` (`docker run`, ~L263) |
| `no-new-privileges` | yes | same `docker run` |
| Resource limits (`--pids-limit=256`, `--memory=2g --memory-swap=2g`, `--cpus=1`, `--ulimit nofile`) | yes | same `docker run` |
| `--tmpfs /tmp:rw,noexec,nosuid,size=256m` | yes | same `docker run` |
| Non-root container user (`USER 1000`) | yes | `docker/openclaw-user/Dockerfile` |
| API bound to loopback only (`127.0.0.1:${apiPort}:8081`) | yes | `src/lib/provisioner.ts` |
| Isolated Docker network | optional | `--network` only when `DOCKER_NETWORK` env var is set — never enforced |
| Read-only rootfs | no | image is compatible (entrypoint only writes under `/home/user`), flag never added |
| Seccomp / AppArmor profiles | no | recommended in the Feb 8 scan, never implemented |
| Multi-stage minimal image, dedicated `agent` user, `dumb-init` | designed only | `docker/openclaw-user/Dockerfile.secure` — never successfully built |
| App-level policy in config (tool allow/deny, egress allowlist, rate limits, jailbreak guard) | inert | `config-template.secure.json` — keys OpenClaw doesn't read |

The one decision worth explaining to a Docker reader is the cap-drop, because it's also a small case
study in drift. Every container starts with `--cap-drop=ALL`, then adds back exactly four: `CHOWN`,
`SETUID`, `SETGID`, `DAC_OVERRIDE`. That allowlist landed on Feb 12 (commit `3bb99a7`), when the image
still ran as root and those were the only capabilities a root entrypoint had any business holding — no
`NET_ADMIN`, no `SYS_ADMIN`. Eleven days later (`b518baa`) the image moved to `USER 1000`, and the
cap-adds were never revisited. A non-root process without file capabilities gets no effective
capabilities regardless, so today those four lines are dead weight; the honest setting is `--cap-drop=ALL`
with nothing added back. The flags were right for the container they were written against and stale for
the one that shipped.

The more useful lesson didn't come from what shipped — it came from what didn't do anything.
`config-template.secure.json` carries `security`, `rateLimits`, `audit`, and `jailbreak` blocks: tool
allow/deny lists, an egress allowlist, secret redaction, a prompt-injection guard. I checked those keys
against OpenClaw 2026.2.18's actual config schema: none of them exist. OpenClaw doesn't validate unknown
keys, so the whole block loaded silently and enforced nothing — it read like a policy and did zero
policing. Four companion docs in the same directory (`HARDENING-SUMMARY.md`, `README-SECURE.md`,
`VALIDATION-REPORT.md`, `QUICK-REFERENCE.md`) were written the same day and had already drifted from the
Dockerfile they described — a different user name, resource limits that don't appear in the file, a
healthcheck that isn't there. I'm keeping them as history, not as documentation. The same failure mode
shows up one layer up: commit `b518baa`'s message claims `--read-only` and `--ipc=none` were added to the
`docker run`; the diff only touches the Dockerfile and entrypoint — those two flags were never in the
actual command. Enforcement lives where the runtime reads it, and the only way to know it's there is to
grep the schema and diff the commit, not to trust the docs or the message.

The skill worth claiming here isn't "it was airtight" — it's knowing exactly what shipped versus what was
designed versus what only looked like it worked.

---

## 4. The Lessons Learned

### Why it actually failed

The market commoditized my core value overnight. "Managed OpenClaw hosting" became a land rush, and I
entered it with **zero organic search presence** — essentially one page indexed.

- **Incumbents owned distribution.** Hostinger (~$4.99/mo Docker template), DigitalOcean and AWS Lightsail
  (official OpenClaw tutorials), Contabo — all ranking for "openclaw hosting" on domain authority alone.
  *"AWS has unlimited DA. Their tutorial will rank."* The instant they offered one-click OpenClaw
  containers, "OpenClaw without the Docker setup" was **table stakes**, not a product.
- **A specialist owned trust.** xCloud ($24/mo, 10k+ managed servers, **280+ Trustpilot reviews**) won the
  content game with a self-ranking "best OpenClaw hosting" roundup. I had no blog, no reviews, no FAQ, no
  comparison content — **0 reviews vs. 280+**.
- **The floor and the bar were both out of reach.** Competitors anchored $3/mo, offered free trials and
  money-back guarantees, and — critically for my *compliance-sensitive* target persona — carried
  **SOC2/GDPR**. I had no trial, no guarantee, and no certs I could claim.

**The honest one-sentence cause of death:** Clawer was a *feature-and-engineering-led solo product in a
distribution-and-trust-led commodity market*, and managed-container hosting has no moat against players who
already own the SEO, the reviews, the datacenters, and the certifications.

### What I'd do differently

1. **Lead with the wedge, not the category.** My only real differentiator was multi-agent **teams** —
   nobody targeted "openclaw teams." I built it into the code but never into the *positioning*. I'd have
   picked that narrow keyword and owned it with content from day one, instead of competing on "OpenClaw
   hosting" where I could never rank.
2. **Distribution is the product in a commodity market.** I spent months on a 14-dimension model router,
   three monitoring systems, and 361 docs — and near-zero on SEO, reviews, and a launch motion. In a market
   that rewards brand/trust over depth, that ratio is backwards. Two articles a week beat a second control
   plane.
3. **Verify enforcement, not just ship it.** The hardened image was designed but never built successfully,
   and the policy config written for it was a block the runtime would have silently ignored. "Built but not
   deployed" is worth zero, and a policy the runtime never reads is worth less. Grep the schema, don't trust
   the docs.
4. **Cut scope to the moatable core.** A marketing suite, an engagement dashboard, and ~3,500 lines of dead
   code were solo-founder over-building. The disciplined move was to validate distribution *before* building
   the fleet.

The engineering here is real, and I'd stand behind most of the systems in §3. But the most valuable thing I
took from Clawer is the pattern-recognition to catch this earlier next time: **when the moat is
distribution and trust, no amount of engineering wins — and the time to learn that is before you write 96k
lines, not after.**

---

## Repository notes

This is preserved as a portfolio artifact, **not** a maintained or deployable product. Known state
(documented honestly in-repo): incomplete container hardening (§3.5 — do not deploy as-is), a disconnected
model router, ~10/20 DB tables unused, ~3,500 lines of dead code, and several partially-built channels.
Deeper docs: [`ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
[`COMPETITOR-ANALYSIS.md`](COMPETITOR-ANALYSIS.md), [`docs/POSITIONING.md`](docs/POSITIONING.md).

MIT © 2026 Keith Lindsay
