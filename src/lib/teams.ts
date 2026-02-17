/**
 * Team configurations for AI Team Dashboard
 * Hardcoded configs from docker/openclaw-user/teams/
 */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  emoji?: string;
  description?: string;
  expertise?: string[];
  triggers?: string[];
  quickPrompts?: string[];
}

export interface TeamConfig {
  industry?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  members: TeamMember[];
  defaultMember?: string;
  cadence?: {
    morning_report?: string;
    evening_checkin?: string;
    weekly_review?: string;
    monthly_review?: string;
  };
}

/**
 * All available team templates
 */
export const TEAM_CONFIGS: Record<string, TeamConfig> = {
  lifeos: {
    industry: 'default',
    name: 'Life OS',
    description: 'Your personal operating system. Automatic morning reports, evening check-ins, weekly reviews, goal tracking, and overnight task execution. Discipline without willpower.',
    isDefault: true,
    members: [
      {
        id: 'chief-of-staff',
        name: 'Max',
        role: 'Chief of Staff',
        emoji: '📋',
        description: 'Your right hand for prioritization and planning',
        triggers: ['morning', 'report', 'check-in', 'review', 'weekly', 'monthly', 'status', 'summary', 'what happened', "what's the plan", 'priorities', 'schedule', 'agenda'],
        quickPrompts: ["What's my plan for today?", "Give me a weekly review", "Help me prioritize my tasks"],
      },
      {
        id: 'goal-tracker',
        name: 'North',
        role: 'Goal Tracker',
        emoji: '🎯',
        description: 'Progress tracking and accountability',
        triggers: ['goal', 'target', 'progress', 'milestone', 'deadline', 'on track', 'behind', 'ahead', 'habit', 'streak', 'accountability', 'measure', 'metric'],
        quickPrompts: ["How am I tracking on my goals?", "Set a new goal for me", "What habits should I build?"],
      },
      {
        id: 'researcher',
        name: 'Scout',
        role: 'Research & Knowledge Manager',
        emoji: '🔍',
        description: 'Find information and save knowledge',
        triggers: ['research', 'find', 'look up', 'article', 'save this', 'bookmark', 'summarize', 'learn about', 'what is', 'compare', 'options', 'pros and cons', 'recommend'],
        quickPrompts: ["Compare options for me", "Research this topic", "Summarize the pros and cons"],
      },
      {
        id: 'executor',
        name: 'Dash',
        role: 'Task Runner',
        emoji: '⚡',
        description: 'Execute tasks and automate workflows',
        triggers: ['do this', 'handle', 'take care of', 'draft', 'write', 'create', 'build', 'send', 'email', 'respond', 'follow up', 'set up', 'automate'],
        quickPrompts: ["Draft an email for me", "Write a follow-up message", "Help me create a checklist"],
      },
      {
        id: 'wellness',
        name: 'Zen',
        role: 'Wellness & Energy Coach',
        emoji: '💪',
        description: 'Health, energy, and wellbeing support',
        triggers: ['workout', 'exercise', 'sleep', 'energy', 'tired', 'stressed', 'health', 'diet', 'meditation', 'mood', 'feeling', 'self-care', 'break', 'burnout'],
        quickPrompts: ["I'm feeling stressed", "Suggest a quick workout", "How can I sleep better?"],
      },
    ],
    cadence: {
      morning_report: '7:00 AM',
      evening_checkin: '4:30 PM',
      weekly_review: 'Sunday 10:00 AM',
      monthly_review: '1st of month 10:00 AM',
    },
  },

  solopreneur: {
    industry: 'solopreneur',
    name: 'Solopreneur Team',
    description: 'Run your business like you have a team. Executive assistant for planning, research analyst for decisions, outreach specialist for partnerships.',
    isDefault: false,
    members: [
      {
        id: 'executive-assistant',
        name: 'Claire',
        role: 'Executive Assistant',
        emoji: '📋',
        description: 'Prioritization, meeting notes, checklists, weekly planning, calendar management',
        triggers: ['schedule', 'meeting', 'calendar', 'priorities', 'checklist', 'plan', 'organize', 'review', 'weekly', 'agenda', 'to-do', 'task list'],
        quickPrompts: ["Plan my week", "Create a meeting agenda", "What should I prioritize today?"],
      },
      {
        id: 'research-analyst',
        name: 'Leo',
        role: 'Research Analyst',
        emoji: '🔍',
        description: 'Market research, competitor analysis, synthesizing options into decisions, due diligence',
        triggers: ['research', 'compare', 'analyze', 'should I', 'options', 'competitors', 'market', 'vet', 'investigate', 'pros and cons', 'recommend', 'feasibility'],
        quickPrompts: ["Analyze my competitors", "Should I do X or Y?", "Research this market for me"],
      },
      {
        id: 'outreach-specialist',
        name: 'Harper',
        role: 'Outreach Specialist',
        emoji: '💼',
        description: 'Cold outreach drafting, follow-ups, partnership pitches, lightweight CRM tracking',
        triggers: ['email', 'reach out', 'pitch', 'partnership', 'follow up', 'contact', 'outreach', 'proposal', 'intro', 'cold email', 'networking'],
        quickPrompts: ["Draft a cold outreach email", "Write a partnership pitch", "Follow up on my last email"],
      },
    ],
    defaultMember: 'executive-assistant',
  },

  ecommerce: {
    industry: 'ecommerce',
    name: 'E-Commerce Team',
    description: 'Complete e-commerce support from customer service to marketing and analytics',
    members: [
      {
        id: 'support',
        name: 'Alex',
        role: 'Customer Support Lead',
        emoji: '💬',
        expertise: ['customer service', 'refund policies', 'FAQ'],
        quickPrompts: ["Draft a refund response", "Help with a customer complaint", "Update our FAQ"],
      },
      {
        id: 'marketing',
        name: 'Maya',
        role: 'Marketing Strategist',
        emoji: '📱',
        expertise: ['social media', 'email campaigns', 'SEO'],
        quickPrompts: ["Plan a social media campaign", "Write an email blast", "SEO ideas for my store"],
      },
      {
        id: 'analyst',
        name: 'Sam',
        role: 'Business Analyst',
        emoji: '📊',
        expertise: ['sales reports', 'inventory analysis', 'market research'],
        quickPrompts: ["Analyze my sales this week", "What products should I restock?", "Show me market trends"],
      },
      {
        id: 'writer',
        name: 'Jordan',
        role: 'Content Writer',
        emoji: '✍️',
        expertise: ['product listings', 'blog posts', 'ad copy'],
        quickPrompts: ["Write a product description", "Draft a blog post idea", "Create ad copy for a sale"],
      },
      {
        id: 'operations',
        name: 'Riley',
        role: 'Operations Manager',
        emoji: '⚙️',
        expertise: ['order processing', 'logistics', 'vendor management'],
        quickPrompts: ["Optimize my shipping process", "Draft a vendor email", "Help with order tracking"],
      },
    ],
  },

  'content-creator': {
    industry: 'content',
    name: 'Content Creator Team',
    description: 'Your AI content and marketing team. Strategy, writing, social media, and outreach - all coordinated to help you create and grow.',
    isDefault: false,
    members: [
      {
        id: 'content-strategist',
        name: 'Mia',
        role: 'Content Strategist',
        emoji: '🎯',
        description: 'Positioning, content calendars, hooks, video ideas, brand voice guidelines',
        triggers: ['strategy', 'what should I', 'content calendar', 'ideas', 'positioning', 'brand voice', 'plan', 'hooks', 'video ideas', 'trending', 'niche'],
        quickPrompts: ["Plan my content calendar", "Give me 10 video ideas", "Help with my brand positioning"],
      },
      {
        id: 'writer',
        name: 'Blake',
        role: 'Script & Copy Writer',
        emoji: '✍️',
        description: 'YouTube scripts, blog posts, newsletters, social captions, ad copy',
        triggers: ['write', 'script', 'blog', 'newsletter', 'ad copy', 'draft', 'caption', 'description', 'sales page', 'email', 'long-form'],
        quickPrompts: ["Write a YouTube script outline", "Draft this week's newsletter", "Write captions for my posts"],
      },
      {
        id: 'social-manager',
        name: 'Jordan',
        role: 'Social Manager',
        emoji: '📱',
        description: 'Repurposing content into platform-specific posts/threads, scheduling cadence, engagement tracking',
        triggers: ['social', 'Instagram', 'Twitter', 'TikTok', 'LinkedIn', 'thread', 'post', 'repurpose', 'turn this into', 'schedule', 'engagement', 'clips'],
        quickPrompts: ["Turn this into a Twitter thread", "Repurpose my video for Instagram", "What should I post today?"],
      },
      {
        id: 'outreach-pr',
        name: 'Aria',
        role: 'Outreach & PR',
        emoji: '🤝',
        description: 'Cold emails, partnership pitches, PR outreach, Product Hunt prep, influencer outreach',
        triggers: ['outreach', 'pitch', 'partnership', 'PR', 'press', 'influencer', 'collaboration', 'collab', 'reach out', 'Product Hunt', 'launch'],
        quickPrompts: ["Draft a collab pitch email", "Prep my Product Hunt launch", "Find influencers in my niche"],
      },
    ],
    defaultMember: 'content-strategist',
  },

  mom: {
    industry: 'family',
    name: "Parent Central",
    description: 'Your household management team. Handles meal planning, schedules, homework help, reminders, and keeping everything running smoothly.',
    members: [
      {
        id: 'planner',
        name: 'Mel',
        role: 'Meal Planner & Nutrition',
        emoji: '🍳',
        description: 'Meal planning and nutrition',
        triggers: ['meal', 'dinner', 'lunch', 'breakfast', 'recipe', 'grocery', 'food', 'cook', 'snack', 'nutrition', 'diet', 'allergies', 'meal prep'],
        quickPrompts: ["Plan dinners for this week", "Quick lunch ideas for kids", "Make me a grocery list"],
      },
      {
        id: 'scheduler',
        name: 'Cal',
        role: 'Schedule & Calendar Manager',
        emoji: '📅',
        description: 'Schedule and calendar management',
        triggers: ['schedule', 'calendar', 'appointment', 'practice', 'pickup', 'dropoff', 'carpool', 'event', 'birthday', 'reminder', 'when is', 'what time'],
        quickPrompts: ["What's on the schedule today?", "Remind me about pickup at 3", "Plan this weekend's activities"],
      },
      {
        id: 'tutor',
        name: 'Prof',
        role: 'Homework & Learning Helper',
        emoji: '📚',
        description: 'Homework help and learning support',
        triggers: ['homework', 'math', 'science', 'reading', 'essay', 'project', 'study', 'test', 'quiz', 'grade', 'school', 'learn', 'explain', 'help with'],
        quickPrompts: ["Help with math homework", "Explain this science concept", "Quiz me on vocabulary"],
      },
      {
        id: 'organizer',
        name: 'Tidy',
        role: 'Household Organizer',
        emoji: '🏠',
        description: 'Household organization and chores',
        triggers: ['chores', 'clean', 'organize', 'laundry', 'shopping', 'budget', 'bills', 'supplies', 'repair', 'maintenance', 'todo', 'list'],
        quickPrompts: ["Create a chore schedule", "What household supplies do I need?", "Help me organize the garage"],
      },
      {
        id: 'wellness',
        name: 'Care',
        role: 'Family Wellness & Activities',
        emoji: '💚',
        description: 'Family wellness and activities',
        triggers: ['activity', 'weekend', 'fun', 'sick', 'doctor', 'medication', 'sleep', 'routine', 'bedtime', 'exercise', 'screen time', 'behavior'],
        quickPrompts: ["Fun weekend activity ideas", "Help with bedtime routine", "My kid has a fever, what to do?"],
      },
    ],
  },

  fitness: {
    industry: 'fitness',
    name: 'Fitness Team',
    description: 'Your AI personal training team. Workout programming, nutrition coaching, and accountability - all working together to help you get fit and stay consistent.',
    isDefault: false,
    members: [
      {
        id: 'training-coach',
        name: 'Noah',
        role: 'Training Coach',
        emoji: '💪',
        description: 'Workout programming, progressive overload, adapting plans to schedule and equipment',
        triggers: ['workout', 'exercise', 'training', 'gym', 'lift', 'run', 'sets', 'reps', 'weights', 'program', 'routine', 'form', 'muscle', 'cardio', 'stretch'],
        quickPrompts: ["Give me today's workout", "I only have 30 minutes to train", "Build me a 4-day split"],
      },
      {
        id: 'nutrition-coach',
        name: 'Nina',
        role: 'Nutrition Coach',
        emoji: '🥗',
        description: 'Macros, meal planning, grocery lists, making nutrition sustainable and practical',
        triggers: ['food', 'eat', 'meal', 'macro', 'calories', 'protein', 'grocery', 'recipe', 'diet', 'nutrition', 'supplement', 'carbs', 'fat', 'cook', 'prep'],
        quickPrompts: ["High protein meal ideas", "Make me a meal prep plan", "What should I eat post-workout?"],
      },
      {
        id: 'accountability-partner',
        name: 'Ethan',
        role: 'Accountability Partner',
        emoji: '📊',
        description: 'Reminders, check-ins, habit streaks, motivation, progress tracking',
        triggers: ['motivation', 'streak', 'habit', 'check-in', 'missed', 'skip', 'progress', 'accountability', 'feeling', 'tired', 'lazy', 'consistency', 'track', 'log'],
        quickPrompts: ["I skipped the gym today", "Check in on my progress", "I need some motivation"],
      },
    ],
    defaultMember: 'training-coach',
  },

  finance: {
    industry: 'finance',
    name: 'Finance Team',
    description: 'AI assistants for your business finances. Invoicing, expense tracking, and tax prep - organized so you are never scrambling.',
    isDefault: false,
    members: [
      {
        id: 'invoices-billing',
        name: 'Sophia',
        role: 'Invoices & Billing',
        emoji: '💰',
        description: 'Creating invoices, payment follow-ups, billing organization',
        triggers: ['invoice', 'bill', 'payment', 'overdue', 'accounts receivable', 'billing', 'client payment', 'send invoice', 'paid', 'owed'],
        quickPrompts: ["Create an invoice", "Who hasn't paid yet?", "Draft a payment reminder"],
      },
      {
        id: 'expenses-bookkeeping',
        name: 'Liam',
        role: 'Expenses & Bookkeeping',
        emoji: '📒',
        description: 'Expense tracking, categorization, clean books prep',
        triggers: ['expense', 'receipt', 'categorize', 'transaction', 'books', 'bookkeeping', 'profit', 'loss', 'cost', 'spending', 'budget', 'reconcile'],
        quickPrompts: ["Categorize my recent expenses", "What's my profit this month?", "Help me prep my books"],
      },
      {
        id: 'tax-planner',
        name: 'Nora',
        role: 'Tax Season Planner',
        emoji: '📅',
        description: 'Deadlines, document checklists, deduction tracking, tax prep readiness',
        triggers: ['tax', 'deduction', '1099', 'W-2', 'quarterly', 'IRS', 'write-off', 'tax prep', 'filing', 'estimated tax', 'deadline'],
        quickPrompts: ["What tax deadlines are coming up?", "Track a new deduction", "Am I ready for tax season?"],
      },
    ],
    defaultMember: 'invoices-billing',
  },

  'growth-ops': {
    name: 'Growth Ops',
    description: 'Two-agent growth automation: Hunter finds leads and opportunities, Shield monitors SEO, competitors, and brand positioning.',
    industry: 'growth',
    members: [
      {
        id: 'hunter',
        name: 'Hunter',
        role: 'Lead Generation & Intel',
        emoji: '🎯',
        description: 'Lead generation, competitor intel, opportunity scanning, market research',
        quickPrompts: [
          "Analyze my top 3 competitors — extract their services, target locations, strengths, and trust signals, then compare to mine",
          "Find content gaps in my competitors' sites and give me 5 topics to cover that they're missing",
          "Research my competitor's top 20 pages and give me a prioritized keyword list with difficulty scores",
        ],
      },
      {
        id: 'shield',
        name: 'Shield',
        role: 'SEO & Positioning',
        emoji: '🛡️',
        description: 'SEO audit, review monitoring, competitive positioning, keyword research, schema analysis',
        quickPrompts: [
          "Scan these competitor sites and find 5 content gaps I should cover to outrank them",
          "List 20 high-intent local keywords for my business that indicate a customer is ready to buy NOW",
          "Analyze my competitor's GBP posts and build me an actionable posting plan with frequency, themes, and CTAs",
        ],
      },
    ],
  },
};

