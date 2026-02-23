/**
 * AI Teams Phase 2: Multi-Agent Provisioning
 * Provisions ALL team members with isolated workspaces and personalities
 * 
 * CRITICAL: This runs `openclaw agents add` INSIDE the container via docker exec.
 * Workspaces are created inside the container at /home/user/workspace-{agentName}
 */

import { sshExec } from '@/lib/ssh';
import { getTeamConfig, TeamMember, TeamConfig } from '@/lib/teams';

export interface TeamProvisionRequest {
  userId: string;
  containerName: string;
  templateName: string;
  defaultAgentId?: string;
}

export interface AgentProvisionConfig {
  containerName: string;
  agentId: string;          // Template ID (e.g. "chief-of-staff")
  agentName: string;        // OpenClaw agent name (e.g. "max")
  agentConfig: TeamMember;
  teamConfig: TeamConfig;
  userId: string;
}

// Map template agent IDs to short OpenClaw agent names
const AGENT_NAME_MAP: Record<string, string> = {
  // Life OS
  'chief-of-staff': 'max',
  'goal-tracker': 'north',
  'researcher': 'scout',
  'executor': 'dash',
  'wellness': 'zen',
  // Solopreneur
  'executive-assistant': 'claire',
  'research-analyst': 'leo',
  'outreach-specialist': 'harper',
  'hunter': 'hunter',
  'shield': 'shield',
  // E-commerce
  'support': 'alex',
  'marketing': 'maya',
  'analyst': 'sam',
  'writer': 'jordan',
  'operations': 'riley',
  // Content Creator
  'content-strategist': 'mia',
  'social-manager': 'jordan-social',
  'outreach-pr': 'aria',
  // Mom/Parent
  'planner': 'mel',
  'scheduler': 'cal',
  'tutor': 'prof',
  'organizer': 'tidy',
  // Fitness
  'training-coach': 'noah',
  'nutrition-coach': 'nina',
  'accountability-partner': 'ethan',
  // Finance
  'invoices-billing': 'sophia',
  'expenses-bookkeeping': 'liam',
  'tax-planner': 'nora',
};

/**
 * Provision a full team - ALL agents from template
 */
export async function provisionFullTeam(req: TeamProvisionRequest): Promise<void> {
  const team = getTeamConfig(req.templateName);
  if (!team) throw new Error(`Unknown template: ${req.templateName}`);
  
  const defaultAgentId = req.defaultAgentId || team.defaultMember || team.members[0].id;
  
  console.log(`[TEAM PROVISION] Provisioning ${team.members.length} agents for ${req.containerName}`);
  
  // Wait a moment for container to be fully ready
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Verify container is accessible
  try {
    const { stdout } = await sshExec(
      `docker exec ${req.containerName} echo "ready"`,
      10000
    );
    if (!stdout.includes('ready')) {
      throw new Error('Container not responding');
    }
  } catch (error) {
    console.error(`[PROVISION ERROR] Container ${req.containerName} not accessible:`, error);
    throw new Error(`Container not accessible: ${error}`);
  }
  
  // 1. Provision ALL agents sequentially (parallel can cause issues with openclaw config)
  const provisionedAgents: Array<{ id: string; openclaw: string }> = [];
  
  for (const member of team.members) {
    const agentName = AGENT_NAME_MAP[member.id] || member.id.replace(/-/g, '');
    
    try {
      await provisionAgent({
        containerName: req.containerName,
        agentId: member.id,
        agentName,
        agentConfig: member,
        teamConfig: team,
        userId: req.userId,
      });
      provisionedAgents.push({ id: member.id, openclaw: agentName });
      console.log(`[TEAM PROVISION] ✅ ${member.name} (${agentName}) provisioned`);
    } catch (error) {
      console.error(`[PROVISION ERROR] Failed to provision ${member.name}:`, error);
      // Continue with other agents - partial provisioning is better than none
    }
  }
  
  // 2. Create team config file
  const teamConfig = {
    template: req.templateName,
    defaultAgent: defaultAgentId,
    provisionedAt: new Date().toISOString(),
    agents: provisionedAgents,
  };
  
  try {
    await writeContainerFile(
      req.containerName,
      '/home/user/clawd/.team-config',
      JSON.stringify(teamConfig, null, 2)
    );
    console.log(`[TEAM PROVISION] ✅ Team config created`);
  } catch (error) {
    console.error(`[PROVISION ERROR] Failed to write team config:`, error);
  }
  
  console.log(`[TEAM PROVISION] ✅ Provisioned ${provisionedAgents.length}/${team.members.length} agents`);
  
  if (provisionedAgents.length === 0) {
    throw new Error('Failed to provision any agents');
  }
}

