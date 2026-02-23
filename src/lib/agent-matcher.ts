/**
 * Smart agent assignment based on task content
 * Matches task title/description against agent triggers
 */

import type { TeamMember } from './teams';

/**
 * Score how well a task matches an agent's triggers
 */
function scoreMatch(content: string, triggers: string[]): number {
  const lowerContent = content.toLowerCase();
  let score = 0;
  
  for (const trigger of triggers) {
    const lowerTrigger = trigger.toLowerCase();
    
    // Exact word match (highest priority)
    const wordBoundaryRegex = new RegExp(`\\b${lowerTrigger}\\b`, 'i');
    if (wordBoundaryRegex.test(lowerContent)) {
      score += 10;
    }
    // Partial match (lower priority)
    else if (lowerContent.includes(lowerTrigger)) {
      score += 3;
    }
  }
  
  return score;
}

/**
 * Auto-assign the best agent based on task content
 * Returns the agent ID that best matches, or the default agent ID
 */
export function autoAssignAgent(
  taskTitle: string,
  taskDescription: string | null,
  teamMembers: TeamMember[],
  defaultAgentId?: string
): string {
  // Combine title and description for matching
  const content = [taskTitle, taskDescription].filter(Boolean).join(' ');
  
  // Score each agent
  const scores = teamMembers
    .filter(agent => agent.triggers && agent.triggers.length > 0)
    .map(agent => ({
      agent,
      score: scoreMatch(content, agent.triggers!),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);
  
  // Return best match if found
  if (scores.length > 0 && scores[0].score > 0) {
    return scores[0].agent.id;
  }
  
  // Fallback to default agent or first agent in list
  if (defaultAgentId) {
    return defaultAgentId;
  }
  
  // Look for Executive Assistant / Chief of Staff as sensible default
  const generalAgent = teamMembers.find(
    m => m.id === 'executive-assistant' || m.id === 'chief-of-staff'
  );
  
  if (generalAgent) {
    return generalAgent.id;
  }
  
  // Last resort: first agent in list
  return teamMembers[0]?.id || '';
}

/**
 * Get top 3 agent suggestions for a task
 * Returns array of { agentId, agentName, score, emoji }
 */
export function suggestAgents(
  taskTitle: string,
  taskDescription: string | null,
  teamMembers: TeamMember[]
): Array<{ agentId: string; agentName: string; score: number; emoji?: string }> {
  const content = [taskTitle, taskDescription].filter(Boolean).join(' ');
  
  const scores = teamMembers
    .filter(agent => agent.triggers && agent.triggers.length > 0)
    .map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      emoji: agent.emoji,
      score: scoreMatch(content, agent.triggers!),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  return scores;
}
