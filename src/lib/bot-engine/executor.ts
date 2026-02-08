/**
 * Bot Executor - Main execution engine for bot interactions
 */

import { 
  ExecutionContext, 
  ExecutionResult, 
  Message, 
  BotDefinition,
  ModelRequest,
} from './types';
import { modelRouter } from './model-router';
import { toolSandbox } from './tool-sandbox';
import {
  sanitizeUserInput,
  filterBotOutput,
  enforceResourceLimits,
  requiresConfirmation,
  storePendingAction,
  formatConfirmationMessage,
  logAudit,
  logMessage,
  logToolCall,
  logToolResult,
  logError,
  logRateLimit,
  logBlocked,
  TIER_LIMITS,
} from './security';

/**
 * Rate limit configuration
 */
const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  free: { requests: 100, windowMs: 86400000 }, // 100/day
  basic: { requests: 500, windowMs: 86400000 }, // 500/day
  pro: { requests: 2000, windowMs: 86400000 }, // 2000/day
  enterprise: { requests: -1, windowMs: 0 }, // unlimited
};

/**
 * In-memory rate limit tracking (in production, use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Main bot execution engine
 */
export class BotExecutor {
  /**
   * Execute a bot interaction
   */
  async execute(
    userMessage: string,
    context: ExecutionContext,
    bot: BotDefinition
  ): Promise<ExecutionResult> {
    try {
      // 1. Sanitize user input
      const sanitizationResult = sanitizeUserInput(userMessage);
      if (!sanitizationResult.safe) {
        logBlocked(
          context.userId,
          context.botId,
          'Input sanitization failed',
          { warnings: sanitizationResult.warnings }
        );
        
        return {
          success: false,
          error: 'Your message contains potentially unsafe content. Please rephrase and try again.',
        };
      }
      
      if (sanitizationResult.warnings.length > 0) {
        logAudit({
          timestamp: new Date(),
          userId: context.userId,
          botId: context.botId,
          action: 'input_sanitized',
          details: { warnings: sanitizationResult.warnings },
        });
      }
      
      const sanitizedMessage = sanitizationResult.sanitized;
      
      // 2. Log incoming message
      logMessage(context.userId, context.botId, sanitizedMessage);
      
      // 3. Check resource limits
      const resourceLimits = TIER_LIMITS[context.tier] || TIER_LIMITS.free;
      const limitsResult = enforceResourceLimits(context, resourceLimits);
      
      if (!limitsResult.allowed) {
        logRateLimit(context.userId, context.botId, limitsResult.reason!);
        
        return {
          success: false,
          error: limitsResult.reason,
        };
      }

      // 4. Build message history
      const messages: Message[] = [
        ...context.conversationHistory,
        { role: 'user', content: sanitizedMessage },
      ];

      // 5. Prepare model request
      const modelRequest: ModelRequest = {
        tier: context.tier,
        systemPrompt: bot.systemPrompt,
        messages,
        tools: bot.tools,
        maxTokens: bot.constraints.maxTokensPerRequest,
        temperature: 0.7,
      };

      // 6. Execute model request
      const response = await modelRouter.complete(modelRequest);

      // 7. Handle tool calls if present
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Check tool call limit
        if (response.toolCalls.length > resourceLimits.maxToolCallsPerRequest) {
          logBlocked(
            context.userId,
            context.botId,
            'Too many tool calls',
            { 
              requested: response.toolCalls.length,
              limit: resourceLimits.maxToolCallsPerRequest 
            }
          );
          
          return {
            success: false,
            error: `Too many tool calls (${response.toolCalls.length}). Maximum ${resourceLimits.maxToolCallsPerRequest} allowed.`,
          };
        }
        
        // Check if any tool requires confirmation
        const toolsNeedingConfirmation = response.toolCalls.filter(toolCall =>
          requiresConfirmation(toolCall.name, toolCall.arguments)
        );
        
        if (toolsNeedingConfirmation.length > 0) {
          // Store pending action
          const actionId = storePendingAction({
            id: '',
            userId: context.userId,
            action: toolsNeedingConfirmation[0].name,
            params: toolsNeedingConfirmation[0].arguments,
            expiresAt: new Date(),
            createdAt: new Date(),
          });
          
          logAudit({
            timestamp: new Date(),
            userId: context.userId,
            botId: context.botId,
            action: 'confirmation_required',
            details: {
              toolName: toolsNeedingConfirmation[0].name,
              actionId,
            },
          });
          
          const confirmationMessage = formatConfirmationMessage({
            id: actionId,
            userId: context.userId,
            action: toolsNeedingConfirmation[0].name,
            params: toolsNeedingConfirmation[0].arguments,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            createdAt: new Date(),
          });
          
          return {
            success: true,
            response: confirmationMessage,
            usage: {
              inputTokens: response.usage.inputTokens,
              outputTokens: response.usage.outputTokens,
              model: modelRouter.selectModel(context.tier),
            },
          };
        }
        
        const toolResults = await this.executeToolCalls(
          response.toolCalls,
          context,
          bot.constraints.allowedIntegrations
        );

        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: response.content || '',
          toolCalls: response.toolCalls,
        });

