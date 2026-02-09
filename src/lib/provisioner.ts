/**
 * Container Provisioner for Production Deployment
 * 
 * Provisions Docker containers on remote server via SSH.
 * Handles all aspects of container creation, patching, and DB updates.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq, desc } from 'drizzle-orm';

const execAsync = promisify(exec);

// Production server configuration
const PRODUCTION_SERVER = 'root@YOUR_DOCKER_HOST';
const CONTAINER_IMAGE = 'clawer-openclaw:ecommerce';
const BASE_PORT = 4010;
const MAX_PORT = 5000;

interface ProvisionResult {
  success: boolean;
  containerId?: string;
  port?: number;
  gatewayToken?: string;
  error?: string;
}

/**
 * Execute command on production server via SSH
 */
async function sshExec(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    const sshCommand = `ssh -o StrictHostKeyChecking=no ${PRODUCTION_SERVER} "${command.replace(/"/g, '\\"')}"`;
    console.log(`[SSH] ${command.substring(0, 100)}...`);
    return await execAsync(sshCommand);
  } catch (error: any) {
    console.error(`SSH command failed: ${command}`, error);
    throw new Error(`SSH execution failed: ${error.message}`);
  }
}

/**
 * Generate a secure gateway token
 */
function generateGatewayToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Allocate the next available port for a new container
 * Scans DB for max port, adds 2, or starts at BASE_PORT
 */
async function allocatePort(): Promise<number> {
  // Get highest port from DB
  const userWithMaxPort = await db.query.users.findFirst({
    columns: { containerPort: true },
    where: (users, { isNotNull }) => isNotNull(users.containerPort),
    orderBy: [desc(users.containerPort)],
  });
  
  if (userWithMaxPort?.containerPort) {
    const nextPort = userWithMaxPort.containerPort + 2;
    if (nextPort <= MAX_PORT) {
      return nextPort;
    }
  }
  
  return BASE_PORT;
}

/**
 * Read API keys from server's .env.local file
 */
async function getServerApiKeys(): Promise<{ openaiKey: string; geminiKey: string }> {
  try {
    const { stdout } = await sshExec('cat /opt/clawer/.env.local');
    
    const openaiMatch = stdout.match(/OPENAI_API_KEY=([^\n]+)/);
    const geminiMatch = stdout.match(/GEMINI_API_KEY=([^\n]+)/);
    
    if (!openaiMatch || !geminiMatch) {
      throw new Error('API keys not found in /opt/clawer/.env.local');
    }
    
    return {
      openaiKey: openaiMatch[1].trim(),
      geminiKey: geminiMatch[1].trim(),
    };
  } catch (error) {
    console.error('Failed to read server API keys:', error);
    throw new Error('Could not retrieve API keys from server');
  }
}

/**
 * Check if container exists on server
 */
async function containerExists(containerName: string): Promise<boolean> {
  try {
    const { stdout } = await sshExec(`docker ps -a --filter name=^${containerName}$ --format "{{.Names}}"`);
    return stdout.trim() === containerName;
  } catch {
    return false;
  }
}

/**
 * Get container ID by name
 */
