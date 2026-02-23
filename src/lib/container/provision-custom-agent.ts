/**
 * Custom Agent Provisioning
 * 
 * Provisions user-created custom agents with isolated workspaces and SOUL.md files.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import {
  generateCustomAgentSOUL,
  generateCustomAgentAGENTS,
  generateInitialDailyNote,
  generateUserMdTemplate,
  type AgentSOULConfig,
} from './generate-soul';

const execAsync = promisify(exec);

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
 * Execute command inside a container
 */
async function execInContainer(
  containerName: string,
  command: string | string[],
  options?: { timeout?: number }
): Promise<string> {
  const cmdArray = Array.isArray(command) ? command : [command];
  const cmdString = cmdArray.join(' && ');
  const fullCommand = `docker exec ${containerName} sh -c "${cmdString.replace(/"/g, '\\"')}"`;
  
  console.log('[provision-custom] Executing:', fullCommand.substring(0, 100) + '...');
  
  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      timeout: options?.timeout || 30000,
      encoding: 'utf-8',
    });
    
    if (stderr && !stderr.includes('WARNING')) {
      console.warn('[provision-custom] stderr:', stderr);
    }
    
    return stdout.trim();
  } catch (error: any) {
    console.error('[provision-custom] Command failed:', error.message);
    throw new Error(`Container exec failed: ${error.message}`);
  }
}

/**
 * Write file content to container
 */
async function writeFileInContainer(
  containerName: string,
  filePath: string,
  content: string
): Promise<void> {
  // Escape content for heredoc - preserve exact content
  const escapedContent = content
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
  
  const command = `cat > "${filePath}" << 'PROVISION_EOF'
${escapedContent}
PROVISION_EOF`;
  
  await execInContainer(containerName, command);
  console.log(`[provision-custom] Wrote file: ${filePath}`);
}

/**
 * Check if file exists in container
 */
async function fileExistsInContainer(
  containerName: string,
  filePath: string
): Promise<boolean> {
  try {
    await execInContainer(containerName, `test -f "${filePath}"`);
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
    await execInContainer(containerName, [
      `mkdir -p "${workspacePath}"`,
      `mkdir -p "${workspacePath}/memory"`,
      `mkdir -p "${workspacePath}/skills"`,
    ]);
    
    console.log(`[provision-custom] Created workspace directories at ${workspacePath}`);
    
    // 2. Generate and write SOUL.md
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
    await writeFileInContainer(containerName, `${workspacePath}/SOUL.md`, soulMd);
    
    console.log(`[provision-custom] Wrote SOUL.md`);
    
    // 3. Generate and write AGENTS.md
    const agentsMd = generateCustomAgentAGENTS(soulConfig);
    await writeFileInContainer(containerName, `${workspacePath}/AGENTS.md`, agentsMd);
    
    console.log(`[provision-custom] Wrote AGENTS.md`);
    
    // 4. Copy or create USER.md
    const mainUserMdExists = await fileExistsInContainer(
      containerName,
      '/home/user/clawd/USER.md'
    );
    
    if (mainUserMdExists) {
      // Copy existing USER.md
      await execInContainer(
        containerName,
        `cp "/home/user/clawd/USER.md" "${workspacePath}/USER.md"`
      );
      console.log(`[provision-custom] Copied USER.md from main workspace`);
    } else {
      // Create default USER.md
      const userMd = generateUserMdTemplate(name, role);
      await writeFileInContainer(containerName, `${workspacePath}/USER.md`, userMd);
      console.log(`[provision-custom] Created default USER.md`);
    }
    
    // 5. Copy TOOLS.md if exists
    const toolsMdExists = await fileExistsInContainer(
      containerName,
      '/home/user/clawd/TOOLS.md'
    );
    
    if (toolsMdExists) {
      await execInContainer(
        containerName,
        `cp "/home/user/clawd/TOOLS.md" "${workspacePath}/TOOLS.md"`
      );
      console.log(`[provision-custom] Copied TOOLS.md`);
    }
    
    // 5b. Copy PLATFORM.md if exists (platform feature documentation)
    const platformMdExists = await fileExistsInContainer(
      containerName,
      '/home/user/clawd/PLATFORM.md'
    );
    
    if (platformMdExists) {
      await execInContainer(
        containerName,
        `cp "/home/user/clawd/PLATFORM.md" "${workspacePath}/PLATFORM.md"`
      );
      console.log(`[provision-custom] Copied PLATFORM.md`);
    }
    
    // 6. Create initial daily note
    const today = new Date().toISOString().split('T')[0];
    const initialNote = generateInitialDailyNote(name, role);
    await writeFileInContainer(
      containerName,
      `${workspacePath}/memory/${today}.md`,
      initialNote
    );
    
    console.log(`[provision-custom] Created initial daily note`);
    
    // 7. Update openclaw.json to register agent
    // Note: This is a simplified version - in production you'd want to:
    // - Read existing openclaw.json
    // - Parse it
    // - Add agent to agents.list array
    // - Write back
    // For now, we'll just log that this should be done
    console.log(`[provision-custom] TODO: Update openclaw.json to register agent ${agentId}`);
    
    // 8. Restart gateway to pick up new config
    try {
      await execInContainer(containerName, 'openclaw gateway restart', { timeout: 60000 });
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
 * Remove a custom agent's workspace
 */
export async function removeCustomAgent(
  containerName: string,
  agentId: string
): Promise<ProvisionResult> {
  try {
    const workspacePath = `/home/user/clawd/workspace-${agentId}`;
    
    // Remove workspace directory
    await execInContainer(containerName, `rm -rf "${workspacePath}"`);
    
    console.log(`[provision-custom] Removed workspace for agent ${agentId}`);
    
    // TODO: Update openclaw.json to remove agent from agents.list
    // TODO: Restart gateway
    
    return { success: true, agentId };
  } catch (error: any) {
    console.error(`[provision-custom] Failed to remove agent ${agentId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to remove agent workspace',
    };
  }
}
