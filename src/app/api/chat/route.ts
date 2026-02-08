import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { modelConfigs, getDefaultConfig } from '@/lib/db/schema/model-configs';
import { eq } from 'drizzle-orm';
import { routeRequest } from '@/lib/router';
import { callLLM, buildMessages } from '@/lib/llm';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, context, settings, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Extract bot settings if provided
    const botSettings = settings ? {
      botName: settings.botName || 'Assistant',
      personality: settings.personality || 'helpful and friendly',
      customInstructions: settings.customInstructions || '',
      communicationStyle: settings.communicationStyle || 'balanced',
      responseLength: settings.responseLength || 'balanced',
    } : null;

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { 
        stripeSubscriptionId: true,
      },
    });

    // Check subscription
    if (!user?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 403 }
      );
    }

    // Get user's model preferences (or use defaults)
    const userModelConfig = await db.query.modelConfigs.findFirst({
      where: eq(modelConfigs.userId, userId),
    });
    
    const defaultConfig = getDefaultConfig();
    const orchestratorModel = userModelConfig?.orchestratorModel ?? defaultConfig.orchestrator;
    const workerModel = userModelConfig?.workerModel ?? defaultConfig.worker;

    // ─── Smart Routing ───
    // Classify the message and decide which model to use
    const routing = routeRequest({
      prompt: message,
      systemPrompt: botSettings?.customInstructions,
      userOrchestratorModel: orchestratorModel,
      userWorkerModel: workerModel,
    });

    console.log('[chat] Routing decision:', {
      tier: routing.tier,
      useOrchestrator: routing.useOrchestrator,
      model: routing.model,
      confidence: routing.confidence.toFixed(2),
      signals: routing.signals.slice(0, 3),
      costEstimate: `$${routing.costEstimate.toFixed(6)}`,
      userConfig: userModelConfig ? 'custom' : 'default',
    });

    // ─── Build System Prompt ───
    const systemPromptParts: string[] = [];
    
    if (botSettings) {
      systemPromptParts.push(`You are ${botSettings.botName}, a personal AI assistant.`);
      systemPromptParts.push(`Your personality is ${botSettings.personality}.`);
      
      const styleMap: Record<string, string> = {
        casual: 'Use a casual, conversational tone.',
        balanced: 'Use a balanced, professional but approachable tone.',
        formal: 'Use a formal, business-appropriate tone.',
      };
      systemPromptParts.push(styleMap[botSettings.communicationStyle] || '');
      
      const lengthMap: Record<string, string> = {
        brief: 'Keep responses concise and to-the-point.',
        balanced: 'Provide well-rounded responses.',
        detailed: 'Provide comprehensive, thorough responses.',
      };
      systemPromptParts.push(lengthMap[botSettings.responseLength] || '');
      
      if (botSettings.customInstructions) {
        systemPromptParts.push(`Additional context: ${botSettings.customInstructions}`);
      }
    } else {
      systemPromptParts.push('You are a helpful AI assistant.');
    }
    
    const systemPrompt = systemPromptParts.filter(Boolean).join(' ');

    // ─── Build Messages ───
    // Include conversation history if provided
    const conversationHistory = history?.slice(-10)?.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })) || [];
    
    const messages = buildMessages(message, systemPrompt, conversationHistory);

    // ─── Call LLM ───
    const llmResponse = await callLLM({
      model: routing.model,
      messages,
      temperature: 0.7,
      maxTokens: 4096,
    });

    // Return response with routing metadata
    return NextResponse.json({
      content: llmResponse.content,
      _routing: {
        tier: routing.tier,
        model: llmResponse.model,
        provider: llmResponse.provider,
        confidence: routing.confidence,
        signals: routing.signals,
        costEstimate: routing.costEstimate,
        savings: routing.savings,
        latencyMs: llmResponse.latencyMs,
        usage: llmResponse.usage,
        userConfig: {
          orchestrator: orchestratorModel,
          worker: workerModel,
          isCustom: !!userModelConfig,
        },
      },
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('No API key configured')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 503 }
      );
    }
    
    if (error.message?.includes('error:')) {
      return NextResponse.json(
        { error: error.message },
        { status: 502 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
