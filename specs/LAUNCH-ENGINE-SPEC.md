# Launch Engine — Product Specification
*Marketing HQ for Clawer.ai*
*Created: 2026-02-23*
*Status: DRAFT*

---

## 1. Product Overview

### Vision

Launch Engine is the productized version of the content factory pattern we've been running manually: AI generates content → AI reviews AI → human curates → pipeline distributes. It turns AI orchestration into a marketing machine — used internally for Clawer.ai's own growth AND offered as a first-class feature to Clawer customers.

The core insight: the 5-agent parallel generation, nightly autonomous content, agent-research-to-human-curation pipeline — these patterns work. They produced 11 blog posts in a week, a complete brand bible in one session, and a content research methodology that surfaces viral angles from live social data. Launch Engine wraps all of that in a dashboard.

### Target Users

**Internal (Clawer.ai marketing):**
- Keith as founder/marketer — approves content, sets strategy, reviews analytics
- AI agents as content producers — generate drafts, research topics, review quality

**External (Clawer customers):**
- **Solo Sarah** — solopreneur who needs consistent content but has no marketing team
- **Creator Chris** — content creator who wants AI to handle research, drafts, and distribution
- **Mike the Manager** — small biz ops who needs campaign coordination across channels

### Value Proposition

"Your AI marketing team. Generate, review, approve, and distribute content across every channel — from one dashboard. Wake up to a queue of brand-consistent drafts. Approve the good ones. Launch Engine handles the rest."

### What Makes This Different

1. **AI reviews AI before you see it.** The Quality Gate scores every piece of content against your brand bible. You only see what passed.
2. **Brand bible is the source of truth.** Every generated tweet, blog post, and campaign asset is grounded in your actual voice, positioning, and guidelines — not generic AI slop.
3. **Content Factory templates.** Not just social media — books, newsletters, product launches, SEO articles. The same orchestration pattern applied to any content type.
4. **Analytics close the loop.** Engagement data feeds back into generation. The system learns what works for YOUR audience.

---

## 2. Module Breakdown

### Module 1: Brand Foundation Builder

**Status:** Already spec'd → see `BRAND-RESEARCH-SPEC.md`

**Summary:** Guided wizard that takes a product URL, social accounts, and competitor context and produces a 6-document brand bible (voice guide, positioning, brand story, messaging framework, battlecards, content guidelines). 5-phase research pipeline with human review checkpoints. ~$0.78 per generation at Sonnet pricing.

**Role in Launch Engine:** The brand bible produced here becomes the system prompt context for every other module. All content generation, quality scoring, and campaign messaging references the active `brand_config` record.

**Key outputs consumed by other modules:**
- `voice_attributes` → Tweet Queue tone enforcement, Blog Pipeline voice consistency
- `content_pillars` → Content Calendar theme scheduling, Campaign Manager brief templates
- `personas` → Campaign Manager targeting, Analytics Loop segmentation
- `vocabulary` (use/avoid lists) → Quality Gate word filtering
- `battlecards` → Quality Gate competitor mention checking

---

### Module 2: Content Pipeline

#### 2.1 Tweet Queue

**What it does:** AI agents continuously draft tweets in both founder voice and brand voice, sourced from the brand bible. User sees a scrollable queue, can edit inline, approve, schedule, or kill.

**Features:**
- Dual-voice drafts: founder (@Vavier style — first person, self-deprecating, opinionated) and brand (@teamclawer style — helpful, direct, third person)
- Draft source tags: `trending-topic`, `blog-promotion`, `build-in-public`, `competitor-reaction`, `community-engagement`, `content-pillar`
- Inline markdown editor with character count (280 limit, thread detection at 3+ tweets)
- Bulk actions: approve all, schedule batch, kill stale (>48h old)
- Draft generation rate: configurable (default: 10 drafts/day across both voices)
- Content pillar balance indicator: shows if queue is skewed toward one pillar

**User Stories:**
- As a founder, I open the tweet queue and see 10 new drafts ranked by engagement potential. I approve 3, edit 1, kill 6, and schedule them across the next 24 hours.
- As a marketer, I see that the queue is heavy on security content and light on use-case stories. I click "Generate more" with the "Use Cases & Inspiration" pillar selected.
- As a user, I click a draft tagged "trending-topic" and see the source tweet/thread that inspired it, so I can judge relevance.

**Wireframe:**
```
┌────────────────────────────────────────────────────────┐
│ Tweet Queue                        [Generate More ▾]   │
│ ───────────────────────────────────────────────────── │
│ Voice: [All ▾]  Source: [All ▾]  Pillar: [All ▾]     │
│                                                        │
│ ┌─ Draft ──────────────────────────────── Score: 8.2 ─┐
│ │ 🎭 @Vavier · trending-topic · 🔐 Security          │
│ │                                                      │
│ │ "Spent the morning reading CVE reports so you don't │
│ │  have to. Short version: if your OpenClaw is on     │
│ │  port 18789 with no auth, you're already owned."    │
│ │                                                      │
│ │ 📊 Source: @zacodil thread on CVE-2026-25253        │
│ │ [✏️ Edit] [✅ Approve] [📅 Schedule] [🗑️ Kill]      │
│ └──────────────────────────────────────────────────────┘
│ ┌─ Draft ──────────────────────────────── Score: 7.8 ─┐
│ │ 🏢 @teamclawer · blog-promotion · ⚡ Ease & Speed   │
│ │ ...                                                  │
│ └──────────────────────────────────────────────────────┘
│                                                        │
│ Queue: 14 drafts · 3 approved · 2 scheduled today     │
│ Pillar balance: 🔐 40% ⚡ 25% 🤖 15% 💡 15% 📚 5%   │
└────────────────────────────────────────────────────────┘
```

