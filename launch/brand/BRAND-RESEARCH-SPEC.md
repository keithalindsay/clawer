# Brand Foundation Builder — Product Specification
*Feature Spec for Marketing HQ*
*Created: 2026-02-23*

---

## Overview

The Brand Foundation Builder is a guided, AI-powered feature within Marketing HQ that takes a product URL, social accounts, and competitor context — and produces a complete brand bible: voice guide, positioning, brand story, messaging framework, battlecards, and content guidelines. It replicates the process that produced Clawer.ai's 6 brand documents, turning a multi-hour agent workflow into a self-serve wizard with human review checkpoints.

**Goal:** Any user can go from "I have a product" to "I have a brand bible my team can execute from" in under 2 hours, with ~30 minutes of active human input and ~90 minutes of AI research + synthesis.

---

## 1. Research Methodology

The agent follows a strict 5-phase research pipeline before synthesis begins. Each phase produces structured intermediate data that feeds the next.

### Phase 1: Product Discovery (Own Site Analysis)
**Data Sources:** Product URL, landing page, pricing page, docs/FAQ, about page
**Steps:**
1. Fetch and parse the primary product URL
2. Spider up to 20 linked pages (pricing, features, about, docs, blog)
3. Extract: value propositions, pricing tiers, feature list, target audience signals, existing taglines/copy, tech stack mentions, integration list
4. Screenshot hero section, pricing table, and key feature sections
5. Identify existing brand voice from copy patterns (formal/casual, technical/accessible, hype level)

**Output:** `product_profile.json` — structured product facts, existing messaging inventory, voice baseline

### Phase 2: Founder & Brand Social Analysis
**Data Sources:** Founder's X/Twitter, brand X/Twitter, LinkedIn (if provided), YouTube, newsletter archives
**Steps:**
1. Fetch last 100 tweets from founder account — analyze tone, topics, engagement patterns, personality markers
2. Fetch last 100 tweets from brand account — analyze content mix, voice consistency, top-performing posts
3. Identify founder's authentic voice patterns: humor style, opinion strength, vulnerability level, jargon comfort
4. Catalog recurring themes and phrases across both accounts
5. Note engagement ratios (which content types get replies vs likes vs retweets)
6. Extract any existing community/audience interactions (what questions do followers ask?)

**Output:** `social_profile.json` — voice attributes, topic affinity map, engagement patterns, personality profile, top-performing content samples

### Phase 3: Competitor Analysis
**Data Sources:** Direct competitor websites, competitor social accounts, product review sites, comparison articles
**Steps:**
1. Auto-detect competitors from: product category, SEO overlap, "alternatives to X" searches, social mentions
2. For each competitor (3-5), fetch: landing page, pricing, key messaging, social presence
3. Map positioning: what category does each claim? What adjectives? What audience?
4. Identify positioning gaps — claims no competitor makes, audiences nobody targets
5. Catalog competitor weaknesses from user complaints (Reddit, X, G2/Capterra reviews)
6. Note competitor pricing models and differentiators

**Output:** `competitive_landscape.json` — competitor profiles, positioning map, gap analysis, weakness catalog

### Phase 4: Audience Research (Social Listening)
**Data Sources:** X/Twitter search, Reddit, Hacker News, Product Hunt, niche forums, G2/Capterra
**Steps:**
1. Search for product category + pain point keywords across platforms
2. Identify 3-5 audience segments from conversation patterns
3. For each segment, extract: demographics signals, pain points (verbatim quotes), goals, current solutions, switching triggers
4. Find the emotional language people use about the problem (frustration, aspiration, fear)
5. Identify the "jobs to be done" — what outcome do people actually want?
6. Catalog objections and skepticism patterns ("I tried X but...")

**Output:** `audience_research.json` — persona drafts, pain point inventory with verbatim quotes, JTBD map, objection catalog

### Phase 5: Content & Channel Analysis
**Data Sources:** Existing blog, YouTube, newsletter, social analytics (if connected)
**Steps:**
1. Analyze existing content (blog posts, videos, newsletters) for topic coverage and voice consistency
2. Identify top-performing content by engagement signals
3. Map content gaps vs competitor content
4. Assess channel presence (which platforms active, which missing)
5. Note content cadence and consistency patterns

**Output:** `content_audit.json` — content inventory, performance signals, gap analysis, channel assessment

---

## 2. Analysis Framework

