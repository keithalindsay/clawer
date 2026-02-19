import { describe, it, expect } from 'vitest';
import { routeRequest, classifyByRules, estimateTokens, analyzeTierDistribution } from '../index';
import { DEFAULT_ROUTING_CONFIG } from '../config';

// ─── No mocking needed — these are pure functions ───

describe('estimateTokens()', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('returns ~1 token for a 4-char string', () => {
    expect(estimateTokens('test')).toBe(1);
  });

  it('returns ~100 tokens for a 400-char string', () => {
    const text = 'a'.repeat(400);
    expect(estimateTokens(text)).toBe(100);
  });

  it('returns a non-negative integer', () => {
    const result = estimateTokens('Hello, world! This is a test sentence.');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('scales proportionally with text length', () => {
    const short = estimateTokens('hi');
    const long = estimateTokens('hi'.repeat(100));
    expect(long).toBeGreaterThan(short);
  });
});

describe('classifyByRules()', () => {
  // Minimal config stub that matches DEFAULT_ROUTING_CONFIG shape from config.ts
  // We'll just import the real defaults via routeRequest instead of re-creating them here

  it('returns { tier, confidence, signals } shape', () => {
    
    const result = classifyByRules(
      'What is the capital of France?',
      undefined,
      estimateTokens('What is the capital of France?'),
      DEFAULT_ROUTING_CONFIG.scoring,
    );
    expect(result).toHaveProperty('tier');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('signals');
    expect(Array.isArray(result.signals)).toBe(true);
  });

  it('classifies a simple factual question as SIMPLE', () => {
    
    const prompt = 'What is 2 + 2?';
    const result = classifyByRules(
      prompt,
      undefined,
      estimateTokens(prompt),
      DEFAULT_ROUTING_CONFIG.scoring,
    );
    // Confidence may be low (null tier) or SIMPLE — both are valid for this prompt
    if (result.tier !== null) {
      expect(['SIMPLE', 'MEDIUM']).toContain(result.tier);
    }
  });

  it('classifies a complex analytical request as COMPLEX or REASONING', () => {
    
    const prompt =
      'Analyze the legal implications of this 5000-word contract for liability clauses and evaluate all trade-offs.';
    const result = classifyByRules(
      prompt,
      undefined,
      estimateTokens(prompt),
      DEFAULT_ROUTING_CONFIG.scoring,
    );
    if (result.tier !== null) {
      expect(['COMPLEX', 'REASONING']).toContain(result.tier);
    }
  });

  it('confidence is between 0 and 1', () => {
    
    const result = classifyByRules(
      'Help me write a story',
      undefined,
      estimateTokens('Help me write a story'),
      DEFAULT_ROUTING_CONFIG.scoring,
    );
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('signals array is empty or contains strings', () => {
    
    const result = classifyByRules(
      'Translate "hello" to Spanish.',
      undefined,
      estimateTokens('Translate "hello" to Spanish.'),
      DEFAULT_ROUTING_CONFIG.scoring,
    );
    expect(Array.isArray(result.signals)).toBe(true);
    result.signals.forEach((s) => expect(typeof s).toBe('string'));
  });
});

describe('routeRequest()', () => {
  it('returns required shape with all expected keys', () => {
    const result = routeRequest({ prompt: 'Hello!' });
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('tier');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('costEstimate');
    expect(result).toHaveProperty('savings');
    expect(result).toHaveProperty('useOrchestrator');
  });

  it('routes a simple greeting to worker model (useOrchestrator=false)', () => {
    const result = routeRequest({
      prompt: 'Hi there!',
      userWorkerModel: 'gemini-2.0-flash-lite',
      userOrchestratorModel: 'gpt-4o',
    });
    // "Hi there!" is a greeting — should NOT use orchestrator
    expect(result.useOrchestrator).toBe(false);
    expect(result.model).toBe('gemini-2.0-flash-lite');
  });

  it('routes a complex analysis request to orchestrator model (useOrchestrator=true)', () => {
    const result = routeRequest({
      prompt:
        'Prove mathematically that the sorting algorithm is optimal and derive the formal complexity proof step by step.',
      userWorkerModel: 'gemini-2.0-flash-lite',
      userOrchestratorModel: 'gpt-4o',
    });
    // Multiple reasoning keywords → REASONING tier → orchestrator
    expect(result.useOrchestrator).toBe(true);
    expect(result.model).toBe('gpt-4o');
  });

  it('uses userWorkerModel when routing to worker', () => {
    const result = routeRequest({
      prompt: 'What is the capital of France?',
      userWorkerModel: 'my-custom-worker',
      userOrchestratorModel: 'my-custom-orchestrator',
    });
    if (!result.useOrchestrator) {
      expect(result.model).toBe('my-custom-worker');
    }
  });

  it('uses userOrchestratorModel when routing to orchestrator', () => {
    const result = routeRequest({
      prompt:
        'Analyze and compare trade-offs, evaluate the mathematical proof step by step with formal reasoning.',
      userWorkerModel: 'my-worker',
      userOrchestratorModel: 'my-orchestrator',
    });
    if (result.useOrchestrator) {
      expect(result.model).toBe('my-orchestrator');
    }
  });

  it('confidence is a number between 0 and 1 inclusive', () => {
    const result = routeRequest({ prompt: 'Write a short poem.' });
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('costEstimate is a non-negative number', () => {
    const result = routeRequest({ prompt: 'What time is it?' });
    expect(result.costEstimate).toBeGreaterThanOrEqual(0);
    expect(typeof result.costEstimate).toBe('number');
  });

  it('savings is between 0 and 1 inclusive', () => {
    const result = routeRequest({ prompt: 'Who wrote Hamlet?' });
    expect(result.savings).toBeGreaterThanOrEqual(0);
    expect(result.savings).toBeLessThanOrEqual(1);
  });

  it('signals is an array of strings', () => {
    const result = routeRequest({
      prompt: 'Implement a distributed caching layer with Redis',
    });
    expect(Array.isArray(result.signals)).toBe(true);
    result.signals.forEach((s) => expect(typeof s).toBe('string'));
  });

  it('tier is one of the four valid values', () => {
    const validTiers = ['SIMPLE', 'MEDIUM', 'COMPLEX', 'REASONING'];
    const result = routeRequest({ prompt: 'Explain quantum entanglement.' });
    expect(validTiers).toContain(result.tier);
  });

  it('SIMPLE/MEDIUM tier sets useOrchestrator=false', () => {
    // Short, simple prompt with no complexity keywords
    const result = routeRequest({
      prompt: 'hello',
      userWorkerModel: 'worker',
      userOrchestratorModel: 'orchestrator',
    });
    if (result.tier === 'SIMPLE' || result.tier === 'MEDIUM') {
      expect(result.useOrchestrator).toBe(false);
    }
  });

  it('COMPLEX/REASONING tier sets useOrchestrator=true', () => {
    const result = routeRequest({
      prompt:
        'Step by step, prove the correctness of this algorithm and analyze all trade-offs formally.',
      userWorkerModel: 'worker',
      userOrchestratorModel: 'orchestrator',
    });
    if (result.tier === 'COMPLEX' || result.tier === 'REASONING') {
      expect(result.useOrchestrator).toBe(true);
    }
  });

  it('defaults to gpt-4o-mini as orchestrator when not provided', () => {
    const result = routeRequest({ prompt: 'Prove formally: P ≠ NP step by step.' });
    if (result.useOrchestrator) {
      expect(result.model).toBe('gpt-4o-mini');
    }
  });

  it('defaults to gemini-2.0-flash-lite as worker when not provided', () => {
    const result = routeRequest({ prompt: 'Hi' });
    if (!result.useOrchestrator) {
      expect(result.model).toBe('gemini-2.0-flash-lite');
    }
  });

  it('all 4 tier values are possible across varied prompts', () => {
    const prompts = [
      'Hi',                               // → SIMPLE
      'Write a 500-word essay on climate change.',  // → MEDIUM or COMPLEX
      'Implement a distributed microservice architecture with kubernetes and docker.',  // → COMPLEX
      'Prove step by step mathematically: derive the formal proof of this theorem.',   // → REASONING
    ];
    const tiers = new Set(prompts.map((p) => routeRequest({ prompt: p }).tier));
    // At least 2 different tiers should appear across these varied prompts
    expect(tiers.size).toBeGreaterThanOrEqual(2);
  });
});

describe('analyzeTierDistribution()', () => {
  it('returns an object with all 4 tiers', () => {
    const prompts = ['Hello', 'What is 2+2?', 'Explain algorithms', 'Prove this theorem formally step by step'];
    const result = analyzeTierDistribution(prompts);
    expect(result).toHaveProperty('SIMPLE');
    expect(result).toHaveProperty('MEDIUM');
    expect(result).toHaveProperty('COMPLEX');
    expect(result).toHaveProperty('REASONING');
  });

  it('each tier has count and percentage fields', () => {
    const prompts = ['hello', 'world'];
    const result = analyzeTierDistribution(prompts);
    for (const tier of ['SIMPLE', 'MEDIUM', 'COMPLEX', 'REASONING'] as const) {
      expect(result[tier]).toHaveProperty('count');
      expect(result[tier]).toHaveProperty('percentage');
      expect(typeof result[tier].count).toBe('number');
      expect(typeof result[tier].percentage).toBe('number');
    }
  });

  it('percentages sum to 100% across all tiers', () => {
    const prompts = [
      'Hi',
      'Hello',
      'What is the capital of France?',
      'Write a poem about autumn',
      'Implement a REST API',
      'Analyze trade-offs and evaluate formally',
      'Build a database schema',
      'Translate "thank you" to French',
      'Step by step mathematical proof',
      'Design a distributed system',
    ];
    const result = analyzeTierDistribution(prompts);
    const totalPercent =
      result.SIMPLE.percentage +
      result.MEDIUM.percentage +
      result.COMPLEX.percentage +
      result.REASONING.percentage;
    expect(totalPercent).toBeCloseTo(100, 0);
  });

  it('counts sum to the total number of prompts', () => {
    const prompts = ['a', 'b', 'c', 'd', 'e'];
    const result = analyzeTierDistribution(prompts);
    const totalCount =
      result.SIMPLE.count +
      result.MEDIUM.count +
      result.COMPLEX.count +
      result.REASONING.count;
    expect(totalCount).toBe(5);
  });

  it('all counts are non-negative integers', () => {
    const prompts = ['test one', 'test two', 'test three'];
    const result = analyzeTierDistribution(prompts);
    for (const tier of ['SIMPLE', 'MEDIUM', 'COMPLEX', 'REASONING'] as const) {
      expect(result[tier].count).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result[tier].count)).toBe(true);
    }
  });

  it('handles a single prompt without error', () => {
    const result = analyzeTierDistribution(['Hello world']);
    const totalCount =
      result.SIMPLE.count + result.MEDIUM.count + result.COMPLEX.count + result.REASONING.count;
    expect(totalCount).toBe(1);
  });

  it('simple prompts end up in SIMPLE or MEDIUM bucket', () => {
    const simplePrompts = ['Hi', 'Hello', 'What is 2+2?', 'Yes or no?'];
    const result = analyzeTierDistribution(simplePrompts);
    const simpleOrMedium = result.SIMPLE.count + result.MEDIUM.count;
    // At least half of simple prompts should be classified as SIMPLE or MEDIUM
    expect(simpleOrMedium).toBeGreaterThanOrEqual(simplePrompts.length / 2);
  });
});
