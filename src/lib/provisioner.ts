/**
 * Container Provisioner for Production Deployment
 * 
 * Provisions Docker containers on remote server via SSH.
 * Handles all aspects of container creation, patching, and DB updates.
 */

import crypto from 'crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq, desc } from 'drizzle-orm';
import { sshExec } from '@/lib/ssh';

// v2026.2.16 image: correct api-server.js (Ed25519 auth), correct entrypoint.sh
// DO NOT use 'ecommerce' — it has the old nonce-based api-server (breaks with v2026.2.16 gateway)
const CONTAINER_IMAGE = 'clawer-openclaw:v2026.2.19';
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
async function getServerApiKeys(): Promise<{ minimaxKey: string; openaiKey: string; geminiKey: string }> {
  try {
    const { stdout } = await sshExec('cat /opt/clawer/.env.local');
    
    const minimaxMatch = stdout.match(/MINIMAX_API_KEY=([^\n]+)/);
    const openaiMatch = stdout.match(/OPENAI_API_KEY=([^\n]+)/);
    const geminiMatch = stdout.match(/GEMINI_API_KEY=([^\n]+)/);
    
    return {
      minimaxKey: minimaxMatch?.[1]?.trim() || '',
      openaiKey: openaiMatch?.[1]?.trim() || '',
      geminiKey: geminiMatch?.[1]?.trim() || '',
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
 * Patch container's api-server.js if it has the old nonce-based protocol.
 * 
 * The 'ecommerce' image has a v2026.2.14 api-server that sends nonce in connect params.
 * v2026.2.16 gateway rejects this with "unexpected property 'nonce'".
 * This patch replaces the api-server with the correct Ed25519 device auth version.
 * 
 * NOTE: v2026.2.16 image already has the correct api-server — skip patching for that image.
 * This function is kept as a safety net for any legacy containers.
 */
async function patchApiServerIfNeeded(containerId: string): Promise<void> {
  // Check if the container's api-server has the nonce bug
  const { stdout: hasNonce } = await sshExec(
    `docker exec ${containerId} grep -l "connectNonce" /usr/local/bin/api-server.js 2>/dev/null || echo ""`
  );
  
  if (!hasNonce.trim()) {
    console.log(`[PATCH] api-server.js looks correct (no nonce bug), skipping patch`);
    return;
  }
  
  console.log(`[PATCH] Detected old nonce-based api-server in ${containerId}, patching...`);
  
  // Extract the correct api-server.js from the v2026.2.16 image
  await sshExec(`docker run --rm --entrypoint cat clawer-openclaw:v2026.2.18 /usr/local/bin/api-server.js > /tmp/api-server-fixed.js`);
  
  // Copy to container
  await sshExec(`docker cp /tmp/api-server-fixed.js ${containerId}:/usr/local/bin/api-server.js`);
  await sshExec(`docker exec ${containerId} chmod +x /usr/local/bin/api-server.js`);
  
  // Cleanup
  await sshExec(`rm /tmp/api-server-fixed.js`);
  
  console.log(`[PATCH] api-server.js patched successfully`);
}

/**
 * DEPRECATED: These patches were needed for the old 'ecommerce' image.
 * The v2026.2.16 image already has:
 * - No --port 8080 flag in entrypoint.sh
 * - GATEWAY_TOKEN not unset in entrypoint.sh  
 * - Correct openclaw.json with dangerouslyDisableDeviceAuth
 * 
 * Keeping these functions for backward compatibility with legacy containers.
 */
async function patchContainerEntrypoint(containerId: string): Promise<void> {
  console.log(`[PATCH] Checking entrypoint.sh in container ${containerId}`);
  
  // Only patch if the old --port 8080 issue exists
  const { stdout: hasPortFlag } = await sshExec(
    `docker exec ${containerId} grep -c "port 8080" /usr/local/bin/entrypoint.sh 2>/dev/null || echo "0"`
  );
  
  if (parseInt(hasPortFlag.trim() || '0') === 0) {
    console.log(`[PATCH] entrypoint.sh looks correct, skipping patch`);
    return;
  }
  
  // Copy entrypoint.sh from container to temp location
  await sshExec(`docker cp ${containerId}:/usr/local/bin/entrypoint.sh /tmp/entrypoint_${containerId}.sh`);
  
  // Fix 1: Remove --port 8080 flag
  await sshExec(`sed -i 's/--port 8080//g' /tmp/entrypoint_${containerId}.sh`);
  
  // Fix 2: Don't unset GATEWAY_TOKEN (comment out the unset line)
  await sshExec(`sed -i 's/^unset GATEWAY_TOKEN/#unset GATEWAY_TOKEN/g' /tmp/entrypoint_${containerId}.sh`);
  
  // Copy patched file back to container
  await sshExec(`docker cp /tmp/entrypoint_${containerId}.sh ${containerId}:/usr/local/bin/entrypoint.sh`);
  
  // Cleanup temp file
  await sshExec(`rm /tmp/entrypoint_${containerId}.sh`);
  
  console.log(`[PATCH] Entrypoint.sh patched successfully`);
}

/**
 * DEPRECATED: Not needed for v2026.2.16 image.
 * The v2026.2.16 entrypoint.sh already writes the correct openclaw.json at startup.
 * This function used to overwrite it with a simpler version that was missing
 * dangerouslyDisableDeviceAuth — DO NOT call this for new containers.
 */
async function patchOpenClawConfig(_containerId: string): Promise<void> {
  // v2026.2.16 entrypoint writes the correct config at container startup.
  // Calling this would BREAK the config by removing dangerouslyDisableDeviceAuth.
  console.log(`[PATCH] Skipping openclaw.json patch — v2026.2.16 image writes correct config at startup`);
}

/**
 * Provision a new container for a user on the production server
 */
export async function provisionContainer(
  userId: string,
  teamTemplate: string = 'lifeos'
): Promise<ProvisionResult> {
  // Validate userId format (Clerk format: user_XXXXX with alphanumeric)
  if (!/^user_[a-zA-Z0-9]+$/.test(userId)) {
    throw new Error('Invalid userId format');
  }
  
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
    const { minimaxKey, openaiKey, geminiKey } = await getServerApiKeys();
    console.log(`[PROVISION] Retrieved API keys from server`);
    
    // Create host directories for persistent user data (volume mounts survive container recreation)
    await sshExec(`mkdir -p /opt/clawer/userdata/${containerName}/.openclaw /opt/clawer/userdata/${containerName}/clawd`);
    console.log(`[PROVISION] Created userdata directories for ${containerName}`);

    // Create container with proper configuration
    // SECURITY: Hardened with capability drops, no-new-privileges, resource limits
    const dockerCmd = [
      'docker run -d',
      `--name ${containerName}`,
      // Resource limits
      '--memory=2g',
      '--memory-swap=2g',
      '--cpus=1',
      '--pids-limit=256',
      '--ulimit nofile=1024:2048',
      // Security hardening
      '--security-opt=no-new-privileges',
      '--cap-drop=ALL',
      '--cap-add=CHOWN',
      '--cap-add=SETUID',
      '--cap-add=SETGID',
      '--cap-add=DAC_OVERRIDE',
      '--tmpfs /tmp:rw,noexec,nosuid,size=256m',
      // Network + port
      `-p 127.0.0.1:${apiPort}:8081`,
      // Volume mounts — persistent user data survives container recreation
      `-v /opt/clawer/userdata/${containerName}/.openclaw:/home/user/.openclaw`,
      `-v /opt/clawer/userdata/${containerName}/clawd:/home/user/clawd`,
      // Environment
      `-e USER_ID=${userId}`,
      `-e TEAM_TEMPLATE=${teamTemplate}`,
      `-e 'MINIMAX_API_KEY=${minimaxKey}'`,
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
    
    // Safety net: patch api-server if it has the old nonce bug (shouldn't happen with v2026.2.16)
    try {
      await patchApiServerIfNeeded(cleanContainerId);
    } catch (error) {
      console.error('Failed to check/patch api-server.js:', error);
      // Not fatal - container may still work
    }
    
    // NOTE: patchContainerEntrypoint and patchOpenClawConfig are NOT called for v2026.2.16.
    // The v2026.2.16 image's entrypoint.sh already handles everything correctly at startup.
    // Calling patchOpenClawConfig would BREAK the config by removing dangerouslyDisableDeviceAuth.
    
    // Restart container so the correct entrypoint runs and writes the proper config
    console.log(`[PROVISION] Restarting container to finalize startup...`);
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
  // Validate userId format
  if (!/^user_[a-zA-Z0-9]+$/.test(userId)) {
    throw new Error('Invalid userId format');
  }
  
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
  // Validate userId format
  if (!/^user_[a-zA-Z0-9]+$/.test(userId)) {
    throw new Error('Invalid userId format');
  }
  
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
  // Validate userId format
  if (!/^user_[a-zA-Z0-9]+$/.test(userId)) {
    throw new Error('Invalid userId format');
  }
  
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