#### 2.2 Blog Pipeline

**What it does:** The nightly blog agent workflow, but with a UI. Content queue with AI-generated drafts, editorial review, SEO optimization, and publish workflow.

**Features:**
- Blog queue sourced from `content-queue.md` equivalent (managed in-app)
- AI generates full draft from brief (title, target keywords, angle, word count)
- SEO panel: keyword density, internal link suggestions, meta description generator
- Editorial review mode: AI reviewer scores draft on voice compliance, factual accuracy, SEO quality
- Publish workflow: Draft → Review → Approved → Scheduled → Published
- Blog template enforcement from Content Guidelines (hook opener, problem section, solution, Clawer angle, CTA)

**User Stories:**
- As a marketer, I add a blog brief ("CVE-2026-25253 explainer, target 3K words, security pillar"). The system generates a draft overnight. I review it in the morning with AI review scores visible.
- As a founder, I see the blog pipeline shows 3 drafts ready for review, 2 scheduled for this week, and 8 queued briefs. I approve one draft with minor edits and it's scheduled for tomorrow at 9am CT.

**Wireframe:**
```
┌────────────────────────────────────────────────────────┐
│ Blog Pipeline                       [+ New Brief]      │
│ ───────────────────────────────────────────────────── │
│                                                        │
│ ┌─ Kanban ─────────────────────────────────────────── │
│ │ Queued (8)  │ Drafting (1) │ Review (3) │ Sched (2)│
│ │             │              │            │          │
│ │ [CVE post]  │ [WhatsApp    │ [Multi-    │ [DIY vs  │
│ │ [ClawHub    │  guide]      │  agent     │  hosted] │
│ │  audit]     │              │  ELI5]     │ [Content │
│ │ [Business   │              │ [Security  │  engine] │
│ │  $140/mo]   │              │  checklist]│          │
│ │ ...         │              │ [Config    │          │
│ │             │              │  files]    │          │
│ └─────────────┴──────────────┴────────────┴──────────┘
│                                                        │
│ Click any card for detail + editor                     │
└────────────────────────────────────────────────────────┘
```

#### 2.3 Thread Builder

**What it does:** Generates tweet threads from blog posts, topics, or campaign briefs. Handles the blog-to-thread decomposition that humans do manually.

**Features:**
- One-click "Convert to thread" from any published blog post
- AI decomposes blog into 5-10 tweet thread following thread template (hook → context → substance → turn → CTA)
- Drag-to-reorder tweets within thread
- Per-tweet character count and media attachment slots
- Schedule thread as atomic unit (all tweets post in sequence with configurable delay)

**User Stories:**
- As a marketer, I click "Thread" on a published blog post about ClawHub malware. The system generates a 7-tweet thread. I swap tweets 3 and 4, edit the hook, and schedule it for tomorrow at 2pm.

#### 2.4 Content Calendar

**What it does:** Visual calendar showing all scheduled content across all channels and content types.

**Features:**
- Month/week/day views
- Color-coded by channel (X blue, Reddit orange, LinkedIn blue-gray, blog green, newsletter purple)
- Content pillar filter overlay
- Drag-to-reschedule
- Gap detection: highlights days with no scheduled content
- Optimal timing suggestions per channel (based on Analytics Loop data when available)
- Campaign grouping: related content shows connected visual indicator

**Wireframe:**
```
┌────────────────────────────────────────────────────────┐
│ Content Calendar — February 2026         [Month ▾]     │
│ ───────────────────────────────────────────────────── │
│ Channels: [✓X] [✓Blog] [✓Reddit] [○LinkedIn] [○News] │
│                                                        │
│  Mon 23        Tue 24        Wed 25        Thu 26      │
│ ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   │
│ │🐦 9am  │   │🐦 10am │   │        │   │🐦 9am  │   │
│ │CVE     │   │Thread  │   │ ⚠️ GAP  │   │Use case│   │
│ │tweet   │   │ClawHub │   │        │   │tweet   │   │
│ │        │   │        │   │        │   │        │   │
│ │📝 noon │   │📝 9am  │   │        │   │📝 9am  │   │
│ │ClawHub │   │DIY vs  │   │        │   │Multi-  │   │
│ │audit   │   │hosted  │   │        │   │agent   │   │
│ └────────┘   └────────┘   └────────┘   └────────┘   │
└────────────────────────────────────────────────────────┘
```

---

### Module 3: Campaign Manager

**What it does:** Group related content into campaigns with shared briefs, coordinated scheduling, and unified performance tracking.

**Features:**
- Campaign creation wizard: name, goal, duration, target persona, content pillars
- Campaign brief → AI generates all assets: tweets (both voices), blog post, thread, email draft, Reddit post
- Drip scheduler: spread campaign content across days/weeks with channel-appropriate cadence
- Campaign-level performance dashboard: total reach, engagement, conversions across all assets
- Campaign templates: "Security Week", "Product Launch", "Feature Spotlight", "Community Highlight"

