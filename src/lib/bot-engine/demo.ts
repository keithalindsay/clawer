/**
 * Demo script to test the Bot Engine
 * Run with: npx tsx src/lib/bot-engine/demo.ts
 */

import { botExecutor } from './executor';
import { getBotDefinition, getBotsForTier } from './bots';
import { modelRouter } from './model-router';
import { toolSandbox } from './tool-sandbox';
import { ExecutionContext, UserTier } from './types';

async function demo() {
  console.log('='.repeat(60));
  console.log('CLAWER.AI Bot Engine Demo');
  console.log('='.repeat(60));
  console.log();

  // 1. Show available bots
  console.log('📋 Available Bots:');
  console.log('-'.repeat(60));
  const allBots = getBotsForTier('enterprise');
  allBots.forEach(bot => {
    console.log(`  • ${bot.name} (${bot.id})`);
    console.log(`    ${bot.description}`);
    console.log();
  });

  // 2. Test email assistant
  console.log('📧 Testing Email Assistant:');
  console.log('-'.repeat(60));
  
  const emailBot = getBotDefinition('email-assistant');
  if (!emailBot) {
    console.error('Email bot not found!');
    return;
  }

  const emailContext: ExecutionContext = {
    userId: 'demo-user-1',
    botId: 'email-assistant',
    tier: 'pro',
    conversationHistory: [],
  };

  const emailResult = await botExecutor.execute(
    'Search for emails from my boss about the project',
    emailContext,
    emailBot
  );

  if (emailResult.success) {
    console.log('✓ Response:', emailResult.response);
    console.log('✓ Usage:', emailResult.usage);
  } else {
    console.log('✗ Error:', emailResult.error);
  }
  console.log();

  // 3. Test calendar manager
  console.log('📅 Testing Calendar Manager:');
  console.log('-'.repeat(60));
  
  const calendarBot = getBotDefinition('calendar-manager');
  if (!calendarBot) {
    console.error('Calendar bot not found!');
    return;
  }

  const calendarContext: ExecutionContext = {
    userId: 'demo-user-1',
    botId: 'calendar-manager',
    tier: 'basic',
    conversationHistory: [],
  };

  const calendarResult = await botExecutor.execute(
    'What meetings do I have tomorrow?',
    calendarContext,
    calendarBot
  );

  if (calendarResult.success) {
    console.log('✓ Response:', calendarResult.response);
    console.log('✓ Usage:', calendarResult.usage);
  } else {
    console.log('✗ Error:', calendarResult.error);
  }
  console.log();

  // 4. Test model router
  console.log('🤖 Testing Model Router:');
  console.log('-'.repeat(60));
  
  const tiers: UserTier[] = ['free', 'basic', 'pro', 'enterprise'];
  tiers.forEach(tier => {
    const model = modelRouter.selectModel(tier);
    console.log(`  ${tier.padEnd(12)} → ${model}`);
  });
  console.log();

  // 5. Test tool sandbox
  console.log('🔧 Testing Tool Sandbox:');
  console.log('-'.repeat(60));
  
  const availableTools = toolSandbox.getAvailableTools();
  console.log(`  Available tools: ${availableTools.length}`);
  availableTools.forEach(tool => {
    console.log(`    • ${tool.name}: ${tool.description}`);
  });
  console.log();

  // 6. Test tier access
  console.log('🔐 Testing Tier Access:');
  console.log('-'.repeat(60));
  
  const testTiers: UserTier[] = ['free', 'basic'];
  testTiers.forEach(tier => {
    const botsForTier = getBotsForTier(tier);
    console.log(`  ${tier} tier can access ${botsForTier.length} bot(s):`);
    botsForTier.forEach(bot => {
      console.log(`    • ${bot.name}`);
    });
  });
  console.log();

  console.log('='.repeat(60));
  console.log('✓ Demo completed successfully!');
  console.log('='.repeat(60));
}

// Run demo
demo().catch(console.error);
