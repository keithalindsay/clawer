/**
 * Zod validation middleware and helpers
 */

import { z, ZodSchema } from 'zod';
import { ValidationError } from './errors';

/**
 * Validate data against a Zod schema
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }
  
  return result.data;
}

/**
 * Parse and validate JSON body
 */
export async function parseAndValidate<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return validate(schema, body);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError({ message: 'Invalid JSON body' });
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  /**
   * Pagination query params
   */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  }),
  
  /**
   * Bot creation
   */
  createBot: z.object({
    type: z.string().min(1),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    config: z
      .object({
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().int().positive().optional(),
        preferredModel: z.string().optional(),
      })
      .optional(),
  }),
  
  /**
   * Bot update
   */
  updateBot: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'paused']).optional(),
    config: z
      .object({
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().int().positive().optional(),
        preferredModel: z.string().optional(),
      })
      .optional(),
  }),
  
  /**
   * Chat message
   */
  chatMessage: z.object({
    botId: z.string().uuid(),
    conversationId: z.string().uuid().optional(),
    message: z.string().min(1).max(10000),
  }),
  
  /**
   * Conversation update
   */
  updateConversation: z.object({
    title: z.string().min(1).max(200).optional(),
  }),
  
  /**
   * Billing checkout
   */
  billingCheckout: z.object({
    tier: z.enum(['basic', 'pro', 'enterprise']),
    successUrl: z.string().url(),
    cancelUrl: z.string().url(),
  }),
  
  /**
   * OAuth callback
   */
  oauthCallback: z.object({
    code: z.string(),
    state: z.string(),
  }),
  
  /**
   * OAuth authorization
   */
  oauthAuthorize: z.object({
    redirectUrl: z.string().url(),
  }),
};
