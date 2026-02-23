/**
 * Custom Agent Provisioning
 * 
 * Provisions user-created custom agents with isolated workspaces and SOUL.md files.
 * Uses SSH to execute commands on the production server (same pattern as provision-team.ts).
 */

import { sshExec } from '@/lib/ssh';
import {
  generateCustomAgentSOUL,
  generateCustomAgentAGENTS,
  generateInitialDailyNote,
  generateUserMdTemplate,
  type AgentSOULConfig,
} from './generate-soul';

export interface ProvisionCustomAgentRequest {
  containerName: string;
  agentId: string;
  name: string;
  role: string;
  emoji?: string;
  personality?: string;
  description?: string;
  skills?: string[];
  triggers?: string[];
  quickPrompts?: string[];
  delegationConfig?: {
    canDelegateTo?: string[];
    canReceiveFrom?: string[];
  };
}

export interface ProvisionResult {
  success: boolean;
  error?: string;
  agentId?: string;
}

/**
 * Write file content to container via SSH + docker exec
 * Uses base64 encoding to handle special characters safely (same as provision-team.ts)
 */
async function writeContainerFile(
  containerName: string,
  filePath: string,
  content: string
): Promise<void> {
  const base64Content = Buffer.from(content).toString('base64');
  
  await sshExec(
    `docker exec ${containerName} bash -c 'echo "${base64Content}" | base64 -d > ${filePath}'`,
    15000
  );
}

/**
 * Check if file exists in container
 */