/**
 * Get team config by template name
 */
export function getTeamConfig(templateName: string): TeamConfig | null {
  return TEAM_CONFIGS[templateName] || null;
}

/**
 * Get agent from team config by agent ID
 */
export function getAgentFromTeam(
  templateName: string,
  agentId: string
): TeamMember | null {
  const team = getTeamConfig(templateName);
  if (!team) return null;
  
  return team.members.find(m => m.id === agentId) || null;
}

/**
 * Build agent-specific system prompt
 */
export function buildAgentSystemPrompt(
  agent: TeamMember,
  teamConfig: TeamConfig,
  userName?: string
): string {
  const userRef = userName || 'the user';
  
  let prompt = `You are ${agent.name}, the ${agent.role} on ${userRef}'s ${teamConfig.name} team.\n\n`;
  
  if (agent.description) {
    prompt += `Your role: ${agent.description}\n\n`;
  }
  
  if (teamConfig.description) {
    prompt += `Team purpose: ${teamConfig.description}\n\n`;
  }
  
  // Add team context
  prompt += `Your team members:\n`;
  teamConfig.members.forEach(member => {
    if (member.id !== agent.id) {
      prompt += `- ${member.name} (${member.role})`;
      if (member.description) {
        prompt += ` - ${member.description}`;
      }
      prompt += '\n';
    }
  });
  
  prompt += `\nRespond in character as ${agent.name}. Be helpful, collaborative, and stay in your area of expertise. You can reference other team members' work when relevant.\n`;
  
  return prompt;
}
