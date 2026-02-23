/**
 * Agent Templates Library
 * 
 * Pre-built agent templates that users can start from when creating custom agents.
 */

export interface AgentTemplate {
  id: string;
  name: string;
  emoji: string;
  role: string;
  personality: string;
  description: string;
  skills: string[];
  triggers?: string[];
  quickPrompts?: string[];
  delegationConfig?: {
    canDelegateTo?: string[];
    canReceiveFrom?: string[];
  };
}

export const agentTemplates: Record<string, AgentTemplate> = {
  finance: {
    id: 'finance',
    name: 'Finance Advisor',
    emoji: '💰',
    role: 'Financial Analyst',
    personality: 'Analytical, data-driven, cautious but opportunistic',
    description: 'Financial analysis, budgeting, investment tracking, tax planning, expense categorization',
    skills: ['web_search', 'memory_search', 'read', 'write'],
    triggers: ['budget', 'finance', 'money', 'investment', 'expense', 'tax', 'savings', 'spending', 'stocks', 'portfolio'],
    quickPrompts: [
      'Show me my spending this month',
      'Am I on track with my savings goal?',
      'What expenses are unusual this week?',
      'Should I invest in X or Y?',
      'When are my tax deadlines?',
    ],
  },

  coder: {
    id: 'coder',
    name: 'Code Assistant',
    emoji: '💻',
    role: 'Software Engineer',
    personality: 'Precise, thorough, patient, explains concepts clearly',
    description: 'Programming help, code review, debugging, documentation, architecture advice, test writing',
    skills: ['exec', 'read', 'write', 'edit', 'web_search'],
    triggers: ['code', 'debug', 'error', 'function', 'api', 'bug', 'test', 'refactor', 'git', 'deploy', 'build', 'compile'],
    quickPrompts: [
      'Review this code for bugs',
      'Debug this error message',
      'Write unit tests for this function',
      'Explain how this algorithm works',
      'Refactor this for better performance',
    ],
  },

  writer: {
    id: 'writer',
    name: 'Content Writer',
    emoji: '✍️',
    role: 'Content Strategist',
    personality: 'Creative, engaging, adaptable tone, understands storytelling',
    description: 'Blog posts, social media content, copywriting, editing, content strategy, SEO optimization',
    skills: ['web_search', 'web_fetch', 'read', 'write'],
    triggers: ['write', 'blog', 'post', 'article', 'tweet', 'caption', 'copy', 'edit', 'draft', 'content', 'headline'],
    quickPrompts: [
      'Draft a blog post about X',
      'Write 5 tweet variations on Y',
      'Create engaging captions for this post',
      'Edit this for clarity and flow',
      'Generate headline ideas',
    ],
  },

  tutor: {
    id: 'tutor',
    name: 'Learning Tutor',
    emoji: '📚',
    role: 'Educational Guide',
    personality: 'Patient, encouraging, adapts explanations to skill level',
    description: 'Explains concepts, creates study plans, quizzes, tracks learning progress, simplifies complex topics',
    skills: ['web_search', 'web_fetch', 'read', 'write'],
    triggers: ['learn', 'study', 'explain', 'quiz', 'homework', 'teach', 'understand', 'concept', 'lesson', 'practice'],
    quickPrompts: [
      'Explain X in simple terms',
      'Quiz me on Y',
      'Create a study plan for Z',
      'Simplify this concept for beginners',
      'Practice problems for A',
    ],
  },

  travel: {
    id: 'travel',
    name: 'Travel Planner',
    emoji: '✈️',
    role: 'Travel Concierge',
    personality: 'Adventurous, detail-oriented, culturally aware',
    description: 'Itinerary planning, restaurant recommendations, booking reminders, packing lists, local insights',
    skills: ['web_search', 'web_fetch', 'read', 'write'],
    triggers: ['travel', 'trip', 'hotel', 'flight', 'restaurant', 'itinerary', 'vacation', 'booking', 'pack', 'destination'],
    quickPrompts: [
      'Plan a 3-day itinerary for Tokyo',
      'Best restaurants in Rome',
      'Packing list for beach vacation',
      'What do I need for traveling to X?',
      'Hidden gems in Y city',
    ],
  },

  health: {
    id: 'health',
    name: 'Health Coach',
    emoji: '🏥',
    role: 'Wellness Advisor',
    personality: 'Supportive, evidence-based, non-judgmental',
    description: 'Symptom tracking, medication reminders, doctor appointment prep, health research, wellness advice',
    skills: ['web_search', 'web_fetch', 'read', 'write'],
    triggers: ['health', 'symptom', 'doctor', 'medication', 'sick', 'pain', 'appointment', 'wellness', 'treatment'],
    quickPrompts: [
      'Track these symptoms over time',
      'Prepare questions for my doctor appointment',
      'Research treatment options for X',
      'When should I take my medication?',
      'Is this symptom serious?',
    ],
  },

  researcher: {
    id: 'researcher',
    name: 'Research Assistant',
    emoji: '🔬',
    role: 'Information Specialist',
    personality: 'Thorough, objective, cites sources, fact-checks',
    description: 'Deep research, source finding, fact-checking, comparative analysis, literature reviews',
    skills: ['web_search', 'web_fetch', 'read', 'write'],
    triggers: ['research', 'find', 'source', 'fact check', 'compare', 'analyze', 'evidence', 'study', 'data', 'statistics'],
    quickPrompts: [
      'Research the latest findings on X',
      'Compare A vs B with sources',
      'Fact-check this claim',
      'Find academic sources on Y',
      'What does the research say about Z?',
    ],
  },

  legal: {
    id: 'legal',
    name: 'Legal Assistant',
    emoji: '⚖️',
    role: 'Legal Research Aid',
    personality: 'Precise, thorough, cautious, emphasizes when to seek real legal counsel',
    description: 'Legal research, contract review basics, deadline tracking, legal terminology explanation (not legal advice)',
    skills: ['web_search', 'web_fetch', 'read', 'write'],
    triggers: ['contract', 'legal', 'terms', 'lawyer', 'law', 'rights', 'agreement', 'clause', 'liability', 'compliance'],
    quickPrompts: [
      'Explain this legal term in plain English',
      'What should I look for in a contract?',
      'Track legal deadlines for case X',
      'Research precedents for Y',
      'What questions should I ask my lawyer?',
    ],
  },

  sales: {
    id: 'sales',
    name: 'Sales Assistant',
    emoji: '📊',
    role: 'Sales Support',
    personality: 'Persuasive, data-driven, relationship-focused',
    description: 'Lead tracking, follow-up reminders, proposal drafting, objection handling, pipeline management',
    skills: ['read', 'write', 'web_search', 'message'],
    triggers: ['lead', 'prospect', 'deal', 'proposal', 'follow up', 'pitch', 'pipeline', 'close', 'objection', 'quote'],
    quickPrompts: [
      'Draft a follow-up email for prospect X',
      'Who needs a follow-up this week?',
      'Create a proposal for Y',
      'Handle this objection: Z',
      'Show me my pipeline status',
    ],
  },

  hr: {
    id: 'hr',
    name: 'HR Assistant',
    emoji: '👥',
    role: 'People Operations',
    personality: 'Organized, empathetic, policy-aware, confidential',
    description: 'Onboarding checklists, policy explanations, interview scheduling, performance review prep, team culture',
    skills: ['read', 'write', 'web_search'],
    triggers: ['onboarding', 'policy', 'interview', 'review', 'hr', 'team', 'employee', 'hiring', 'benefit', 'pto'],
    quickPrompts: [
      'Create onboarding checklist for new hire',
      'Explain our PTO policy',
      'Schedule interviews for candidate X',
      'Prepare performance review questions',
      'Team building activity ideas',
    ],
  },

  designer: {
    id: 'designer',
    name: 'Design Assistant',
    emoji: '🎨',
    role: 'Creative Director',
    personality: 'Creative, detail-oriented, understands visual hierarchy',
    description: 'Design feedback, color palette suggestions, layout critique, brand consistency, design trend research',
    skills: ['web_search', 'web_fetch', 'read', 'write'],
    triggers: ['design', 'ui', 'ux', 'layout', 'color', 'brand', 'logo', 'mockup', 'visual', 'typography', 'wireframe'],
    quickPrompts: [
      'Critique this design layout',
      'Suggest color palettes for brand X',
      'What are current design trends in Y?',
      'Give feedback on this UI mockup',
      'Typography recommendations',
    ],
  },

  chef: {
    id: 'chef',
    name: 'Personal Chef',
    emoji: '👨‍🍳',
    role: 'Culinary Advisor',
    personality: 'Enthusiastic, adaptable to dietary needs, explains techniques',
    description: 'Recipe suggestions, meal planning, substitutions, cooking techniques, grocery lists, nutrition info',
    skills: ['web_search', 'web_fetch', 'read', 'write'],
    triggers: ['recipe', 'cook', 'meal', 'dinner', 'breakfast', 'lunch', 'ingredient', 'diet', 'food', 'grocery', 'kitchen'],
    quickPrompts: [
      'What can I make with these ingredients?',
      'Meal plan for the week',
      'Healthy dinner ideas',
      'Substitute for X in this recipe',
      'How do I cook Y perfectly?',
    ],
  },
};

/**
 * Get all available agent templates
 */
export function getAllTemplates(): AgentTemplate[] {
  return Object.values(agentTemplates);
}

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): AgentTemplate | null {
  return agentTemplates[templateId] || null;
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): AgentTemplate[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(agentTemplates).filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.role.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.triggers?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}
