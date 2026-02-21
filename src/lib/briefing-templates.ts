/**
 * Clawer.ai Morning Briefing Templates
 *
 * Each template defines the message format and AI prompt used to
 * generate personalized daily briefings for a given team template.
 *
 * Variables in message bodies use {curly_brace} syntax and are
 * substituted at send time from the user's profile / onboarding data.
 */

export type BriefingTemplateId =
  | 'lifeos'
  | 'solopreneur'
  | 'content-creator'
  | 'ecommerce'
  | 'growth-ops'
  | 'fitness'
  | 'parent'
  | 'finance';

export interface BriefingTemplate {
  id: BriefingTemplateId;
  /** Human-readable name */
  name: string;
  /** Static message body sent to the user (with {variable} placeholders) */
  messageTemplate: string;
  /**
   * AI prompt used to generate dynamic content inserted into the message.
   * Not sent directly to the user — output is rendered into messageTemplate.
   */
  aiPrompt: string;
  /** Variables required by this template */
  requiredVars: string[];
}

export const BRIEFING_TEMPLATES: Record<BriefingTemplateId, BriefingTemplate> = {

  /* ── LifeOS ──────────────────────────────────────────────────── */
  lifeos: {
    id: 'lifeos',
    name: 'Personal Assistant',
    messageTemplate: `☀️ Good morning, {name}!

📋 TODAY'S PRIORITIES
{priorities}

🔄 FOCUS HABIT
{habit}

{reminders_section}💡 Tip: You mentioned wanting to {onboarding_start}. Want me to work on that today?`,
    aiPrompt: `Based on the user's life goals:
- Biggest stress: {onboarding_stress}
- Want to start: {onboarding_start}
- Want to stop: {onboarding_stop}

Generate a morning briefing with:
1. Three specific, actionable priorities for today (derived from their goals)
2. One focus habit directly related to what they want to stop

Format:
PRIORITIES:
1. [Priority]
2. [Priority]
3. [Priority]

HABIT:
[One habit to focus on today and why it matters]

Keep it warm, practical, and specific. Not generic advice.`,
    requiredVars: ['name', 'onboarding_stress', 'onboarding_start', 'onboarding_stop'],
  },

  /* ── Solopreneur ─────────────────────────────────────────────── */
  solopreneur: {
    id: 'solopreneur',
    name: 'Solopreneur',
    messageTemplate: `💼 Good morning, {name}!

📈 TODAY'S FOCUS
{focus_task}

📱 CONTENT PREVIEW
{content_idea}

{news_section}Quick ask: Want me to draft your {onboarding_platform} post for today?`,
    aiPrompt: `The user runs: {onboarding_business}
Their ideal customer: {onboarding_customer}
They post most on: {onboarding_platform}

Generate a morning briefing with:
1. One high-leverage focus task for today based on their business
2. One content idea ready to write, tailored to their platform and audience

Format:
FOCUS_TASK:
[Specific task with clear outcome]

CONTENT_IDEA:
[Hook + brief outline for today's post]

Make it sound like it came from someone who knows their business. Not generic marketing advice.`,
    requiredVars: ['name', 'onboarding_business', 'onboarding_customer', 'onboarding_platform'],
  },

  /* ── Content Creator ─────────────────────────────────────────── */
  'content-creator': {
    id: 'content-creator',
    name: 'Content Creator',
    messageTemplate: `🎨 Good morning, {name}!

📅 TODAY'S SCHEDULE
{content_schedule}

🔥 TRENDING IN {niche_upper}
{trending_topics}

💡 READY TO POST
{ready_content}

Want me to generate scripts for any of today's topics?`,
    aiPrompt: `The creator's niche: {onboarding_niche}
Their platforms: {onboarding_platforms}
Their best performing content: {onboarding_best_content}

Generate a morning briefing with:
1. Today's content schedule (what to create / post today)
2. Two trending topics in their niche worth covering
3. One piece of content that's ready to publish based on their calendar

Format:
SCHEDULE:
[Specific platform + content type + topic for today]

TRENDING:
- [Topic 1 and why it's trending]
- [Topic 2 and why it's trending]

READY_TO_POST:
[Content ready to go, with suggested caption/hook]

Be specific to their niche. Reference their best content as a style guide.`,
    requiredVars: ['name', 'onboarding_niche', 'onboarding_platforms', 'onboarding_best_content'],
  },

  /* ── E-Commerce ──────────────────────────────────────────────── */
  ecommerce: {
    id: 'ecommerce',
    name: 'Business Ops',
    messageTemplate: `🛍️ Good morning, {name}!

📊 TODAY'S METRICS
{metrics}

⚔️ COMPETITOR ALERT
{competitor_update}

💡 OPPORTUNITY
{opportunity}

Action item: {action_item}`,
    aiPrompt: `User sells: {onboarding_product}
Main competitor: {onboarding_competitor}
Biggest challenge: {onboarding_challenge}

Generate a morning briefing with:
1. A brief metrics focus for today (what to check / what matters)
2. One competitor insight worth knowing this week
3. One actionable opportunity based on their challenge
4. A single clear action item for today

Format:
METRICS:
[What to review and why today]

COMPETITOR_UPDATE:
[Insight about {onboarding_competitor} and what it means for them]

OPPORTUNITY:
[Specific gap or opening they can exploit this week]

ACTION_ITEM:
[Single clear thing to do today]

Be direct and specific. They want intelligence, not fluff.`,
    requiredVars: ['name', 'onboarding_product', 'onboarding_competitor', 'onboarding_challenge'],
  },

  /* ── Growth Ops ──────────────────────────────────────────────── */
  'growth-ops': {
    id: 'growth-ops',
    name: 'Growth Ops',
    messageTemplate: `📈 Good morning, {name}!

🎯 THIS WEEK'S EXPERIMENT
{experiment}

📊 COMPETITOR INTEL
{competitor_intel}

🛡️ POSITIONING NOTE
{positioning_note}

Ready to move on this?`,
    aiPrompt: `Company stage: {onboarding_stage}
Biggest growth blocker: {onboarding_blocker}
Already tried: {onboarding_tried}

Generate a morning briefing with:
1. The top growth experiment to run this week (hypothesis + success metric)
2. One competitor intelligence note relevant to their stage and blocker
3. One positioning insight for today

Format:
EXPERIMENT:
Name: [Experiment name]
Hypothesis: [If we do X, we expect Y because Z]
Metric: [How to measure success]
Start: [First step to run today]

COMPETITOR_INTEL:
[Specific intelligence and what it implies for their growth]

POSITIONING_NOTE:
[One tactical positioning move to consider]

Be crisp. Think like a growth operator, not a consultant.`,
    requiredVars: ['name', 'onboarding_stage', 'onboarding_blocker', 'onboarding_tried'],
  },

  /* ── Fitness ─────────────────────────────────────────────────── */
  fitness: {
    id: 'fitness',
    name: 'Fitness',
    messageTemplate: `💪 Good morning, {name}!

🏋️ TODAY'S WORKOUT
{workout}

🍎 NUTRITION NOTES
{nutrition}

📈 PROGRESS
{progress}

Log your workout when you're done and I'll adjust next week!`,
    aiPrompt: `User's goal: {onboarding_goal}
Training days per week: {onboarding_days}
Injuries/restrictions: {onboarding_restrictions}

Generate a morning briefing with:
1. Today's specific workout (exercises, sets, reps — not vague)
2. A nutrition tip relevant to their goal
3. A progress reminder to keep them motivated

Format:
WORKOUT:
[Warmup → Main workout (specific exercises + sets/reps) → Cooldown]
Note: Must account for restrictions: {onboarding_restrictions}

NUTRITION:
[One specific, actionable nutrition tip for today based on their goal]

PROGRESS:
[Motivating progress note — streak, what to celebrate, what to watch]

Make it feel like a personal trainer wrote it, not a generic app.`,
    requiredVars: ['name', 'onboarding_goal', 'onboarding_days', 'onboarding_restrictions'],
  },

  /* ── Parent ──────────────────────────────────────────────────── */
  parent: {
    id: 'parent',
    name: 'Parent',
    messageTemplate: `👩‍👧 Good morning, {name}!

📅 TODAY'S SCHEDULE
{schedule}

🍽️ DINNER PLAN
{dinner}

✅ QUICK TASKS
{tasks}

Let me know if anything needs to shift!`,
    aiPrompt: `Kids' ages: {onboarding_kids_ages}
Schedule complexity: {onboarding_schedule_complexity}
Biggest pain point: {onboarding_pain_point}

Generate a morning briefing with:
1. A suggested daily schedule structure for a family with kids aged {onboarding_kids_ages}
2. One practical dinner suggestion that fits a {onboarding_schedule_complexity} schedule
3. Three quick tasks the parent can delegate or knock out today

Format:
SCHEDULE:
[Time blocks for the day, tailored to complexity level]

DINNER:
[Meal name + why it fits the schedule + quick prep tip]

TASKS:
1. [Task]
2. [Task]
3. [Task]

Make it warm and practical. This parent is tired — make it feel like someone organized their day for them.`,
    requiredVars: [
      'name',
      'onboarding_kids_ages',
      'onboarding_schedule_complexity',
      'onboarding_pain_point',
    ],
  },

  /* ── Finance ─────────────────────────────────────────────────── */
  finance: {
    id: 'finance',
    name: 'Finance',
    messageTemplate: `💰 Good morning, {name}!

🎯 FOCUS: {onboarding_finance_goal}
{goal_insight}

📋 THIS WEEK'S ACTIONS
{weekly_actions}

💡 MONEY TIP
{money_tip}

Need me to track anything specific this week?`,
    aiPrompt: `User's financial goal: {onboarding_finance_goal}
Biggest money stress: {onboarding_money_stress}
Income range: {onboarding_income_range}

Generate a morning briefing with:
1. One specific insight based on their goal (not generic advice)
2. Three concrete action items for this week
3. One money tip directly related to their stress

Format:
GOAL_INSIGHT:
[Specific, actionable insight that moves them toward {onboarding_finance_goal}]

WEEKLY_ACTIONS:
1. [Action — specific, not "budget better"]
2. [Action]
3. [Action]

MONEY_TIP:
[One tip directly addressing: {onboarding_money_stress}]

Be direct. Cut through noise. Tell them exactly what to do.`,
    requiredVars: [
      'name',
      'onboarding_finance_goal',
      'onboarding_money_stress',
      'onboarding_income_range',
    ],
  },
};

/**
 * Get a briefing template by ID, with fallback to lifeos
 */
export function getBriefingTemplate(templateId: string): BriefingTemplate {
  return (
    BRIEFING_TEMPLATES[templateId as BriefingTemplateId] ?? BRIEFING_TEMPLATES.lifeos
  );
}

/**
 * Substitute {variable} placeholders in a template string
 */
export function substituteTemplateVars(
  template: string,
  vars: Record<string, string | undefined>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] ?? match;
  });
}

/**
 * Build briefing content preferences summary for a user
 */
export function buildBriefingContentPrefs(user: {
  briefingIncludeSummary?: number | null;
  briefingIncludeWorking?: number | null;
  briefingIncludeReminders?: number | null;
  briefingIncludeNews?: number | null;
}): {
  includeSummary: boolean;
  includeWorking: boolean;
  includeReminders: boolean;
  includeNews: boolean;
} {
  return {
    includeSummary: !!user.briefingIncludeSummary,
    includeWorking: !!user.briefingIncludeWorking,
    includeReminders: !!user.briefingIncludeReminders,
    includeNews: !!user.briefingIncludeNews,
  };
}