async function fileExistsInContainer(
  containerName: string,
  filePath: string
): Promise<boolean> {
  try {
    await sshExec(
      `docker exec ${containerName} test -f "${filePath}" && echo "yes" || echo "no"`,
      10000
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Provision a custom agent workspace
 */
export async function provisionCustomAgent(
  opts: ProvisionCustomAgentRequest
): Promise<ProvisionResult> {
  const {
    containerName,
    agentId,
    name,
    role,
    emoji = '🤖',
    personality,
    description,
    skills = [],
    triggers = [],
    quickPrompts = [],
    delegationConfig = {},
  } = opts;
  
  try {
    console.log(`[provision-custom] Starting provision for custom agent: ${agentId} (${name})`);
    
    const workspacePath = `/home/user/clawd/workspace-${agentId}`;
    
    // 1. Create workspace directories
    await sshExec(
      `docker exec ${containerName} mkdir -p "${workspacePath}" "${workspacePath}/memory" "${workspacePath}/skills" "${workspacePath}/files"`,
      15000
    );
    
    console.log(`[provision-custom] Created workspace directories at ${workspacePath}`);
    
    // 2. Register agent with OpenClaw (CRITICAL - this was the TODO)
    try {
      const addResult = await sshExec(
        `docker exec ${containerName} openclaw agents add ${agentId} --workspace ${workspacePath} --non-interactive 2>&1 | tail -5`,
        30000
      );
      console.log(`[provision-custom] openclaw agents add result: ${addResult.stdout.trim()}`);
    } catch (error: any) {
      // Check if agent already exists
      const checkResult = await sshExec(
        `docker exec ${containerName} openclaw agents list 2>&1 | grep -c "^- ${agentId}" || echo "0"`,
        15000
      );
      if (checkResult.stdout.trim() === '1') {
        console.log(`[provision-custom] Agent ${agentId} already exists, continuing...`);
      } else {
        console.error(`[provision-custom] Failed to add agent:`, error.message);
        throw error;
      }
    }
    
    // 3. Generate and write SOUL.md
    const soulConfig: AgentSOULConfig = {
      name,
      role,
      emoji,
      personality,
      description,
      skills,
      triggers,
      quickPrompts,
      delegationConfig,
    };
    
    const soulMd = generateCustomAgentSOUL(soulConfig);
    await writeContainerFile(containerName, `${workspacePath}/SOUL.md`, soulMd);
    
    console.log(`[provision-custom] Wrote SOUL.md`);
    
    // 4. Generate and write AGENTS.md
    const agentsMd = generateCustomAgentAGENTS(soulConfig);
    await writeContainerFile(containerName, `${workspacePath}/AGENTS.md`, agentsMd);
    
    console.log(`[provision-custom] Wrote AGENTS.md`);
    
    // 5. Copy or create USER.md
    try {
      const { stdout } = await sshExec(
        `docker exec ${containerName} bash -c 'test -f /home/user/clawd/USER.md && echo "yes" || echo "no"'`,
        10000
      );
      
      if (stdout.trim() === 'yes') {
        await sshExec(
          `docker exec ${containerName} cp "/home/user/clawd/USER.md" "${workspacePath}/USER.md"`,
          15000
        );
        console.log(`[provision-custom] Copied USER.md from main workspace`);
      } else {
        const userMd = generateUserMdTemplate(name, role);
        await writeContainerFile(containerName, `${workspacePath}/USER.md`, userMd);
        console.log(`[provision-custom] Created default USER.md`);
      }
    } catch (error) {
      console.warn(`[provision-custom] USER.md handling skipped:`, error);
    }
    
    // 6. Copy TOOLS.md if exists
    try {
      await sshExec(
        `docker exec ${containerName} bash -c 'test -f /home/user/clawd/TOOLS.md && cp /home/user/clawd/TOOLS.md ${workspacePath}/TOOLS.md || true'`,
        15000
      );
      console.log(`[provision-custom] Copied TOOLS.md (if exists)`);
    } catch (error) {
      console.warn(`[provision-custom] TOOLS.md copy skipped`);
    }
    
    // 7. Copy PLATFORM.md if exists (platform feature documentation)
    try {
      await sshExec(
        `docker exec ${containerName} bash -c 'test -f /home/user/clawd/PLATFORM.md && cp /home/user/clawd/PLATFORM.md ${workspacePath}/PLATFORM.md || true'`,
        15000
      );
      console.log(`[provision-custom] Copied PLATFORM.md (if exists)`);
    } catch (error) {
      console.warn(`[provision-custom] PLATFORM.md copy skipped`);
    }
    
    // 8. Create initial daily note
    const today = new Date().toISOString().split('T')[0];
    const initialNote = generateInitialDailyNote(name, role);
    await writeContainerFile(
      containerName,
      `${workspacePath}/memory/${today}.md`,
      initialNote
    );
    
    console.log(`[provision-custom] Created initial daily note`);
    
    // 9. Create MEMORY.md
    const memoryMd = `# ${name}'s Memory\n\nLong-term memory about the user and their work.\n`;
    await writeContainerFile(containerName, `${workspacePath}/MEMORY.md`, memoryMd);
    
    // 10. Create WORKING.md
    const workingMd = `# Current Task State\n\n**Active Task:** None\n**Status:** Idle\n\n## Context\n\n## Next Steps\n`;
    await writeContainerFile(containerName, `${workspacePath}/WORKING.md`, workingMd);
    
    // 11. Restart gateway to pick up new agent config
    try {
      await sshExec(
        `docker exec ${containerName} openclaw gateway restart`,
        60000
      );
      console.log(`[provision-custom] Gateway restarted successfully`);
    } catch (error: any) {
      console.warn(`[provision-custom] Gateway restart warning (may auto-restart):`, error.message);
      // Non-fatal - gateway may restart on its own
    }
    
    console.log(`[provision-custom] ✅ Successfully provisioned custom agent: ${agentId}`);
    
    return { success: true, agentId };
    
  } catch (error: any) {
    console.error(`[provision-custom] ❌ Failed to provision custom agent:`, error);
    return {
      success: false,
      error: error.message || 'Unknown provisioning error',
    };
  }
}

/**
 * Remove a custom agent's workspace and unregister from OpenClaw
 */
export async function removeCustomAgent(
  containerName: string,
  agentId: string
): Promise<ProvisionResult> {
  try {
    console.log(`[provision-custom] Removing custom agent: ${agentId}`);
    
    const workspacePath = `/home/user/clawd/workspace-${agentId}`;
    
    // 1. Unregister agent from OpenClaw
    try {
      const removeResult = await sshExec(
        `docker exec ${containerName} openclaw agents remove ${agentId} --non-interactive 2>&1 | tail -5`,
        30000
      );
      console.log(`[provision-custom] openclaw agents remove result: ${removeResult.stdout.trim()}`);
    } catch (error: any) {
      // Non-fatal - agent might already be removed or command might not exist
      console.warn(`[provision-custom] Agent removal warning:`, error.message);
    }
    
    // 2. Remove workspace directory
    await sshExec(
      `docker exec ${containerName} rm -rf "${workspacePath}"`,
      15000
    );
    console.log(`[provision-custom] Removed workspace directory`);
    
    // 3. Restart gateway to update agent list
    try {
      await sshExec(
        `docker exec ${containerName} openclaw gateway restart`,
        60000
      );
      console.log(`[provision-custom] Gateway restarted successfully`);
    } catch (error: any) {
      console.warn(`[provision-custom] Gateway restart warning:`, error.message);
    }
    
    console.log(`[provision-custom] ✅ Successfully removed custom agent: ${agentId}`);
    
    return { success: true, agentId };
  } catch (error: any) {
    console.error(`[provision-custom] ❌ Failed to remove agent ${agentId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to remove agent workspace',
    };
  }
}

/**
 * Update a custom agent's SOUL.md and workspace files
 */
export async function updateCustomAgent(
  containerName: string,
  agentId: string,
  config: AgentSOULConfig
): Promise<ProvisionResult> {
  try {
    console.log(`[provision-custom] Updating custom agent: ${agentId}`);
    
    const workspacePath = `/home/user/clawd/workspace-${agentId}`;
    
    // 1. Regenerate and write SOUL.md
    const soulMd = generateCustomAgentSOUL(config);
    await writeContainerFile(containerName, `${workspacePath}/SOUL.md`, soulMd);
    console.log(`[provision-custom] Updated SOUL.md`);
    
    // 2. Regenerate and write AGENTS.md
    const agentsMd = generateCustomAgentAGENTS(config);
    await writeContainerFile(containerName, `${workspacePath}/AGENTS.md`, agentsMd);
    console.log(`[provision-custom] Updated AGENTS.md`);
    
    console.log(`[provision-custom] ✅ Successfully updated custom agent: ${agentId}`);
    
    return { success: true, agentId };
  } catch (error: any) {
    console.error(`[provision-custom] ❌ Failed to update agent ${agentId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to update agent workspace',
    };
  }
}