**User Stories:**
- As a marketer, I create a "ClawHub Security" campaign. I write a 2-sentence brief: "Highlight the malware findings from our ClawHub audit. Drive signups through security fear → managed solution." The system generates 8 tweets, 1 blog post, 1 thread, and 1 Reddit post. I review, edit 2 tweets, and approve. The drip scheduler spreads them across 5 days.
- As a founder, I open the "Launch Push" campaign dashboard and see: 45K impressions, 2.3% engagement rate, 127 signups attributed. I see the top-performing tweet and click "Generate more like this."

**Wireframe:**
```
┌────────────────────────────────────────────────────────┐
│ Campaign: ClawHub Security Week           [Edit Brief] │
│ ───────────────────────────────────────────────────── │
│ Status: Active · Day 3 of 5 · 62% content published   │
│                                                        │
│ ┌─ Assets ────────────────────────────────────────── │
│ │ 🐦 Tweets: 5/8 posted  · Avg engagement: 3.1%     │
│ │ 📝 Blog: Published     · 1,247 views              │
│ │ 🧵 Thread: Scheduled   · Posts tomorrow 2pm       │
│ │ 🔴 Reddit: Posted      · 34 upvotes, 12 comments  │
│ └───────────────────────────────────────────────────── │
│                                                        │
│ ┌─ Performance ───────────────────────────────────── │
│ │ Reach: 45,200 · Engagement: 2.3% · Signups: 127   │
│ │ [📊 Full Analytics]                                │
│ └───────────────────────────────────────────────────── │
│                                                        │
│ ┌─ Timeline ──────────────────────────────────────── │
│ │ Day 1: ████████████ 3 tweets, blog                │
│ │ Day 2: ██████ 1 tweet, Reddit                      │
│ │ Day 3: ████████ 1 tweet, thread ← today           │
│ │ Day 4: ████ 1 tweet                                │
│ │ Day 5: ██████ 2 tweets, wrap-up                    │
│ └───────────────────────────────────────────────────── │
└────────────────────────────────────────────────────────┘
```

---

### Module 4: Quality Gate

**What it does:** AI reviews all generated content against the brand bible before showing it to the human. The human only sees content that passed — with scores and flagged issues.

**Features:**
- Auto-review on every draft (tweet, blog, thread, campaign asset)
- Scoring dimensions (each 1-10):
  - **Brand Voice Compliance** — matches tone attributes, vocabulary, banned phrases
  - **Factual Accuracy** — claims have sources, numbers are verifiable, no hallucinated stats
  - **Engagement Potential** — hook strength, specificity, shareability, follows proven formats
  - **Guideline Adherence** — follows content guidelines (competitor mentions, legal boundaries, ethical rules)
- Pass threshold: configurable (default: composite score ≥ 6.0)
- Flag categories: `off-brand-language`, `unverified-claim`, `competitor-violation`, `banned-phrase`, `legal-risk`, `hype-language`
- Override: human can promote failed content with acknowledgment
- Audit trail: every review decision logged with scores and flags

**User Stories:**
- As a user, I open the tweet queue and see 10 drafts. I don't know that 6 others were generated but failed the quality gate (scored below 6.0). Three were killed for hype language, two for unverified claims, one for using "seamless."
- As a marketer, I click a tweet's score badge (8.2) and see the breakdown: Voice 9, Accuracy 7, Engagement 8, Guidelines 9. The accuracy flag says "CVE number referenced — verified against source."

**Architecture:**
```
Content Draft → Quality Gate Agent → Pass/Fail Decision
                     ↓
              brand_config loaded as system context
              scoring rubric applied per dimension
              flags generated with citations
                     ↓
              Pass (≥6.0) → Appears in user queue with scores
              Fail (<6.0) → Logged, not shown (unless user enables "show failed")
```

**Quality Gate Agent Spec:**
- Input: draft content + `brand_config` (voice attributes, vocabulary, guidelines, battlecards)
- Output: structured score JSON + flag array + brief rationale per dimension
- Token cost: ~3K input + ~1K output per review = ~$0.02/review (Sonnet)
- At 20 drafts/day: ~$0.40/day for quality gate

---

### Module 5: Distribution Automation

**What it does:** Multi-channel posting with platform-specific formatting, scheduling with optimal timing, and cross-posting deduplication.

**Channels:**
| Channel | Format | API | Notes |
|---|---|---|---|
| X (primary) | 280-char tweets, threads, media | X API v2 | Multiple accounts (founder + brand) |
| X (secondary) | Quote tweets, replies | X API v2 | Community engagement |
| Reddit | Long-form posts, comments | Reddit API | Subreddit-specific formatting |
| LinkedIn | Professional long-form | LinkedIn API | Repurposed from blog/thread content |
| Newsletter | Curated digest | Email API (Resend/Sendgrid) | Weekly digest from top content |
| Blog | Full articles | Direct CMS (Next.js) | Git-based publish via API |

**Features:**
- Platform-specific reformatting: blog → thread (X), blog → article (LinkedIn), blog → post (Reddit)
- Scheduling with optimal timing: learns best post times from Analytics Loop (default: research-based per platform)
- Cross-posting deduplication: same content adapted for each platform, tracked as single content unit
- Failure handling: retry with exponential backoff, alert on persistent failures
- Rate limit awareness: respects per-platform API limits, queues excess
- Preview mode: see exactly how content will render on each platform before publishing

