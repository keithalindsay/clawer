/**
 * Launch Engine — Brand Configuration
 * Type definitions and loader for brand configuration.
 * Hardcoded from ~/projects/clawer/launch/brand/ docs.
 * Future: reads from `brand_config` table in Postgres.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Tone attributes that define the brand voice */
export interface VoiceAttribute {
  name: string;
  description: string;
  examples?: { good: string; bad: string }[];
}

/** Preferred and avoided vocabulary */
export interface VocabularyConfig {
  /** Words/phrases we actively use */
  useList: string[];
  /** Words/phrases we avoid */
  avoidList: string[];
}

/** Persona definition */
export interface Persona {
  id: string;
  name: string;
  description: string;
  painPoints?: string[];
}

/** Content pillar definition */
export interface ContentPillar {
  id: string;
  name: string;
  emoji?: string;
  description: string;
}

/** Competitor reference rules */
export interface CompetitorRules {
  /** Reference patterns that are allowed */
  allowed: string[];
  /** Reference patterns that are never allowed */
  forbidden: string[];
  /** Competitor names/categories we track */
  categories: string[];
}

/** Legal and ethical boundary rules */
export interface LegalBoundaries {
  /** Exact phrases that cannot appear in content */
  forbiddenClaims: string[];
  /** Messaging patterns to avoid (not exact, pattern-based) */
  messagingTraps: Array<{
    avoid: string;
    useInstead: string;
  }>;
}

/** Encouragement patterns — signature phrases to use more */
export interface EncouragementPhrases {
  signatures: string[];
  ctaPatterns: Record<string, string>;
}

/** Content Guidelines loaded from the brand docs */
export interface ContentGuidelines {
  bannedPhrases: string[];
  competitorRules: CompetitorRules;
  legalBoundaries: LegalBoundaries;
  encouragement: EncouragementPhrases;
  /** What NOT to say — ethical/competitive/legal boundaries */
  doNotSay: string[];
}

/** Full brand configuration — the source of truth for all agents */
export interface BrandConfig {
  id: string;
  workspaceId: string;
  name: string;

  // Voice
  toneAttributes: VoiceAttribute[];
  vocabulary: VocabularyConfig;

  // Content strategy
  contentPillars: ContentPillar[];
  personas: Persona[];

  // Platform-specific voices
  founderVoiceHandle: string;
  brandVoiceHandle: string;

  // Rules
  guidelines: ContentGuidelines;

