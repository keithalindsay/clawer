#!/usr/bin/env tsx
/**
 * Quick test to verify Smart Router integration
 * Run: npx tsx test-routing-integration.ts
 */

import { routeRequest } from './src/lib/router';

const testPrompts = [
  {
    name: 'Simple Math',
    prompt: 'What is 2+2?',
    expectedTier: 'SIMPLE',
  },
  {
    name: 'Code Explanation',
    prompt: 'Explain how async/await works in JavaScript',
    expectedTier: 'MEDIUM',
  },
  {
    name: 'Complex Analysis',
    prompt: 'Design a scalable microservices architecture for an e-commerce platform with real-time inventory management',
    expectedTier: 'COMPLEX',
  },
  {
    name: 'Deep Reasoning',
    prompt: 'Analyze the ethical implications of AI in healthcare, considering privacy, bias, accessibility, and autonomy',
    expectedTier: 'REASONING',
  },
  {
    name: 'Creative Task',
    prompt: 'Write a haiku about programming',
    expectedTier: 'MEDIUM',
  },
];

console.log('🎯 Testing Smart Router Integration\n');
console.log('='.repeat(80));

for (const test of testPrompts) {
  const result = routeRequest({
    prompt: test.prompt,
    userOrchestratorModel: 'openai/gpt-4o-mini',
    userWorkerModel: 'openai/gpt-4o-mini',
  });

  const match = result.tier === test.expectedTier ? '✅' : '❌';
  const confidencePercent = (result.confidence * 100).toFixed(0);

  console.log(`\n${match} ${test.name}`);
  console.log(`   Prompt: "${test.prompt.slice(0, 60)}${test.prompt.length > 60 ? '...' : ''}"`);
  console.log(`   Tier: ${result.tier} (expected: ${test.expectedTier})`);
  console.log(`   Model: ${result.model}`);
  console.log(`   Confidence: ${confidencePercent}%`);
  console.log(`   Signals: ${result.signals.slice(0, 3).join(', ')}`);
  console.log(`   Cost Estimate: $${result.costEstimate.toFixed(6)}`);
  console.log(`   Savings vs Baseline: ${(result.savings * 100).toFixed(1)}%`);
}

console.log('\n' + '='.repeat(80));

// Test with bot settings
console.log('\n🤖 Testing with Bot Settings\n');
console.log('='.repeat(80));

const botTest = {
  prompt: 'Help me plan my day',
  systemPrompt: 'You are a personal productivity coach. Be encouraging and practical.',
};

const botResult = routeRequest({
  prompt: botTest.prompt,
  systemPrompt: botTest.systemPrompt,
  userOrchestratorModel: 'openai/gpt-4o-mini',
  userWorkerModel: 'openai/gpt-4o-mini',
});

console.log(`\nPrompt: "${botTest.prompt}"`);
console.log(`System: "${botTest.systemPrompt}"`);
console.log(`Tier: ${botResult.tier}`);
console.log(`Model: ${botResult.model}`);
console.log(`Confidence: ${(botResult.confidence * 100).toFixed(0)}%`);

console.log('\n' + '='.repeat(80));
console.log('\n✅ Smart Router Integration Test Complete!\n');
console.log('Next step: Test via UI at https://clawer.ai/chat');
console.log('Look for tier badges on assistant messages: ⚡🔧🧠🎯\n');