async function getContainerId(containerName: string): Promise<string | null> {
  try {
    const { stdout } = await sshExec(`docker ps -a --filter name=^${containerName}$ --format "{{.ID}}"`);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Patch container's entrypoint.sh to fix known issues
 */
async function patchContainerEntrypoint(containerId: string): Promise<void> {
  console.log(`[PATCH] Fixing entrypoint.sh in container ${containerId}`);
  
  // Copy entrypoint.sh from container to temp location
  await sshExec(`docker cp ${containerId}:/app/entrypoint.sh /tmp/entrypoint_${containerId}.sh`);
  
  // Fix 1: Remove --port 8080 flag
  await sshExec(`sed -i 's/--port 8080//g' /tmp/entrypoint_${containerId}.sh`);
  
  // Fix 2: Don't unset GATEWAY_TOKEN (comment out the unset line)
  await sshExec(`sed -i 's/^unset GATEWAY_TOKEN/#unset GATEWAY_TOKEN/g' /tmp/entrypoint_${containerId}.sh`);
  
  // Copy patched file back to container
  await sshExec(`docker cp /tmp/entrypoint_${containerId}.sh ${containerId}:/app/entrypoint.sh`);
  
  // Cleanup temp file
  await sshExec(`rm /tmp/entrypoint_${containerId}.sh`);
  
  console.log(`[PATCH] Entrypoint.sh patched successfully`);
}

/**
 * Patch container's openclaw.json to fix provider configuration
 */
async function patchOpenClawConfig(containerId: string): Promise<void> {
  console.log(`[PATCH] Fixing openclaw.json in container ${containerId}`);
  
  // Create proper openclaw.json with correct baseUrl and gateway mode
  const config = {
    gateway: {
      mode: 'local',
      token: '${GATEWAY_TOKEN}'  // Will be replaced by entrypoint
    },
    providers: {
      openai: {
        apiKey: '${OPENAI_API_KEY}',
        baseUrl: 'https://api.openai.com/v1'
      },
      gemini: {
        apiKey: '${GEMINI_API_KEY}'
      }
    }
  };
  
  // Write config to temp file on server
  const configJson = JSON.stringify(config, null, 2);
  await sshExec(`echo '${configJson}' > /tmp/openclaw_${containerId}.json`);
  
  // Copy to container
  await sshExec(`docker cp /tmp/openclaw_${containerId}.json ${containerId}:/app/openclaw.json`);
  
  // Cleanup temp file
  await sshExec(`rm /tmp/openclaw_${containerId}.json`);
  
  console.log(`[PATCH] openclaw.json patched successfully`);
}

/**
 * Provision a new container for a user on the production server
 */
export async function provisionContainer(
  userId: string,
  teamTemplate: string = 'lifeos'
): Promise<ProvisionResult> {
  const containerName = `clawer_user_${userId}`;
  
  console.log(`[PROVISION] Starting provisioning for user ${userId}`);
  
  try {
    // Check if container already exists
    const exists = await containerExists(containerName);
    
    if (exists) {
      console.log(`[PROVISION] Container ${containerName} already exists, starting it`);
      
      // Start if not running
      await sshExec(`docker start ${containerName}`).catch(() => {
        console.log('Container was already running');
      });
      
      // Get existing data from DB
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { containerPort: true, containerId: true, gatewayToken: true },
      });
      
      // Update status
      await db
        .update(users)
        .set({ 
          containerStatus: 'running',
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
      
      return {
        success: true,
        containerId: user?.containerId || containerName,
        port: user?.containerPort || undefined,
        gatewayToken: user?.gatewayToken || undefined,
      };
    }
    
    // Allocate port
    const apiPort = await allocatePort();
    console.log(`[PROVISION] Allocated port ${apiPort}`);
    
    // Generate gateway token
    const gatewayToken = generateGatewayToken();
    console.log(`[PROVISION] Generated gateway token`);
    
    // Get API keys from server
    const { openaiKey, geminiKey } = await getServerApiKeys();
    console.log(`[PROVISION] Retrieved API keys from server`);
    
    // Create container with proper configuration
    const dockerCmd = [
      'docker run -d',
      `--name ${containerName}`,
      '--memory=2g',
      '--cpus=1',
      `-p ${apiPort}:8081`,  // API server port
      `-e USER_ID=${userId}`,
      `-e TEAM_TEMPLATE=${teamTemplate}`,
      `-e 'OPENAI_API_KEY=${openaiKey}'`,
      `-e 'GEMINI_API_KEY=${geminiKey}'`,
      `-e 'GATEWAY_TOKEN=${gatewayToken}'`,
      '--restart=unless-stopped',
      CONTAINER_IMAGE,
    ].join(' \\\n  ');
    
    console.log(`[PROVISION] Creating container...`);
    const { stdout: containerId } = await sshExec(dockerCmd);
    const cleanContainerId = containerId.trim();
    
    console.log(`[PROVISION] Container created: ${cleanContainerId}`);
    
    // Wait a moment for container to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Patch entrypoint.sh
    try {
      await patchContainerEntrypoint(cleanContainerId);
    } catch (error) {
      console.error('Failed to patch entrypoint.sh:', error);
      // Continue anyway - container might still work
    }
    
    // Patch openclaw.json
    try {
      await patchOpenClawConfig(cleanContainerId);
    } catch (error) {
      console.error('Failed to patch openclaw.json:', error);
      // Continue anyway
    }
    
    // Restart container to apply patches
    console.log(`[PROVISION] Restarting container to apply patches`);
    await sshExec(`docker restart ${cleanContainerId}`);
    
    // Update database with container info
    await db
      .update(users)
      .set({
        containerId: cleanContainerId,
        containerPort: apiPort,
        containerStatus: 'running',
        gatewayToken,
        containerCreatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    console.log(`[PROVISION] ✅ Successfully provisioned container for user ${userId}`);
    
    return {
      success: true,
      containerId: cleanContainerId,
      port: apiPort,
      gatewayToken,
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PROVISION] ❌ Failed to provision container for user ${userId}:`, error);
    
    // Update user status to error
    await db
      .update(users)
      .set({ 
        containerStatus: 'error',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Stop a user's container
 */
export async function stopContainer(userId: string): Promise<boolean> {
  const containerName = `clawer_user_${userId}`;
  
  try {
    console.log(`[STOP] Stopping container ${containerName}`);
    await sshExec(`docker stop ${containerName}`);
    
    await db
      .update(users)
      .set({ 
        containerStatus: 'stopped',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    console.log(`[STOP] ✅ Container stopped for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[STOP] ❌ Failed to stop container for user ${userId}:`, error);
    return false;
  }
}

/**
 * Restart a user's container
 */
export async function restartContainer(userId: string): Promise<boolean> {
  const containerName = `clawer_user_${userId}`;
  
  try {
    console.log(`[RESTART] Restarting container ${containerName}`);
    await sshExec(`docker restart ${containerName}`);
    
    await db
      .update(users)
      .set({ 
        containerStatus: 'running',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    console.log(`[RESTART] ✅ Container restarted for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[RESTART] ❌ Failed to restart container for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get container status from server
 */
export async function getContainerStatus(userId: string): Promise<'running' | 'stopped' | 'error' | 'not_found'> {
  const containerName = `clawer_user_${userId}`;
  
  try {
    const { stdout } = await sshExec(`docker ps -a --filter name=^${containerName}$ --format "{{.State}}"`);
    const state = stdout.trim();
    
    if (!state) return 'not_found';
    if (state === 'running') return 'running';
    if (state === 'exited' || state === 'stopped') return 'stopped';
    return 'error';
    
  } catch (error) {
    console.error(`[STATUS] Failed to get container status for user ${userId}:`, error);
    return 'error';
  }
}
