#!/usr/bin/env tsx
/**
 * Router Test Harness
 * 
 * Tests Clawer's smart router with predefined queries across all tiers.
 * Validates that routing matches expectations and makes config tuning faster.
 * 
 * Usage:
 *   cd ~/projects/clawer
 *   ./scripts/test-router.ts
 *   ./scripts/test-router.ts --verbose
 *   ./scripts/test-router.ts --query "Build a REST API"
 */

import { routeRequest } from '../src/lib/router';
import type { Tier } from '../src/lib/router';

interface TestQuery {
  prompt: string;
  expectedTier: Tier;
  category: string;
}

// Test queries covering all tiers and edge cases
const TEST_QUERIES: TestQuery[] = [
  // SIMPLE tier
  {
    prompt: 'What is the capital of France?',
    expectedTier: 'SIMPLE',
    category: 'simple-fact',
  },
  {
    prompt: 'Define REST API',
    expectedTier: 'SIMPLE',
    category: 'simple-definition',
  },
  {
    prompt: 'Translate "hello" to Spanish',
    expectedTier: 'SIMPLE',
    category: 'simple-translation',
  },

  // MEDIUM tier
  {
    prompt: 'Write a short story about a robot',
    expectedTier: 'MEDIUM',
    category: 'medium-creative',
  },
  {
    prompt: 'Summarize the main points of Docker containers',
    expectedTier: 'MEDIUM',
    category: 'medium-summary',
  },
  {
    prompt: 'List pros and cons of microservices architecture',
    expectedTier: 'MEDIUM',
    category: 'medium-comparison',
  },
  {
    prompt: 'Explain async/await in JavaScript',
    expectedTier: 'MEDIUM',
    category: 'medium-technical-explanation',
  },

  // COMPLEX tier — Multi-step coding/building tasks
  {
    prompt: 'Build a REST API for user authentication with JWT tokens',
    expectedTier: 'COMPLEX',
    category: 'complex-build-api',
  },
  {
    prompt: 'Create a React component for a data table with sorting and filtering',
    expectedTier: 'COMPLEX',
    category: 'complex-build-component',
  },
  {
    prompt: 'Implement a microservice for order processing with event-driven architecture',
    expectedTier: 'COMPLEX',
    category: 'complex-implement-service',
  },
  {
    prompt: 'Design and implement a caching layer with Redis for a high-traffic API',
    expectedTier: 'COMPLEX',
    category: 'complex-design-implement',
  },
  {
    prompt: 'Write a TypeScript function to parse CSV files and store in PostgreSQL',
    expectedTier: 'COMPLEX',
    category: 'complex-code-integration',
  },
  {
    prompt: 'Build a Docker container for a Node.js app with health checks and logging',
    expectedTier: 'COMPLEX',
    category: 'complex-infrastructure',
  },
  {
    prompt: `
Create a Next.js API route that:
1. Accepts file uploads
2. Validates file type
3. Stores in S3
4. Returns a signed URL
Include error handling and tests.
    `.trim(),
    expectedTier: 'COMPLEX',
    category: 'complex-multi-step-code',
  },

  // REASONING tier
  {
    prompt: 'Prove that the square root of 2 is irrational using a step-by-step proof',
    expectedTier: 'REASONING',
    category: 'reasoning-mathematical-proof',
  },
  {
    prompt: 'Analyze the trade-offs between monolithic vs microservices architecture, considering cost, complexity, and scalability',
    expectedTier: 'REASONING',
    category: 'reasoning-technical-analysis',
  },
  {
    prompt: 'Explain the chain of thought process for solving the traveling salesman problem with dynamic programming',
    expectedTier: 'REASONING',
    category: 'reasoning-algorithm-thinking',
  },
  {
    prompt: 'Derive the time complexity of quicksort with a formal proof',
    expectedTier: 'REASONING',
    category: 'reasoning-complexity-proof',
  },
  {
    prompt: 'Reason through the implications of quantum computing on current encryption standards',
    expectedTier: 'REASONING',
    category: 'reasoning-implications',
  },

  // Edge cases
  {
    prompt: 'Build',
    expectedTier: 'SIMPLE',
    category: 'edge-single-word',
  },
  {
    prompt: 'Create a function that returns "hello world"',
    expectedTier: 'MEDIUM',
    category: 'edge-trivial-code',
  },
  {
    prompt: '```python\ndef hello():\n  return "world"\n```\nWhat does this do?',
    expectedTier: 'SIMPLE',
    category: 'edge-code-explanation',
  },
];

