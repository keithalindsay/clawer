# AI Team Dashboard — Product Spec

**Product:** Clawer.ai Web UI  
**Feature:** AI Team Dashboard (Multi-Agent Chat Interface)  
**Status:** Spec for MVP build  
**Target Ship:** Friday (1-2 day build)  
**Author:** Lex  
**Date:** 2026-02-11

---

## Problem

Users pick an "AI team" during onboarding (7 templates: Personal HQ, Solopreneur, E-commerce, Parent Command Center, Content Creator, Fitness, Finance). Each team has 3-5 named agents with distinct roles and personalities (e.g., Max the Chief of Staff, Scout the Researcher, Zen the Wellness Coach).

**Current experience:** After onboarding, users land in a SINGLE chat interface. The team they picked is invisible. It feels like a generic chatbot, not a team.

**User expectation:** Separate, named agents they can talk to individually — like having multiple Telegram chats with different specialists who collaborate behind the scenes.

**Inspiration:** Screenshot from @Saboo_Shubham_ showing 6 named AI agents (Monica, Ross, Dwight, Kelly, Rachel, Pam) as separate Telegram chats with distinct roles, daily reports, and cross-agent coordination.

---

## Solution

Transform the web UI from a single chat into a **team dashboard** with:
- Left sidebar showing all team members (like Slack/Telegram)
- Each agent has their own dedicated chat thread
- Agents respond in character with their distinct personality
- Optional activity feed showing what the team is working on
- Group "Team" chat for coordinating across all agents

---

## User Flow

### 1. Onboarding (unchanged)
- User selects team template (e.g., "Personal HQ")
- Container provisioned with team config loaded

### 2. Post-Onboarding Redirect → Dashboard
- User lands on `/dashboard` (not single chat)
- Sees sidebar with their team members
- Default view: "Team" group chat (or Chief of Staff for teams with default member)

### 3. Chat with Individual Agent
- User clicks "Scout" in sidebar
- Opens Scout's dedicated thread
- Previous conversation history with Scout loads
- Scout responds in character ("Hey! What should I dig into?")
- Recent activity module at top shows Scout's last 3 tasks (collapsible)

### 4. Switch Between Agents
- Click different agent → switch thread instantly
- Each thread maintains own history
- Unread badges appear when agent has proactive update (post-MVP)

### 5. Team Chat
- Top of sidebar: "Team" chat (emoji: 👥)
- Message here → all agents can see and respond
- Useful for "what should I focus on today?" questions

---

## Wireframe Description

### Layout
```
┌─────────────────────────────────────────────────────┐
│ [Clawer Logo]         [User Menu]     [Settings ⚙️] │
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│  SIDEBAR      │  CHAT VIEW                          │
│  (200px)      │  (Flex 1)                           │
│               │                                     │
│ 👥 Team       │  ┌───────────────────────────────┐ │
│ ────────────  │  │ Recent Activity (Scout) ▼     │ │
│ 📋 Max        │  │ • Researched SEO tools        │ │
│   Chief of    │  │ • Saved 3 articles on Notion  │ │
│   Staff       │  └───────────────────────────────┘ │
│               │                                     │
│ 🎯 North      │  [Chat messages with Scout...]     │
│   Goal        │                                     │
│   Tracker     │  User: Find best email tools       │
│               │  Scout: On it! Here are 5 options  │
│ 🔍 Scout  ●   │         with pros/cons...          │
│   Research    │                                     │
│   (active)    │  [Message input box]               │
│               │                                     │
│ ⚡ Dash       │                                     │
│   Task Runner │                                     │
│               │                                     │
│ 💪 Zen        │                                     │
│   Wellness    │                                     │
└───────────────┴─────────────────────────────────────┘
```

### Sidebar (Left Panel)

**Top:**
- "Team" group chat (👥 Team)
- Separator line

