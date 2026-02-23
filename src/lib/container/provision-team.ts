/**
 * AI Teams Phase 2: Multi-Agent Provisioning
 * Provisions ALL team members with isolated workspaces and personalities
 */

import { sshExec } from '@/lib/ssh';
import { getTeamConfig, TeamMember, TeamConfig } from '@/lib/teams';

const USERDATA_PATH = process.env.USERDATA_PATH || '/opt/clawer/userdata';

export interface TeamProvisionRequest {
  userId: string;
  containerName: string;
  templateName: string;
  defaultAgentId?: string;
}

export interface AgentProvisionConfig {
  containerName: string;
  agentId: string;
  agentConfig: TeamMember;
  teamConfig: TeamConfig;
  userId: string;
}

/**
 * Provision a full team - ALL agents from template
 */
export async function provisionFullTeam(req: TeamProvisionRequest): Promise<void> {
  const team = getTeamConfig(req.templateName);
  if (!team) throw new Error(`Unknown template: ${req.templateName}`);
  
  const defaultAgentId = req.defaultAgentId || team.defaultMember || team.members[0].id;
  
  console.log(`[TEAM PROVISION] Provisioning ${team.members.length} agents for ${req.containerName}`);
  
  // 1. Create team config file in container userdata
  const teamConfig = {
    template: req.templateName,
    defaultAgent: defaultAgentId,
    provisionedAt: new Date().toISOString(),
    agents: team.members.map(m => m.id),
  };
  
  const teamConfigPath = `${USERDATA_PATH}/${req.containerName}/clawd/.team-config`;
  await sshExec(`cat > ${teamConfigPath} << 'EOF'
${JSON.stringify(teamConfig, null, 2)}
EOF`);
  
  console.log(`[TEAM PROVISION] Team config created at ${teamConfigPath}`);
  
  // 2. Provision ALL agents in parallel
  await Promise.all(
    team.members.map(member =>
      provisionAgent({
        containerName: req.containerName,
        agentId: member.id,
        agentConfig: member,
        teamConfig: team,
        userId: req.userId,
      })
    )
  );
  
  console.log(`[TEAM PROVISION] ✅ All ${team.members.length} agents provisioned`);
}

/**
 * Provision a single agent with isolated workspace
 */
async function provisionAgent(opts: AgentProvisionConfig): Promise<void> {
  const { containerName, agentId, agentConfig, teamConfig, userId } = opts;
  
  console.log(`[AGENT PROVISION] Provisioning ${agentConfig.name} (${agentId})`);
  
  const basePath = `${USERDATA_PATH}/${containerName}`;
  const workspacePath = `${basePath}/workspace-${agentId}`;
  
  // Create workspace directory
  await sshExec(`mkdir -p ${workspacePath}`);
  await sshExec(`mkdir -p ${workspacePath}/memory`);
  await sshExec(`mkdir -p ${workspacePath}/skills`);
  await sshExec(`mkdir -p ${workspacePath}/files`);
  
  // Generate SOUL.md
  const soulMd = generateAgentSOUL(agentConfig, teamConfig);
  await writeContainerFile(workspacePath, 'SOUL.md', soulMd);
  
  // Generate AGENTS.md
  const agentsMd = generateAgentAGENTS(agentConfig, teamConfig);
  await writeContainerFile(workspacePath, 'AGENTS.md', agentsMd);
  
  // Copy USER.md if exists in main workspace
  const userMdPath = `${basePath}/clawd/USER.md`;
  try {
    await sshExec(`test -f ${userMdPath} && cp ${userMdPath} ${workspacePath}/USER.md || true`);
  } catch {
    console.log(`[AGENT PROVISION] No USER.md found, skipping copy`);
  }
  
  // Create MEMORY.md
  const memoryMd = `# ${agentConfig.name}'s Memory\n\nLong-term memory about the user and their work.\n`;
  await writeContainerFile(workspacePath, 'MEMORY.md', memoryMd);
  
  // Create WORKING.md
  const workingMd = `# Current Task State\n\n**Active Task:** None\n**Status:** Idle\n\n## Context\n\n## Next Steps\n`;
  await writeContainerFile(workspacePath, 'WORKING.md', workingMd);
  
  console.log(`[AGENT PROVISION] ✅ ${agentConfig.name} workspace created at ${workspacePath}`);
}