  // Metadata
  primaryTagline: string;
  updatedAt: Date;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Load the active brand configuration.
 * Currently hardcoded from the Clawer.ai brand docs.
 * Future: SELECT * FROM brand_configs WHERE workspace_id = ? AND active = true
 */
export function loadBrandConfig(): BrandConfig {
  return CLAWER_BRAND_CONFIG;
}

// ─── Hardcoded Clawer.ai Brand Config ────────────────────────────────────────
// Source: ~/projects/clawer/launch/brand/BRAND-VOICE.md
//         ~/projects/clawer/launch/brand/CONTENT-GUIDELINES.md

const CLAWER_BRAND_CONFIG: BrandConfig = {
  id: 'clawer-ai-internal',
  workspaceId: 'clawer-ai',
  name: 'Clawer.ai',
  primaryTagline: 'AI Teams That Do the Work While You Sleep',
  founderVoiceHandle: '@Vavier',
  brandVoiceHandle: '@teamclawer',
  updatedAt: new Date('2026-02-23'),

  toneAttributes: [
    {
      name: 'Straight-Talking',
      description:
        'Say it plainly. No jargon walls, no corporate fluff, no "leveraging synergies." If something is hard, say it\'s hard.',
      examples: [
        {
          good: 'Self-hosting OpenClaw is a pain. We fixed that.',
          bad: "We've streamlined the deployment experience to optimize operational efficiency.",
        },
      ],
    },
    {
      name: 'Engineer-Honest',
      description:
        "We're builders, not marketers. We acknowledge tradeoffs. We show our work. We don't pretend everything is perfect.",
      examples: [
        {
          good: "OpenClaw is incredible software. Running it yourself? That's the hard part.",
          bad: 'Clawer.ai is the revolutionary next-generation AI platform transforming businesses worldwide.',
        },
      ],
    },
    {
      name: 'Casually Confident',
      description:
        "We know what we built is good. We don't need to scream about it. Tone is 'friend who's really good at this stuff explaining it over coffee.'",
      examples: [
        {
          good: "Your agents are live in 60 seconds. That's it. Go do something else.",
          bad: 'Our industry-leading deployment pipeline achieves sub-minute provisioning times!!',
        },
      ],
    },
    {
      name: 'Security-Serious',
      description:
        'When it comes to security, we drop the casualness. We cite specifics — CVEs, numbers, real incidents.',
      examples: [
        {
          good: "42,000+ OpenClaw instances are exposed on port 18789 with no auth. Ours aren't.",
          bad: 'We take security very seriously.',
        },
      ],
    },
    {
      name: 'Anti-Hype',
      description:
        'The AI space is drowning in hype. No "AGI," no "paradigm shift," no "transformative." Just: here\'s what it does, here\'s who it\'s for, here\'s what it costs.',
      examples: [
        {
          good: 'AI agents that handle your tasks while you sleep. $49/month.',
          bad: 'Unlock the transformative potential of autonomous AI-powered digital workforce solutions.',
        },
      ],
    },
  ],

  vocabulary: {
    useList: [
      'AI team',
      'agents',
      'deploy',
      'skills',
      'channels',
      'managed hosting',
      'setup',
      'works with',
      'security-first',
      'container isolation',
      'plain English',
      'breaks',
      'broken',
      'costs',
      '$49/month',
      'while you sleep',
      'not a chatbot',
      '60 seconds',
      'no docker',
      'no servers',
      'wake up to done',
      'the hard part, handled',
    ],
    avoidList: [
      'AI workforce',
      'digital employees',
      'bots',
      'provision',
      'instantiate',
      'plugins',
      'extensions',
      'modules',
      'touchpoints',
      'endpoints',
      'cloud infrastructure solution',
      'onboarding journey',
      'integrates seamlessly with',
      'enterprise-grade security',
      'sandboxed execution environment',
      'natural language interface',
      'suboptimal experience',
      'investment',
      'competitive pricing',
    ],
  },

  contentPillars: [
    {
      id: 'security',
      name: 'Security',
      emoji: '🔐',
      description:
        'OpenClaw security research, CVE coverage, exposed instances, malicious skills, security-first hosting',
    },
    {
      id: 'ease',
      name: 'Ease & Speed',
      emoji: '⚡',
      description: '60-second deploys, no Docker, no config, WhatsApp/Telegram channels, quick wins',
    },
    {
      id: 'ai-teams',
      name: 'AI Teams',
      emoji: '🤖',
      description: 'Multi-agent workflows, team templates, autonomous agents, what AI teams can do',
    },
    {
      id: 'use-cases',
      name: 'Use Cases & Inspiration',
      emoji: '💡',
      description: 'Real customer use cases, what people build, founder use cases, inspiration',
    },
    {
      id: 'education',
      name: 'Education',
      emoji: '📚',
      description:
        'OpenClaw tutorials, AGENTS.md guides, how-to content, DIY vs managed comparisons',
    },
  ],

  personas: [
    {
      id: 'solo-sarah',
      name: 'Solo Sarah',
      description: 'Solopreneur who needs consistent content but has no marketing team',
      painPoints: ['no marketing team', 'inconsistent content', 'too busy to write'],
    },
    {
      id: 'creator-chris',
      name: 'Creator Chris',
      description: 'Content creator who wants AI to handle research, drafts, and distribution',
      painPoints: ['research takes too long', 'drafting is slow', 'multi-channel distribution'],
    },
    {
      id: 'mike-the-manager',
      name: 'Mike the Manager',
      description: 'Small biz ops who needs campaign coordination across channels',
      painPoints: ['coordination chaos', 'manual scheduling', 'no campaign visibility'],
    },
    {
      id: 'dev-adjacent-dana',
      name: 'Dev-Adjacent Dana',
      description: 'Technical enough to self-host but tired of the maintenance overhead',
      painPoints: ['docker debugging', '2am server issues', 'security hardening'],
    },
  ],

  guidelines: {
    bannedPhrases: [
      'We take security very seriously',
      'leveraging AI',
      'leverage',
      'best-in-class',
      'cutting-edge',
      'paradigm shift',
      'digital transformation',
      'unlock the power',
      'seamless',
      'delighted to announce',
      'game-changer',
      'disruptive',
      'synergy',
      'synergies',
      'empower',
      'empowering',
      'revolutionize',
      'revolutionary',
      'transformative',
      'next-generation',
      'world-class',
      'industry-leading',
      'robust',
    ],

    competitorRules: {
      allowed: [
        'Self-hosting is great if you enjoy the infrastructure work.',
        'ChatGPT is great for conversations. Clawer is for ongoing work.',
        'We think our approach is different.',
        'Compare features and approaches — never trash-talk.',
      ],
      forbidden: [
        "Don't waste your time self-hosting.",
        'Self-hosting is dangerous.',
        'ChatGPT is just a dumb chatbot.',
        'Name-and-shame specific competing OpenClaw hosts.',
        'Claim competitors have security vulnerabilities without published evidence.',
      ],
      categories: ['self-hosted openclaw', 'chatgpt', 'claude direct', 'other openclaw hosts'],
    },

    legalBoundaries: {
      forbiddenClaims: [
        'SOC 2 compliant',
        'SOC2 compliant',
        'unhackable',
        '100% secure',
        '100% uptime',
        'guaranteed uptime',
        'replaces human judgment',
        'no human oversight needed',
        "customer's data",
        'specific customer usage',
      ],
      messagingTraps: [
        {
          avoid: 'AI will replace your job',
          useInstead: 'AI handles tasks so you focus on what matters',
        },
        {
          avoid: 'set it and forget it',
          useInstead: 'works while you sleep, review when you wake up',
        },
        {
          avoid: 'no technical knowledge needed',
          useInstead: 'no servers or Docker required',
        },
        {
          avoid: 'enterprise-grade',
          useInstead: 'describe specific security measures',
        },
        {
          avoid: 'infallible',
          useInstead: 'reliable with human oversight',
        },
      ],
    },

    encouragement: {
      signatures: [
        'while you sleep',
        'Not a chatbot. An AI team.',
        '60 seconds',
        'No Docker. No servers. No config files.',
        'Wake up to done',
        'The hard part, handled',
      ],
      ctaPatterns: {
        security:
          'Check if your instance is exposed → [link]. Or skip the risk entirely → [Clawer signup]',
        tutorial: 'Want this pre-configured? Clawer deploys it in 60 seconds → [link]',
        comparison: 'Try it free — 100 messages, no credit card → [link]',
        useCase: 'Deploy this AI team template → [link]',
      },
    },

    doNotSay: [
      'We take security very seriously',
      'SOC 2 compliant',
      'unhackable',
      '100% secure',
      'AI will replace your job',
      'set it and forget it',
      'no technical knowledge needed',
      'enterprise-grade',
      'best-in-class',
      'industry-leading',
      'game-changer',
      'disruptive',
      'paradigm shift',
    ],
  },
};