**Team Members:**
Each agent displays:
- Emoji avatar (from team config)
- Name (e.g., "Max")
- Role subtitle (e.g., "Chief of Staff")
- Online indicator (green dot, always on for MVP)
- Unread badge (post-MVP: red circle with count)

**Interaction:**
- Click agent → loads their thread
- Active agent highlighted with background color
- Hover shows tooltip with agent description

**Responsive:**
- Mobile: sidebar collapses to hamburger menu
- Tablet: sidebar pinned, 180px width

### Chat View (Right Panel)

**Header:**
- Agent name + emoji
- Role subtitle
- "What can I do?" info button → shows agent's expertise

**Recent Activity Module** (collapsible, below header):
- Shows last 3 actions/tasks agent completed
- Example: "Scout completed research on [topic]" (timestamp)
- Collapsed by default after first interaction
- Helps user understand what agent's been working on

**Chat Area:**
- Standard chat UI (messages, timestamps, user/agent distinction)
- Agent messages show agent emoji + name
- User messages right-aligned
- Markdown rendering for agent responses
- Scroll to bottom on new message

**Input Box:**
- Text area with "Message {Agent Name}..." placeholder
- Send button
- File attachment button (post-MVP)

### Activity Feed (Post-MVP, Optional Tab)

- Separate tab/view showing unified timeline
- All agents' activity aggregated
- "Max scheduled your morning briefing" (2 hours ago)
- "Scout completed research on email tools" (30 min ago)
- "Dash added 3 tasks to your list" (10 min ago)
- Click activity → jumps to relevant agent thread

---

## Data Model Changes

### New Tables/Collections

#### `agent_threads`
```sql
CREATE TABLE agent_threads (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  agent_id VARCHAR(50) NOT NULL, -- e.g., "chief-of-staff", "researcher"
  created_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP,
  UNIQUE(user_id, agent_id)
);
```

#### `messages` (extend existing)
Add columns:
```sql
ALTER TABLE messages
  ADD COLUMN agent_id VARCHAR(50), -- NULL for old messages
  ADD COLUMN thread_id UUID REFERENCES agent_threads(id);
```

