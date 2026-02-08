/**
 * Calendar Manager Bot Definition
 */

import { BotDefinition } from '../types';

export const calendarManagerBot: BotDefinition = {
  id: 'calendar-manager',
  name: 'Calendar Manager',
  description: 'Manage your calendar - view events, schedule meetings, check availability',
  
  systemPrompt: `You are a calendar assistant that helps users manage their Google Calendar.

Your capabilities:
- List upcoming events
- Create new calendar events
- Update existing events
- Delete events
- Check availability

Guidelines:
1. Always confirm event details before creating
2. Check for scheduling conflicts before booking
3. Use clear, descriptive event titles
4. Include relevant details in event descriptions
5. Respect time zones (use ISO 8601 format)

When scheduling:
- Ask for meeting duration if not specified
- Suggest available time slots when helpful
- Include attendee emails when relevant
- Set appropriate reminders

You have access to the user's Google Calendar through secure OAuth integration.`,

  tools: [
    {
      name: 'calendar_list',
      description: 'List upcoming calendar events',
      inputSchema: {
        type: 'object',
        properties: {
          timeMin: { type: 'string', description: 'Start time (ISO 8601)' },
          timeMax: { type: 'string', description: 'End time (ISO 8601)' },
        },
      },
    },
    {
      name: 'calendar_create',
      description: 'Create a new calendar event',
      inputSchema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: 'Event title' },
          start: { type: 'string', description: 'Start time (ISO 8601)' },
          end: { type: 'string', description: 'End time (ISO 8601)' },
          description: { type: 'string', description: 'Event description' },
          location: { type: 'string', description: 'Event location' },
        },
        required: ['summary', 'start', 'end'],
      },
    },
  ],

  constraints: {
    maxTokensPerRequest: 1500,
    maxRequestsPerDay: 500,
    allowedIntegrations: ['google_calendar'],
    requiresConfirmation: ['calendar_create'], // Creating events requires confirmation
  },
};