Each output document has a defined synthesis process that transforms raw research into structured brand guidance.

### Brand Voice Guide
**Input data:** `social_profile.json` (founder voice patterns), `product_profile.json` (existing copy tone), `audience_research.json` (audience language level)
**Analysis questions:**
- What tone attributes appear naturally in founder's communication? (Map to 4-6 named attributes with do/don't examples)
- What vocabulary does the audience use vs what vocabulary does the product use? (Align toward audience)
- Where does the founder's voice differ from the brand's voice? (Define both as separate registers)
- What are the "banned phrases" in the industry? (Overused, empty, or hyperbolic terms)
- What platform-specific adaptations are needed? (Twitter brevity vs blog depth vs docs precision)
**Pattern matching:** Cluster tweet language into tone buckets. Score existing copy on formality (1-10), jargon density, hype level, specificity. Use these scores to set target ranges.

### Positioning Document
**Input data:** `product_profile.json`, `competitive_landscape.json`, `audience_research.json`
**Analysis questions:**
- What category does the product create or occupy? (If no category exists, name one)
- What is the 1-sentence positioning statement? (For [audience] who [need], [product] is a [category] that [key benefit], unlike [alternatives], because [reason to believe])
- What are the 3-5 value propositions, ranked by audience priority?
- Who are the 3-4 target personas? (Synthesized from audience segments, named with alliterative archetypes)
- What proof points support each claim? (Numbers, third-party validation, technical specifics)
**Pattern matching:** Overlay competitor positioning on a 2x2 matrix (e.g., technical↔accessible × DIY↔managed). Find the open quadrant. Validate it against audience pain points.

### Brand Story
**Input data:** `product_profile.json`, `social_profile.json` (founder narrative), `audience_research.json` (problem validation)
**Analysis questions:**
- What is the origin trigger? (What specific moment or frustration caused the product to exist?)
- What is the villain? (Not a competitor — a *situation*. Complexity, gatekeeping, broken defaults, etc.)
- What is the mission statement in ≤20 words?
- What are the 4-6 core beliefs/principles?
- What is the "setup wall" — the specific friction the product eliminates?
**Pattern matching:** Extract origin story signals from founder tweets (personal frustrations, "I built this because..." moments). Cross-reference with audience pain points to ensure the story resonates beyond the founder's experience.

### Messaging Framework
**Input data:** All previous outputs + `competitive_landscape.json` for differentiation
**Analysis questions:**
- What are the 5/30/60-second elevator pitches? (Increasing detail, same core)
- What are 8-10 tagline candidates? (Rank by specificity, memorability, and differentiation)
- What is the primary message for each persona? (Pain point → solution → CTA)
- What are the 4-5 content pillars? (Thematic buckets all content maps to)
- What proof points and social proof exist? (Numbers, testimonials, third-party validation)
**Pattern matching:** Test tagline candidates against: does it work without the product name? Is it specific to this product or generic? Does it contain a verb? Does it promise an outcome? Score and rank.