**User Stories:**
- As a marketer, I approve a blog post. Distribution Automation auto-generates: a promotional tweet, a 7-tweet thread summarizing key points, a LinkedIn article adaptation, and a Reddit post for r/OpenClaw. I review each adaptation and schedule them staggered across 48 hours.

---

### Module 6: Analytics Loop

**What it does:** Pulls engagement data, feeds it back into content generation, and provides actionable insights.

**Data Sources:**
- X API: impressions, likes, retweets, replies, profile visits, link clicks
- Reddit API: upvotes, comments, crosspost count
- Blog analytics: page views, time on page, bounce rate, scroll depth (via Plausible/Umami)
- Newsletter: open rate, click rate, unsubscribes
- Signup attribution: UTM tracking from content → Clawer signup funnel

**Features:**
- **Performance Dashboard:** Real-time metrics across all channels, filterable by content pillar, campaign, date range, voice (founder vs brand)
- **Weekly Digest:** Auto-generated report: top 5 performers, bottom 5, recommended pivots, content pillar performance, best posting times observed
- **Feedback Loop:** Top-performing content attributes (topics, hooks, formats, posting times) fed into generation prompts. "Generate more like [top tweet]" one-click.
- **A/B Insights:** When multiple tweets cover the same topic, compare performance. Surface which headlines, hooks, and CTAs convert.
- **Pillar Health:** Are we over-indexing on Security and neglecting Use Cases? Visual balance indicator with alerts.

**Wireframe:**
```
┌────────────────────────────────────────────────────────┐
│ Analytics — Last 7 Days                  [Custom ▾]    │
│ ───────────────────────────────────────────────────── │
│                                                        │
│ Total Reach    Engagement    Signups    Best Day       │
│ 124,500        3.2%          89         Tuesday       │
│                                                        │
│ ┌─ By Pillar ─────────────────────────────────────── │
│ │ 🔐 Security    52K reach  4.1% eng  ████████████  │
│ │ ⚡ Ease         31K reach  2.8% eng  ██████        │
│ │ 🤖 AI Teams    22K reach  3.4% eng  ████          │
│ │ 💡 Use Cases   14K reach  2.1% eng  ███           │
│ │ 📚 Education    5K reach  1.9% eng  █             │
│ └───────────────────────────────────────────────────── │
│                                                        │
│ ┌─ Top Performers ────────────────────────────────── │
│ │ 1. "42K instances exposed..." — 12K imp, 4.8% eng │
│ │ 2. "Hot take: 90% of AI wrappers..." — 8K, 3.9%  │
│ │    [Generate More Like This]                       │
│ └───────────────────────────────────────────────────── │
│                                                        │
│ 💡 Insight: "Security content outperforms by 2x.     │
│    Consider a 'Security Week' campaign."              │
└────────────────────────────────────────────────────────┘
```

---

### Module 7: Content Factory Templates

Extensible templates that apply the same AI orchestration pattern to different content types.

#### 7.1 Social Media Template
- Tweet queues, thread builders (covered in Module 2)
- Reusable across customer accounts

#### 7.2 Blog/SEO Template
- Article pipeline with keyword research integration
- SEO brief generator: keyword → competitor analysis → content brief → draft
- Follows `MVP-SEO-BRIEF.md` methodology

#### 7.3 Book Publishing Template (Monster Morphs Pattern)
- 5 parallel agents generate content simultaneously
- Selection agent picks the best output
- Review team (3 agents) score and critique
- Human makes final selection
- Used for: children's books, fiction, non-fiction chapters
- Token cost: ~5x single generation, but quality is dramatically higher

#### 7.4 Boring Book Generator
- Template-based content: activity books, coloring books, puzzle books, journals
- Structured generation: table of contents → page templates → content fill
- Minimal human review needed (formulaic content)
- Revenue potential: KDP/Amazon self-publishing pipeline

#### 7.5 Newsletter Template
- Curated digest from content pipeline
- Auto-selects top content from the week
- Generates summary + commentary in brand voice
- Template: intro → 3-5 featured items → CTA → sign-off

#### 7.6 Product Launch Template
- Full launch campaign from announcement to post-launch
- Generates: teaser tweets, announcement blog, launch thread, Product Hunt copy, Reddit post, email sequence (3-part drip), press kit
- Timeline-based: T-7 through T+14 day schedule
- Campaign Manager integration for coordinated distribution

---

## 3. Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Launch Engine Dashboard                   │
│  (Next.js — same stack as Clawer.ai dashboard)              │
│                                                              │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────┐ │
│  │ Tweet    │ Blog     │ Campaign │ Content  │ Analytics  │ │
│  │ Queue    │ Pipeline │ Manager  │ Calendar │ Dashboard  │ │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────┬─────┘ │
│       │          │          │          │            │        │
└───────┼──────────┼──────────┼──────────┼────────────┼────────┘
        │          │          │          │            │
   ┌────▼──────────▼──────────▼──────────▼────────────▼────┐
   │              Launch Engine API Server                   │
   │         (Express routes on existing API)                │
   │                                                         │
   │  ┌──────────────────────────────────────────────────┐  │
   │  │            Agent Orchestrator                     │  │
   │  │                                                   │  │
   │  │  ┌─────────┐ ┌──────────┐ ┌───────────────────┐ │  │
   │  │  │ Content │ │ Quality  │ │ Distribution      │ │  │
   │  │  │ Gen     │ │ Gate     │ │ Engine            │ │  │
   │  │  │ Agents  │ │ Agent    │ │                   │ │  │
   │  │  └────┬────┘ └────┬─────┘ └────┬──────────────┘ │  │
   │  │       │           │            │                  │  │
   │  └───────┼───────────┼────────────┼──────────────────┘  │
   │          │           │            │                      │
   │  ┌───────▼───────────▼────────────▼──────────────────┐  │
   │  │              Brand Config (from Module 1)          │  │
   │  │  voice_attributes, vocabulary, pillars, personas   │  │
   │  └────────────────────────────────────────────────────┘  │
   │                                                         │
   └─────────┬───────────────────────────────┬───────────────┘
             │                               │
        ┌────▼────┐                    ┌─────▼──────┐
        │ Postgres │                    │ External   │
        │ (content │                    │ APIs       │
        │  store)  │                    │ X, Reddit, │
        │          │                    │ LinkedIn,  │
        │          │                    │ Analytics  │
        └──────────┘                    └────────────┘
