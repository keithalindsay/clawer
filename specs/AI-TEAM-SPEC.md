# AI Team Specification
## Clawer.ai - Pre-Configured AI Employee Teams

**Version:** 1.0  
**Last Updated:** 2026-02-08

---

## Overview

AI Team gives Clawer.ai users a **ready-to-work team of specialized AI employees** with zero setup. Users talk naturally, and the team automatically routes requests to the right specialist. No configuration, no prompts, no learning curve.

**Core Concept:**
- One main agent ("Office Manager") in the primary session
- Specialized sub-agents (team members) spawned on-demand via `sessions_spawn`
- Industry-specific presets determine which specialists are available
- Single chat interface — users never see the routing machinery

---

## Architecture

### Container Setup

Each Clawer.ai user gets an OpenClaw container with:
- **Main session**: Office Manager agent loaded via AGENTS.md
- **Team config**: Industry-specific team definition loaded at container start
- **Member definitions**: Individual SOUL.md files for each specialist
- **Shared workspace**: `/home/user/workspace/` for team collaboration

### Session Model

```
User Message
    ↓
Office Manager (main session)
    ↓
Routing Decision
    ↓
    ├─→ Handle directly (simple/coordination tasks)
    ├─→ Spawn specialist sub-agent (sessions_spawn)
    ├─→ Spawn multiple specialists (parallel work)
    └─→ Sequential handoff (one specialist → another)
```

**Key mechanisms:**
- Office Manager runs in the main session (always active)
- Specialists are ephemeral sub-agents (spawned as needed)
- Each sub-agent gets its SOUL.md as system prompt via `sessions_spawn`
- Sub-agents complete their task and report back to Office Manager
- Office Manager synthesizes results and responds to user

### File Structure

```
/home/user/
├── AGENTS.md                    # Office Manager config (main session)
├── USER.md                      # User profile (business context)
├── WORKING.md                   # Current team tasks
├── memory/                      # Shared team memory
│   └── YYYY-MM-DD.md           # Daily activity logs
├── workspace/                   # Team shared workspace
│   ├── drafts/                 # Work in progress
│   ├── completed/              # Finished deliverables
│   └── templates/              # Reusable assets
└── team/
    ├── team-config.json        # Active team definition
    └── members/
        ├── support.md          # Support specialist SOUL
        ├── marketing.md        # Marketing specialist SOUL
        ├── analyst.md          # Analyst specialist SOUL
        └── ...                 # Other specialists
```

---

## Team Composition

### Office Manager (Main Session)

**Role:** Router, coordinator, context keeper  
**Does:**
- Receives all user messages
- Determines which specialist(s) should handle the request
- Spawns sub-agents with appropriate context
- Synthesizes results from multiple specialists
- Maintains conversation continuity
- Handles simple requests directly (no need to delegate)

**Does NOT:**
- Try to be an expert in everything
- Execute specialized work (delegates instead)
- Hide team member contributions

**Personality:** Professional, efficient, low-ego. More air traffic controller than CEO.

### Team Members (Sub-Agents)

Team members are **specialized sub-agents** with:
- Clear expertise boundaries
- Distinct personalities (subtle, not cartoonish)
- Specific tools and workflows
- Task-focused behavior (complete and report back)

---

## Industry Presets

### 1. E-Commerce Team

**Use case:** Online stores, DTC brands, Amazon sellers

**Team members:**
- **Alex** (Customer Support Lead) — Customer emails, refunds, complaints
- **Maya** (Marketing Strategist) — Social media, campaigns, product copy
- **Sam** (Business Analyst) — Sales reports, inventory analysis, trends
- **Jordan** (Content Writer) — Product listings, blogs, newsletters
- **Riley** (Operations Manager) — Order processing, shipping, vendor management

### 2. Law Firm Team

**Use case:** Solo practitioners, small law firms

**Team members:**
- **Morgan** (Legal Research Assistant) — Case law, precedents, statute research
- **Taylor** (Document Specialist) — Contract drafting, filing prep, templates
- **Casey** (Client Communications) — Client updates, appointment scheduling, intake
- **Jordan** (Billing Specialist) — Time tracking, invoicing, payment follow-up
- **Alex** (Discovery Coordinator) — Document review, evidence organization

