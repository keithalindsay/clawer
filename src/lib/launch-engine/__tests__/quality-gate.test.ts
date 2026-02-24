/**
 * Quality Gate Engine Tests
 * Rules-based content scoring against Clawer.ai brand config.
 *
 * These tests are LOCAL (no AI calls). They run against the hardcoded
 * brand config derived from BRAND-VOICE.md and CONTENT-GUIDELINES.md.
 */

import { describe, expect, it } from 'vitest';
import { loadBrandConfig } from '../brand-config';
import {
  checkBannedPhrases,
  checkGuidelines,
  checkVocabulary,
  estimateEngagement,
  scoreContent,
} from '../quality-gate';

const brandConfig = loadBrandConfig();
const guidelines = brandConfig.guidelines;

// ─── Banned Phrase Detection ───────────────────────────────────────────────────

describe('checkBannedPhrases', () => {
  it('flags "seamless" as a banned phrase', () => {
    const result = checkBannedPhrases(
      'Our platform provides seamless integration with all your tools.',
      brandConfig.guidelines.bannedPhrases,
    );
    expect(result.clean).toBe(false);
    expect(result.found).toContain('seamless');
    expect(result.flags[0].type).toBe('banned-phrase');
    expect(result.flags[0].severity).toBe('error');
  });

  it('flags "leverage" as a banned phrase', () => {
    const result = checkBannedPhrases(
      'You can leverage our platform to increase productivity.',
      brandConfig.guidelines.bannedPhrases,
    );
    expect(result.clean).toBe(false);
    expect(result.found).toContain('leverage');
  });

  it('flags "empower" as a banned phrase', () => {
    const result = checkBannedPhrases(
      'We empower businesses to reach their potential.',
      brandConfig.guidelines.bannedPhrases,
    );
    expect(result.clean).toBe(false);
    expect(result.found.some((p) => p.toLowerCase().includes('empower'))).toBe(true);
  });

  it('flags multiple banned phrases in one piece of content', () => {
    const result = checkBannedPhrases(
      'We take security very seriously. Leveraging AI to deliver seamless synergy at scale.',
      brandConfig.guidelines.bannedPhrases,
    );
    expect(result.found.length).toBeGreaterThanOrEqual(3);
    expect(result.clean).toBe(false);
  });

  it('returns clean for on-brand content', () => {
    const result = checkBannedPhrases(
      'Deploy your AI team in 60 seconds. No Docker, no servers. Works while you sleep.',
      brandConfig.guidelines.bannedPhrases,
    );
    expect(result.clean).toBe(true);
    expect(result.found).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const result = checkBannedPhrases(
      'SEAMLESS integration with REVOLUTIONARY new features.',
      brandConfig.guidelines.bannedPhrases,
    );
    expect(result.found).toContain('seamless');
    expect(result.found.some((p) => p.toLowerCase().includes('revolution'))).toBe(true);
  });

  it('flags "game-changer" and "disruptive"', () => {
    const result = checkBannedPhrases(
      'This is a game-changer for the industry. Truly disruptive.',
      brandConfig.guidelines.bannedPhrases,
    );
    expect(result.found).toContain('game-changer');
    expect(result.found).toContain('disruptive');
  });

  it('flags "paradigm shift"', () => {
    const result = checkBannedPhrases(
      'AI represents a paradigm shift in how we work.',
      brandConfig.guidelines.bannedPhrases,
    );
    expect(result.found).toContain('paradigm shift');
  });
});

// ─── Vocabulary Check ─────────────────────────────────────────────────────────