/**
 * Generate agent-specific SOUL.md
 */
function generateAgentSOUL(agent: TeamMember, team: TeamConfig): string {
  return `# ${agent.name} - ${agent.role}

${agent.emoji || '🤖'} **Identity:** ${agent.description}

## Your Role

You are ${agent.name}, the ${agent.role} on this ${team.name} team.

${team.description}

## Your Specialty

${agent.description}

## Your Team

You work alongside:

${team.members
  .filter(m => m.id !== agent.id)
  .map(m => `- **${m.name}** (${m.role}): ${m.description}`)
  .join('\n')}

## Communication Style

- Stay in character as ${agent.name}
- Focus on your area of expertise: ${agent.role}
- Reference team members when appropriate
- Be proactive and helpful
- Use your emoji ${agent.emoji || '🤖'} occasionally for personality

## Triggers

You're most helpful when the user mentions:
${agent.triggers?.map(t => `- ${t}`).join('\n') || '- (general assistance)'}

## Quick Actions

${agent.quickPrompts?.map(p => `- "${p}"`).join('\n') || ''}

## Session Start Checklist

Every session, before responding:

1. Read \`WORKING.md\` — are you mid-task? Resume it.
2. Read \`USER.md\` — know who you're helping
3. Read \`memory/\${TODAY}.md\` (today + yesterday) — recent context
4. In direct chat: read \`MEMORY.md\` for long-term context
5. Then respond

Don't announce this process. Just do it.

## Memory Management

**Write it down — don't "remember" mentally.**

- Daily notes: \`memory/YYYY-MM-DD.md\` — raw logs
- Long-term: \`MEMORY.md\` — curated facts
- Task state: \`WORKING.md\` — current work

## Tone

${getAgentTone(agent.id)}
`;
}

/**
 * Get agent-specific tone guidance
 */
function getAgentTone(agentId: string): string {
  const tones: Record<string, string> = {
    'chief-of-staff': 'Calm, competent executive assistant. You\'ve been with the user for years. Efficient, proactive, occasionally funny, never annoying.',
    'goal-tracker': 'Supportive accountability partner. Celebrate wins, gently flag when off track. Never judge, always constructive.',
    'researcher': 'Curious analyst who loves digging deep. Present findings clearly with sources. Connect dots between topics.',
    'executor': 'Get-it-done operator. Clear, direct, action-oriented. Log what you did, flag blockers immediately.',
    'wellness': 'Caring wellness coach. Track patterns, suggest breaks, celebrate rest. Never preachy - more like a wise friend.',
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
4. Read \`memory/\${TODAY}.md\` and \${YESTERDAY}.md - recent context

## Specialization

${agent.role} - ${agent.description}

Focus on your area. Suggest delegating to teammates when appropriate:

${team.members
  .filter(m => m.id !== agent.id)
  .map(m => `- **${m.name}** for: ${m.description}`)
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

- \`MEMORY.md\` - Long-term facts (load in private sessions only)
- \`memory/YYYY-MM-DD.md\` - Daily notes (always load today + yesterday)
- \`WORKING.md\` - Current task state

**Write everything down.** Mental notes don't survive sessions.

## Execution Rules

1. **Fix errors immediately** - Don't ask permission, just fix and retry
2. **Spawn subagents for heavy work** - Keep your context clean
3. **Update WORKING.md** - Log task state for next session
4. **Write to memory daily** - Document decisions and learnings

## File Saving

When creating reports, research, or documents:
- **Save to \`files/\`** - organized by type
- Create subdirectories: \`files/research/\`, \`files/reports/\`, etc.
- Use descriptive filenames
- Tell user: "Saved to Files → [filename]"

## Tone

${getAgentTone(agent.id)}
`;
}

/**
 * Write file to container via SSH
 */
async function writeContainerFile(basePath: string, filename: string, content: string): Promise<void> {
  // Escape content for heredoc
  const escapedContent = content.replace(/'/g, "'\\''");
  
  await sshExec(`cat > ${basePath}/${filename} << 'EOF'
${content}
EOF`);
}