### Battlecards
**Input data:** `competitive_landscape.json`, `product_profile.json`, `audience_research.json` (objections)
**Analysis questions:**
- For each competitor category: what do they pitch, what's actually weak, what's our counter?
- What are the top 3 objections per competitor and what's the response?
- What proof points neutralize each objection?
- What's the "honest acknowledgment" — where is the competitor genuinely better, and why does it not matter for our audience?
**Pattern matching:** Map each competitor weakness to a specific user pain point. Only include weaknesses that matter to the target personas (ignore technical weaknesses that non-technical users wouldn't encounter).

### Content Guidelines
**Input data:** `content_audit.json`, `social_profile.json`, Brand Voice Guide (synthesized), `competitive_landscape.json` (SEO gaps)
**Analysis questions:**
- What is the blog post structure template?
- What are the CTA patterns by content type?
- What are the platform-specific posting rules? (Cadence, format, tone adjustment)
- What are the SEO target keywords? (Primary, long-tail, organized by content pillar)
- What are the ethical/legal/competitive boundaries? (What NOT to say)
**Pattern matching:** Cross-reference competitor content topics with audience questions. Gaps = content opportunities. High-engagement competitor content = proven demand for that topic.

---

## 3. Decision Points

Human review is required at these checkpoints. The wizard blocks forward progress until the user acts.

| Checkpoint | Location | What User Reviews | Actions Available |
|---|---|---|---|
| **Product Profile Validation** | After Phase 1 | Extracted features, value props, pricing, audience | Confirm, edit, add missing info |
| **Persona Validation** | After Phase 4 | 3-4 draft personas with names, descriptions, pain points | Approve, merge, delete, rename, edit quotes |
| **Competitor List Approval** | After Phase 3 | Auto-detected + user-added competitors with positioning summary | Add, remove, re-prioritize |
| **Tone Attribute Selection** | During Voice Guide synthesis | 6-8 candidate tone attributes with examples | Select 4-6, adjust intensity slider, edit examples |
| **Tagline Selection** | During Messaging synthesis | 8-10 ranked tagline candidates | Pick primary + secondary, request more, edit |
| **Battlecard Accuracy Review** | During Battlecard synthesis | Competitor claims, weaknesses, counters | Flag inaccurate claims, soften/strengthen language, add proof points |
| **Final Brand Bible Approval** | After all docs generated | Complete 6-document brand bible | Approve, request revisions per document, export |

### Review UI Pattern
Each decision point uses a **card-based review interface**:
- Left panel: AI-generated content with inline confidence indicators (high/medium/low based on source quality)
- Right panel: source citations — the actual tweets, pages, or data that informed each claim
- Inline editing: click any text to edit in place
- Accept/reject per section (not just per document)
- "Regenerate this section" button with optional guidance prompt

---

## 4. Input/Output Specification

### Required Inputs
| Input | Type | Example | Required? |
|---|---|---|---|
| Product URL | URL | `https://clawer.ai` | **Yes** |
| Product name | String | "Clawer.ai" | **Yes** |
| One-line description | String (≤140 chars) | "Managed AI agent hosting for OpenClaw" | **Yes** |
| Industry / category | Enum + freetext | "SaaS > AI/ML > Hosting" | **Yes** |

### Optional Inputs (improve quality significantly)
| Input | Type | Example |
|---|---|---|
| Founder X/Twitter handle | @handle | `@Vavier` |
| Brand X/Twitter handle | @handle | `@teamclawer` |
| Competitor URLs | URL[] (up to 5) | `["competitor1.com", "competitor2.com"]` |
| Existing brand guidelines | File upload (PDF/MD) | Previous brand doc |
| Target audience description | Freetext | "Non-technical solopreneurs who want AI automation" |
| Pricing info | Structured or freetext | "$49/month, free tier with 100 messages" |
| LinkedIn company page | URL | `linkedin.com/company/clawer` |

### Outputs (The Brand Bible)
| Document | Format | ~Word Count | Description |
|---|---|---|---|
| **Brand Voice Guide** | Markdown | 1,500-2,500 | Tone attributes, do/don't examples, vocabulary guide, platform-specific voice, banned phrases |
| **Positioning Document** | Markdown | 1,500-2,000 | Positioning statement, category definition, persona profiles, value propositions with proof points |
| **Brand Story** | Markdown | 1,000-1,500 | Origin story, mission, vision, core beliefs, problem narrative |
| **Messaging Framework** | Markdown | 1,500-2,000 | Elevator pitches (5/30/60s), taglines, per-persona messages, content pillars, proof points |
| **Battlecards** | Markdown | 1,500-2,500 | Per-competitor: their pitch, their weakness, our counter, objection handling |
| **Content Guidelines** | Markdown | 1,500-2,000 | Blog template, social formats, SEO keywords, posting rules, ethical boundaries |

### Export Formats
- **Markdown bundle** (.zip of 6 .md files) — default
- **PDF brand book** (formatted, branded cover page)
- **Notion import** (structured pages with database properties)
- **JSON** (machine-readable for downstream tool consumption)

---

## 5. UI Flow

### Step 1: Product Discovery
**Screen: "Tell us about your product"**

```
┌─────────────────────────────────────────────────┐
│  Brand Foundation Builder                        │
│  ─────────────────────────────────────────────── │
│                                                  │
│  Product URL:  [https://___________________]     │
│  Product Name: [_____________________________]   │
│  One-liner:    [_____________________________]   │
│  Industry:     [SaaS ▾] > [AI/ML ▾] > [____]   │
│                                                  │
│  ── Social Accounts (optional) ──────────────── │
│  Founder Twitter: [@______________]              │
│  Brand Twitter:   [@______________]              │
│  LinkedIn:        [URL_____________]             │
│                                                  │
│  ── Additional Context ──────────────────────── │
│  Target audience: [freetext________________]     │
│  Upload existing brand docs: [📎 Drop files]    │
│                                                  │
│              [Start Research →]                   │
└─────────────────────────────────────────────────┘
```

**On submit:** Agent begins Phase 1 (product crawl). Progress bar shows pages fetched. Takes 30-60 seconds.

**Transition screen:** Shows extracted product profile as editable cards:
- Value propositions (editable list)
- Pricing summary (editable)
- Feature inventory (editable tags)
- Detected audience signals (editable)
- Existing voice assessment (slider: formal↔casual, technical↔accessible)

User confirms or edits, then proceeds.

### Step 2: Competitor Analysis
**Screen: "Who are you up against?"**

```
┌─────────────────────────────────────────────────┐
│  Competitors                                     │
│  ─────────────────────────────────────────────── │
│                                                  │
│  🔍 Auto-detected (from SEO + category):        │
│  ┌──────────────────────────────────────────┐   │
│  │ ☑ Self-hosting OpenClaw  [View analysis] │   │
│  │ ☑ ChatGPT / Claude Pro  [View analysis]  │   │
│  │ ☑ CompetitorHost.io     [View analysis]   │   │
│  │ ☐ IrrelevantCo.com     [View analysis]   │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  + Add competitor: [URL or name____________]     │
│                                                  │
│  ── Positioning Map Preview ─────────────────── │
│  [2x2 matrix visualization showing you vs        │
│   competitors on two auto-detected axes]         │
│                                                  │
│  Axes: [Technical ↔ Accessible ▾]               │
│        [DIY ↔ Managed ▾]                        │
│                                                  │
│        [Confirm Competitors →]                   │
└─────────────────────────────────────────────────┘
```

**On submit:** Agent runs Phase 3 (deep competitor analysis) for selected competitors. 2-4 minutes.

### Step 3: Audience Research
**Screen: "Here's who's talking about this problem"**

```
┌─────────────────────────────────────────────────┐
│  Audience Insights                               │
│  ─────────────────────────────────────────────── │
│                                                  │
│  We found 4 audience segments:                   │
│                                                  │
│  ┌─ Persona Card ───────────────────────────┐   │
│  │ 👤 "Solo Sarah" — The Solopreneur         │   │
│  │ Pain: "I spent 3 hours on Docker and      │   │
│  │       gave up" — @user, Reddit            │   │
│  │ Goal: AI team without technical setup      │   │
│  │ Current solution: ChatGPT + manual work   │   │
│  │ [✏️ Edit] [🔀 Merge] [🗑️ Remove]          │   │
│  └──────────────────────────────────────────┘   │
│  ┌─ Persona Card ───────────────────────────┐   │
│  │ 👤 "Mike the Manager" — Small Biz Ops     │   │
│  │ ...                                       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ── Pain Point Cloud ────────────────────────── │
│  [Visual word cloud of most-mentioned pain       │
│   points, sized by frequency, colored by         │
│   sentiment intensity]                           │
│                                                  │
│        [Approve Personas →]                      │
└─────────────────────────────────────────────────┘
```

### Step 4: AI Generates Draft Brand Docs
**Screen: "Building your brand bible"**

```
┌─────────────────────────────────────────────────┐
│  Generating Brand Foundation                     │
│  ─────────────────────────────────────────────── │
│                                                  │
│  ✅ Brand Voice Guide          [Preview]        │
│  ✅ Positioning                [Preview]         │
│  🔄 Brand Story...             ████████░░ 80%   │
│  ⏳ Messaging Framework        queued            │
│  ⏳ Battlecards                queued             │
│  ⏳ Content Guidelines         queued             │
│                                                  │
│  Estimated time remaining: ~4 minutes            │
│                                                  │
│  ── Live Preview ────────────────────────────── │
│  [Scrollable preview of most recently            │
│   completed document, streaming in]              │
│                                                  │
└─────────────────────────────────────────────────┘
```

Generation takes 5-8 minutes total. Documents generate sequentially (each builds on previous). User can preview completed docs while others generate.

### Step 5: Human Review & Edit
**Screen: "Review your brand bible"**

```
┌─────────────────────────────────────────────────┐
│  Brand Bible Review                              │
│  ─────────────────────────────────────────────── │
│                                                  │
│  [Voice] [Positioning] [Story] [Messaging]       │
│  [Battlecards] [Content Guidelines]              │
│  ─────────────────────────────────────────────── │
│                                                  │
│  ┌─ Editor (left 65%) ──┬─ Sources (right 35%) ─┐
│  │                       │                       │
│  │ ## Tone Attributes    │ 📌 Based on:         │
│  │                       │ • @Vavier tweets     │
│  │ ### 1. Straight-      │   (23 matched this   │
│  │ Talking               │    pattern)          │
│  │ Say it plainly. No    │ • Landing page copy  │
│  │ jargon walls...       │   (3 sections)       │
│  │                       │                       │
│  │ [✏️ click to edit]    │ [View sources ↓]     │
│  │                       │                       │
│  │ 💡 AI Suggestion:     │                       │
│  │ "Consider adding a    │                       │
│  │  'Playful' attribute  │                       │
│  │  — founder tweets     │                       │
│  │  show humor 34% of    │                       │
│  │  the time"            │                       │
│  │  [Apply] [Dismiss]    │                       │
│  │                       │                       │
│  └───────────────────────┴───────────────────────┘
│                                                  │
│  Section status: 12/18 approved  4 edited  2 new │
│                                                  │
│  [← Previous Doc]  [Approve Doc ✓]  [Next Doc →] │
└─────────────────────────────────────────────────┘
```

**Key interactions:**
- Click any text block to edit inline (markdown editor)
- Each section has accept/reject toggle
- AI suggestions appear as dismissable callouts with "Apply" button
- Source panel shows the data that informed each section
- "Regenerate section" button with optional prompt: "Make this more aggressive" / "Tone down the humor"
- Section-level confidence badges (green/yellow/red) based on source data quality
- Diff view available for edited sections

### Step 6: Approve & Publish
**Screen: "Your brand bible is ready"**

```
┌─────────────────────────────────────────────────┐
│  Brand Foundation Complete 🎉                    │
│  ─────────────────────────────────────────────── │
│                                                  │
│  ✅ Brand Voice Guide         1,847 words        │
│  ✅ Positioning               1,623 words         │
│  ✅ Brand Story               1,204 words         │
│  ✅ Messaging Framework       1,891 words         │
│  ✅ Battlecards               2,156 words          │
│  ✅ Content Guidelines        1,734 words         │
│                                                  │
│  ── Export ──────────────────────────────────── │
│  [📦 Download .zip]  [📄 Export PDF]             │
│  [📋 Send to Notion] [🔗 Share link]            │
│                                                  │
│  ── Activate ────────────────────────────────── │
│  ☑ Use as default brand voice for content gen    │
│  ☑ Load personas into campaign targeting         │
│  ☑ Attach battlecards to sales workflows         │
│  ☑ Apply content guidelines to tweet composer    │
│                                                  │
│        [Publish Brand Bible →]                   │
└─────────────────────────────────────────────────┘
```

**On publish:** Brand bible becomes the active brand context for all downstream features (tweet drafting, content generation, campaign messaging). Documents are versioned — user can regenerate or update individual docs later as the product evolves.

---

## 6. Agent Architecture

### Agent Topology

```
┌──────────────────────────────────────────────────────┐
│                  Orchestrator Agent                    │
│  Manages wizard state, chains phases, handles retries │
└──────────┬──────────┬──────────┬──────────┬──────────┘
           │          │          │          │
     ┌─────▼────┐ ┌───▼────┐ ┌──▼───┐ ┌───▼────────┐
     │ Product   │ │ Social │ │Comp. │ │ Audience    │
     │ Crawler   │ │Analyst │ │Intel │ │ Researcher  │
     └─────┬─────┘ └───┬────┘ └──┬───┘ └───┬────────┘
           │          │          │          │
           └──────────┴──────┬───┴──────────┘
                             │
                    ┌────────▼────────┐
                    │  Synthesis Agent │
                    │  (6 sequential  │
                    │   doc generators)│
                    └─────────────────┘
```

### Agent Specifications

#### Orchestrator Agent
- **Role:** Manages wizard state machine, dispatches research agents, collects results, triggers synthesis
- **Tools:** Internal state management, user prompt relay, progress broadcasting
- **Token cost:** ~2K tokens/phase (lightweight coordination)
- **Total:** ~12K tokens

#### Product Crawler Agent
- **Role:** Fetches and analyzes the product website
- **Tools:** `web_fetch`, `web_search`, screenshot capture
- **Concurrency:** Fetches up to 5 pages in parallel
- **Token cost:** ~8K input (page content) + ~3K output (structured extraction)
- **Total:** ~11K tokens
- **Wall time:** 30-60 seconds

#### Social Analyst Agent
- **Role:** Analyzes founder and brand social accounts
- **Tools:** Twitter/X API (or scraper), `web_fetch` for profile pages
- **Token cost:** ~15K input (200 tweets × ~75 tokens each) + ~4K output (voice analysis)
- **Total:** ~19K tokens
- **Wall time:** 45-90 seconds

#### Competitive Intelligence Agent
- **Role:** Researches and profiles competitors
- **Tools:** `web_fetch`, `web_search`, review site scrapers
- **Concurrency:** Analyzes 3-5 competitors in parallel (sub-agents per competitor)
- **Token cost:** ~20K input (5 competitor sites × ~4K each) + ~5K output
- **Total:** ~25K tokens
- **Wall time:** 2-4 minutes

#### Audience Research Agent
- **Role:** Social listening across platforms for pain points and persona signals
- **Tools:** `web_search`, `web_fetch` (Reddit, HN, forums), Twitter search
- **Token cost:** ~15K input (forum threads, tweets) + ~5K output (persona drafts)
- **Total:** ~20K tokens
- **Wall time:** 2-3 minutes

#### Synthesis Agent
- **Role:** Generates all 6 brand documents sequentially
- **Tools:** None (pure LLM synthesis from structured research data)
- **Input:** All research outputs (~15K tokens of structured JSON)
- **Output:** 6 documents (~10K tokens total)
- **Sequencing:** Voice → Positioning → Story → Messaging → Battlecards → Content Guidelines (each builds on previous)
- **Token cost per document:** ~15K input (research + prior docs) + ~2K output = ~17K per doc
- **Total:** ~100K tokens (6 docs, growing context)
- **Wall time:** 5-8 minutes

### Total Cost Estimate

| Phase | Input Tokens | Output Tokens | Est. Cost (Claude Sonnet) |
|---|---|---|---|
| Product Crawl | 8K | 3K | $0.04 |
| Social Analysis | 15K | 4K | $0.07 |
| Competitor Intel | 20K | 5K | $0.10 |
| Audience Research | 15K | 5K | $0.08 |
| Synthesis (6 docs) | 90K | 12K | $0.45 |
| Orchestration | 10K | 2K | $0.04 |
| **Total** | **~158K** | **~31K** | **~$0.78** |

*Costs based on Claude 3.5 Sonnet pricing ($3/M input, $15/M output). Using Opus would ~5x the cost. Haiku would ~0.2x.*

**Recommendation:** Use Sonnet for research phases, Sonnet for synthesis. The quality/cost tradeoff is optimal. Offer Opus as a premium option for users who want higher-quality creative output.

---

## 7. Data Model

### Entity Relationship

```
Brand Project (1)
├── Research Data (1:1)
│   ├── product_profile     (JSON)
│   ├── social_profile      (JSON)
│   ├── competitive_landscape (JSON)
│   ├── audience_research   (JSON)
│   └── content_audit       (JSON)
├── Brand Documents (1:many)
│   ├── voice_guide         (Markdown, versioned)
│   ├── positioning         (Markdown, versioned)
│   ├── brand_story         (Markdown, versioned)
│   ├── messaging_framework (Markdown, versioned)
│   ├── battlecards         (Markdown, versioned)
│   └── content_guidelines  (Markdown, versioned)
├── Decision Log (1:many)
│   └── checkpoint decisions with timestamps + diffs
└── Active Brand Config (1:1)
    ├── selected_voice_attributes[]
    ├── primary_tagline
    ├── active_personas[]
    └── content_pillar_config[]
```

### Core Tables

```sql
-- Brand project container
brand_projects (
  id              UUID PRIMARY KEY,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id),
  name            VARCHAR(255),
  product_url     VARCHAR(2048),
  product_name    VARCHAR(255),
  industry        VARCHAR(255),
  status          ENUM('input', 'researching', 'review', 'published', 'archived'),
  created_at      TIMESTAMP,
  published_at    TIMESTAMP
)

-- Research phase outputs (raw data)
brand_research (
  id              UUID PRIMARY KEY,
  project_id      UUID REFERENCES brand_projects(id),
  phase           ENUM('product', 'social', 'competitor', 'audience', 'content'),
  data            JSONB,
  sources         JSONB,        -- URLs, timestamps, confidence scores
  agent_run_id    VARCHAR(255), -- link to agent execution log
  created_at      TIMESTAMP
)

-- Generated brand documents (versioned)
brand_documents (
  id              UUID PRIMARY KEY,
  project_id      UUID REFERENCES brand_projects(id),
  doc_type        ENUM('voice', 'positioning', 'story', 'messaging', 'battlecards', 'content_guidelines'),
  version         INTEGER DEFAULT 1,
  content_md      TEXT,
  content_json    JSONB,        -- structured version for programmatic access
  status          ENUM('draft', 'reviewing', 'approved'),
  approved_at     TIMESTAMP,
  created_at      TIMESTAMP
)

-- Human decision audit trail
brand_decisions (
  id              UUID PRIMARY KEY,
  project_id      UUID REFERENCES brand_projects(id),
  checkpoint      VARCHAR(100),
  section         VARCHAR(255),
  action          ENUM('approved', 'edited', 'rejected', 'regenerated'),
  original_text   TEXT,
  final_text      TEXT,
  user_id         UUID,
  created_at      TIMESTAMP
)

-- Active brand configuration (links to downstream features)
brand_config (
  id              UUID PRIMARY KEY,
  workspace_id    UUID UNIQUE REFERENCES workspaces(id),
  project_id      UUID REFERENCES brand_projects(id),
  voice_attributes JSONB,      -- selected tone attributes + intensity
  primary_tagline VARCHAR(255),
  personas        JSONB,       -- active persona configs
  content_pillars JSONB,       -- pillar definitions + keywords
  vocabulary      JSONB,       -- use/avoid word lists
  active          BOOLEAN DEFAULT true,
  updated_at      TIMESTAMP
)
```

### Downstream Integrations

The `brand_config` record becomes the system prompt context for all content-generating features:

| Feature | How Brand Docs Are Used |
|---|---|
| **Tweet Composer** | Voice guide → tone enforcement; vocabulary → word filtering; content pillars → topic suggestions |
| **Content Calendar** | Content guidelines → format templates; content pillars → theme scheduling; SEO keywords → topic generation |
| **Campaign Builder** | Messaging framework → per-persona copy; positioning → value prop selection; taglines → headline generation |
| **Competitor Monitor** | Battlecards → alert triggers when competitors change messaging; positioning map → drift detection |
| **Analytics Dashboard** | Content pillars → performance by pillar; personas → engagement by segment |
| **Team Onboarding** | Brand story → new hire brand context; voice guide → writing standards |

### Versioning & Refresh

- Brand documents are immutable per version. Edits create version N+1.
- Users can trigger a "brand refresh" — re-runs research phases with new data, generates updated docs, presents diff against current version.
- Recommended refresh cadence: quarterly, or after major product/market changes.
- Research data has a `stale_after` TTL (default 90 days). Dashboard shows staleness indicators.

---

## 8. Technical Requirements

### Performance Targets
- Phase 1-4 research: complete within 5 minutes
- Phase 5 synthesis: complete within 8 minutes
- Total end-to-end (including human review): target < 2 hours
- Document regeneration (single doc): < 90 seconds

### Error Handling
- Social account not found → skip gracefully, note reduced quality, suggest manual input
- Website unreachable → retry 3x with backoff, then prompt user for manual product description
- Rate limited on research APIs → queue and resume, extend time estimate
- Synthesis quality below threshold → auto-retry with temperature adjustment before presenting to user

### Security
- Research data never leaves the workspace
- Social account credentials (if OAuth connected) stored encrypted, scoped to read-only
- Export PDFs generated server-side, not sent to third parties
- Brand documents can be marked "confidential" (excludes from shared workspace views)

---

## Appendix: Implementation Priority

### MVP (v1)
- Steps 1, 4, 5, 6 of the wizard (skip competitor auto-detection and social listening — user provides context manually)
- Generate 3 core docs: Voice Guide, Positioning, Messaging Framework
- Basic markdown editor for review
- Export as .zip

### v1.1
- Add social account analysis (Phase 2)
- Add Brand Story and Content Guidelines generation
- Source citations panel

### v1.2
- Competitor auto-detection and analysis (Phase 3)
- Battlecards generation
- Positioning map visualization

### v2
- Social listening / audience research (Phase 4)
- Full inline editing with AI suggestions
- Notion/PDF export
- Downstream integration with tweet composer and content calendar
- Brand refresh / versioning
