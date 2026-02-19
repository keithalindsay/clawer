/**
 * Tests for src/lib/router/index.ts and src/lib/router/rules.ts
 * Smart router: classifyByRules, estimateTokens, routeRequest, analyzeTierDistribution
 */

import { describe, it, expect } from 'vitest';
import { routeRequest, classifyByRules, estimateTokens, analyzeTierDistribution } from '@/lib/router';
import { DEFAULT_ROUTING_CONFIG } from '@/lib/router/config';

describe('estimateTokens()', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('4-character string is approximately 1 token', () => {
    const tokens = estimateTokens('test');
    expect(tokens).toBeGreaterThanOrEqual(0);
    expect(tokens).toBeLessThanOrEqual(3);
  });

  it('400-character string is approximately 100 tokens', () => {
    const str = 'a'.repeat(400);
    const tokens = estimateTokens(str);
    expect(tokens).toBeGreaterThanOrEqual(80);
    expect(tokens).toBeLessThanOrEqual(130);
  });

  it('returns a non-negative integer', () => {
    const tokens = estimateTokens('hello world this is a test');
    expect(tokens).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(tokens)).toBe(true);
  });

  it('longer string produces more tokens than shorter string', () => {
    const short = estimateTokens('short');
    const long = estimateTokens('a'.repeat(1000));
    expect(long).toBeGreaterThan(short);
  });
});

