/**
 * Tests for POST /api/chat with agentId parameter
 */

import { describe, it, expect } from 'vitest';
import { buildAgentSystemPrompt } from '@/lib/teams';

describe('Agent System Prompt Builder', () => {
  it('should build agent-specific system prompt', () => {
    const agent = {
      id: 'researcher',
      name: 'Scout',
      role: 'Research & Knowledge Manager',
      emoji: '🔍',
      description: 'Find information and save knowledge',
    };
    
    const team = {
      name: 'Personal Assistant',
      description: 'Your personal operating system',
      members: [
        agent,
        { id: 'executor', name: 'Dash', role: 'Task Runner', emoji: '⚡' },
      ],
    };
    
    const prompt = buildAgentSystemPrompt(agent, team, 'Keith');
    
    expect(prompt).toContain('You are Scout');
    expect(prompt).toContain('Research & Knowledge Manager');
    expect(prompt).toContain("Keith's Personal Assistant team");
    expect(prompt).toContain('Dash (Task Runner)');
    expect(prompt).not.toContain('Scout ('); // Should not list self in team members
  });

  it('should handle missing user name', () => {
    const agent = {
      id: 'researcher',
      name: 'Scout',
      role: 'Research & Knowledge Manager',
    };
    
    const team = {
      name: 'Personal Assistant',
      members: [agent],
    };
    
    const prompt = buildAgentSystemPrompt(agent, team);
    expect(prompt).toContain('the user');
  });
});

describe('POST /api/chat with agentId', () => {
  it('should work without agentId (backward compatible)', async () => {
    // Mock chat request without agentId
    // Verify it works as before (no agent persona)
  });

  it('should include agent persona when agentId provided', async () => {
    // Mock:
    // 1. Chat request with agentId='researcher'
    // 2. User has teamTemplate='lifeos'
    // 
    // Verify:
    // - System prompt includes agent name, role, personality
    // - botSettings.customInstructions contains agent prompt
  });

  it('should pass agent context to container', async () => {
    // Mock container API call
    // Verify botSettings includes agent-specific customInstructions
  });

  it('should save message to correct agent thread', async () => {
    // Mock:
    // 1. Chat with agentId='researcher'
    // 2. Existing agent thread for researcher
    // 
    // Verify:
    // - Message saved to researcher's conversation
    // - Not saved to general conversation
  });

  it('should create agent thread if it does not exist', async () => {
    // Mock:
    // 1. Chat with agentId for new agent
    // 2. No existing thread
    // 
    // Verify:
    // - Thread created automatically
    // - Message saved to new thread
  });

  it('should return error for invalid agentId', async () => {
    // Request with agentId not in user's team
    // Verify appropriate error response
  });

  it('should include agent name in response metadata', async () => {
    // Verify response includes which agent responded
  });
});

describe('Cross-Agent Context (Post-MVP)', () => {
  it('should allow agent to reference other agents in response', async () => {
    // Agent mentions another team member
    // Verify it's in the response text (manual AI-generated for MVP)
  });

  // Future: Shared memory tests
  // it('should allow agent to query other agents threads', async () => {});
});