```

### Data Flow

```
1. Brand Bible (Module 1)
   └→ brand_config record
       └→ System prompt context for ALL agents

2. Content Generation (Module 2)
   ├→ Scheduled: nightly batch (blog drafts, tweet queue refill)
   ├→ On-demand: user clicks "Generate More"
   └→ Event-driven: trending topic detected, campaign triggered

3. Quality Gate (Module 4)
   ├→ Every draft passes through before entering user queue
   ├→ Scores stored alongside content
   └→ Failed content logged but hidden

4. Human Review (Dashboard)
   ├→ Approve / Edit / Kill decisions
   └→ Decision audit trail stored

5. Distribution (Module 5)
   ├→ Approved content → platform-specific formatting
   ├→ Scheduled posting via job queue
   └→ Post confirmation + link stored

6. Analytics (Module 6)
   ├→ Engagement data pulled on schedule (hourly for X, daily for blog)
   ├→ Performance scores computed
   └→ Feedback injected into generation prompts (top-performing patterns)
```

---

## 4. Data Model

Extends the schema from `BRAND-RESEARCH-SPEC.md`. All brand-related tables defined there remain unchanged.

### New Tables

```sql
-- Content items (tweets, blogs, threads, etc.)
content_items (
  id              UUID PRIMARY KEY,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id),
  campaign_id     UUID REFERENCES campaigns(id),        -- nullable
  content_type    ENUM('tweet', 'blog', 'thread', 'reddit', 'linkedin', 'newsletter', 'email'),
  voice           ENUM('founder', 'brand'),              -- which voice generated it
  content_pillar  VARCHAR(100),                          -- maps to brand_config.content_pillars
  source_type     ENUM('trending', 'blog-promo', 'build-in-public', 'competitor', 'community', 'campaign', 'manual'),
  source_ref      JSONB,                                 -- URL/tweet/brief that inspired this
  
  -- Content
  title           VARCHAR(500),                          -- for blogs/threads
  body_md         TEXT,                                  -- markdown content
  body_platform   JSONB,                                 -- platform-specific formatted versions
  media_urls      JSONB,                                 -- attached images/videos
  
  -- Lifecycle
  status          ENUM('generating', 'gate-review', 'failed-gate', 'queued', 'approved', 'scheduled', 'published', 'killed'),
  scheduled_at    TIMESTAMP,
  published_at    TIMESTAMP,
  published_url   VARCHAR(2048),
  
  -- Quality Gate
  gate_score      DECIMAL(3,1),                          -- composite score 0-10
  gate_scores     JSONB,                                 -- {voice: 8, accuracy: 7, engagement: 9, guidelines: 8}
  gate_flags      JSONB,                                 -- [{type: "banned-phrase", detail: "seamless", severity: "warning"}]
  gate_passed     BOOLEAN,
  gate_reviewed_at TIMESTAMP,
  
  -- Metadata
  word_count      INTEGER,
  char_count      INTEGER,
  seo_keywords    JSONB,                                 -- for blog content
  target_channel  VARCHAR(100),                          -- which platform/account
  
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)

-- Thread items (ordered tweets within a thread)
thread_items (
  id              UUID PRIMARY KEY,
  content_id      UUID NOT NULL REFERENCES content_items(id), -- parent thread
  position        INTEGER NOT NULL,
  body            TEXT NOT NULL,
  char_count      INTEGER,
  media_url       VARCHAR(2048),
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Campaigns
campaigns (
  id              UUID PRIMARY KEY,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id),
  name            VARCHAR(255) NOT NULL,
  brief           TEXT,                                  -- campaign brief text
  goal            VARCHAR(500),
  target_persona  VARCHAR(100),                          -- from brand_config.personas
  content_pillars JSONB,                                 -- which pillars this campaign targets
  template        VARCHAR(100),                          -- campaign template name
  
  status          ENUM('draft', 'active', 'paused', 'completed', 'archived'),
  start_date      DATE,
  end_date        DATE,
  
  -- Performance (aggregated from content_items)
  total_reach     BIGINT DEFAULT 0,
  total_engagement DECIMAL(5,2) DEFAULT 0,
  total_signups   INTEGER DEFAULT 0,
  
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)