interface TestResult {
  query: TestQuery;
  actualTier: Tier;
  confidence: number;
  signals: string[];
  passed: boolean;
  costEstimate: number;
}

function runTests(verbose = false, singleQuery?: string): TestResult[] {
  const queriesToTest = singleQuery
    ? [{ prompt: singleQuery, expectedTier: 'UNKNOWN' as Tier, category: 'manual' }]
    : TEST_QUERIES;

  const results: TestResult[] = [];

  for (const query of queriesToTest) {
    const result = routeRequest({
      prompt: query.prompt,
      userOrchestratorModel: 'claude-sonnet-4',
      userWorkerModel: 'gpt-4o-mini',
    });

    const passed = singleQuery ? true : result.tier === query.expectedTier;

    results.push({
      query,
      actualTier: result.tier,
      confidence: result.confidence,
      signals: result.signals,
      passed,
      costEstimate: result.costEstimate,
    });

    if (verbose || singleQuery) {
      console.log('\n' + '='.repeat(80));
      console.log(`Query: ${query.prompt.substring(0, 60)}...`);
      console.log(`Category: ${query.category}`);
      if (!singleQuery) {
        console.log(`Expected: ${query.expectedTier}`);
      }
      console.log(`Actual: ${result.tier} (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
      console.log(`Model: ${result.model} (${result.useOrchestrator ? 'orchestrator' : 'worker'})`);
      console.log(`Cost: $${result.costEstimate.toFixed(6)}`);
      console.log(`Signals: ${result.signals.slice(0, 5).join(', ')}${result.signals.length > 5 ? '...' : ''}`);
      if (!singleQuery) {
        console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      }
    }
  }

  return results;
}

function printSummary(results: TestResult[]) {
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  const totalTests = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = totalTests - passed;
  const passRate = (passed / totalTests) * 100;

  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passed} (${passRate.toFixed(1)}%)`);
  console.log(`Failed: ${failed}`);

  // Tier distribution
  const tierCounts: Record<Tier, number> = {
    SIMPLE: 0,
    MEDIUM: 0,
    COMPLEX: 0,
    REASONING: 0,
  };

  for (const result of results) {
    tierCounts[result.actualTier]++;
  }

  console.log('\nTier Distribution:');
  console.log(`  SIMPLE: ${tierCounts.SIMPLE} (${((tierCounts.SIMPLE / totalTests) * 100).toFixed(1)}%)`);
  console.log(`  MEDIUM: ${tierCounts.MEDIUM} (${((tierCounts.MEDIUM / totalTests) * 100).toFixed(1)}%)`);
  console.log(`  COMPLEX: ${tierCounts.COMPLEX} (${((tierCounts.COMPLEX / totalTests) * 100).toFixed(1)}%)`);
  console.log(`  REASONING: ${tierCounts.REASONING} (${((tierCounts.REASONING / totalTests) * 100).toFixed(1)}%)`);

  // Failed tests breakdown
  if (failed > 0) {
    console.log('\nFailed Tests:');
    const failedResults = results.filter((r) => !r.passed);
    for (const result of failedResults) {
      console.log(`  ❌ ${result.query.category}: Expected ${result.query.expectedTier}, got ${result.actualTier}`);
      console.log(`     "${result.query.prompt.substring(0, 60)}..."`);
    }
  }

  // Average confidence
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTests;
  console.log(`\nAverage confidence: ${(avgConfidence * 100).toFixed(1)}%`);

  // Estimated cost (assuming 1000 requests/month)
  const avgCost = results.reduce((sum, r) => sum + r.costEstimate, 0) / totalTests;
  const monthlyCost = avgCost * 1000;
  console.log(`\nEstimated cost (1000 req/month): $${monthlyCost.toFixed(2)}`);

  console.log('\n' + '='.repeat(80));
}

// Main
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const queryIndex = args.indexOf('--query');
const singleQuery = queryIndex >= 0 ? args[queryIndex + 1] : undefined;

console.log('🧪 Clawer Router Test Harness\n');

const results = runTests(verbose, singleQuery);

if (!singleQuery) {
  printSummary(results);
}

// Exit with error code if tests failed (for CI)
const failed = results.filter((r) => !r.passed).length;
process.exit(failed > 0 ? 1 : 0);
