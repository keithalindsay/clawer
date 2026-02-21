# Clawer.ai Onboarding & Retention Implementation Spec

> Version 1.0 | February 2026 | Implementation-Ready Specification

This document provides detailed implementation guidance for the Clawer.ai onboarding and retention system. It covers UI layouts, database schema, API endpoints, and prompts for each phase.

---

## Table of Contents

1. [Phase 1: Template Quick Starts + First Deliverable](#phase-1-template-quick-starts--first-deliverable)
2. [Phase 2: Morning Briefing System](#phase-2-morning-briefing-system)
3. [Phase 3: Day 1-7 Agent Messages](#phase-3-day-1-7-agent-messages)
4. [Phase 4: Memory Display](#phase-4-memory-display)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)

---

## Phase 1: Template Quick Starts + First Deliverable

### Overview

The new onboarding flow replaces the blank canvas problem with an immediate, personalized deliverable. Users complete 5 steps in under 4 minutes:

1. Welcome (existing)
2. Template Selection (enhanced)
3. Context Questions (NEW)
4. Channel Connection (NEW)
5. First Deliverable (NEW)

### Step 1: Welcome (Keep Existing)

**UI:** Keep existing welcome screen  
**DB Changes:** None  
**API:** None

---

### Step 2: Template Selection (Enhanced)

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  🦞 Clawer.ai                              Step 2 of 5      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Choose your team template                                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  🗂 Life OS      │  │  💼 Solopreneur  │                 │
│  │                  │  │                  │                 │
│  │  Personal       │  │  Business        │                 │
│  │  productivity   │  │  growth &        │                 │
│  │  assistant      │  │  content         │                 │
│  │                  │  │                  │                 │
│  │  Your first:    │  │  Your first:     │                 │
│  │  morning        │  │  week of         │                 │
│  │  briefing       │  │  LinkedIn ideas  │                 │
│  │  ready in 3min  │  │  personalized    │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  🎨 Content     │  │  🛍 E-Commerce   │                 │
│  │  Creator        │  │                  │                 │
│  │                  │  │                  │                 │
│  │  Content         │  │  Business        │                 │
│  │  planning &     │  │  intelligence    │                 │
│  │  repurposing    │  │  & operations    │                 │
│  │                  │  │                  │                 │
│  │  Your first:    │  │  Your first:     │                 │
│  │  4-week         │  │  competitor     │                 │
│  │  content        │  │  analysis       │                 │
│  │  calendar       │  │                  │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  📈 Growth Ops  │  │  💪 Fitness     │                 │
│  │                  │  │                  │                 │
│  │  Lead generation│  │  Training &     │                 │
│  │  & competitive  │  │  nutrition      │                 │
│  │  intelligence  │  │  coaching       │                 │
│  │                  │  │                  │                 │
│  │  Your first:    │  │  Your first:    │                 │
│  │  growth         │  │  4-week         │                 │
│  │  experiment     │  │  workout plan   │                 │
│  │  backlog        │  │                  │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  👩‍👧 Parent      │  │  💰 Finance      │                 │
│  │                  │  │                  │                 │
│  │  Family         │  │  Personal       │                 │
│  │  logistics &   │  │  finance        │                 │
│  │  scheduling    │  │  clarity        │                 │
│  │                  │  │                  │                 │
│  │  Your first:    │  │  Your first:    │                 │
│  │  family weekly  │  │  financial     │                 │
│  │  overview       │  │  snapshot       │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  [Back]                                      [Continue →]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Template Cards:**
- Grid: 2 columns on mobile, 4 columns on desktop
- Each card: 180px min-height, rounded-xl border
- Selected state: orange border, subtle orange bg tint
- Hover: slight lift (translateY -2px), shadow-md

**Component:**
```tsx
// components/onboarding/TemplateSelection.tsx
interface TemplateCardProps {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  firstDeliverable: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function TemplateSelection({ templates, selectedId, onSelect }: {
  templates: Template[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={cn(
            "p-4 rounded-xl border-2 text-left transition-all",
            selectedId === template.id
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 hover:border-gray-300 hover:-translate-y-0.5"
          )}
        >
          <span className="text-2xl mb-2 block">{template.emoji}</span>
          <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
          <p className="text-xs text-gray-500 mt-1">{template.tagline}</p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-orange-600 font-medium">Your first:</p>
            <p className="text-xs text-gray-600">{template.firstDeliverable}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
```

**DB Fields:** None (uses existing `team_config` field)  
**API:** None needed (client-side selection)

---

### Step 3: Context Questions (NEW)

**Philosophy:** These aren't profile questions—they're the agent's first instructions. Frame as "Your agent needs 3 things to start working for you."

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  🦞 Clawer.ai                              Step 3 of 5      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your agent needs 3 things to start working for you        │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ What's your business in one sentence?                 ││
│  │                                                         ││
│  │ [I help small businesses with marketing_______________]││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Who's your ideal customer?                             ││
│  │                                                         ││
│  │ [Small business owners aged 35-55___________________] ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ What platform do you post on most?                     ││
│  │                                                         ││
│  │  ○ Twitter   ○ LinkedIn   ○ Instagram   ○ TikTok     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Back]                                      [Continue →]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Template-Specific Questions:**

#### 1. LifeOS Template

| Question | Type | Options | DB Field |
|----------|------|---------|----------|
| What's your current biggest stress? | text | — | `onboarding_stress` |
| What do you want to start doing? | text | — | `onboarding_start` |
| What do you want to stop doing? | text | — | `onboarding_stop` |

#### 2. Solopreneur Template

| Question | Type | Options | DB Field |
|----------|------|---------|----------|
| What's your business in one sentence? | text | — | `onboarding_business` |
| Who's your ideal customer? | text | — | `onboarding_customer` |
| What platform do you post on most? | radio | Twitter, LinkedIn, Instagram, TikTok, YouTube, None | `onboarding_platform` |

#### 3. Content Creator Template

| Question | Type | Options | DB Field |
|----------|------|---------|----------|
| What's your content niche? | text | — | `onboarding_niche` |
| What platforms do you create for? | multi-select | YouTube, TikTok, Instagram, Twitter, LinkedIn, Podcast, Blog | `onboarding_platforms` |
| What's a piece of content that performed well? | text | — | `onboarding_best_content` |

#### 4. E-Commerce Template

| Question | Type | Options | DB Field |
|----------|------|---------|----------|
| What do you sell? | text | — | `onboarding_product` |
| Who's your main competitor? | text | — | `onboarding_competitor` |
| What's your biggest challenge? | radio | Traffic, Conversion, Retention, Pricing, Operations | `onboarding_challenge` |

#### 5. Growth Ops Template

| Question | Type | Options | DB Field |
|----------|------|---------|----------|
| What stage is your company? | radio | Pre-seed, Seed, Series A, Series B+ | `onboarding_stage` |
| What's your biggest growth blocker? | text | — | `onboarding_blocker` |
| What have you already tried? | text | — | `onboarding_tried` |

#### 6. Fitness Template

| Question | Type | Options | DB Field |
|----------|------|---------|----------|
| What's your main goal? | radio | Lose weight, Build muscle, General fitness, Athletic performance, Mobility | `onboarding_goal` |
| How many days per week can you train? | radio | 2, 3, 4, 5, 6, 7 | `onboarding_days` |
| Any injuries or restrictions? | text | — | `onboarding_restrictions` |

#### 7. Mom/Parent Template

| Question | Type | Options | DB Field |
|----------|------|---------|----------|
| How old are your kids? | text | — | `onboarding_kids_ages` |
| How complex is your schedule? | radio | Simple (1-2 activities/week), Moderate (3-5), Complex (6+) | `onboarding_schedule_complexity` |
| What's your biggest logistical pain point? | text | — | `onboarding_pain_point` |

#### 8. Finance Template

| Question | Type | Options | DB Field |
|----------|------|---------|----------|
| What's your primary financial goal? | radio | Save money, Invest, Get out of debt, Build wealth, Tax optimization | `onboarding_finance_goal` |
| What's your biggest money stress? | text | — | `onboarding_money_stress` |
| What's your approximate income range? | radio | Under $50k, $50k-$100k, $100k-$200k, $200k+ | `onboarding_income_range` |

**Component:**
```tsx
// components/onboarding/ContextQuestions.tsx
interface ContextQuestionsProps {
  templateId: string;
  questions: Question[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
}

export function ContextQuestions({ templateId, questions, answers, onAnswer }: ContextQuestionsProps) {
  return (
    <div className="space-y-6">
      <p className="text-gray-600">Your agent needs {questions.length} things to start working for you</p>
      {questions.map((q, i) => (
        <div key={q.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            {i + 1}. {q.question}
          </label>
          {q.type === 'text' && (
            <input
              type="text"
              value={answers[q.id] || ''}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder={q.placeholder}
            />
          )}
          {q.type === 'radio' && (
            <div className="flex flex-wrap gap-2">
              {q.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onAnswer(q.id, opt)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-colors",
                    answers[q.id] === opt
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          {q.type === 'multi-select' && (
            <div className="flex flex-wrap gap-2">
              {q.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    const current = (answers[q.id] || '').split(',').filter(Boolean);
                    const updated = current.includes(opt)
                      ? current.filter(v => v !== opt)
                      : [...current, opt];
                    onAnswer(q.id, updated.join(','));
                  }}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-colors",
                    (answers[q.id] || '').split(',').includes(opt)
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### Step 4: Channel Connection (NEW)

**Philosophy:** Ask after they've seen the deliverable (Step 5), but the flow has them at Step 4. This is when they're most likely to say yes—they just got value.

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  🦞 Clawer.ai                              Step 4 of 5      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Where should your agent reach you?                         │
│                                                             │
│  Connect a channel so your agent can send you updates.     │
│  Start with WhatsApp — it's the easiest way to get your    │
│  daily briefing.                                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  💬 WhatsApp                                            ││
│  │                                                         ││
│  │  Get your morning briefing as a text message.           ││
│  │  Most popular for daily updates.                        ││
│  │                                          [Connect →]   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  ✈️ Telegram                                            ││
│  │                                                         ││
│  │  Connect for the same experience via Telegram.          ││
│  │  Great for power users.                                ││
│  │                                          [Connect →]   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  💬 Slack                                               ││
│  │                                                         ││
│  │  Get updates in a Slack channel.                        ││
│  │  Best for team collaboration.                          ││
│  │                                          [Connect →]   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  🌐 Web only                                            ││
│  │                                                         ││
│  │  I'll check the app for updates.                       ││
│  │  You can connect channels later in Settings.          ││
│  │                                          [Select →]    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  [Back]                                      [Skip →]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**DB Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `preferred_channel` | enum | 'whatsapp', 'telegram', 'slack', 'web' |
| `whatsapp_connected` | boolean | Whether WhatsApp is connected |
| `telegram_connected` | boolean | Whether Telegram is connected |
| `slack_connected` | boolean | Whether Slack is connected |
| `morning_briefing_enabled` | boolean | Whether user wants daily briefing |
| `morning_briefing_time` | time | Time to send briefing (default: 07:30) |

**Component:**
```tsx
// components/onboarding/ChannelConnection.tsx
interface ChannelOptionProps {
  emoji: string;
  name: string;
  description: string;
  connected: boolean;
  onConnect: () => void;
  secondary?: string;
}

function ChannelOption({ emoji, name, description, connected, onConnect, secondary }: ChannelOptionProps) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{description}</p>
            {secondary && <p className="text-xs text-gray-400 mt-1">{secondary}</p>}
          </div>
        </div>
        {connected ? (
          <span className="text-green-600 text-sm font-medium">✓ Connected</span>
        ) : (
          <button onClick={onConnect} className="btn-secondary text-sm">
            Connect →
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### Step 5: First Deliverable (NEW)

**Philosophy:** This is the "Aha Moment." The user watches their deliverable generate live. It's personalized to their answers, genuinely useful, and slightly better than they expected.

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  🦞 Clawer.ai                              Step 5 of 5      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🎉 Your agent is working...                               │
│                                                             │
│  ████████████████░░░░░░  68%                               │
│  "Analyzing your business profile..."                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  📄 PREVIEW: Your Week of Content                      ││
│  │  ─────────────────────────────────                     ││
│  │  Monday: "The mistake I made as a                      ││
│  │  first-time founder (and what it                       ││
│  │  cost me)..."                                          ││
│  │                                                         ││
│  │  [generating 4 more posts...]                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ✓ Save to files        ✓ Send to WhatsApp                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Progress States:**
1. 0-20%: "Analyzing your answers..."
2. 20-50%: "Researching [niche] trends..."
3. 50-80%: "Creating your [deliverable type]..."
4. 80-95%: "Finalizing..."
5. 100%: "Done! Here's your [deliverable]"

**Component:**
```tsx
// components/onboarding/FirstDeliverable.tsx
interface FirstDeliverableProps {
  templateId: string;
  progress: number;
  statusMessage: string;
  deliverable: Deliverable | null;
  onSave: () => void;
  onSendToChannel: () => void;
}

export function FirstDeliverable({ 
  templateId, 
  progress, 
  statusMessage, 
  deliverable,
  onSave,
  onSendToChannel 
}: FirstDeliverableProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">🎉 Your agent is working...</p>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 text-center">{statusMessage}</p>
      </div>

      {/* Deliverable Preview */}
      {deliverable && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{deliverable.icon}</span>
            <h3 className="font-semibold text-gray-900">{deliverable.title}</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            {deliverable.content}
          </div>
        </div>
      )}

      {/* Actions */}
      {deliverable && (
        <div className="flex gap-3 justify-center">
          <button onClick={onSave} className="btn-secondary">
            ✓ Save to Files
          </button>
          <button onClick={onSendToChannel} className="btn-primary">
            📤 Send to {channelName}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Template-Specific First Deliverables

### 1. LifeOS → "Your Weekly Life Structure"

**Prompt:**
```
Based on the user's input:
- Biggest stress: {onboarding_stress}
- Want to start: {onboarding_start}
- Want to stop: {onboarding_stop}

Create a personalized weekly life structure that includes:
1. A suggested morning routine (specific times, specific activities)
2. Top 3 priorities for the week (derived from their "want to start")
3. One habit to focus on this week (derived from their "want to stop")

Format this as a clear, actionable document. Keep it warm but practical. The user is overwhelmed—they need simplicity, not another complex system.

Output as markdown.
```

**Deliverable Preview:**
```
## Your Week at a Glance

### Morning Routine (suggested)
- 6:30 AM: Wake up, drink water
- 6:45 AM: 10 min stretching
- 7:00 AM: Review 3 priorities

### This Week's Top 3 Priorities
1. [Priority 1 - from "want to start"]
2. [Priority 2]
3. [Priority 3]

### This Week's Focus Habit
[Habit] — Why: [connection to "want to stop"]
```

---

### 2. Solopreneur → "Your Week of Content Ideas"

**Prompt:**
```
The user runs: {onboarding_business}
Their ideal customer: {onboarding_customer}
They post most on: {onboarding_platform}

Generate 5 content ideas for this week, personalized to their business and platform. Each should include:
- Day/Theme
- Hook (first 3 lines that would make someone stop scrolling)
- Core message
- Call to action

Make it genuinely useful—not generic advice. It should sound like it could come from THEM, not a generic marketing template.

Output as markdown with clear formatting for each post.
```

**Deliverable Preview:**
```
## Your Week of Content

### Monday: "The Vulnerability Hook"
Hook: "I made $50K mistake as a first-time founder..."
Core: [lesson learned]
CTA: "Follow for more real talk"

[4 more posts...]
```

---

### 3. Content Creator → "Your 4-Week Content Calendar"

**Prompt:**
```
The creator's niche: {onboarding_niche}
Their platforms: {onboarding_platforms}
Their best performing content: {onboarding_best_content}

Create a 4-week content calendar with 3 posts per week (12 total).
For each post, include:
- Platform (optimized for each)
- Content type (video, carousel, thread, etc.)
- Hook/formula
- Topic

Group by week. Prioritize variety. Use their best content as a model for tone.

Output as markdown table/calendar format.
```

---

### 4. E-Commerce → "Competitor Analysis"

**Prompt:**
```
User sells: {onboarding_product}
Main competitor: {onboarding_competitor}
Biggest challenge: {onboarding_challenge}

Create a competitor analysis of {onboarding_competitor} that includes:
1. Their pricing strategy (estimate if needed)
2. Their unique selling proposition
3. 3 gaps in their positioning that the user could exploit
4. One specific recommendation for this week

Keep it actionable. This should feel like insights they couldn't get in 5 minutes themselves.

Output as a structured report.
```

---

### 5. Growth Ops → "Growth Experiment Backlog"

**Prompt:**
```
Company stage: {onboarding_stage}
Biggest growth blocker: {onboarding_blocker}
Already tried: {onboarding_tried}

Create a backlog of 10 growth experiments, prioritized by:
- Effort (Low/Medium/High)
- Potential Impact (Low/Medium/High)
- Suggested order

For each experiment, include:
- Name
- Hypothesis
- Success metric
- Quick implementation steps

Focus on experiments that address their specific blocker. Don't overwhelm—prioritize.

Output as a task board format.
```

---

### 6. Fitness → "4-Week Workout Plan"

**Prompt:**
```
User's goal: {onboarding_goal}
Training days per week: {onboarding_days}
Injuries/restrictions: {onboarding_restrictions or "None reported"}

Create a 4-week workout plan that:
1. Is progressive (each week builds on the last)
2. Fits their {onboarding_days} day availability
3. Accounts for any injuries/restrictions
4. Includes warmup, workout, and cooldown for each session

Format as a clean, saveable document. Include progression notes. This should feel like something a personal trainer would write—specific, not generic.

Output as markdown with clear day-by-day structure.
```

---

### 7. Mom/Parent → "Family Weekly Overview"

**Prompt:**
```
Kids' ages: {onboarding_kids_ages}
Schedule complexity: {onboarding_schedule_complexity}
Biggest pain point: {onboarding_pain_point}

Create a family weekly overview that includes:
1. This week's schedule (fill in with placeholder for known events)
2. 3 meal suggestions that work around the schedule
3. 3 tasks the agent can help with this week
4. One logistical tip based on their pain point

Make it warm and practical. This should feel like someone finally organized their week for them.

Output as a clear weekly summary.
```

---

### 8. Finance → "Financial Clarity Snapshot"

**Prompt:**
```
User's financial goal: {onboarding_finance_goal}
Biggest money stress: {onboarding_money_stress}
Income range: {onboarding_income_range}

Create a financial clarity snapshot that includes:
1. A plain-English summary of their situation
2. 3 concrete next actions (specific, not vague)
3. One insight relevant to their goal and stress

Cut through the noise. This should tell them exactly what to do, not overwhelm with generic advice.

Output as a simple, actionable document.
```

---

## Phase 2: Morning Briefing System

### User Configuration Flow

**Settings Location:** `/dashboard/settings` → "Morning Briefing" section

**UI:**

```
┌─────────────────────────────────────────────────────────────┐
│  Morning Briefing                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Toggle] Receive daily morning briefing        [ON]       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  What time?                                                 │
│  [07:30 ▼]  (Your timezone: CST)                          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  What's your preferred channel?                             │
│  ○ WhatsApp   ○ Telegram   ○ Slack                         │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  What should I always include?                             │
│  ☑ Quick summary of what you need to know today             │
│  ☑ One thing you're working on                             │
│  ☐ Reminders for upcoming events                           │
│  ☐ Industry news relevant to you                           │
│                                                             │
│  [Save Changes]                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**DB Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `morning_briefing_enabled` | boolean | false | Whether briefing is active |
| `morning_briefing_time` | time | 07:30 | Send time (user's local) |
| `morning_briefing_channel` | enum | 'whatsapp' | Delivery channel |
| `morning_briefing_include_summary` | boolean | true | Include daily summary |
| `morning_briefing_include_working` | boolean | true | Include current task |
| `morning_briefing_include_reminders` | boolean | false | Include reminders |
| `morning_briefing_include_news` | boolean | false | Include relevant news |
| `morning_briefing_timezone` | string | 'America/Chicago' | User's timezone |

**Settings Component:**
```tsx
// components/settings/MorningBriefingSettings.tsx
export function MorningBriefingSettings({ 
  settings, 
  onUpdate 
}: { 
  settings: MorningBriefingSettings;
  onUpdate: (settings: Partial<MorningBriefingSettings>) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Morning Briefing</h2>
      
      <div className="flex items-center justify-between">
        <span className="text-gray-700">Receive daily morning briefing</span>
        <Toggle 
          checked={settings.enabled}
          onChange={(enabled) => onUpdate({ enabled })}
        />
      </div>
      
      {settings.enabled && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              What time?
            </label>
            <select 
              value={settings.time}
              onChange={(e) => onUpdate({ time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return (
                  <option key={i} value={`${hour}:30`}>
                    {`${hour}:30`} ({settings.timezone})
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="space-y-3">
            <span className="block text-sm font-medium text-gray-700">
              What's your preferred channel?
            </span>
            <div className="flex gap-3">
              {['whatsapp', 'telegram', 'slack'].map((channel) => (
                <button
                  key={channel}
                  onClick={() => onUpdate({ channel: channel as any })}
                  className={cn(
                    "flex-1 py-3 rounded-lg border text-center capitalize",
                    settings.channel === channel
                      ? "bg-orange-50 border-orange-500 text-orange-700"
                      : "border-gray-300 text-gray-700"
                  )}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <span className="block text-sm font-medium text-gray-700">
              What should I always include?
            </span>
            {[
              { key: 'include_summary', label: 'Quick summary of what you need to know today' },
              { key: 'include_working', label: 'One thing you\'re working on' },
              { key: 'include_reminders', label: 'Reminders for upcoming events' },
              { key: 'include_news', label: 'Industry news relevant to you' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings[item.key as keyof MorningBriefingSettings] as boolean}
                  onChange={(e) => onUpdate({ [item.key]: e.target.checked })}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600">{item.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

---

### Per-Template Briefing Content

#### LifeOS Briefing

```
☀️ Good morning, {name}!

📋 TODAY'S PRIORITIES
{3 priorities from their stated goals}

🔄 FOCUS HABIT
{one habit they're working on}

{If reminders enabled:
📅 COMING UP
{upcoming events from calendar}
}

💡 Tip: You mentioned wanting to {start X}. Want me to work on that today?
```

#### Solopreneur Briefing

```
💼 Good morning, {name}!

📈 TODAY'S FOCUS
{top task from their queue}

📱 CONTENT PREVIEW
{1 content idea ready for today}

{If news enabled:
🎯 COMPETITOR WATCH
{1 relevant competitor update}
}

Quick ask: Want me to draft your {platform} post for today?
```

#### Content Creator Briefing

```
🎨 Good morning, {name}!

📅 TODAY'S SCHEDULE
{scheduled content for today}

🔥 TRENDING IN {NICHE}
{1-2 trending topics to consider}

💡 READY TO POST
{content that's ready to publish}

Want me to generate scripts for any of today's topics?
```

#### E-Commerce Briefing

```
🛍️ Good morning, {name}!

📊 TODAY'S METRICS
{quick sales/revenue snapshot if available}

⚔️ COMPETITOR ALERT
{any pricing/positioning changes from competitors}

💡 OPPORTUNITY
{one gap identified this week}

Action item: {specific recommendation}
```

#### Fitness Briefing

```
💪 Good morning, {name}!

🏋️ TODAY'S WORKOUT
{workout for today based on their plan}

🍎 NUTRITION NOTES
{quick meal suggestion or macro reminder}

📈 PROGRESS
{streak count, weight logged, etc.}

Log your workout when you're done and I'll adjust next week!
```

#### Mom/Parent Briefing

```
👩‍👧 Good morning, {name}!

📅 TODAY'S SCHEDULE
{all kids' activities}

🍽️ DINNER PLAN
{meal suggestion for tonight}

✅ QUICK TASKS
{3 things I can help with today}

Let me know if anything needs to shift!
```

#### Finance Briefing

```
💰 Good morning, {name}!

🎯 FOCUS: {their goal}
{1 actionable insight based on their goal}

📋 THIS WEEK'S ACTIONS
{3 action items}

💡 MONEY TIP
{one relevant tip based on their stress point}

Need me to track anything specific this week?
```

#### Growth Ops Briefing

```
📈 Good morning, {name}!

🎯 THIS WEEK'S EXPERIMENT
{top experiment from their backlog}

📊 COMPETITOR INTEL
{key competitor movement}

🛡️ WALL REPORT SUMMARY
{SEO/positioning snapshot}

Ready to run experiment #{n}?
```

---

### Cron Implementation

**Stack:** PostgreSQL + node-cron (or external scheduler like Inngest)

**Database Table:** `cron_jobs`

```sql
CREATE TABLE morning_briefing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  scheduled_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Cron Service:**

```typescript
// lib/cron/morningBriefing.ts
import { cron } from 'croner';

interface BriefJob {
  userId: string;
  timezone: string;
  time: string;
  channel: 'whatsapp' | 'telegram' | 'slack';
}

async function getActiveBriefingJobs(): Promise<BriefJob[]> {
  const now = new Date();
  const [hours, minutes] = getUserLocalTime(now, 'America/Chicago').split(':');
  
  return db.query.morningBriefingJobs.findMany({
    where: and(
      eq(morningBriefingJobs.enabled, true),
      // Match current hour/minute
    ),
  });
}

async function sendBriefing(userId: string, channel: string) {
  const user = await getUser(userId);
  const templateId = user.teamConfig;
  const briefing = await generateBriefing(templateId, user);
  
  switch (channel) {
    case 'whatsapp':
      await sendWhatsAppMessage(user.phone, briefing);
      break;
    case 'telegram':
      await sendTelegramMessage(user.telegramId, briefing);
      break;
    case 'slack':
      await sendSlackMessage(user.slackChannel, briefing);
      break;
  }
}

// Run every 5 minutes, check for jobs
cron('*/5 * * * *', async () => {
  const jobs = await getActiveBriefingJobs();
  for (const job of jobs) {
    await sendBriefing(job.userId, job.channel);
  }
});
```

---

### Opt-Out Mechanism

**In-Brief Opt-Out:**
```
💬 Reply "STOP" to any briefing to unsubscribe
💬 Reply "MUTE" to pause for 1 week
💬 Reply "CHANGE" to adjust timing
```

**Settings Page Opt-Out:**
- Toggle off "Receive daily morning briefing"
- Immediate effect—no pending messages

**Component:**
```tsx
// Quick toggle in settings header
<div className="flex items-center gap-3">
  <span className="text-sm text-gray-600">Morning Briefing</span>
  <Switch 
    checked={enabled}
    onChange={toggleEnabled}
  />
</div>
```

---

## Phase 3: Day 1-7 Agent Messages

### Message Timing & Channels

| Day | Time | Channel | Type |
|-----|------|---------|------|
| Day 1 | 6:00 PM local | Chat (in-app) | Recap + briefing setup |
| Day 2 | 8:00 AM local | WhatsApp/Telegram/Slack | First Morning Briefing (if opted in) |
| Day 3 | 10:00 AM local | WhatsApp/Telegram/Slack | Capability reveal |
| Day 4 | — | — | Silence (strategic) |
| Day 5 | 10:00 AM local | WhatsApp/Telegram/Slack | Re-engagement or milestone |
| Day 6 | 10:00 AM local | WhatsApp/Telegram/Slack | Feature depth |
| Day 7 | 10:00 AM local | WhatsApp/Telegram/Slack | Weekly recap + "unlock" |

### Skip Logic

**Skip Day 1:** If user has >10 messages on Day 1  
**Skip Day 2:** If user disabled morning briefing  
**Skip Day 3-7:** If user has >50 messages total (they're engaged, don't pester)

### Technical Trigger Mechanism

**Database Table:** `engagement_messages`

```sql
CREATE TABLE engagement_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  message_type TEXT NOT NULL, -- 'day1_recap', 'day2_briefing', etc.
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, skipped, failed
  skip_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Trigger Service:**

```typescript
// lib/engagement/triggerMessages.ts
async function scheduleEngagementSequence(userId: string, signupDate: Date) {
  const messages = [
    { type: 'day1_recap', offsetHours: 18 },
    { type: 'day2_briefing', offsetHours: 32 },  -- Day 2 morning
    { type: 'day3_capability', offsetHours: 58 },
    { type: 'day5_reengage', offsetHours: 106 },
    { type: 'day6_depth', offsetHours: 130 },
    { type: 'day7_recap', offsetHours: 154 },
  ];
  
  for (const msg of messages) {
    await db.insert.engagementMessages({
      userId,
      messageType: msg.type,
      scheduledFor: addHours(signupDate, msg.offsetHours),
      status: 'pending',
    });
  }
}
```

**Message Queue Worker:**

```typescript
// lib/workers/engagementWorker.ts
// Runs every 5 minutes
cron('*/5 * * * *', async () => {
  const pendingMessages = await db.query.engagementMessages.findMany({
    where: and(
      eq(engagementMessages.status, 'pending'),
      lte(engagementMessages.scheduledFor, new Date()),
    ),
    limit: 100,
  });
  
  for (const msg of pendingMessages) {
    // Check skip conditions
    const shouldSkip = await checkSkipConditions(msg);
    if (shouldSkip) {
      await updateMessageStatus(msg.id, 'skipped', shouldSkip.reason);
      continue;
    }
    
    // Send message
    try {
      await sendEngagementMessage(msg);
      await updateMessageStatus(msg.id, 'sent');
    } catch (error) {
      await updateMessageStatus(msg.id, 'failed');
    }
  }
});
```

---

### Exact Message Content

#### Day 1: Recap + Briefing Setup (6 PM)

```
Hey {name} 👋 Here's what I worked on for you today:

✅ Created your {deliverable_type} (saved to Files)
✅ Set up your {template_name} team
✅ Ready to help you every day

Want me to set up your morning briefing so I can update you daily?
[Yes, set it up] [Not now]
```

**Skip if:** User has >10 messages on Day 1

---

#### Day 2: First Morning Briefing (8 AM)

(If morning briefing enabled - see Phase 2 for template-specific content)

(If not enabled:)

```
Quick question — what would make me more useful to you?

A) Daily morning briefing (news, schedule, reminders)
B) Weekly content batch
C) Just ask when I need something
```

---

#### Day 3: Capability Reveal (10 AM)

**Based on usage:**

*If they only used chat:*
```
I can also create files and save research for you. 

Try: "Research {industry} trends and save a report"

I'll have it ready by tomorrow morning.
```

*If they created content:*
```
I can schedule your posts to auto-publish.

Just say "post my Monday content" and I'll handle it (after you approve).

Want to try?
```

*If they only asked questions:*
```
I can build task boards for you.

Say "create a project board for {project}" and I'll track tasks, deadlines, and follow up automatically.

Try it?
```

---

#### Day 4: Silence

No message. Strategic pause.

---

#### Day 5: Re-engagement or Milestone

**If active (user has messages on Day 3 or 4):**
```
You're on a 3-day streak 🔥

This week I:
• Answered {X} questions
• Created {X} files
• Saved ~{X} minutes

Most used: {feature_name}
Haven't tried yet: {feature_suggestion}

Want me to dig into anything specific?
```

**If inactive (last seen Day 1):**
```
Hey {name} — I noticed you haven't been back.

That's okay — I've been preparing something for you:

{Template-specific preview, e.g.:
"I researched 3 trending topics in your niche this week"
"I finished your competitor analysis"
"I've got your week 2 workout ready"}

Want to see it?
```

---

#### Day 6: Feature Depth (10 AM)

*Template-specific advanced feature:*

**Solopreneur:**
```
I can run a mini-competitor analysis whenever you want.

Just say "analyze {competitor name}" and I'll report back on their content, pricing, and positioning.

Want me to start with someone specific?
```

**Content Creator:**
```
I've been watching what's working in your niche. 

Want me to turn {trending_topic} into a full script? I'll have it ready in 10 minutes.
```

**Fitness:**
```
Your first week is in the books! 

Based on how you've been training, I've adjusted week 2 to focus more on {area needing attention}.

Want to see the updated plan?
```

---

#### Day 7: Weekly Recap + Unlock (10 AM)

```
Your first week with your team 📊

This week I:
✅ Created {X} files
✅ Answered {X} questions
✅ Saved you an estimated {X} hours

Your agent now knows your {context}. The more we work together, the better I get.

🎁 Week 2 unlock: I can now {new_capability}. Want to try it?

[Yes, show me] [Maybe later]
```

**New capabilities to unlock at Day 7:**
- LifeOS: "I can now proactively remind you about your habits — just tell me what to track"
- Solopreneur: "I can now monitor your competitors daily and alert you to changes"
- Content Creator: "I can now repurpose any video into content for every platform automatically"
- E-Commerce: "I can now track your competitor pricing in real-time"
- Fitness: "I can now adjust your program based on how each workout felt"
- Mom: "I can now manage family appointments and send reminders automatically"
- Finance: "I can now categorize expenses and flag unusual transactions"
- Growth Ops: "I can now run daily competitive intelligence reports"

---

## Phase 4: Memory Display

### Where Shown

**Location 1:** Dashboard sidebar (persistent)
```
┌────────────┐
│ 🦞          │
│            │
│ Your agent │
│ knows:     │
│            │
│ 31 days    │
│ of context │
│            │
│ View →     │
└────────────┘
```

**Location 2:** Profile/Settings page (detailed)

**Location 3:** Chat header (subtle)
```
💬 Chat with {team_name} (Day {n} of context)
```

### Visual Design

**Sidebar Card:**
```tsx
// components/dashboard/MemoryCard.tsx
export function MemoryCard({ days, stats }: { days: number; stats: MemoryStats }) {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🧠</span>
        <span className="text-sm font-medium text-gray-900">Your agent knows</span>
      </div>
      
      <div className="text-3xl font-bold text-orange-600">{days} days</div>
      <div className="text-xs text-gray-500">of context about you</div>
      
      <div className="mt-4 pt-4 border-t border-orange-100 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Conversations</span>
          <span className="font-medium text-gray-900">{stats.conversations}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Files created</span>
          <span className="font-medium text-gray-900">{stats.files}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Tasks completed</span>
          <span className="font-medium text-gray-900">{stats.tasks}</span>
        </div>
      </div>
      
      <button className="mt-4 w-full text-xs text-orange-600 hover:text-orange-700 font-medium">
        View details →
      </button>
    </div>
  );
}
```

**Memory Details Page:**
```tsx
// pages/dashboard/memory.tsx
export default function MemoryPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Agent's Memory</h1>
      
      {/* Timeline */}
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <span className="text-xl">📋</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Context learned</h3>
            <ul className="mt-2 space-y-1">
              <li className="text-sm text-gray-600">• Your business: {memory.business}</li>
              <li className="text-sm text-gray-600">• Your goals: {memory.goals}</li>
              <li className="text-sm text-gray-600">• Your preferences: {memory.preferences}</li>
            </ul>
          </div>
        </div>
        
        {/* More sections... */}
      </div>
      
      {/* Never resets message */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-100">
        <p className="text-sm text-green-800">
          ✓ Your agent's memory never resets. Even if you don't log in for a while, 
          your context accumulates. You can never lose progress with Clawer.ai.
        </p>
      </div>
    </div>
  );
}
```

### Data Pull Method

**Database Query:**

```typescript
// lib/memory/getUserMemory.ts
async function getUserMemory(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    include: {
      conversations: true,
      files: true,
      tasks: true,
      onboardingAnswers: true,
    },
  });
  
  const daysSinceSignup = differenceInDays(new Date(), user.createdAt);
  
  // Aggregate context
  const context = {
    business: user.onboarding_business,
    goals: user.onboarding_finance_goal || user.onboarding_goal,
    platforms: user.onboarding_platform,
    team: user.team_config,
    preferences: extractPreferences(user.conversations),
  };
  
  return {
    days: daysSinceSignup,
    stats: {
      conversations: user.conversations.length,
      files: user.files.length,
      tasks: user.tasks.filter(t => t.status === 'completed').length,
    },
    context,
  };
}
```

---

## Database Schema

### New Tables & Fields

```sql
-- Onboarding answers (per user)
ALTER TABLE users ADD COLUMN onboarding_template TEXT;
ALTER TABLE users ADD COLUMN onboarding_stress TEXT;
ALTER TABLE users ADD COLUMN onboarding_start TEXT;
ALTER TABLE users ADD COLUMN onboarding_stop TEXT;
ALTER TABLE users ADD COLUMN onboarding_business TEXT;
ALTER TABLE users ADD COLUMN onboarding_customer TEXT;
ALTER TABLE users ADD COLUMN onboarding_platform TEXT;
ALTER TABLE users ADD COLUMN onboarding_niche TEXT;
ALTER TABLE users ADD COLUMN onboarding_platforms TEXT;
ALTER TABLE users ADD COLUMN onboarding_best_content TEXT;
ALTER TABLE users ADD COLUMN onboarding_product TEXT;
ALTER TABLE users ADD COLUMN onboarding_competitor TEXT;
ALTER TABLE users ADD COLUMN onboarding_challenge TEXT;
ALTER TABLE users ADD COLUMN onboarding_stage TEXT;
ALTER TABLE users ADD COLUMN onboarding_blocker TEXT;
ALTER TABLE users ADD COLUMN onboarding_tried TEXT;
ALTER TABLE users ADD COLUMN onboarding_goal TEXT;
ALTER TABLE users ADD COLUMN onboarding_days TEXT;
ALTER TABLE users ADD COLUMN onboarding_restrictions TEXT;
ALTER TABLE users ADD COLUMN onboarding_kids_ages TEXT;
ALTER TABLE users ADD COLUMN onboarding_schedule_complexity TEXT;
ALTER TABLE users ADD COLUMN onboarding_pain_point TEXT;
ALTER TABLE users ADD COLUMN onboarding_finance_goal TEXT;
ALTER TABLE users ADD COLUMN onboarding_money_stress TEXT;
ALTER TABLE users ADD COLUMN onboarding_income_range TEXT;

-- Channel preferences
ALTER TABLE users ADD COLUMN preferred_channel TEXT DEFAULT 'web';
ALTER TABLE users ADD COLUMN whatsapp_connected BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN telegram_connected BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN slack_connected BOOLEAN DEFAULT false;

-- Morning briefing
ALTER TABLE users ADD COLUMN morning_briefing_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN morning_briefing_time TIME DEFAULT '07:30';
ALTER TABLE users ADD COLUMN morning_briefing_channel TEXT DEFAULT 'whatsapp';
ALTER TABLE users ADD COLUMN morning_briefing_timezone TEXT DEFAULT 'America/Chicago';
ALTER TABLE users ADD COLUMN morning_briefing_include_summary BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN morning_briefing_include_working BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN morning_briefing_include_reminders BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN morning_briefing_include_news BOOLEAN DEFAULT false;

-- Engagement tracking
CREATE TABLE engagement_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  message_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  skip_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL, -- 'conversation', 'file_created', 'task_completed', 'goal_set'
  content JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- First deliverable storage
CREATE TABLE first_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  template_id TEXT NOT NULL,
  content JSONB NOT NULL,
  viewed_at TIMESTAMPTZ,
  saved_at TIMESTAMPTZ,
  sent_to_channel BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## API Endpoints

### Onboarding Flow

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/onboarding/template` | POST | Save selected template |
| `/api/onboarding/context` | POST | Save context answers |
| `/api/onboarding/channel` | POST | Save channel preference |
| `/api/onboarding/deliverable` | POST | Generate first deliverable |
| `/api/onboarding/complete` | POST | Mark onboarding complete |

### Morning Briefing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings/briefing` | GET | Get briefing settings |
| `/api/settings/briefing` | PUT | Update briefing settings |
| `/api/settings/briefing/test` | POST | Send test briefing |

### Engagement

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/engagement/messages` | GET | Get user's scheduled messages |
| `/api/engagement/messages/:id/skip` | POST | Skip a message |
| `/api/engagement/messages/:id/send` | POST | Force send a message |

### Memory

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/memory` | GET | Get user's memory stats |
| `/api/memory/context` | GET | Get learned context |

### Example API Implementations

```typescript
// pages/api/onboarding/deliverable.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateFirstDeliverable } from '@/lib/ai/deliverable';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { templateId, answers } = await req.json();
  
  // Generate deliverable based on template
  const deliverable = await generateFirstDeliverable(templateId, answers);
  
  // Save to database
  const saved = await db.insert.firstDeliverables({
    userId: session.user.id,
    templateId,
    content: deliverable,
  });
  
  return NextResponse.json({ deliverable: saved });
}
```

```typescript
// pages/api/settings/briefing.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      morning_briefing_enabled: true,
      morning_briefing_time: true,
      morning_briefing_channel: true,
      morning_briefing_timezone: true,
      morning_briefing_include_summary: true,
      morning_briefing_include_working: true,
      morning_briefing_include_reminders: true,
      morning_briefing_include_news: true,
    },
  });
  
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const settings = await req.json();
  
  await db.update.users({
    ...settings,
  }).where(eq(users.id, session.user.id));
  
  // Update or create cron job
  await updateCronJob(session.user.id, settings);
  
  return NextResponse.json({ success: true });
}
```

---

## Implementation Priority

| Phase | Effort | Impact | Ship Week |
|-------|--------|--------|-----------|
| Phase 1: Template Quick Starts | 2 weeks | Highest | Week 1-2 |
| Phase 2: Morning Briefing | 2 weeks | High | Week 3-4 |
| Phase 3: Day 1-7 Messages | 1.5 weeks | Medium-High | Week 5-6 |
| Phase 4: Memory Display | 1 week | Medium | Week 7 |

---

## Key Metrics to Track

### Activation
- % users who view first deliverable
- % users who save first deliverable
- T2FD (Time to First Deliverable) — target: <4 minutes

### Retention
- Day 3 retention
- Day 7 retention
- Morning briefing opt-in rate
- Morning briefing retention (7-day)

### Engagement
- Messages sent Days 1-7
- Feature depth score by Day 7
- Agent-initiated message response rate

### Business
- Free → Pro conversion rate
- Time to upgrade

---

*End of Implementation Spec*