-- Content engagement metrics (per content item, per platform)
content_metrics (
  id              UUID PRIMARY KEY,
  content_id      UUID NOT NULL REFERENCES content_items(id),
  platform        VARCHAR(50) NOT NULL,
  
  impressions     BIGINT DEFAULT 0,
  likes           INTEGER DEFAULT 0,
  retweets        INTEGER DEFAULT 0,
  replies         INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  shares          INTEGER DEFAULT 0,
  
  -- Blog-specific
  page_views      INTEGER DEFAULT 0,
  time_on_page    INTEGER,                              -- seconds
  bounce_rate     DECIMAL(5,2),
  scroll_depth    DECIMAL(5,2),                         -- percentage
  
  -- Attribution
  signups         INTEGER DEFAULT 0,
  
  fetched_at      TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Human decisions on content (audit trail)
content_decisions (
  id              UUID PRIMARY KEY,
  content_id      UUID NOT NULL REFERENCES content_items(id),
  user_id         UUID,
  action          ENUM('approved', 'edited', 'killed', 'promoted', 'rescheduled'),
  original_text   TEXT,
  edited_text     TEXT,
  note            VARCHAR(500),
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Distribution jobs
distribution_jobs (
  id              UUID PRIMARY KEY,
  content_id      UUID NOT NULL REFERENCES content_items(id),
  platform        VARCHAR(50) NOT NULL,
  account         VARCHAR(100),                          -- which account to post from
  
  status          ENUM('pending', 'posting', 'posted', 'failed', 'retrying'),
  scheduled_at    TIMESTAMP,
  posted_at       TIMESTAMP,
  post_url        VARCHAR(2048),
  error           TEXT,
  retry_count     INTEGER DEFAULT 0,
  
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Analytics snapshots (weekly digests)
analytics_snapshots (
  id              UUID PRIMARY KEY,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  
  summary_md      TEXT,                                  -- AI-generated weekly digest
  top_performers  JSONB,                                 -- [{content_id, metric, value}]
  bottom_performers JSONB,
  pillar_breakdown JSONB,                                -- {security: {reach, engagement}, ...}
  recommendations JSONB,                                 -- AI-generated pivots
  
  created_at      TIMESTAMP DEFAULT NOW()
)

-- Content factory templates
content_templates (
  id              UUID PRIMARY KEY,
  workspace_id    UUID REFERENCES workspaces(id),        -- null = system template
  name            VARCHAR(255) NOT NULL,
  template_type   ENUM('social', 'blog-seo', 'book', 'boring-book', 'newsletter', 'product-launch'),
  config          JSONB,                                 -- template-specific config
  agent_topology  JSONB,                                 -- which agents, how they connect
  estimated_cost  DECIMAL(10,2),                         -- estimated token cost per run
  
  created_at      TIMESTAMP DEFAULT NOW()
)
```

### Entity Relationships

```
workspace (1)
├── brand_config (1:1) ← from Module 1
├── campaigns (1:many)
│   └── content_items (1:many)
├── content_items (1:many)
│   ├── thread_items (1:many)
│   ├── content_metrics (1:many, per platform)
│   ├── content_decisions (1:many, audit trail)
│   └── distribution_jobs (1:many, per platform)
├── analytics_snapshots (1:many, weekly)
└── content_templates (1:many)
```

---

## 5. Agent Orchestration

### Agent Roster

| Agent | Role | Trigger | Model | Est. Cost/Run |
|---|---|---|---|---|
| **Tweet Drafter** | Generate tweet drafts from brand bible + sources | Scheduled (3x/day) + on-demand | Sonnet | ~$0.03 per tweet |
| **Blog Drafter** | Generate full blog post from brief | Scheduled (nightly) + on-demand | Sonnet | ~$0.45 per post |
| **Thread Converter** | Decompose blog → tweet thread | On-demand | Sonnet | ~$0.05 per thread |
| **Campaign Generator** | Generate all campaign assets from brief | On-demand | Sonnet | ~$0.50 per campaign |
| **Quality Gate Reviewer** | Score content against brand bible | Every draft (auto) | Haiku | ~$0.005 per review |
| **Platform Formatter** | Adapt content for each distribution channel | Pre-distribution (auto) | Haiku | ~$0.003 per format |
| **Analytics Summarizer** | Generate weekly digest from metrics | Scheduled (weekly) | Sonnet | ~$0.10 per digest |
| **Trend Scanner** | Monitor X/Reddit for trending topics in category | Scheduled (2x/day) | Haiku | ~$0.02 per scan |
| **SEO Researcher** | Keyword research + competitor content analysis | On-demand | Sonnet | ~$0.15 per brief |

### Quality Gate Flow

```
Any Agent Output
      │
      ▼
┌─────────────────────┐
│ Quality Gate Agent   │
│                     │
│ Input:              │
│ - Draft content     │
│ - brand_config      │
│ - Scoring rubric    │
│                     │
│ Process:            │
│ 1. Check vocabulary │
│    (banned phrases, │
│     use/avoid list) │
│ 2. Score voice      │
│    compliance       │
│ 3. Verify claims    │
│    (source check)   │
│ 4. Score engagement │
│    potential        │
│ 5. Check guidelines │
│    (competitor      │
│     rules, legal)   │
│                     │
│ Output:             │
│ - Composite score   │
│ - Per-dimension     │
│   scores            │
│ - Flag array        │
│ - Pass/fail         │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
  Pass      Fail
    │         │
    ▼         ▼
 User Queue  Logged
 (with       (hidden,
  scores)    retrievable)
```

### Daily Token Cost Estimate (Internal Use)

| Activity | Volume | Cost |
|---|---|---|
| Tweet generation | 10 drafts/day | $0.30 |
| Quality gate reviews | 10 reviews/day | $0.05 |
| Blog draft | 1 every 2 days | $0.23 |
| Thread conversion | 1 every 2 days | $0.03 |
| Trend scanning | 2 scans/day | $0.04 |
| Platform formatting | 5 formats/day | $0.02 |
| **Daily total** | | **~$0.67** |
| **Monthly total** | | **~$20** |

With campaign bursts (e.g., Security Week), add ~$2-5 per campaign.

---

## 6. UI/UX — Key Screens

### 6.1 Launch Engine Dashboard (Home)

The main dashboard. At-a-glance view of the entire content operation.

```
┌────────────────────────────────────────────────────────────┐
│ 🚀 Launch Engine                          [Keith ▾]        │
│ ──────────────────────────────────────────────────────── │
│                                                            │
│ ┌─ Today ──────────────────────────────────────────────┐  │
│ │ 📝 3 drafts awaiting review                          │  │
│ │ 📅 2 posts scheduled today (9am tweet, noon blog)    │  │
│ │ 📊 Yesterday: 8.2K reach, 3.1% engagement           │  │
│ │ 🎯 Active campaign: ClawHub Security (Day 3/5)      │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌─ Quick Actions ──────────────────────────────────────┐  │
│ │ [Review Tweet Queue (3)] [Blog Pipeline (1 ready)]   │  │
│ │ [New Campaign]           [View Calendar]              │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌─ This Week ──────────────────────────────────────────┐  │
│ │ Content published: 8  │  Engagement: 3.2%            │  │
│ │ Pillar balance:       │  Top: CVE tweet (4.8% eng)   │  │
│ │ 🔐 ████████ 40%       │  Signups: 89 attributed      │  │
│ │ ⚡ ████ 25%            │                               │  │
│ │ 🤖 ███ 15%            │  💡 AI says: "Security is     │  │
│ │ 💡 ███ 15%            │   hot. Run a campaign."       │  │
│ │ 📚 █ 5%               │                               │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ Nav: [Dashboard] [Tweets] [Blog] [Campaigns]              │
│      [Calendar] [Analytics] [Brand Bible] [Settings]      │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Tweet Queue Screen
(See Module 2.1 wireframe above)

### 6.3 Content Calendar Screen
(See Module 2.4 wireframe above)

### 6.4 Campaign Builder Screen
(See Module 3 wireframe above)

### 6.5 Analytics Dashboard Screen
(See Module 6 wireframe above)

### 6.6 Brand Bible Screen

```
┌────────────────────────────────────────────────────────────┐
│ Brand Bible                    Last updated: Feb 23, 2026  │
│ ──────────────────────────────────────────────────────── │
│                                                            │
│ [Voice Guide] [Positioning] [Story] [Messaging]           │
│ [Battlecards] [Content Guidelines]                        │
│ ──────────────────────────────────────────────────────── │
│                                                            │
│ ┌─ Active Config ──────────────────────────────────────┐  │
│ │ Tone: Straight-Talking · Engineer-Honest · Casually  │  │
│ │       Confident · Security-Serious · Anti-Hype       │  │
│ │ Primary tagline: "AI Teams That Do the Work While    │  │
│ │                   You Sleep"                          │  │
│ │ Active personas: Solo Sarah, Mike, Creator Chris,    │  │
│ │                  Dev-Adjacent Dana                    │  │
│ │ Pillars: Security, Ease, AI Teams, Use Cases, Edu   │  │
│ │                                                      │  │
│ │ [Edit Brand Bible] [Refresh Research] [Export]       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌─ Document Viewer ────────────────────────────────────┐  │
│ │ (markdown rendered view of selected document)        │  │
│ │ with inline edit capability                          │  │
│ └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 7. MVP Phasing

### Phase 0: Foundation (Week 1-2)
**Ship:** Brand Foundation Builder + Tweet Queue

This is the minimum viable product. A user creates their brand bible, then immediately starts seeing AI-generated tweet drafts that match their voice. The quality gate runs silently. They approve and schedule.

**What's included:**
- Brand Foundation Builder wizard (all 5 research phases, 6 documents)
- Tweet Queue with inline editing, approve/schedule/kill
- Quality Gate (auto-review, scoring, pass/fail)
- Basic scheduling (post at specified time via X API)
- Single X account integration

**What's NOT included:** Blog pipeline, campaigns, analytics, multi-channel, calendar

**Internal validation:** We use it ourselves for @Vavier and @teamclawer for 2 weeks before exposing to customers.

### Phase 1: Content Pipeline (Week 3-4)
**Add:** Blog Pipeline + Thread Builder + Content Calendar

- Blog brief → AI draft → review → publish workflow
- Thread conversion from published blog posts
- Calendar view of all scheduled content
- Two X accounts (founder + brand)

### Phase 2: Campaigns + Distribution (Week 5-8)
**Add:** Campaign Manager + Distribution Automation

- Campaign creation, brief → asset generation, drip scheduling
- Reddit and LinkedIn distribution channels
- Platform-specific formatting
- Cross-posting deduplication

### Phase 3: Analytics Loop (Week 9-12)
**Add:** Analytics Dashboard + Feedback Loop

- Pull engagement data from X, Reddit, blog
- Weekly digest generation
- Performance feedback into generation prompts
- A/B insights
- Signup attribution

### Phase 4: Content Factory (Week 13+)
**Add:** Content Factory Templates

- Newsletter template
- Product Launch template
- Book Publishing (Monster Morphs pattern)
- Boring Book Generator
- SEO Brief template
- Custom template builder

---

## 8. Integration Points

### X (Twitter) API v2
- **Auth:** OAuth 2.0 with PKCE (user auth) or App-only (read)
- **Endpoints:** POST /tweets, GET /tweets/:id, GET /users/:id/tweets
- **Rate limits:** 1,500 tweets/month (free), 10K (basic $200/mo), 100K (pro)
- **For us:** Basic tier ($200/mo) covers internal + early customer use
- **Required scopes:** tweet.read, tweet.write, users.read, offline.access

### Reddit API
- **Auth:** OAuth 2.0, script type for personal use
- **Endpoints:** POST /api/submit, GET /r/{subreddit}/hot
- **Rate limits:** 100 requests/minute
- **Required scopes:** submit, read

### LinkedIn API
- **Auth:** OAuth 2.0 (3-legged)
- **Endpoints:** Share API (ugcPosts)
- **Rate limits:** 100 posts/day per member
- **Note:** LinkedIn API access requires partnership application — may delay

### Blog CMS (Clawer.ai)
- **Stack:** Next.js, MDX files in git repo
- **Integration:** Git-based: generate MDX → commit → deploy triggers rebuild
- **API:** Custom endpoint: POST /api/blog/publish

### Email (Newsletter)
- **Provider:** Resend or SendGrid
- **Integration:** API-based send with templated HTML
- **Subscriber management:** Simple list in Postgres

### Analytics
- **Primary:** Plausible or Umami (self-hosted, privacy-friendly)
- **Integration:** API for pageviews, referrers, events
- **Supplementary:** X analytics via API, Reddit post metrics via API

---

## 9. Internal vs Customer-Facing

### What We Use Internally NOW

| Capability | Current Implementation | Launch Engine Equivalent |
|---|---|---|
| Brand bible creation | Manual agent sessions, markdown files | Module 1: Brand Foundation Builder |
| Nightly blog generation | Cron agent at 4:30am, `content-queue.md` | Module 2: Blog Pipeline |
| Tweet drafting | Manual or ad-hoc agent prompts | Module 2: Tweet Queue |
| Content research | Subagent with bird CLI + web search | Module 6: Trend Scanner agent |
| Quality review | Keith reads and edits everything | Module 4: Quality Gate |
| Publishing | Manual: git commit for blog, copy-paste for X | Module 5: Distribution Automation |
| Analytics | Manual: check X analytics, Plausible | Module 6: Analytics Loop |
| Campaign coordination | Spreadsheets / memory | Module 3: Campaign Manager |

### What Becomes a Clawer Customer Feature

**Phase A — Internal Only (Month 1-2):**
All modules used internally for Clawer.ai marketing. Validate workflows, fix bugs, measure ROI.

**Phase B — Power User Beta (Month 3-4):**
- Brand Foundation Builder available to Clawer Pro customers
- Tweet Queue available (connects to customer's X account)
- Quality Gate runs on customer's brand bible

**Phase C — Full Launch (Month 5+):**
- All modules available as "Marketing HQ" add-on
- Content Factory Templates available
- Campaign Manager
- Multi-channel distribution

### Pricing Model (Preliminary)

| Tier | Included | Price |
|---|---|---|
| **Free** | Brand bible generation (1 project) | $0 (lead gen) |
| **Pro** | Tweet queue + blog pipeline + quality gate (1 brand) | +$29/mo on top of Clawer |
| **Business** | All modules, campaigns, analytics, 3 brands | +$99/mo |
| **Agency** | Unlimited brands, white-label, team seats | +$249/mo |

Token costs are absorbed into subscription pricing. At ~$20/mo internal cost for moderate usage, the margins are strong.

---

## Appendix A: Open Questions

1. **X API tier:** Basic ($200/mo) or Pro ($5K/mo)? Basic is fine for launch but rate limits may constrain at scale.
2. **LinkedIn API access:** Requires partnership approval. Start without LinkedIn and add when approved?
3. **Multi-tenant isolation:** When customers use this, how do we isolate their brand bibles, content, and API credentials? Workspace-level isolation in Postgres should suffice.
4. **Webhook vs polling for analytics:** X API webhooks are unreliable. Poll on schedule (hourly) is more predictable.
5. **Content calendar as standalone?** Some users may want just the calendar without the generation pipeline. Consider it.

## Appendix B: Success Metrics

### Internal (Clawer.ai marketing)
- Content output: 2 tweets/day + 1 blog/2 days → 5 tweets/day + 1 blog/day
- Time spent on content: 2 hours/day → 30 min/day (review only)
- Content quality: brand voice consistency score ≥ 8.0 average
- Attribution: track signups from content → target 200/month from organic

### Customer-facing
- Adoption: 10% of Clawer Pro users activate Marketing HQ within 30 days
- Retention: Marketing HQ users churn 30% less than non-users
- Revenue: $5K MRR from Marketing HQ add-on within 6 months
- NPS: >50 from Marketing HQ users

---

*This spec represents the productized version of the content factory pattern — the AI orchestration methodology that's been producing Clawer.ai's marketing output since day one. It's ambitious but phased practically: Tweet Queue + Brand Builder = MVP that ships in 2 weeks. Everything else layers on.*
