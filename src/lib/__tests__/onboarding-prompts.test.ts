import { describe, it, expect } from 'vitest';
import {
  ONBOARDING_TEMPLATES,
  getOnboardingTemplate,
  buildFirstDeliverablePrompt,
  PROGRESS_MESSAGES,
  type OnboardingTemplate,
  type Question,
} from '../onboarding-prompts';

// ── ONBOARDING_TEMPLATES ───────────────────────────────────────────────────

describe('ONBOARDING_TEMPLATES', () => {
  it('exports exactly 8 templates', () => {
    expect(ONBOARDING_TEMPLATES).toHaveLength(8);
  });

  it('contains the expected template IDs', () => {
    const ids = ONBOARDING_TEMPLATES.map(t => t.id);
    expect(ids).toContain('lifeos');
    expect(ids).toContain('solopreneur');
    expect(ids).toContain('content-creator');
    expect(ids).toContain('ecommerce');
    expect(ids).toContain('growth-ops');
    expect(ids).toContain('fitness');
    expect(ids).toContain('mom');
    expect(ids).toContain('finance');
  });

  it('every template has the required fields', () => {
    for (const template of ONBOARDING_TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.emoji).toBeTruthy();
      expect(template.tagline).toBeTruthy();
      expect(template.firstDeliverable).toBeTruthy();
      expect(template.deliverableIcon).toBeTruthy();
      expect(template.deliverableTitle).toBeTruthy();
      expect(Array.isArray(template.questions)).toBe(true);
    }
  });

  it('every template has exactly 3 questions', () => {
    for (const template of ONBOARDING_TEMPLATES) {
      expect(template.questions).toHaveLength(3);
    }
  });

  it('every question has the required fields', () => {
    for (const template of ONBOARDING_TEMPLATES) {
      for (const question of template.questions) {
        expect(question.id).toBeTruthy();
        expect(question.question).toBeTruthy();
        expect(['text', 'radio', 'multi-select']).toContain(question.type);
        expect(question.dbField).toBeTruthy();
      }
    }
  });

  it('radio and multi-select questions have options arrays', () => {
    for (const template of ONBOARDING_TEMPLATES) {
      for (const question of template.questions) {
        if (question.type === 'radio' || question.type === 'multi-select') {
          expect(Array.isArray(question.options)).toBe(true);
          expect(question.options!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('text questions have placeholder strings', () => {
    for (const template of ONBOARDING_TEMPLATES) {
      for (const question of template.questions) {
        if (question.type === 'text') {
          expect(typeof question.placeholder).toBe('string');
          expect(question.placeholder!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('all question IDs are unique within a template', () => {
    for (const template of ONBOARDING_TEMPLATES) {
      const ids = template.questions.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });

  it('all question dbField values are unique within a template', () => {
    for (const template of ONBOARDING_TEMPLATES) {
      const fields = template.questions.map(q => q.dbField);
      const uniqueFields = new Set(fields);
      expect(uniqueFields.size).toBe(fields.length);
    }
  });
});

// ── getOnboardingTemplate ──────────────────────────────────────────────────

describe('getOnboardingTemplate', () => {
  it('returns the correct template for a valid ID', () => {
    const template = getOnboardingTemplate('lifeos');
    expect(template).toBeDefined();
    expect(template!.id).toBe('lifeos');
    expect(template!.name).toBe('Personal Assistant');
  });

  it('returns solopreneur template with correct structure', () => {
    const template = getOnboardingTemplate('solopreneur');
    expect(template).toBeDefined();
    expect(template!.id).toBe('solopreneur');
    expect(template!.questions.map(q => q.id)).toContain('business');
    expect(template!.questions.map(q => q.id)).toContain('customer');
    expect(template!.questions.map(q => q.id)).toContain('platform');
  });

  it('returns fitness template with correct structure', () => {
    const template = getOnboardingTemplate('fitness');
    expect(template).toBeDefined();
    expect(template!.id).toBe('fitness');
    expect(template!.questions.map(q => q.id)).toContain('goal');
    expect(template!.questions.map(q => q.id)).toContain('days');
    expect(template!.questions.map(q => q.id)).toContain('restrictions');
  });

  it('returns undefined for an unknown template ID', () => {
    const result = getOnboardingTemplate('unknown-template');
    expect(result).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    const result = getOnboardingTemplate('');
    expect(result).toBeUndefined();
  });

  it('is case-sensitive (returns undefined for wrong case)', () => {
    const result = getOnboardingTemplate('LifeOS');
    expect(result).toBeUndefined();
  });

  it('returns each of the 8 templates by ID', () => {
    const ids = ['lifeos', 'solopreneur', 'content-creator', 'ecommerce', 'growth-ops', 'fitness', 'mom', 'finance'];
    for (const id of ids) {
      const template = getOnboardingTemplate(id);
      expect(template).toBeDefined();
      expect(template!.id).toBe(id);
    }
  });
});

// ── buildFirstDeliverablePrompt ────────────────────────────────────────────

describe('buildFirstDeliverablePrompt', () => {
  it('builds a lifeos prompt that includes user answers', () => {
    const answers = {
      stress: 'I have too many meetings',
      start: 'Exercise daily',
      stop: 'Scrolling at night',
    };
    const prompt = buildFirstDeliverablePrompt('lifeos', answers);

    expect(prompt).toContain('I have too many meetings');
    expect(prompt).toContain('Exercise daily');
    expect(prompt).toContain('Scrolling at night');
    expect(prompt.toLowerCase()).toContain('morning routine');
  });

  it('builds a solopreneur prompt that includes user answers', () => {
    const answers = {
      business: 'I help SaaS companies with marketing',
      customer: 'B2B startup founders',
      platform: 'LinkedIn',
    };
    const prompt = buildFirstDeliverablePrompt('solopreneur', answers);

    expect(prompt).toContain('I help SaaS companies with marketing');
    expect(prompt).toContain('B2B startup founders');
    expect(prompt).toContain('LinkedIn');
    expect(prompt.toLowerCase()).toContain('content');
  });

  it('builds a content-creator prompt that includes user answers', () => {
    const answers = {
      niche: 'Personal finance for millennials',
      platforms: 'YouTube,TikTok',
      best_content: 'My video about passive income got 1M views',
    };
    const prompt = buildFirstDeliverablePrompt('content-creator', answers);

    expect(prompt).toContain('Personal finance for millennials');
    expect(prompt).toContain('YouTube,TikTok');
    expect(prompt).toContain('My video about passive income got 1M views');
    expect(prompt.toLowerCase()).toContain('content calendar');
  });

  it('builds an ecommerce prompt that includes user answers', () => {
    const answers = {
      product: 'Handmade leather goods',
      competitor: 'LuxLeather.com',
      challenge: 'Conversion',
    };
    const prompt = buildFirstDeliverablePrompt('ecommerce', answers);

    expect(prompt).toContain('Handmade leather goods');
    expect(prompt).toContain('LuxLeather.com');
    expect(prompt).toContain('Conversion');
  });

  it('builds a growth-ops prompt that includes user answers', () => {
    const answers = {
      stage: 'Seed',
      blocker: 'Not enough qualified leads',
      tried: 'Cold email and LinkedIn outreach',
    };
    const prompt = buildFirstDeliverablePrompt('growth-ops', answers);

    expect(prompt).toContain('Seed');
    expect(prompt).toContain('Not enough qualified leads');
    expect(prompt).toContain('Cold email and LinkedIn outreach');
    expect(prompt.toLowerCase()).toContain('experiment');
  });

  it('builds a fitness prompt that includes user answers', () => {
    const answers = {
      goal: 'Build muscle',
      days: '4',
      restrictions: 'Bad knees',
    };
    const prompt = buildFirstDeliverablePrompt('fitness', answers);

    expect(prompt).toContain('Build muscle');
    expect(prompt).toContain('4');
    expect(prompt).toContain('Bad knees');
    expect(prompt.toLowerCase()).toContain('workout');
  });

  it('builds a mom prompt that includes user answers', () => {
    const answers = {
      kids_ages: '5 and 8',
      schedule_complexity: 'Complex (6+)',
      pain_point: 'School pickups clash with work calls',
    };
    const prompt = buildFirstDeliverablePrompt('mom', answers);

    expect(prompt).toContain('5 and 8');
    expect(prompt).toContain('Complex (6+)');
    expect(prompt).toContain('School pickups clash with work calls');
  });

  it('builds a finance prompt that includes user answers', () => {
    const answers = {
      finance_goal: 'Get out of debt',
      money_stress: 'Credit card balances',
      income_range: '$50k-$100k',
    };
    const prompt = buildFirstDeliverablePrompt('finance', answers);

    expect(prompt).toContain('Get out of debt');
    expect(prompt).toContain('Credit card balances');
    expect(prompt).toContain('$50k-$100k');
  });

  it('handles missing answers gracefully with fallback text', () => {
    // Empty answers should not throw
    const prompt = buildFirstDeliverablePrompt('lifeos', {});
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(50);
    // Should include "Not specified" fallbacks
    expect(prompt).toContain('Not specified');
  });

  it('returns a default prompt for unknown template IDs', () => {
    const prompt = buildFirstDeliverablePrompt('unknown-template', { key: 'value' });
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
    // Should contain the unknown template ID
    expect(prompt).toContain('unknown-template');
  });

  it('returns a non-empty string for every known template with empty answers', () => {
    const ids = ['lifeos', 'solopreneur', 'content-creator', 'ecommerce', 'growth-ops', 'fitness', 'mom', 'finance'];
    for (const id of ids) {
      const prompt = buildFirstDeliverablePrompt(id, {});
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(50);
    }
  });

  it('includes output formatting instructions in all prompts', () => {
    const ids = ['lifeos', 'solopreneur', 'content-creator', 'ecommerce', 'growth-ops', 'fitness', 'mom', 'finance'];
    for (const id of ids) {
      const prompt = buildFirstDeliverablePrompt(id, {});
      // All prompts should include some kind of output/structure instruction
      expect(prompt.toLowerCase()).toMatch(/output|format|structure|markdown/);
    }
  });
});

// ── PROGRESS_MESSAGES ──────────────────────────────────────────────────────

describe('PROGRESS_MESSAGES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(PROGRESS_MESSAGES)).toBe(true);
    expect(PROGRESS_MESSAGES.length).toBeGreaterThan(0);
  });

  it('contains only non-empty strings', () => {
    for (const msg of PROGRESS_MESSAGES) {
      expect(typeof msg).toBe('string');
      expect(msg.trim().length).toBeGreaterThan(0);
    }
  });

  it('has at least 3 progress messages', () => {
    expect(PROGRESS_MESSAGES.length).toBeGreaterThanOrEqual(3);
  });
});