describe('checkVocabulary', () => {
  it('rewards use of preferred vocabulary', () => {
    const result = checkVocabulary(
      'Deploy your AI team in 60 seconds. No Docker, no servers. Works while you sleep.',
      brandConfig.vocabulary.useList,
      brandConfig.vocabulary.avoidList,
    );
    expect(result.usedPreferred.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(8);
  });

  it('penalises use of avoid vocabulary', () => {
    const result = checkVocabulary(
      'Our cloud infrastructure solution provisions AI bots via touchpoints and endpoints.',
      brandConfig.vocabulary.useList,
      brandConfig.vocabulary.avoidList,
    );
    expect(result.usedAvoid.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(8);
    expect(result.flags.some((f) => f.type === 'vocabulary-violation')).toBe(true);
  });

  it('penalises "bots" — we say "agents"', () => {
    const result = checkVocabulary(
      'Our AI bots will handle your tasks.',
      brandConfig.vocabulary.useList,
      brandConfig.vocabulary.avoidList,
    );
    expect(result.usedAvoid).toContain('bots');
  });

  it('detects preferred vocabulary: "while you sleep"', () => {
    const result = checkVocabulary(
      'Your AI team works while you sleep.',
      brandConfig.vocabulary.useList,
      brandConfig.vocabulary.avoidList,
    );
    expect(result.usedPreferred.some((p) => p.toLowerCase().includes('while you sleep'))).toBe(true);
  });

  it('penalises "integrates seamlessly with" from avoid list', () => {
    const result = checkVocabulary(
      'Clawer integrates seamlessly with your existing tools.',
      brandConfig.vocabulary.useList,
      brandConfig.vocabulary.avoidList,
    );
    expect(result.usedAvoid.some((p) => p.toLowerCase().includes('seamlessly'))).toBe(true);
  });
});

// ─── Voice Scoring ────────────────────────────────────────────────────────────

describe('scoreContent — voice compliance', () => {
  it('scores high for on-brand founder voice content', () => {
    const result = scoreContent(
      'Spent 6 hours optimizing a query that saves users 0.3 seconds. ' +
        'Spent 0 hours on marketing. This is why engineers should not run companies. I am the engineer.',
      'tweet',
      'founder',
      brandConfig,
    );
    expect(result.scores.voice).toBeGreaterThanOrEqual(6);
  });

  it('scores high for on-brand brand voice content', () => {
    const result = scoreContent(
      '42,000 OpenClaw instances are sitting on the open internet with no auth. ' +
        "Don't be one of them. Check your config →",
      'tweet',
      'brand',
      brandConfig,
    );
    expect(result.scores.voice).toBeGreaterThanOrEqual(6);
  });

  it('scores low for off-brand corporate-speak', () => {
    const result = scoreContent(
      'We are delighted to announce our industry-leading, cutting-edge AI platform. ' +
        'Leveraging seamless digital transformation to empower enterprise synergy.',
      'tweet',
      'brand',
      brandConfig,
    );
    expect(result.scores.voice).toBeLessThan(5);
    expect(result.flags.some((f) => f.type === 'banned-phrase')).toBe(true);
  });

  it('scores lower for content with "synergy"', () => {
    const onBrand = scoreContent(
      'Deploy your AI team in 60 seconds. No Docker. Works while you sleep.',
      'tweet',
      'brand',
      brandConfig,
    );
    const offBrand = scoreContent(
      'Unlock synergy with our AI solutions. Best-in-class performance.',
      'tweet',
      'brand',
      brandConfig,
    );
    expect(onBrand.scores.voice).toBeGreaterThan(offBrand.scores.voice);
  });

  it('passes clean on-brand content', () => {
    const result = scoreContent(
      'Your agents are live in 60 seconds. No Docker. No servers. No config files. Go do something else.',
      'tweet',
      'brand',
      brandConfig,
    );
    expect(result.passed).toBe(true);
  });
});

// ─── Engagement Scoring ───────────────────────────────────────────────────────

describe('estimateEngagement', () => {
  it('scores high for a tweet with a strong number hook', () => {
    const score = estimateEngagement(
      '42,000 OpenClaw instances are sitting on the open internet with no auth. ' +
        "Don't be one of them →",
      'tweet',
    );
    expect(score).toBeGreaterThanOrEqual(6.5);
  });

  it('scores low for a bland statement with no hook', () => {
    const score = estimateEngagement(
      'We offer managed OpenClaw hosting services for businesses.',
      'tweet',
    );
    expect(score).toBeLessThan(6);
  });

  it('hook tweet beats bland tweet', () => {
    const hookScore = estimateEngagement(
      'Hot take: 90% of AI wrappers will die. The survivors picked one thing and made it stupidly easy.',
      'tweet',
    );
    const blandScore = estimateEngagement(
      'We provide AI agent hosting solutions for modern businesses.',
      'tweet',
    );
    expect(hookScore).toBeGreaterThan(blandScore);
  });

  it('scores higher for content with a CTA', () => {
    const withCTA = estimateEngagement(
      'Your AGENTS.md is the most important file in OpenClaw. Here is what you are missing → https://clawer.ai/blog',
      'tweet',
    );
    const withoutCTA = estimateEngagement(
      'Your AGENTS.md is the most important file in OpenClaw and most people never edit it.',
      'tweet',
    );
    expect(withCTA).toBeGreaterThan(withoutCTA);
  });

  it('scores "before/after" format as engaging', () => {
    const score = estimateEngagement(
      'Before: 3 hours debugging Docker networking. After: Scan QR code. Done.',
      'tweet',
    );
    expect(score).toBeGreaterThanOrEqual(5.5);
  });

  it('rewards specificity (numbers in content)', () => {
    const specific = estimateEngagement(
      '1,184 malicious skills found on ClawHub. The #1 most downloaded was a crypto wallet stealer.',
      'tweet',
    );
    const vague = estimateEngagement(
      'Many malicious skills found on ClawHub. The most downloaded was harmful.',
      'tweet',
    );
    expect(specific).toBeGreaterThan(vague);
  });

  it('gives blog content credit for subheadings', () => {
    const structured = estimateEngagement(
      '## The Problem\n\nOpenClaw defaults expose port 18789.\n\n## The Fix\n\nChange this one setting.\n\n[Deploy with Clawer →](https://clawer.ai)',
      'blog',
    );
    const unstructured = estimateEngagement(
      'OpenClaw defaults expose port 18789. You should change this setting. Use Clawer instead.',
      'blog',
    );
    expect(structured).toBeGreaterThan(unstructured);
  });
});

// ─── Guidelines Check ─────────────────────────────────────────────────────────

describe('checkGuidelines', () => {
  it('flags competitor attack: dismissing self-hosting', () => {
    const result = checkGuidelines(
      "Don't waste your time self-hosting OpenClaw. It's not worth it.",
      guidelines,
    );
    expect(result.competitorViolations.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(8);
    expect(result.flags.some((f) => f.type === 'competitor-violation')).toBe(true);
  });

  it('flags competitor attack: mocking ChatGPT', () => {
    const result = checkGuidelines(
      'ChatGPT is just a dumb chatbot. Our platform is actually useful.',
      guidelines,
    );
    expect(result.competitorViolations.length).toBeGreaterThan(0);
    expect(result.flags.some((f) => f.type === 'competitor-violation')).toBe(true);
  });

  it('allows respectful competitor comparison', () => {
    const result = checkGuidelines(
      'Self-hosting is great if you enjoy the infrastructure work. We handle it if you prefer.',
      guidelines,
    );
    expect(result.competitorViolations).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(8);
  });

  it('flags legal risk: SOC 2 claim', () => {
    const result = checkGuidelines(
      'Clawer.ai is SOC 2 compliant and enterprise-ready.',
      guidelines,
    );
    expect(result.legalViolations.some((v) => v.toLowerCase().includes('soc 2'))).toBe(true);
    expect(result.flags.some((f) => f.type === 'legal-risk')).toBe(true);
  });

  it('flags legal risk: "100% secure" claim', () => {
    const result = checkGuidelines(
      'Your data is 100% secure on our platform.',
      guidelines,
    );
    expect(result.legalViolations.some((v) => v.toLowerCase().includes('100% secure'))).toBe(true);
  });

  it('flags messaging trap: "set it and forget it"', () => {
    const result = checkGuidelines(
      'Set it and forget it — your AI team runs 24/7.',
      guidelines,
    );
    expect(result.messagingTrapViolations.some((v) => v.toLowerCase().includes('set it and forget it'))).toBe(true);
    expect(result.flags.some((f) => f.type === 'guidelines-violation')).toBe(true);
  });

  it('flags messaging trap: "enterprise-grade"', () => {
    const result = checkGuidelines(
      'We offer enterprise-grade security for all customers.',
      guidelines,
    );
    expect(
      result.messagingTrapViolations.some((v) => v.toLowerCase().includes('enterprise-grade')) ||
      result.flags.some((f) => f.match?.toLowerCase().includes('enterprise-grade'))
    ).toBe(true);
  });

  it('gives clean score for on-brand, guidelines-compliant content', () => {
    const result = checkGuidelines(
      '42,000+ OpenClaw instances are exposed on port 18789 with no auth. ' +
        "Here's what we do differently → https://clawer.ai/security",
      guidelines,
    );
    expect(result.competitorViolations).toHaveLength(0);
    expect(result.legalViolations).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(8);
  });
});

// ─── Full scoreContent Integration ───────────────────────────────────────────

describe('scoreContent — full integration', () => {
  it('passes a strong, on-brand brand-voice tweet', () => {
    const result = scoreContent(
      '42,000 OpenClaw instances sitting on the open internet with no auth. ' +
        "Don't be one of them. We scanned ClawHub so you don't have to → https://clawer.ai/security",
      'tweet',
      'brand',
      brandConfig,
    );
    expect(result.passed).toBe(true);
    expect(result.compositeScore).toBeGreaterThan(6.0);
  });

  it('fails content heavy with banned phrases', () => {
    const result = scoreContent(
      'We are delighted to announce our industry-leading, best-in-class AI solution. ' +
        'Leveraging seamless synergy to empower digital transformation.',
      'tweet',
      'brand',
      brandConfig,
    );
    expect(result.passed).toBe(false);
    expect(result.compositeScore).toBeLessThan(6.0);
    expect(result.flags.filter((f) => f.type === 'banned-phrase').length).toBeGreaterThanOrEqual(3);
  });

  it('flags content with legal violations and fails it', () => {
    const result = scoreContent(
      'Clawer.ai is 100% secure and SOC 2 compliant. Set it and forget it.',
      'tweet',
      'brand',
      brandConfig,
    );
    expect(result.flags.some((f) => f.type === 'legal-risk')).toBe(true);
    expect(result.scores.guidelines).toBeLessThan(6);
  });

  it('composite score is average of 4 dimensions', () => {
    const result = scoreContent(
      'Deploy your AI team in 60 seconds. No Docker. No servers. While you sleep.',
      'tweet',
      'brand',
      brandConfig,
    );
    const { voice, accuracy, engagement, guidelines: guidelinesScore } = result.scores;
    const expected = Math.round(((voice + accuracy + engagement + guidelinesScore) / 4) * 10) / 10;
    expect(result.compositeScore).toBe(expected);
  });

  it('provides rationale for every dimension', () => {
    const result = scoreContent(
      'Hot take: self-hosting is getting easier. But managing 3am alerts is not. That is why we built this.',
      'tweet',
      'founder',
      brandConfig,
    );
    expect(result.rationale.voice).toBeTruthy();
    expect(result.rationale.accuracy).toBeTruthy();
    expect(result.rationale.engagement).toBeTruthy();
    expect(result.rationale.guidelines).toBeTruthy();
  });

  it('respects custom pass threshold', () => {
    const content = 'Deploy your AI team. No Docker needed. Works while you sleep.';
    const strictResult = scoreContent(content, 'tweet', 'brand', brandConfig, 9.0);
    const easyResult = scoreContent(content, 'tweet', 'brand', brandConfig, 3.0);

    expect(easyResult.passed).toBe(true);
    expect(strictResult.passed).toBe(false);
  });

  it('fails a blog with weak opener', () => {
    const result = scoreContent(
      'In this article we will discuss the benefits of managed OpenClaw hosting. ' +
        'We offer enterprise-grade security solutions.',
      'blog',
      'brand',
      brandConfig,
    );
    // Should trigger at least voice and guidelines issues
    expect(result.flags.length).toBeGreaterThan(0);
  });
});
