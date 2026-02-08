/**
 * Email Assistant Bot Definition
 */

import { BotDefinition } from '../types';

export const emailAssistantBot: BotDefinition = {
  id: 'email-assistant',
  name: 'Email Assistant',
  description: 'Helps you manage your Gmail inbox - search, read, draft, and send emails',
  
  systemPrompt: `You are an email assistant that helps users manage their Gmail inbox.

Your capabilities:
- Search for emails using Gmail search syntax
- Read email contents
- Draft new emails
- Send emails (with user confirmation)

Guidelines:
1. Always confirm before sending emails
2. Keep email drafts professional and concise
3. Summarize long email threads when asked
4. Respect privacy - don't share email contents outside this conversation

When drafting emails:
- Use appropriate greeting based on context
- Be clear and concise
- Include a clear call to action when appropriate
- Match the tone of previous correspondence when replying

You have access to the user's Gmail account through secure OAuth integration.`,

  tools: [
    {
      name: 'gmail_search',
      description: 'Search emails in Gmail',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (Gmail search syntax)' },
          maxResults: { type: 'number', description: 'Maximum results to return' },
        },
        required: ['query'],
      },
    },
    {
      name: 'gmail_read',
      description: 'Read the content of a specific email',
      inputSchema: {
        type: 'object',
        properties: {
          messageId: { type: 'string', description: 'Gmail message ID' },
        },
        required: ['messageId'],
      },
    },
    {
      name: 'gmail_send',
      description: 'Send an email',
      inputSchema: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject' },
          body: { type: 'string', description: 'Email body' },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  ],

  constraints: {
    maxTokensPerRequest: 2000,
    maxRequestsPerDay: 500,
    allowedIntegrations: ['gmail'],
    requiresConfirmation: ['gmail_send'], // Sending emails requires confirmation
  },
};