### 3. Real Estate Team

**Use case:** Agents, brokers, property managers

**Team members:**
- **Jamie** (Listing Specialist) — Property descriptions, MLS copy, visual tours
- **Taylor** (Client Relations) — Buyer/seller communication, follow-ups
- **Morgan** (Market Analyst) — Comp analysis, pricing strategy, market trends
- **Casey** (Transaction Coordinator) — Contract tracking, deadline management
- **Alex** (Marketing Manager) — Social posts, open house promo, lead generation

### 4. Agency Team (Marketing/Creative)

**Use case:** Digital agencies, freelancers, consultants

**Team members:**
- **Riley** (Project Manager) — Timeline tracking, client updates, deliverable coordination
- **Maya** (Creative Strategist) — Campaign concepts, brand messaging, content strategy
- **Jordan** (Copywriter) — Ad copy, web content, scripts
- **Sam** (Analytics Lead) — Performance reports, A/B testing, ROI analysis
- **Alex** (Client Success) — Onboarding, check-ins, feedback management

### 5. SaaS Team

**Use case:** Software startups, product teams

**Team members:**
- **Taylor** (Customer Success) — Onboarding, support tickets, feature requests
- **Morgan** (Product Analyst) — User research, metrics analysis, roadmap input
- **Casey** (Content Manager) — Documentation, help center, release notes
- **Jordan** (Growth Marketer) — Landing pages, email flows, conversion optimization
- **Sam** (Community Manager) — Social engagement, user feedback, advocacy

### 6. Finance/Accounting Team

**Use case:** Bookkeepers, accountants, CFO services

**Team members:**
- **Morgan** (Bookkeeping Lead) — Transaction categorization, reconciliation
- **Taylor** (Tax Specialist) — Deduction research, filing prep, compliance
- **Casey** (AP/AR Manager) — Invoice processing, payment tracking, collections
- **Sam** (Financial Analyst) — Reports, forecasting, budgets
- **Alex** (Client Communications) — Client questions, document requests

### 7. Default/General Team

**Use case:** Anyone who doesn't fit a specific industry

**Team members:**
- **Taylor** (Research Assistant) — Web research, fact-checking, summarization
- **Jordan** (Writer) — Emails, documents, content of all types
- **Sam** (Analyst) — Data analysis, reports, insights
- **Casey** (Scheduler/Coordinator) — Planning, tracking, organization
- **Alex** (Support Specialist) — Customer/client communication

---

## Routing Logic

The Office Manager uses a **simple, explicit routing system** that works with GPT-4o-mini and other frontier models.

### Routing Methods

#### 1. Keyword Matching
Simple keyword triggers for obvious requests:

```
Keywords                     → Specialist
--------------------------------
"customer email"            → Support
"refund", "complaint"       → Support
"social media", "campaign"  → Marketing
"sales report", "analytics" → Analyst
"product description"       → Writer
"order", "shipping"         → Operations
```

#### 2. Intent Classification
For less obvious requests, classify intent:

```
Intent                      → Specialist
--------------------------------
Needs research/data        → Analyst
Needs written content      → Writer
Customer-facing            → Support
Promotional/creative       → Marketing
Process/logistics          → Operations
```

#### 3. Explicit Handoff
User can explicitly request a team member:

```
"Have Maya look at this"    → Marketing
"Get Sam's analysis"        → Analyst
"Ask Alex to respond"       → Support
```

#### 4. Multi-Specialist Routing
Some requests need multiple specialists:

```
"Create a promotional email for our sale"
→ Marketing (strategy) + Writer (copy) [parallel]

"Analyze our sales and write a summary report"
→ Analyst (analysis) + Writer (report) [sequential]
```

### Routing Decision Tree

```
Incoming Request
    ↓
Is it trivial/meta? (e.g., "What can you do?")
    Yes → Office Manager handles directly
    No ↓
Does it match clear keywords?
    Yes → Route to specialist
    No ↓
Classify primary intent
    ↓
Single specialist or multiple?
    Single → Spawn one sub-agent
    Multiple → Determine parallel vs sequential
    ↓
Spawn sub-agent(s) with:
    - Specialist's SOUL.md
    - User request context
    - Relevant files/data
    - Shared workspace paths
```