#### `agent_activity` (post-MVP, for activity feed)
```sql
CREATE TABLE agent_activity (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id VARCHAR(50) NOT NULL,
  activity_type VARCHAR(50), -- "task_completed", "research_done", "report_sent"
  title TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Team Config Storage

**Option A:** Store in user metadata (simple, MVP)
```json
{
  "user_id": "uuid",
  "team_template": "lifeos", // team slug
  "team_config": { /* full config from team-config.json */ }
}
```

**Option B:** Separate `teams` table (future, if users can customize)

---

## API Changes

### New Endpoints

#### `GET /api/teams/current`
Returns user's team config (members, cadence, etc.)

**Response:**
```json
{
  "name": "Life OS",
  "members": [
    {
      "id": "chief-of-staff",
      "name": "Max",
      "role": "Chief of Staff",
      "emoji": "📋",
      "description": "Your right hand for prioritization and planning"
    },
    // ... other members
  ]
}
```

#### `GET /api/agents/:agent_id/thread`
Gets or creates thread for user + agent

**Response:**
```json
{
  "thread_id": "uuid",
  "agent_id": "researcher",
  "messages": [ /* message history */ ],
  "recent_activity": [
    {"title": "Researched email tools", "timestamp": "2026-02-11T10:30:00Z"}
  ]
}
```

#### `POST /api/messages` (extend existing)
Add `agent_id` parameter

**Request:**
```json
{
  "text": "Find the best email marketing tools",
  "agent_id": "researcher", // NEW
  "thread_id": "uuid" // optional, created if missing
}
```

**Backend routing:**
- Message sent to OpenClaw container with agent context
- System prompt includes agent's personality + role
- Agent's memory/context loaded from thread

#### `GET /api/agents/:agent_id/activity` (post-MVP)
Returns recent activity for activity feed

---

## Container Integration (Backend)

### How Messages Route to Agents

**Current:** Single chat → container receives message → generic AI response

**New:** Per-agent chat → container receives message **with agent context**

**Flow:**
1. Web UI sends message with `agent_id` and `thread_id`
2. API server loads:
   - Thread history (messages in this agent thread)
   - Agent config (name, role, personality, triggers)
   - User's team config
3. API constructs prompt:
   ```
   You are {Agent Name}, the {Role} on {User}'s team.
   
   Your personality: {from team template or agent description}
   Your expertise: {from triggers/description}
   
   Team members you can reference:
   - Max (Chief of Staff)
   - Scout (Researcher)
   - Dash (Task Runner)
   [etc.]
   
   Respond in character. Be helpful and collaborative.
   You can mention other team members' work when relevant.
   ```
4. Send to OpenClaw container
5. Container responds (same model, different persona)
6. Response saved to thread, returned to UI

### Cross-Agent References

**MVP approach:** Agent mentions other agents in response text
- "Scout found this research for you..." (manual, AI-generated)
- No actual cross-agent memory lookups

**Post-MVP:** Shared memory in container
- Agent can query: "What did Scout research recently?"
- Container searches Scout's thread, returns context
- Agent incorporates into response

### Team Chat (👥)

**Option A (MVP):** No agent_id, generic response
- User talks to "team"
- Container decides which agent(s) should respond
- Single response mentioning relevant agents

**Option B (post-MVP):** Multi-agent response
- Multiple agents can chime in
- "Max: Let's prioritize..." + "Scout: I can research..."
- Requires orchestration layer

**Recommendation for MVP:** Option A (simpler)

---

## Interaction with WhatsApp/Telegram

**Current:** Single bot number/account per user

**Challenge:** How does user talk to specific agents via WhatsApp?

**Solutions:**

### Option 1: Keyword routing (MVP-friendly)
- User message triggers agent selection via keywords
- WhatsApp message: "Scout, find email tools"
- Backend detects "@Scout" or keyword from agent's triggers
- Routes to Scout's thread

### Option 2: Buttons/menu (platform-dependent)
- WhatsApp: Send menu on first message ("Choose agent: 1=Max, 2=North...")
- User replies with number
- Session stores active agent
- "Switch to Scout" changes active agent

### Option 3: Separate numbers (expensive, not MVP)
- Each agent gets own WhatsApp number
- User saves 5 contacts for their team
- Requires 5x phone numbers per user

**Recommendation:** Option 1 (keyword routing) for MVP
- Web UI: explicit agent selection via sidebar
- WhatsApp/Telegram: "@AgentName" prefix or keyword detection
- Default to "team chat" if no agent specified

---

## MVP Scope (Build Friday)

### Must Have (Core Experience)
- [x] Sidebar with team members from user's template
- [x] Each agent clickable → opens dedicated thread
- [x] Thread maintains conversation history per agent
- [x] Agent responds with persona (system prompt includes role/personality)
- [x] "Team" group chat at top of sidebar
- [x] Responsive layout (desktop + mobile)
- [x] API endpoints: `/api/teams/current`, `/api/agents/:id/thread`
- [x] DB schema: `agent_threads` table, extend `messages`
- [x] Basic message routing with `agent_id`

### Nice to Ship (If Time Allows)
- [ ] Recent activity module (hardcoded "last 3 actions" placeholder)
- [ ] Agent online indicators (green dot, always on)
- [ ] Hover tooltips on agent sidebar items
- [ ] Empty state for new threads ("Hey! I'm Scout. What can I research?")

### Post-MVP (Next Week)
- [ ] Unread message badges
- [ ] Activity feed (separate view)
- [ ] Proactive agent messages (cron-driven)
- [ ] Agent-to-agent memory lookups (shared context)
- [ ] WhatsApp keyword routing (@AgentName detection)
- [ ] File attachments in chat
- [ ] Agent activity logging (auto-capture tasks completed)

---

## Nice-to-Have Enhancements (Future)

### Personalization
- User can rename agents ("Max" → "Sarah")
- Custom agent avatars (upload image)
- Add/remove team members (pick from agent library)

### Proactive Agents
- Morning report auto-sent by Chief of Staff (Max)
- Goal tracker (North) checks in weekly
- Wellness coach (Zen) sends evening wind-down prompt
- Cron jobs trigger agent-initiated messages

### Agent Collaboration UI
- "Scout is researching..." live status
- "Dash handed this off to Scout" handoff indicators
- Agent group discussions (multiple agents in one thread)

### Advanced Context Sharing
- Agents read each other's threads (with permission gates)
- "Scout, review what Max said about priorities"
- Cross-thread search ("What did any agent say about email tools?")

### Voice/Audio
- Voice input for messages
- Agent voice responses (TTS with distinct voices per agent)

---

## Estimated Effort

### MVP (Target: Friday, 1-2 days)

**Frontend (Web UI):**
- Sidebar component with team members: **2 hours**
- Chat view with thread switching: **3 hours**
- API integration (fetch team, load threads, send messages): **2 hours**
- Responsive layout tweaks: **1 hour**
- **Total Frontend: ~8 hours**

**Backend (API + DB):**
- DB migrations (agent_threads, extend messages): **1 hour**
- API endpoints (teams/current, agents/:id/thread): **2 hours**
- Message routing with agent_id: **2 hours**
- Agent persona prompt construction: **1 hour**
- **Total Backend: ~6 hours**

**Testing & Polish:**
- Manual testing (thread switching, message persistence): **2 hours**
- Bug fixes + edge cases: **2 hours**
- **Total Testing: ~4 hours**

**Grand Total MVP: ~18 hours (2 full days)**

### Post-MVP Features (Next Week)
- Activity feed: **4 hours**
- Proactive messages (cron setup): **3 hours**
- Unread badges: **2 hours**
- WhatsApp keyword routing: **3 hours**
- **Total Post-MVP: ~12 hours (1.5 days)**

---

## Success Metrics

### Qualitative (User Feedback)
- "This feels like I have a real team!"
- Users engage with multiple agents (not just one)
- Users reference agents by name in feedback

### Quantitative (Analytics)
- **Agent diversity:** % of users who message 3+ different agents/week
- **Thread retention:** Avg. messages per agent thread (target: 5+)
- **Engagement lift:** Messages/day before vs. after dashboard launch
- **Team chat usage:** % of messages sent to "Team" vs. individual agents

### Product Health
- Thread load time <500ms
- Zero thread history leakage (user A can't see user B's threads)
- Mobile responsive (works on 375px width)

---

## Open Questions / Decisions Needed

1. **Team chat behavior:** Should "Team" route to all agents or a generic responder?  
   **Rec:** Generic responder for MVP, multi-agent post-MVP

2. **Agent memory:** Do agents remember cross-thread context?  
   **Rec:** No for MVP (siloed threads), yes post-MVP (shared memory)

3. **WhatsApp routing:** How do users select agents via WhatsApp?  
   **Rec:** Keyword detection ("@Scout find...") for MVP

4. **Activity feed placement:** Separate tab or embedded in dashboard?  
   **Rec:** Separate tab post-MVP (keeps MVP simple)

5. **Thread limits:** Max threads per user? Delete old threads?  
   **Rec:** Unlimited for MVP, add cleanup cron if storage becomes issue

6. **Agent customization:** Can users rename/customize agents?  
   **Rec:** Not in MVP, consider for v2 (personalization play)

---

## Rollout Plan

### Phase 1: Soft Launch (MVP - Friday)
- Ship to team + 10 beta users
- Monitor for bugs (thread switching, message routing)
- Collect qualitative feedback

### Phase 2: Full Launch (MVP + Polish - Next Monday)
- Fix critical bugs from beta
- Add empty states + tooltips
- Announce in marketing email + X/Twitter

### Phase 3: Iteration (Post-MVP - Week 2)
- Add activity feed
- Enable proactive messages (morning reports)
- WhatsApp keyword routing

### Phase 4: Personalization (Month 2)
- Agent customization (rename, avatars)
- User can add/remove agents
- Custom team templates

---

## Risk Mitigation

### Risk: Users confused by multiple agents
**Mitigation:** 
- Onboarding tooltip: "Click an agent to chat 1-on-1"
- Default to "Team" chat (familiar single-chat experience)
- Agent descriptions on hover

### Risk: Thread history leakage (privacy bug)
**Mitigation:**
- Security audit: SQL queries must filter by `user_id` + `thread_id`
- Integration test: User A can't access User B's threads
- Code review before deploy

### Risk: Agent responses feel identical (no personality)
**Mitigation:**
- Test prompts with distinct agent personas before launch
- Include personality traits in system prompt ("Scout is curious and concise")
- A/B test with beta users: "Does Scout feel different from Max?"

### Risk: Performance (slow thread loads)
**Mitigation:**
- Index `agent_threads` table on `(user_id, agent_id)`
- Cache team config in Redis (avoid DB lookup per message)
- Paginate message history (load last 50, "Load more" for older)

---

## References

**Team Templates:**
- `~/projects/clawer/docker/openclaw-user/teams/lifeos/team-config.json`
- `~/projects/clawer/docker/openclaw-user/teams/solopreneur/team-config.json`
- `~/projects/clawer/docker/openclaw-user/teams/content-creator/team-config.json`
- `~/projects/clawer/docker/openclaw-user/teams/ecommerce/team-config.json`
- `~/projects/clawer/docker/openclaw-user/teams/mom/team-config.json`

**Inspiration:**
- @Saboo_Shubham_ screenshot (6 agents as separate Telegram chats)
- Slack multi-channel model
- Telegram group chat UX

**Related Docs:**
- OpenClaw container architecture
- Clawer.ai onboarding flow
- Message API spec

---

## Appendix: Example Agent Personas

### Max (Chief of Staff, Life OS)
```
You are Max, the Chief of Staff on {User}'s Life OS team.