        // Add tool results
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            content: JSON.stringify(result.data),
            toolCallId: result.toolCallId,
          });
        }

        // Make another request with tool results
        const followUpRequest: ModelRequest = {
          ...modelRequest,
          messages,
        };

        const finalResponse = await modelRouter.complete(followUpRequest);
        
        // 8. Filter output
        const filterResult = filterBotOutput(finalResponse.content, context);
        
        if (filterResult.blockedContent.length > 0) {
          logAudit({
            timestamp: new Date(),
            userId: context.userId,
            botId: context.botId,
            action: 'output_filtered',
            details: { blockedContent: filterResult.blockedContent },
          });
        }

        // 9. Log usage
        await this.logUsage(
          context.userId,
          context.botId,
          response.usage.inputTokens + finalResponse.usage.inputTokens,
          response.usage.outputTokens + finalResponse.usage.outputTokens
        );

        return {
          success: true,
          response: filterResult.filtered,
          usage: {
            inputTokens: response.usage.inputTokens + finalResponse.usage.inputTokens,
            outputTokens: response.usage.outputTokens + finalResponse.usage.outputTokens,
            model: modelRouter.selectModel(context.tier),
          },
        };
      }

      // 8. Filter output (no tool calls)
      const filterResult = filterBotOutput(response.content, context);
      
      if (filterResult.blockedContent.length > 0) {
        logAudit({
          timestamp: new Date(),
          userId: context.userId,
          botId: context.botId,
          action: 'output_filtered',
          details: { blockedContent: filterResult.blockedContent },
        });
      }
      
      // 9. Log usage
      await this.logUsage(
        context.userId,
        context.botId,
        response.usage.inputTokens,
        response.usage.outputTokens
      );

      // 10. Return response
      return {
        success: true,
        response: filterResult.filtered,
        usage: {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          model: modelRouter.selectModel(context.tier),
        },
      };
    } catch (error) {
      console.error('[BotExecutor] Execution error:', error);
      
      logError(
        context.userId,
        context.botId,
        error instanceof Error ? error : new Error(String(error))
      );
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check rate limit for user
   */
  private async checkRateLimit(userId: string, tier: string): Promise<boolean> {
    const limits = RATE_LIMITS[tier] || RATE_LIMITS.free;
    
    // Unlimited for enterprise
    if (limits.requests === -1) return true;

    const key = `${userId}:${tier}`;
    const now = Date.now();
    
    let data = rateLimitStore.get(key);
    
    // Reset if window expired
    if (!data || now >= data.resetAt) {
      data = {
        count: 0,
        resetAt: now + limits.windowMs,
      };
      rateLimitStore.set(key, data);
    }

    // Check limit
    if (data.count >= limits.requests) {
      return false;
    }

    // Increment
    data.count++;
    return true;
  }

  /**
   * Execute tool calls
   */
  private async executeToolCalls(
    toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>,
    context: ExecutionContext,
    allowedIntegrations: string[]
  ): Promise<Array<{ toolCallId: string; data: unknown; error?: string }>> {
    const results = [];

    for (const toolCall of toolCalls) {
      // Log tool call
      logToolCall(
        context.userId,
        context.botId,
        toolCall.name,
        toolCall.arguments
      );
      
      // Create tool execution context
      const toolContext = {
        userId: context.userId,
        botId: context.botId,
        tier: context.tier,
        integrations: new Map<string, string>(), // TODO: Load from DB
      };

      // Execute tool
      const result = await toolSandbox.execute(
        toolCall.name,
        toolCall.arguments,
        toolContext,
        [] // TODO: Get allowed tools from bot definition
      );
      
      // Log tool result
      logToolResult(
        context.userId,
        context.botId,
        toolCall.name,
        result.success,
        result.error
      );

      results.push({
        toolCallId: toolCall.id,
        data: result.success ? result.data : null,
        error: result.error,
      });
    }

    return results;
  }

  /**
   * Log usage for billing/analytics
   */
  private async logUsage(
    userId: string,
    botId: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    // TODO: In production, write to database
    console.log('[BotExecutor] Usage:', {
      userId,
      botId,
      inputTokens,
      outputTokens,
      timestamp: new Date().toISOString(),
    });
  }
}

// Singleton instance
export const botExecutor = new BotExecutor();