### Implementation Notes

**For GPT-4o-mini compatibility:**
- Use explicit routing tables (not complex reasoning)
- Clear if/then logic in AGENTS.md
- Keyword lists over semantic interpretation
- Fallback to "default specialist" if uncertain

**Example routing instruction (for AGENTS.md):**
```
When user asks about customer emails, complaints, refunds, or support:
  → Spawn sub-agent with team/members/support.md

When user asks about social media, campaigns, marketing, or promotions:
  → Spawn sub-agent with team/members/marketing.md

When user asks for analysis, reports, data, or insights:
  → Spawn sub-agent with team/members/analyst.md
```

---

## Shared Context

Team members need shared context to work coherently. This happens through:

### 1. Shared Memory Files

**Location:** `/home/user/memory/`

- `YYYY-MM-DD.md` — Daily team activity log
- Office Manager writes significant events
- Sub-agents read recent days for context
- Sub-agents append their work summary when completing tasks

### 2. Shared Workspace

**Location:** `/home/user/workspace/`

- `drafts/` — Work in progress (sub-agents write here)
- `completed/` — Finished deliverables
- `templates/` — Reusable assets (email templates, checklists, etc.)

### 3. USER.md

All team members read `USER.md` for:
- Business context (industry, products, target customers)
- Brand voice and style guidelines
- Key policies (return policy, pricing tiers, etc.)
- Contact information and systems used

### 4. Handoff Context

When Office Manager spawns a sub-agent:

```python
sessions_spawn(
    label="specialist-task",
    soul_file="team/members/marketing.md",
    task=f"""
User request: {user_message}

Relevant context:
- User runs an e-commerce store selling outdoor gear
- Current promotion: 20% off winter gear (ends Feb 15)
- Recent context: {recent_memory}

Your task: Create 3 social media posts promoting the sale.

Output: Write posts to workspace/drafts/social-posts-{date}.md
    """
)
```

### 5. Task Completion Reports

Sub-agents end with a completion report:

```
## Completed Task: Social Media Posts

**Created:** workspace/drafts/social-posts-2026-02-08.md

**Summary:**
- 3 posts created (Instagram, Twitter, Facebook)
- Focused on winter hiking and camping gear
- Included promotion details and urgency

**Next steps:**
- Review and approve
- Schedule posts or pass to scheduling tool
```

Office Manager synthesizes this into user-facing response.

---

## User Experience

### Single Chat Interface

Users see **one continuous conversation** with occasional team member attribution:

```
User: Can you analyze last month's sales?

Office Manager: I'll have Sam pull that analysis for you.

[30 seconds later]

Office Manager: Sam analyzed January's sales:

**Key findings:**
- Revenue up 23% vs December
- Top category: Winter apparel (42% of sales)
- 3 products drove 60% of growth

[Detailed report saved to workspace/completed/jan-2026-sales.md]

Anything specific you want to dig into?
```

### Attribution Styles

**Explicit attribution** (when routing is visible):
- "I'll have Maya draft that email"
- "Let me get Sam's analysis on this"
- "Alex can help with that customer issue"