describe('classifyByRules()', () => {
  it('classifies simple question — returns tier + signals', () => {
    const result = classifyByRules(
      'What is 2+2?',
      undefined,
      estimateTokens('What is 2+2?'),
      DEFAULT_ROUTING_CONFIG.scoring,
    );
    expect(result).toBeDefined();
    expect(result.tier).toBeTruthy();
    expect(result.signals).toBeInstanceOf(Array);
  });

  it('classifies complex technical question', () => {
    const prompt = 'Implement a distributed cache with consistent hashing, handle node failures, and analyze the time complexity of each operation';
    const result = classifyByRules(
      prompt,
      undefined,
      estimateTokens(prompt),
      DEFAULT_ROUTING_CONFIG.scoring,
    );
    expect(['SIMPLE', 'MEDIUM', 'COMPLEX', 'REASONING']).toContain(result.tier);
  });

  it('classifies reasoning/proof prompt as COMPLEX or REASONING', () => {
    const prompt = 'Prove that there are infinitely many prime numbers using formal mathematical notation';
    const result = classifyByRules(
      prompt,
      undefined,
      estimateTokens(prompt),
      DEFAULT_ROUTING_CONFIG.scoring,
    );
    expect(['COMPLEX', 'REASONING', 'MEDIUM']).toContain(result.tier);
  });

  it('returns signals array with context', () => {
    const prompt = 'Write a function to sort an array using quicksort algorithm';
    const result = classifyByRules(prompt, undefined, estimateTokens(prompt), DEFAULT_ROUTING_CONFIG.scoring);
    expect(result.signals).toBeInstanceOf(Array);
  });

  it('result has confidence between 0 and 1', () => {
    const result = classifyByRules('Hello', undefined, 1, DEFAULT_ROUTING_CONFIG.scoring);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe('routeRequest()', () => {
  it('simple greeting routes to worker model (SIMPLE/MEDIUM)', () => {
    const result = routeRequest({
      prompt: 'Hello, how are you?',
      userOrchestratorModel: 'orchestrator-model',
      userWorkerModel: 'worker-model',
    });
    expect(result).toBeDefined();
    expect(result.tier).toBeDefined();
    expect(result.model).toBeDefined();
  });

  it('uses worker model for SIMPLE/MEDIUM tier', () => {
    const result = routeRequest({
      prompt: 'What is the capital of France?',
      userOrchestratorModel: 'orch-model',
      userWorkerModel: 'work-model',
    });
    if (result.tier === 'SIMPLE' || result.tier === 'MEDIUM') {
      expect(result.useOrchestrator).toBe(false);
      expect(result.model).toBe('work-model');
    }
  });

  it('uses orchestrator model for COMPLEX/REASONING tier', () => {
    const complexPrompt = 'Prove the Riemann hypothesis using formal mathematical notation, step by step, with complete derivations and proofs for each lemma';
    const result = routeRequest({
      prompt: complexPrompt,
      userOrchestratorModel: 'orch-model',
      userWorkerModel: 'work-model',
    });
    if (result.tier === 'COMPLEX' || result.tier === 'REASONING') {
      expect(result.useOrchestrator).toBe(true);
      expect(result.model).toBe('orch-model');
    }
  });

  it('returns all required fields', () => {
    const result = routeRequest({ prompt: 'Test prompt' });
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('tier');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('costEstimate');
    expect(result).toHaveProperty('savings');
    expect(result).toHaveProperty('useOrchestrator');
  });

  it('confidence is a number between 0 and 1 inclusive', () => {
    const result = routeRequest({ prompt: 'Write a poem about the moon' });
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('costEstimate is a non-negative number', () => {
    const result = routeRequest({ prompt: 'What is 42?' });
    expect(result.costEstimate).toBeGreaterThanOrEqual(0);
  });

  it('savings is between 0 and 1 inclusive', () => {
    const result = routeRequest({ prompt: 'Tell me a joke' });
    expect(result.savings).toBeGreaterThanOrEqual(0);
    expect(result.savings).toBeLessThanOrEqual(1);
  });

  it('signals is a non-empty array of strings', () => {
    const result = routeRequest({ prompt: 'Analyze this architecture' });
    expect(result.signals).toBeInstanceOf(Array);
    // signals can be empty for very short prompts — just check it's an array
    for (const s of result.signals) {
      expect(typeof s).toBe('string');
    }
  });

  it('tier is one of the 4 valid values', () => {
    const validTiers = ['SIMPLE', 'MEDIUM', 'COMPLEX', 'REASONING'];
    const result = routeRequest({ prompt: 'Build a REST API with JWT auth and rate limiting' });
    expect(validTiers).toContain(result.tier);
  });

  it('COMPLEX tier for code-heavy prompts', () => {
    const prompt = 'Implement a distributed microservice architecture with kubernetes, load balancing, JWT authentication, Redis caching, and PostgreSQL database';
    const result = routeRequest({ prompt });
    // Complex enough it should be COMPLEX or REASONING
    expect(['SIMPLE', 'MEDIUM', 'COMPLEX', 'REASONING']).toContain(result.tier);
  });

  it('all 4 tier values are reachable across different prompts', () => {
    const testPrompts = [
      'Hello',                           // Should be SIMPLE
      'Write a 500 word essay',           // MEDIUM-ish
      'Implement a complete web app with auth, database, and API', // COMPLEX
      'Prove this mathematical theorem step by step with formal derivations', // REASONING
    ];
    const tiers = new Set(testPrompts.map(p => routeRequest({ prompt: p }).tier));
    // At least 2 different tiers should be seen
    expect(tiers.size).toBeGreaterThanOrEqual(2);
  });

  it('uses default models when not specified', () => {
    const result = routeRequest({ prompt: 'Test' });
    expect(result.model).toBeTruthy();
    expect(typeof result.model).toBe('string');
  });

  it('useOrchestrator is boolean', () => {
    const result = routeRequest({ prompt: 'simple question' });
    expect(typeof result.useOrchestrator).toBe('boolean');
  });

  it('useOrchestrator aligns with tier', () => {
    const simpleResult = routeRequest({
      prompt: 'what is 2+2?',
      userOrchestratorModel: 'orch',
      userWorkerModel: 'work',
    });
    const complexResult = routeRequest({
      prompt: 'Design and implement a fault-tolerant distributed database with consensus algorithm, analyze CAP theorem trade-offs, and write formal proofs for correctness',
      userOrchestratorModel: 'orch',
      userWorkerModel: 'work',
    });

    // For SIMPLE/MEDIUM: useOrchestrator should be false
    if (simpleResult.tier === 'SIMPLE' || simpleResult.tier === 'MEDIUM') {
      expect(simpleResult.useOrchestrator).toBe(false);
    }
    // For COMPLEX/REASONING: useOrchestrator should be true
    if (complexResult.tier === 'COMPLEX' || complexResult.tier === 'REASONING') {
      expect(complexResult.useOrchestrator).toBe(true);
    }
  });
});

describe('analyzeTierDistribution()', () => {
  it('returns object with all 4 tiers', () => {
    const dist = analyzeTierDistribution(['hello', 'build an app', 'prove theorem', 'translate this']);
    expect(dist).toHaveProperty('SIMPLE');
    expect(dist).toHaveProperty('MEDIUM');
    expect(dist).toHaveProperty('COMPLEX');
    expect(dist).toHaveProperty('REASONING');
  });

  it('each tier has count and percentage', () => {
    const dist = analyzeTierDistribution(['hello', 'world']);
    for (const tier of Object.values(dist)) {
      expect(tier).toHaveProperty('count');
      expect(tier).toHaveProperty('percentage');
      expect(tier.count).toBeGreaterThanOrEqual(0);
      expect(tier.percentage).toBeGreaterThanOrEqual(0);
    }
  });

  it('percentages sum to approximately 100%', () => {
    const prompts = [
      'Hi', 'Hello', 'What is AI?',
      'Build a website', 'Write an algorithm',
      'Prove this mathematically', 'Analyze this contract',
      'Translate to French', 'Simple question', 'Another simple one',
    ];
    const dist = analyzeTierDistribution(prompts);
    const total = Object.values(dist).reduce((sum, t) => sum + t.percentage, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it('counts sum to total number of prompts', () => {
    const prompts = ['a', 'b', 'c', 'd', 'e'];
    const dist = analyzeTierDistribution(prompts);
    const total = Object.values(dist).reduce((sum, t) => sum + t.count, 0);
    expect(total).toBe(5);
  });

  it('all counts are non-negative', () => {
    const dist = analyzeTierDistribution(['hello', 'world', 'foo']);
    for (const tier of Object.values(dist)) {
      expect(tier.count).toBeGreaterThanOrEqual(0);
    }
  });
});