Your role: Prioritization, planning, morning reports, weekly reviews, keeping everything on track.

Personality: Organized, proactive, concise. You think like an executive assistant who anticipates needs.

You work with:
- North (Goal Tracker) — you reference their progress when planning priorities
- Scout (Researcher) — you assign research tasks and incorporate findings
- Dash (Task Runner) — you delegate execution
- Zen (Wellness) — you balance productivity with well-being

Respond with clarity and structure. Use bullet points and checklists. Always be one step ahead.
```

### Scout (Researcher, Life OS)
```
You are Scout, the Research & Knowledge Manager on {User}'s team.

Your role: Find information, summarize articles, compare options, save knowledge.

Personality: Curious, thorough, concise. You love digging into topics and presenting clear takeaways.

You work with:
- Max (Chief of Staff) — you report findings to them for decision-making
- Dash (Task Runner) — you hand off actionable next steps
- North (Goal Tracker) — you research strategies to hit their goals

Respond with well-researched insights, pros/cons lists, and credible sources. Keep it scannable.
```

### Harper (Outreach Specialist, Solopreneur)
```
You are Harper, the Outreach Specialist on {User}'s Solopreneur team.

Your role: Draft cold emails, follow-ups, partnership pitches, track relationships.

Personality: Friendly, strategic, persuasive. You write like a human, not a bot.

You work with:
- Claire (Executive Assistant) — you get context on priorities and deadlines
- Leo (Research Analyst) — you use their research to personalize outreach

Respond with email drafts, subject line ideas, and follow-up cadences. Always optimize for reply rates.
```

---

**End of Spec**

**Next Steps:**
1. Review with team (get feedback on scope/timeline)
2. Create GitHub issues for MVP tasks
3. Assign frontend + backend devs
4. Schedule design review (wireframe → mockup)
5. Ship Friday 🚀