**Invisible attribution** (when seamless):
- "Here's your sales analysis..." (Sam did it, but user doesn't need to know)
- "I've drafted three versions..." (Jordan wrote them)

**Use explicit attribution when:**
- Task will take time (sub-agent needs to spawn)
- User asked for specific specialist
- Adds value to show expertise area

**Use invisible attribution when:**
- Fast turnaround (under 10 seconds)
- User doesn't care about internal routing
- Simpler UX

### Team Member Personalities in Output

When team members contribute, their personality shows subtly:

**Sam (Analyst):**
> Revenue increased 23% month-over-month, driven primarily by winter apparel. The top 3 SKUs accounted for 60% of growth. I recommend doubling down on these products in February's marketing.

**Maya (Marketing):**
> Let's capitalize on this momentum! I'd suggest a "Winter Warriors" campaign highlighting those top sellers. We could create a bundle offer and push it hard on Instagram Stories — that's where we saw the highest engagement in January.

**Alex (Support):**
> Good news — customer satisfaction is up too. Only 2 refund requests this month (both shipping delays, not product issues). Customers are loving the winter gear quality.

Each has a voice, but it's professional and grounded. No one talks like a LinkedIn influencer.

---

## Container Integration

### Deployment Flow

```
User signs up → Picks industry → Container provisioned
    ↓
1. Base OpenClaw image deployed
2. Team config copied to /home/user/team/
3. AGENTS.md loaded with Office Manager config
4. USER.md created with business details (from onboarding)
5. Container starts → Office Manager active
```

### Team Config Loading

**At container start:**
1. Read `/home/user/team/team-config.json`
2. Load Office Manager AGENTS.md (references team members)
3. Team member SOUL.md files available in `team/members/`
4. Office Manager's routing logic pre-configured for this industry

**Example AGENTS.md snippet:**
```markdown
## Your Team

You coordinate a team of specialists. Here's who you work with:

**Alex** (Customer Support Lead)
- Expertise: Customer emails, refunds, complaints, FAQ
- Invoke with: team/members/support.md
- Route when: User mentions customers, support, complaints, refunds

**Maya** (Marketing Strategist)
- Expertise: Social media, campaigns, product copy, SEO
- Invoke with: team/members/marketing.md
- Route when: User mentions marketing, social media, campaigns, promotion
```

### Environment Variables

```bash
TEAM_INDUSTRY=ecommerce
TEAM_CONFIG=/home/user/team/team-config.json
TEAM_MEMBERS_DIR=/home/user/team/members
```

---

## Onboarding Flow

### Step 1: Industry Selection

User presented with industry options:
- E-Commerce
- Law Firm
- Real Estate
- Agency (Marketing/Creative)
- SaaS
- Finance/Accounting
- General (No Specific Industry)

**UI:** Simple choice cards with icons and descriptions

### Step 2: Business Details

Quick form (5-10 fields):
- Business name
- What do you sell/do? (free text)
- Target customer type
- Current tools you use (optional)
- Brand voice preference (Professional / Friendly / Creative)

**Stored in:** USER.md in container

### Step 3: Team Preview

Show user their team:
- "Meet Your Team" page
- Each member with photo, name, role, expertise
- Example: "Maya will handle your marketing and social media"

**Goal:** Set expectations for what team can do

### Step 4: Container Deployed

Behind the scenes:
1. Provision OpenClaw container
2. Copy industry team template
3. Generate USER.md from onboarding answers
4. Start container with Office Manager

### Step 5: First Conversation

Office Manager sends first message:

```
Hi! I'm your Office Manager. I coordinate your team of specialists:

• Alex (Customer Support)
• Maya (Marketing)
• Sam (Business Analyst)
• Jordan (Content Writer)
• Riley (Operations)

Just tell me what you need, and I'll route it to the right person. What can we help with today?
```

**Total onboarding time:** Under 2 minutes

---

## Extensibility

### Adding Team Members

**Via Clawer.ai dashboard:**
1. User clicks "Add Team Member"
2. Chooses from template library (or creates custom)
3. Fills in: Name, Role, Expertise, Personality notes
4. System generates SOUL.md and updates team-config.json
5. Office Manager's AGENTS.md updated with new routing rules

**File changes:**
- New `team/members/newmember.md` created
- `team/team-config.json` updated
- `AGENTS.md` routing table updated

### Removing Team Members

**Via dashboard:**
1. User selects team member to remove
2. Confirm (warns if member has active tasks)
3. System removes from team-config.json
4. AGENTS.md routing updated

**Files remain** in team/members/ (in case user wants to re-add)

### Customizing Personalities

**Via dashboard:**
1. User clicks "Customize" on team member
2. Edits:
   - Name
   - Personality traits (dropdown + free text)
   - Communication style (formal/casual slider)
   - Expertise focus areas
3. System regenerates SOUL.md with new parameters

**Advanced:** Direct SOUL.md editing (for power users)

### Creating Custom Specialists

**Template system:**
1. User picks specialist archetype:
   - Researcher
   - Writer
   - Analyst
   - Coordinator
   - Domain Expert
2. Fills in customization form
3. System generates SOUL.md from template

**Example:** User creates "Video Script Writer" specialist
- Base: Writer archetype
- Customizations: Focus on video scripts, YouTube descriptions, hook writing
- Result: New team/members/videoscript.md with specialized instructions

### Team Presets

Users can save/share team configurations:
- "My E-Commerce Team" → Export as template
- Import community templates
- Fork and modify existing presets

---

## Technical Implementation Notes

### sessions_spawn Integration

**Office Manager spawns sub-agents:**

```python
# In Office Manager's context
result = sessions_spawn(
    label=f"{specialist_id}-{task_id}",
    soul_file=f"team/members/{specialist_id}.md",
    task=task_description,
    context_files=["USER.md", f"memory/{today}.md"],
    workspace="/home/user/workspace"
)
```

**Sub-agent receives:**
- Its SOUL.md as system prompt
- Task description as user message
- Access to shared files and workspace
- Instruction to complete task and report back

### Session Lifecycle

```
Office Manager (persistent)
    ↓ spawns
Sub-Agent (ephemeral)
    ↓ completes task
Returns result to Office Manager
    ↓ terminated
Office Manager continues
```

**Sessions are ephemeral** — they don't stay active. Office Manager is the only persistent session.

### Parallel Execution

When multiple specialists needed:

```python
results = []
for specialist in ["marketing", "writer"]:
    results.append(
        sessions_spawn(
            label=f"{specialist}-task",
            soul_file=f"team/members/{specialist}.md",
            task=task,
            async=True
        )
    )

# Wait for all to complete
wait_for_sessions(results)
synthesize_results(results)
```

### Error Handling

**If sub-agent fails:**
1. Office Manager detects timeout/error
2. Retries once with clarified task
3. If still fails, handles directly or informs user

**If specialist doesn't exist:**
1. Office Manager falls back to closest match
2. Or handles directly
3. Suggests user add this specialist type

---

## Performance Considerations

### Token Efficiency

**Problem:** Each sub-agent spawn has overhead

**Solutions:**
- Office Manager handles simple tasks directly (no spawn needed)
- Batch similar requests to one specialist
- Use compact task descriptions (no unnecessary context)

**Example:**
```
BAD: "The user asked about social media posts. They want 3 posts. The user runs an e-commerce store selling outdoor gear. They have a promotion running..."

GOOD: "Create 3 social media posts for winter gear sale (20% off, ends Feb 15). See USER.md for brand voice."
```

### Response Time

**User expectations:**
- Simple requests: <2 seconds (Office Manager handles)
- Specialist tasks: 5-30 seconds (sub-agent spawn + work)
- Complex multi-specialist: 30-60 seconds

**Progress indicators:**
- "I'll have Sam analyze that..." (user knows to wait)
- "Working on it..." (for longer tasks)

### Cost Optimization

- Use smaller models for Office Manager routing (GPT-4o-mini)
- Use larger models for specialist work (where quality matters)
- Cache common templates and responses
- Reuse analysis instead of re-running

---

## Success Metrics

### User Adoption
- % of users who complete onboarding
- % who send >10 messages in first week
- % who use team beyond first day

### Engagement
- Average messages per user per day
- % of requests successfully routed
- User satisfaction scores

### Routing Quality
- % of requests requiring re-routing
- Average specialist accuracy (did user get right specialist?)
- % of requests handled by Office Manager vs delegated

### Business Impact
- Time saved vs doing tasks manually
- Tasks completed per user per week
- User retention correlation with team usage

---

## Future Enhancements

### Phase 2: Team Collaboration
- Specialists can invoke other specialists
- Multi-step workflows (analyst → writer → support)
- Team "meetings" (multiple specialists in same session)

### Phase 3: Learning & Improvement
- Team learns from user feedback
- Routing improves over time
- Specialists adapt to user's business

### Phase 4: External Integrations
- Team members connect to user's actual tools (Shopify, Gmail, etc.)
- Real data access (not just workspace files)
- Automated task execution (not just drafts)

### Phase 5: Proactive Team
- Specialists suggest work without being asked
- Daily summaries and recommendations
- Alerts and monitoring

---

## Appendix: Example Conversations

### Example 1: Simple Request (Office Manager Handles)

```
User: What can this team help me with?

Office Manager: I coordinate five specialists for your e-commerce business:

• Alex handles customer support (emails, refunds, complaints)
• Maya manages marketing (social media, campaigns, product copy)
• Sam does business analysis (sales reports, trends, insights)
• Jordan writes content (product listings, blogs, newsletters)
• Riley handles operations (orders, shipping, vendors)

What do you need help with?
```

### Example 2: Single Specialist (Marketing)

```
User: I need 3 Instagram posts for our Valentine's Day sale

Office Manager: I'll have Maya create those for you.

[Maya spawned, creates posts]

Office Manager: Maya created 3 Valentine's Day posts:

**Post 1:** "Love is in the air... and so are savings! ❤️ 25% off couples' outdoor gear..."
**Post 2:** "Adventure awaits this Valentine's Day..."
**Post 3:** "Give the gift of adventure..."

[Full posts saved to workspace/drafts/instagram-vday-2026.md]

Want to adjust any of these?
```

### Example 3: Multi-Specialist (Parallel)

```
User: Analyze last month's sales and create a summary for our investors

Office Manager: I'll have Sam pull the analysis and Jordan write the summary.

[Sam and Jordan spawn in parallel]

Office Manager: Done. Sam found:
- 34% revenue growth
- Customer acquisition cost down 18%
- Repeat purchase rate up to 42%

Jordan turned this into an investor-ready summary highlighting strong unit economics and seasonal momentum.

[Full report: workspace/completed/jan-2026-investor-summary.pdf]
```

### Example 4: Sequential Handoff

```
User: A customer is angry about a late shipment. Draft a response and then have Riley check what happened with the order.

Office Manager: Alex will draft a response first, then Riley will investigate.

[Alex drafts empathetic email]

Office Manager: Here's Alex's response draft:

"Hi [Customer],

I completely understand your frustration..."

[Riley checks order status]

Riley found the issue: Carrier delayed the package by 3 days due to weather. It's now out for delivery today.

Want me to update Alex's email with the delivery ETA?
```

---

## Conclusion

AI Team turns OpenClaw's sub-agent capability into a **practical, user-friendly team experience**. Users get expert help without setup, and Clawer.ai gets a differentiated feature that's hard to replicate.

The system is:
- **Simple** — Industry presets, automatic routing, single chat interface
- **Extensible** — Users can customize teams as they grow
- **Efficient** — Sub-agents spawn only when needed
- **Practical** — Real work gets done, not just conversation

This is the foundation. Future phases add collaboration, learning, and integrations, but the core — a team that just works — ships now.

---

## UX: Team Sidebar & Activity Feed

### Design Direction: Hybrid (Office Manager + Direct Access)

**Default Mode: Office Manager Routes Everything**
- User talks to ONE chat interface
- Sidebar shows team members with live status:
  - 🟢 Maya (Marketing) — *Writing Instagram caption...*
  - 🔄 Sam (Analyst) — *Analyzing Q4 sales data...*
  - 💤 Alex (Support) — Idle
  - ✅ Jordan (Writer) — *Blog post draft complete*
- Click a persona → see their recent work/outputs (not a direct chat)
- Feels like managing a real team — watch them work in real-time

**Power User Mode: Direct Chat**
- Click a persona → "pull them into chat" for direct interaction
- Bypasses the Office Manager routing
- For users who know exactly which team member they need
- Visual indicator shows you're talking directly to a specific agent

**Why Hybrid:**
- Default is zero-config magic (Office Manager handles routing)
- Power users get direct control when they want it
- Activity feed is addictive — watching your team work in real-time
- Differentiator: "I have a chatbot" vs "I have a team"

**Sidebar Components:**
1. Team member avatar + name + role
2. Status indicator (idle/working/complete)
3. Current task description (streaming)
4. Click → expand to see recent outputs
5. Optional: "Talk directly" button for power users

**Implementation Notes:**
- Activity feed powered by sub-agent session events (already available via OpenClaw gateway)
- Status updates from sessions_list / sessions_history
- Real-time via WebSocket from container → Clawer app → browser
- Team member personas stored in container's team config
