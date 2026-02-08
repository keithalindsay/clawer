/**
 * Container Orchestrator for clawer.ai
 * 
 * Manages Docker containers running OpenClaw for each user.
 * Uses shell commands instead of dockerode to avoid bundling issues.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { alertProvisioningFailure, alertContainerFailure } from '@/lib/alerts';

const execAsync = promisify(exec);

const CONTAINER_IMAGE = 'clawer-openclaw:latest';
const BASE_PORT = 4001;
const MAX_PORT = 5000;

interface ProvisionResult {
  success: boolean;
  containerId?: string;
  port?: number;
  error?: string;
}

/**
 * Execute a Docker command
 */
async function dockerExec(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execAsync(`docker ${command}`);
  } catch (error: any) {
    console.error(`Docker command failed: docker ${command}`, error);
    throw error;
  }
}

/**
 * Allocate the next available port pair for a new container
 * Each container uses 2 ports: gateway (port) and API server (port+1)
 */
async function allocatePort(): Promise<number> {
  // Get all used ports from DB
  const usersWithPorts = await db.query.users.findMany({
    columns: { containerPort: true },
  });
  
  const usedPorts = new Set(
    usersWithPorts
      .map(u => u.containerPort)
      .filter((p): p is number => p !== null)
  );
  
  // Find next available port pair (step by 2)
  for (let port = BASE_PORT; port <= MAX_PORT - 1; port += 2) {
    if (!usedPorts.has(port) && !usedPorts.has(port + 1)) {
      return port;
    }
  }
  
  throw new Error('No available ports');
}

/**
 * Check if a container exists
 */
async function containerExists(containerName: string): Promise<boolean> {
  try {
    const { stdout } = await dockerExec(`ps -a --filter name=${containerName} --format "{{.Names}}"`);
    return stdout.trim().includes(containerName);
  } catch {
    return false;
  }
}

/**
 * Get container state
 */
async function getContainerState(containerName: string): Promise<string | null> {
  try {
    const { stdout } = await dockerExec(`ps -a --filter name=${containerName} --format "{{.State}}"`);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Provision a new OpenClaw container for a user
 */
export async function provisionContainer(userId: string): Promise<ProvisionResult> {
  const containerName = `clawer_user_${userId}`;
  
  try {
    // Check if container already exists
    const exists = await containerExists(containerName);
    
    if (exists) {
      const state = await getContainerState(containerName);
      
      // Start if not running
      if (state !== 'running') {
        await dockerExec(`start ${containerName}`);
      }
      
      // Get user's port from DB
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { containerPort: true, containerId: true },
      });
      
      // Update status
      await db
        .update(users)
        .set({ containerStatus: 'running' })
        .where(eq(users.id, userId));
      
      return {
        success: true,
        containerId: user?.containerId || containerName,
        port: user?.containerPort || undefined,
      };
    }
    
    // Allocate new port
    const port = await allocatePort();
    
    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    // Generate unique gateway token for container API authentication
    const gatewayToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Create and start container
    // Port mapping: gateway on port, API server on port+1
    // SECURITY: Bind to localhost only to prevent direct internet access
    const apiPort = port + 1;
    const createCmd = [
      'run -d',
      `--name ${containerName}`,
      `--memory=1g`,      // 1GB needed for openclaw commands
      `--cpus=1`,
      `-p 127.0.0.1:${port}:8080`,  // Gateway (Control UI + WebSocket) - localhost only
      `-p 127.0.0.1:${apiPort}:8081`,  // API server (REST endpoints) - localhost only
      `-e OPENAI_API_KEY=${openaiApiKey}`,
      `-e GATEWAY_TOKEN=${gatewayToken}`,  // Use generated token
      `-e USER_ID=${userId}`,
      `--restart=unless-stopped`,
      CONTAINER_IMAGE,
    ].join(' ');
    
    const { stdout } = await dockerExec(createCmd);
    const containerId = stdout.trim();
    
    // Update user record
    await db
      .update(users)
      .set({
        containerId,
        containerPort: port,
        containerStatus: 'running',
        containerCreatedAt: new Date(),
        gatewayToken,
      })
      .where(eq(users.id, userId));
    
    return {
      success: true,
      containerId,
      port,
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to provision container for user ${userId}:`, error);
    
    // Send alert
    await alertProvisioningFailure(userId, errorMsg);
    
    // Update user status to error
    await db
      .update(users)
      .set({ containerStatus: 'error' })
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
    await dockerExec(`stop ${containerName}`);
    
    await db
      .update(users)
      .set({ containerStatus: 'stopped' })
      .where(eq(users.id, userId));
    
    return true;
  } catch (error) {
    console.error(`Failed to stop container for user ${userId}:`, error);
    return false;
  }
}

/**
 * Restart a user's container
 */
export async function restartContainer(userId: string): Promise<boolean> {
  const containerName = `clawer_user_${userId}`;
  
  try {
    await dockerExec(`restart ${containerName}`);
    
    await db
      .update(users)
      .set({ containerStatus: 'running' })
      .where(eq(users.id, userId));
    
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to restart container for user ${userId}:`, error);
    await alertContainerFailure(userId, `Restart failed: ${errorMsg}`);
    return false;
  }
}

/**
 * Remove a user's container entirely
 */
export async function removeContainer(userId: string): Promise<boolean> {
  const containerName = `clawer_user_${userId}`;
  
  try {
    // Stop first (ignore errors if already stopped)
    await dockerExec(`stop ${containerName}`).catch(() => {});
    await dockerExec(`rm ${containerName}`);
    
    await db
      .update(users)
      .set({
        containerId: null,
        containerPort: null,
        containerStatus: null,
      })
      .where(eq(users.id, userId));
    
    return true;
  } catch (error) {
    console.error(`Failed to remove container for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get container status for a user
 */
export async function getContainerStatus(userId: string): Promise<'running' | 'stopped' | 'error' | 'not_found'> {
  const containerName = `clawer_user_${userId}`;
  
  try {
    const state = await getContainerState(containerName);
    
    if (!state) return 'not_found';
    if (state === 'running') return 'running';
    if (state === 'exited' || state === 'stopped') return 'stopped';
    return 'error';
    
  } catch (error) {
    console.error(`Failed to get container status for user ${userId}:`, error);
    return 'error';
  }
}

/**
 * Health check all containers and restart unhealthy ones
 */
export async function healthCheckAllContainers(): Promise<void> {
  try {
    const { stdout } = await dockerExec('ps -a --filter name=clawer_user_ --format "{{.Names}} {{.State}}"');
    
    const lines = stdout.trim().split('\n').filter(Boolean);
    
    for (const line of lines) {
      const [name, state] = line.split(' ');
      
      if (state !== 'running') {
        const userId = name?.replace('clawer_user_', '');
        if (userId) {
          console.log(`Restarting unhealthy container for user ${userId}`);
          await restartContainer(userId);
        }
      }
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
}
