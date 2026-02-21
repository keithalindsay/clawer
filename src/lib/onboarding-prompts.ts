/**
 * Onboarding template prompts and configuration
 * Phase 1: Template Quick Starts + First Deliverable
 */

export interface Question {
  id: string;
  question: string;
  type: 'text' | 'radio' | 'multi-select';
  placeholder?: string;
  options?: string[];
  dbField: string;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  firstDeliverable: string;
  deliverableIcon: string;
  deliverableTitle: string;
  questions: Question[];
}

/** All 8 onboarding templates with their questions and deliverable metadata */
export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    id: 'lifeos',
    name: 'Personal Assistant',
    emoji: '🗂',
    tagline: 'Personal productivity assistant',
    firstDeliverable: 'morning briefing ready in 3min',
    deliverableIcon: '📋',
    deliverableTitle: 'Your Weekly Life Structure',
    questions: [
      {
        id: 'stress',
        question: "What's your current biggest stress?",
        type: 'text',
        placeholder: "e.g. I'm overwhelmed with too many tasks and no system",
        dbField: 'onboarding_stress',
      },
      {
        id: 'start',
        question: 'What do you want to start doing?',
        type: 'text',
        placeholder: 'e.g. Exercise daily, read more, respond to emails faster',
        dbField: 'onboarding_start',
      },
      {
        id: 'stop',
        question: 'What do you want to stop doing?',
        type: 'text',
        placeholder: 'e.g. Scrolling social media at night, saying yes to everything',
        dbField: 'onboarding_stop',
      },
    ],
  },
  {
    id: 'solopreneur',
    name: 'Solopreneur',
    emoji: '💼',
    tagline: 'Business growth & content',
    firstDeliverable: 'week of LinkedIn ideas personalized',
    deliverableIcon: '📱',
    deliverableTitle: 'Your Week of Content Ideas',
    questions: [
      {
        id: 'business',
        question: "What's your business in one sentence?",
        type: 'text',
        placeholder: 'e.g. I help small businesses with marketing automation',
        dbField: 'onboarding_business',
      },
      {
        id: 'customer',
        question: "Who's your ideal customer?",
        type: 'text',
        placeholder: 'e.g. Small business owners aged 35-55 in the US',
        dbField: 'onboarding_customer',
      },
      {
        id: 'platform',
        question: 'What platform do you post on most?',
        type: 'radio',
        options: ['Twitter', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube', 'None yet'],
        dbField: 'onboarding_platform',
      },
    ],
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    emoji: '🎨',
    tagline: 'Content planning & repurposing',
    firstDeliverable: '4-week content calendar',
    deliverableIcon: '📅',
    deliverableTitle: 'Your 4-Week Content Calendar',
    questions: [
      {
        id: 'niche',
        question: "What's your content niche?",
        type: 'text',
        placeholder: 'e.g. Personal finance for millennials, fitness for busy moms',
        dbField: 'onboarding_niche',
      },
      {
        id: 'platforms',
        question: 'What platforms do you create for?',
        type: 'multi-select',
        options: ['YouTube', 'TikTok', 'Instagram', 'Twitter', 'LinkedIn', 'Podcast', 'Blog'],
        dbField: 'onboarding_platforms',
      },
      {
        id: 'best_content',
        question: "What's a piece of content that performed well?",
        type: 'text',
        placeholder: 'e.g. My video about passive income got 500K views',
        dbField: 'onboarding_best_content',
      },
    ],
  },
  {
    id: 'ecommerce',
    name: 'Business Ops',
    emoji: '🛍',
    tagline: 'Business intelligence & operations',
    firstDeliverable: 'competitor analysis',
    deliverableIcon: '📊',
    deliverableTitle: 'Competitor Analysis',
    questions: [
      {
        id: 'product',
        question: 'What do you sell?',
        type: 'text',
        placeholder: 'e.g. Handmade leather goods, skincare products, tech accessories',
        dbField: 'onboarding_product',
      },
      {
        id: 'competitor',
        question: "Who's your main competitor?",
        type: 'text',
        placeholder: 'e.g. Brand name or website URL',
        dbField: 'onboarding_competitor',
      },
      {
        id: 'challenge',
        question: "What's your biggest challenge?",
        type: 'radio',
        options: ['Traffic', 'Conversion', 'Retention', 'Pricing', 'Operations'],
        dbField: 'onboarding_challenge',
      },
    ],
  },
  {
    id: 'growth-ops',
    name: 'Growth Ops',
    emoji: '📈',
    tagline: 'Lead generation & competitive intelligence',
    firstDeliverable: 'growth experiment backlog',
    deliverableIcon: '🎯',
    deliverableTitle: 'Growth Experiment Backlog',
    questions: [
      {
        id: 'stage',
        question: "What stage is your company?",
        type: 'radio',
        options: ['Pre-seed', 'Seed', 'Series A', 'Series B+'],
        dbField: 'onboarding_stage',
      },
      {
        id: 'blocker',
        question: "What's your biggest growth blocker?",
        type: 'text',
        placeholder: 'e.g. Not enough qualified leads, high churn, CAC too high',
        dbField: 'onboarding_blocker',
      },
      {
        id: 'tried',
        question: 'What have you already tried?',
        type: 'text',
        placeholder: 'e.g. Content marketing, paid ads, cold outreach — nothing stuck',
        dbField: 'onboarding_tried',
      },
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    emoji: '💪',
    tagline: 'Training & nutrition coaching',
    firstDeliverable: '4-week workout plan',
    deliverableIcon: '🏋️',
    deliverableTitle: 'Your 4-Week Workout Plan',
    questions: [
      {
        id: 'goal',
        question: "What's your main goal?",
        type: 'radio',
        options: ['Lose weight', 'Build muscle', 'General fitness', 'Athletic performance', 'Mobility'],
        dbField: 'onboarding_goal',
      },
      {
        id: 'days',
        question: 'How many days per week can you train?',
        type: 'radio',
        options: ['2', '3', '4', '5', '6', '7'],
        dbField: 'onboarding_days',
      },
      {
        id: 'restrictions',
        question: 'Any injuries or restrictions?',
        type: 'text',
        placeholder: 'e.g. Bad knees, lower back issues, or "None"',
        dbField: 'onboarding_restrictions',
      },
    ],
  },
  {
    id: 'mom',
    name: 'Parent Central',
    emoji: '👩‍👧',
    tagline: 'Family logistics & scheduling',
    firstDeliverable: 'family weekly overview',
    deliverableIcon: '📅',
    deliverableTitle: 'Family Weekly Overview',
    questions: [
      {
        id: 'kids_ages',
        question: 'How old are your kids?',
        type: 'text',
        placeholder: 'e.g. 4 and 7, or "Toddler and teen"',
        dbField: 'onboarding_kids_ages',
      },
      {
        id: 'schedule_complexity',
        question: "How complex is your schedule?",
        type: 'radio',
        options: ['Simple (1-2 activities/week)', 'Moderate (3-5)', 'Complex (6+)'],
        dbField: 'onboarding_schedule_complexity',
      },
      {
        id: 'pain_point',
        question: "What's your biggest logistical pain point?",
        type: 'text',
        placeholder: 'e.g. School pickups conflict with work calls, meal planning chaos',
        dbField: 'onboarding_pain_point',
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    emoji: '💰',
    tagline: 'Personal finance clarity',
    firstDeliverable: 'financial snapshot',
    deliverableIcon: '💡',
    deliverableTitle: 'Financial Clarity Snapshot',
    questions: [
      {
        id: 'finance_goal',
        question: "What's your primary financial goal?",
        type: 'radio',
        options: ['Save money', 'Invest', 'Get out of debt', 'Build wealth', 'Tax optimization'],
        dbField: 'onboarding_finance_goal',
      },
      {
        id: 'money_stress',
        question: "What's your biggest money stress?",
        type: 'text',
        placeholder: 'e.g. I spend too much and never save, uncertain about investing',
        dbField: 'onboarding_money_stress',
      },
      {
        id: 'income_range',
        question: "What's your approximate income range?",
        type: 'radio',
        options: ['Under $50k', '$50k-$100k', '$100k-$200k', '$200k+'],
        dbField: 'onboarding_income_range',
      },
    ],
  },
];

/** Get a template by ID */
export function getOnboardingTemplate(templateId: string): OnboardingTemplate | undefined {
  return ONBOARDING_TEMPLATES.find(t => t.id === templateId);
}

/** Progress status messages for the generation animation */
export const PROGRESS_MESSAGES = [
  'Analyzing your answers...',
  'Understanding your context...',
  'Crafting your personalized plan...',
  'Adding final touches...',
  'Almost ready...',
];

/**
 * Build the AI prompt for generating the first deliverable.
 * Substitutes onboarding answers into template-specific prompts.
 */
export function buildFirstDeliverablePrompt(
  templateId: string,
  answers: Record<string, string>
): string {
  switch (templateId) {
    case 'lifeos':
      return `Based on the user's input:
- Biggest stress: ${answers.stress || 'Not specified'}
- Want to start: ${answers.start || 'Not specified'}
- Want to stop: ${answers.stop || 'Not specified'}

Create a personalized weekly life structure that includes:
1. A suggested morning routine (specific times, specific activities)
2. Top 3 priorities for the week (derived from their "want to start")
3. One habit to focus on this week (derived from their "want to stop")

Format this as a clear, actionable document. Keep it warm but practical. The user is overwhelmed — they need simplicity, not another complex system.

Output as markdown with clear sections.`;

    case 'solopreneur':
      return `The user runs: ${answers.business || 'their business'}
Their ideal customer: ${answers.customer || 'Not specified'}
They post most on: ${answers.platform || 'Not specified'}

Generate 5 content ideas for this week, personalized to their business and platform. Each should include:
- Day/Theme
- Hook (first 3 lines that would make someone stop scrolling)
- Core message
- Call to action

Make it genuinely useful — not generic advice. It should sound like it could come from THEM, not a generic marketing template.

Output as markdown with clear formatting for each post.`;

    case 'content-creator':
      return `The creator's niche: ${answers.niche || 'Not specified'}
Their platforms: ${answers.platforms || 'Not specified'}
Their best performing content: ${answers.best_content || 'Not specified'}

Create a 4-week content calendar with 3 posts per week (12 total).
For each post, include:
- Week and day
- Platform (optimized for each from their list)
- Content type (video, carousel, thread, etc.)
- Hook/formula
- Topic

Group by week. Prioritize variety. Use their best content as a model for tone.

Output as a clean calendar format.`;

    case 'ecommerce':
      return `User sells: ${answers.product || 'Not specified'}
Main competitor: ${answers.competitor || 'Not specified'}
Biggest challenge: ${answers.challenge || 'Not specified'}

Create a competitor analysis of ${answers.competitor || 'their main competitor'} that includes:
1. Their likely pricing strategy
2. Their unique selling proposition
3. 3 gaps in their positioning the user could exploit
4. One specific recommendation for this week

Keep it actionable. This should feel like insights they couldn't get in 5 minutes themselves.

Output as a structured report with clear sections.`;

    case 'growth-ops':
      return `Company stage: ${answers.stage || 'Not specified'}
Biggest growth blocker: ${answers.blocker || 'Not specified'}
Already tried: ${answers.tried || 'Not specified'}

Create a backlog of 10 growth experiments, prioritized by:
- Effort (Low/Medium/High)
- Potential Impact (Low/Medium/High)
- Suggested order

For each experiment, include:
- Name
- Hypothesis
- Success metric
- Quick implementation steps

Focus on experiments that address their specific blocker (${answers.blocker || 'growth challenges'}). Don't overwhelm — prioritize.

Output as a task board format.`;

    case 'fitness':
      return `User's goal: ${answers.goal || 'General fitness'}
Training days per week: ${answers.days || '3'}
Injuries/restrictions: ${answers.restrictions || 'None reported'}

Create a 4-week workout plan that:
1. Is progressive (each week builds on the last)
2. Fits their ${answers.days || '3'} day/week availability
3. Accounts for any injuries/restrictions
4. Includes warmup, workout, and cooldown for each session

Format as a clean, saveable document. Include progression notes. This should feel like something a personal trainer would write — specific, not generic.

Output as markdown with clear day-by-day structure.`;

    case 'mom':
      return `Kids' ages: ${answers.kids_ages || 'Not specified'}
Schedule complexity: ${answers.schedule_complexity || 'Moderate'}
Biggest pain point: ${answers.pain_point || 'Not specified'}

Create a family weekly overview that includes:
1. A suggested weekly schedule structure (with placeholder slots for known events)
2. 3 meal suggestions that work around a busy schedule
3. 3 tasks an AI assistant can help with this week
4. One logistical tip based on their pain point (${answers.pain_point || 'scheduling'})

Make it warm and practical. This should feel like someone finally organized their week for them.

Output as a clear weekly summary.`;

    case 'finance':
      return `User's financial goal: ${answers.finance_goal || 'Build wealth'}
Biggest money stress: ${answers.money_stress || 'Not specified'}
Income range: ${answers.income_range || 'Not specified'}

Create a financial clarity snapshot that includes:
1. A plain-English summary of their financial situation and key priorities
2. 3 concrete next actions (specific, not vague) to work toward their goal
3. One insight relevant to their goal (${answers.finance_goal || 'building wealth'}) and stress

Cut through the noise. This should tell them exactly what to do, not overwhelm with generic advice.

Output as a simple, actionable document.`;

    default:
      return `Create a helpful, personalized overview and action plan based on:
Template: ${templateId}
User answers: ${JSON.stringify(answers, null, 2)}

Make it practical and immediately useful. Output as markdown.`;
  }
}
