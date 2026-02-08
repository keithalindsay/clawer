/**
 * Container Manager
 * Handles Docker container lifecycle for user bot workers
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);

const DOCKER_IMAGE = 'clawer-bot-worker';
const DOCKER_HOST = process.env.DOCKER_HOST || 'YOUR_DOCKER_HOST';
const STARTING_PORT = 4001;
const MEMORY_LIMIT = '512m';
const CPU_LIMIT = '0.5';

export interface ContainerInfo {
  userId: string;
  containerName: string;
  port: number;
  status: 'running' | 'stopped' | 'error';
}

/**
 * Provision a new container for a user
 */
export async function provisionContainer(userId: string): Promise<ContainerInfo> {
  console.log(`🚀 Provisioning container for user: ${userId}`);

  try {
    // Get next available port
    const port = await allocatePort(userId);
    const containerName = `clawer_user_${userId}`;
    const moonshotKey = process.env.MOONSHOT_API_KEY;

    if (!moonshotKey) {
      throw new Error('MOONSHOT_API_KEY not set in environment');
    }

    // Check if container already exists
    const existing = await getContainerStatus(containerName);
    if (existing) {
      console.log(`⚠️ Container ${containerName} already exists, removing...`);
      await removeContainer(userId);
    }

    // Run container
    const dockerCmd = `docker run -d \
      --name ${containerName} \
      --memory=${MEMORY_LIMIT} \
      --cpus=${CPU_LIMIT} \
      -p ${port}:3001 \
      -e USER_ID=${userId} \
      -e MOONSHOT_API_KEY=${moonshotKey} \
      --restart=unless-stopped \
      ${DOCKER_IMAGE}`;

    const { stdout, stderr } = await execAsync(dockerCmd);

    if (stderr && !stderr.includes('WARNING')) {
      throw new Error(`Docker error: ${stderr}`);
    }

    const containerId = stdout.trim();
    console.log(`✅ Container created: ${containerId.substring(0, 12)}`);

    // Update user record with port
    await db
      .update(users)
      .set({
        containerPort: port,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Wait for container to be healthy
    await waitForHealthy(containerName, 30);

    console.log(`✅ Container ${containerName} is healthy on port ${port}`);

    return {
      userId,
      containerName,
      port,
      status: 'running',
    };
  } catch (error) {
    console.error(`❌ Failed to provision container for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Start a stopped container
 */
export async function startContainer(userId: string): Promise<void> {
  const containerName = `clawer_user_${userId}`;
  console.log(`▶️ Starting container: ${containerName}`);

  try {
    await execAsync(`docker start ${containerName}`);
    await waitForHealthy(containerName, 30);
    console.log(`✅ Container ${containerName} started`);
  } catch (error) {
    console.error(`❌ Failed to start container ${containerName}:`, error);
    throw error;
  }
}

/**
 * Stop a running container
 */
export async function stopContainer(userId: string): Promise<void> {
  const containerName = `clawer_user_${userId}`;
  console.log(`⏸️ Stopping container: ${containerName}`);

  try {
    await execAsync(`docker stop ${containerName}`);
    console.log(`✅ Container ${containerName} stopped`);
  } catch (error) {
    console.error(`❌ Failed to stop container ${containerName}:`, error);
    throw error;
  }
}

/**
 * Restart a container
 */
export async function restartContainer(userId: string): Promise<void> {
  const containerName = `clawer_user_${userId}`;
  console.log(`🔄 Restarting container: ${containerName}`);

  try {
    await execAsync(`docker restart ${containerName}`);
    await waitForHealthy(containerName, 30);
    console.log(`✅ Container ${containerName} restarted`);
  } catch (error) {
    console.error(`❌ Failed to restart container ${containerName}:`, error);
    throw error;
  }
}

/**
 * Remove a container completely
 */
export async function removeContainer(userId: string): Promise<void> {
  const containerName = `clawer_user_${userId}`;
  console.log(`🗑️ Removing container: ${containerName}`);

  try {
    // Stop first if running
    try {
      await execAsync(`docker stop ${containerName}`);
    } catch {
      // May not be running, ignore
    }

    // Remove
    await execAsync(`docker rm ${containerName}`);

    // Clear port from database
    await db
      .update(users)
      .set({
        containerPort: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(`✅ Container ${containerName} removed`);
  } catch (error) {
    console.error(`❌ Failed to remove container ${containerName}:`, error);
    throw error;
  }
}

/**
 * Get container status
 */
export async function getContainerStatus(containerName: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `docker ps -a --filter "name=${containerName}" --format "{{.Status}}"`
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Allocate next available port for a user
 */
async function allocatePort(userId: string): Promise<number> {
  // Get all existing ports
  const allUsers = await db.query.users.findMany({
    columns: {
      containerPort: true,
    },
  });

  const usedPorts = allUsers
    .map((u) => u.containerPort)
    .filter((p): p is number => p !== null);

  // Find next available port
  let port = STARTING_PORT;
  while (usedPorts.includes(port)) {
    port++;
  }

  return port;
}

/**
 * Wait for container to be healthy
 */
async function waitForHealthy(containerName: string, timeoutSec: number): Promise<void> {
  const startTime = Date.now();
  const timeoutMs = timeoutSec * 1000;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const { stdout } = await execAsync(
        `docker inspect --format='{{.State.Health.Status}}' ${containerName}`
      );
      const health = stdout.trim();

      if (health === 'healthy' || health === '') {
        // Empty health means no healthcheck defined, assume ready after 3s
        if (health === '' && Date.now() - startTime > 3000) {
          return;
        }
        if (health === 'healthy') {
          return;
        }
      }
    } catch {
      // Container may not exist yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Container ${containerName} did not become healthy within ${timeoutSec}s`);
}

/**
 * Get container logs
 */
export async function getContainerLogs(
  userId: string,
  lines: number = 100
): Promise<string> {
  const containerName = `clawer_user_${userId}`;
  try {
    const { stdout } = await execAsync(`docker logs --tail ${lines} ${containerName}`);
    return stdout;
  } catch (error) {
    throw new Error(`Failed to get logs for ${containerName}: ${error}`);
  }
}