/**
 * Provision a single agent with isolated workspace
 */
async function provisionAgent(opts: AgentProvisionConfig): Promise<void> {
  const { containerName, agentId, agentName, agentConfig, teamConfig } = opts;
  
  console.log(`[AGENT PROVISION] Creating ${agentConfig.name} (${agentName}) in ${containerName}`);
  
  const workspacePath = `/home/user/workspace-${agentName}`;
  
  // 1. Create workspace directory
  await sshExec(
    `docker exec ${containerName} mkdir -p ${workspacePath}`,
    15000
  );
  
  // 2. Register agent with OpenClaw (this is the critical step that was missing!)
  try {
    const addResult = await sshExec(
      `docker exec ${containerName} openclaw agents add ${agentName} --workspace ${workspacePath} --non-interactive 2>&1 | tail -5`,
      30000
    );
    console.log(`[AGENT PROVISION] openclaw agents add result: ${addResult.stdout.trim()}`);
  } catch (error) {
    // Check if agent already exists
    const checkResult = await sshExec(
      `docker exec ${containerName} openclaw agents list 2>&1 | grep -c "^- ${agentName}" || true`,
      15000
    );
    if (checkResult.stdout.trim() === '1') {
      console.log(`[AGENT PROVISION] Agent ${agentName} already exists, continuing...`);
    } else {
      throw error;
    }
  }
  
  // 3. Generate and write SOUL.md
  const soulMd = generateAgentSOUL(agentConfig, teamConfig);
  await writeContainerFile(containerName, `${workspacePath}/SOUL.md`, soulMd);
  
  // 4. Generate and write AGENTS.md  
  const agentsMd = generateAgentAGENTS(agentConfig, teamConfig);
  await writeContainerFile(containerName, `${workspacePath}/AGENTS.md`, agentsMd);
  
  // 5. Create memory directory and basic files
  await sshExec(
    `docker exec ${containerName} mkdir -p ${workspacePath}/memory ${workspacePath}/files`,
    15000
  );
  
  // 6. Create MEMORY.md
  const memoryMd = `# ${agentConfig.name}'s Memory\n\nLong-term memory about the user and their work.\n`;
  await writeContainerFile(containerName, `${workspacePath}/MEMORY.md`, memoryMd);
  
  // 7. Create WORKING.md
  const workingMd = `# Current Task State\n\n**Active Task:** None\n**Status:** Idle\n\n## Context\n\n## Next Steps\n`;
  await writeContainerFile(containerName, `${workspacePath}/WORKING.md`, workingMd);
  
  // 8. Copy USER.md from main workspace if exists
  await sshExec(
    `docker exec ${containerName} bash -c 'test -f /home/user/clawd/USER.md && cp /home/user/clawd/USER.md ${workspacePath}/USER.md || true'`,
    15000
  );
  
  console.log(`[AGENT PROVISION] ✅ ${agentConfig.name} workspace ready at ${workspacePath}`);
}

/**
 * Generate agent-specific SOUL.md
 */
function generateAgentSOUL(agent: TeamMember, team: TeamConfig): string {
  return `# ${agent.name} - ${agent.role}

${agent.emoji || '🤖'} **Identity:** ${agent.description || 'Your helpful assistant'}

## Your Role

You are ${agent.name}, the ${agent.role} on this ${team.name} team.

${team.description ? `## Team Purpose\n\n${team.description}\n` : ''}

## Your Specialty

${agent.description || agent.role}

## Your Team

You work alongside:

${team.members
  .filter(m => m.id !== agent.id)
  .map(m => `- **${m.name}** (${m.role}): ${m.description || m.role}`)
  .join('\n')}

## Triggers

You're most helpful when the user mentions:
${agent.triggers?.map(t => `- ${t}`).join('\n') || '- (general assistance)'}

## Quick Actions

${agent.quickPrompts?.map(p => `- "${p}"`).join('\n') || ''}

## Tone

${getAgentTone(agent.id)}
`;
}

/**
 * Get agent-specific tone guidance
 */
function getAgentTone(agentId: string): string {
  const tones: Record<string, string> = {
    // Life OS
    'chief-of-staff': 'Calm, competent executive assistant. You\'ve been with the user for years. Efficient, proactive, occasionally funny, never annoying.',
    'goal-tracker': 'Supportive accountability partner. Celebrate wins, gently flag when off track. Never judge, always constructive.',
    'researcher': 'Curious analyst who loves digging deep. Present findings clearly with sources. Connect dots between topics.',
    'executor': 'Get-it-done operator. Clear, direct, action-oriented. Log what you did, flag blockers immediately.',
    'wellness': 'Caring wellness coach. Track patterns, suggest breaks, celebrate rest. Never preachy - more like a wise friend.',
    // Solopreneur
    'executive-assistant': 'Organized, proactive, anticipates needs. Your right hand that keeps everything running.',
    'research-analyst': 'Thorough, data-driven, presents evidence clearly. Helps make informed decisions.',
    'outreach-specialist': 'Professional, persistent, relationship-focused. Helps grow your network.',
    'hunter': 'Sharp-eyed, competitive, opportunity-focused. Always looking for the next win.',
    'shield': 'Vigilant, detail-oriented, protective. Keeps your digital presence strong.',
    // Fitness
    'training-coach': 'Motivating but realistic. Pushes you while respecting limits.',
    'nutrition-coach': 'Practical, flexible, evidence-based. Good food should taste good.',
    'accountability-partner': 'Supportive but honest. Celebrates wins, calls out excuses.',
  };
  
  return tones[agentId] || 'Professional, helpful, and focused on your specialty.';
}

/**
 * Generate agent-specific AGENTS.md
 */
function generateAgentAGENTS(agent: TeamMember, team: TeamConfig): string {
  return `# AGENTS.md - ${agent.name}'s Workspace

## Who You Are

You are **${agent.name}**, the ${agent.role}.

Read \`SOUL.md\` for your full identity and team context.

## Every Session

1. Read \`WORKING.md\` - current task state
2. Read \`SOUL.md\` - your identity and role
3. Read \`USER.md\` - your human's context
4. Read today's \`memory/\` files - recent context

## Specialization

${agent.role} - ${agent.description || ''}

Focus on your area. Suggest delegating to teammates when appropriate:

${team.members
  .filter(m => m.id !== agent.id)
  .map(m => `- **${m.name}** for: ${m.description || m.role}`)
  .join('\n')}

## Tools & Skills

You have access to OpenClaw's standard toolset:
- \`read\`, \`write\`, \`edit\` - File operations
- \`exec\` - Shell commands
- \`web_search\`, \`web_fetch\` - Research
- \`browser\` - Web automation
- \`subagents\` - Spawn helpers for complex tasks

## Memory

Your memory lives in files:

- \`MEMORY.md\` - Long-term facts
- \`memory/YYYY-MM-DD.md\` - Daily notes
- \`WORKING.md\` - Current task state

**Write everything down.** Mental notes don't survive sessions.

## Tone

${getAgentTone(agent.id)}
`;
}

/**
 * Write file to container via docker exec
 * Uses base64 encoding to handle special characters safely
 */
async function writeContainerFile(
  containerName: string,
  filePath: string,
  content: string
): Promise<void> {
  // Base64 encode to handle special characters
  const base64Content = Buffer.from(content).toString('base64');
  
  await sshExec(
    `docker exec ${containerName} bash -c 'echo "${base64Content}" | base64 -d > ${filePath}'`,
    15000
  );
}

/**
 * Check if team is provisioned in container
 */
export async function hasTeamProvisioned(containerName: string): Promise<boolean> {
  try {
    const { stdout } = await sshExec(
      `docker exec ${containerName} test -f /home/user/clawd/.team-config && echo "yes" || echo "no"`,
      10000
    );
    return stdout.trim() === 'yes';
  } catch {
    return false;
  }
}

/**
 * Get list of provisioned agents in container
 */
export async function getProvisionedAgents(containerName: string): Promise<string[]> {
  try {
    const { stdout } = await sshExec(
      `docker exec ${containerName} openclaw agents list 2>&1 | grep -E "^- [a-z]+" | sed 's/^- //' | sed 's/ .*//'`,
      15000
    );
    return stdout.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}
