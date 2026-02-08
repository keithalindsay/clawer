/**
 * Health Checker
 * Periodic health checks for user containers with auto-restart
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { isNull, not } from 'drizzle-orm';
import { restartContainer, getContainerStatus } from './container-manager';

const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute
const MAX_RESTART_ATTEMPTS = 3;

interface HealthCheckResult {
  userId: string;
  containerName: string;
  port: number;
  healthy: boolean;
  error?: string;
}

let healthCheckInterval: NodeJS.Timeout | null = null;
const restartAttempts = new Map<string, number>();

/**
 * Start periodic health checks
 */
export function startHealthChecker(): void {
  if (healthCheckInterval) {
    console.log('⚠️ Health checker already running');
    return;
  }

  console.log('🏥 Starting health checker...');

  // Run first check immediately
  performHealthChecks().catch(console.error);

  // Then run periodically
  healthCheckInterval = setInterval(() => {
    performHealthChecks().catch(console.error);
  }, CHECK_INTERVAL_MS);

  console.log(`✅ Health checker running (interval: ${CHECK_INTERVAL_MS / 1000}s)`);
}

/**
 * Stop periodic health checks
 */
export function stopHealthChecker(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('🛑 Health checker stopped');
  }
}

/**
 * Perform health checks on all active containers
 */
async function performHealthChecks(): Promise<HealthCheckResult[]> {
  try {
    // Get all users with containers
    const activeUsers = await db.query.users.findMany({
      where: not(isNull(users.containerPort)),
      columns: {
        id: true,
        containerPort: true,
      },
    });

    if (activeUsers.length === 0) {
      return [];
    }

    console.log(`🏥 Checking health of ${activeUsers.length} containers...`);

    const results: HealthCheckResult[] = [];

    for (const user of activeUsers) {
      const result = await checkContainer(user.id, user.containerPort!);
      results.push(result);

      if (!result.healthy) {
        await handleUnhealthyContainer(user.id);
      } else {
        // Reset restart attempts on success
        restartAttempts.delete(user.id);
      }
    }

    const healthyCount = results.filter((r) => r.healthy).length;
    console.log(`✅ Health check complete: ${healthyCount}/${results.length} healthy`);

    return results;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return [];
  }
}

/**
 * Check individual container health
 */
async function checkContainer(
  userId: string,
  port: number
): Promise<HealthCheckResult> {
  const containerName = `clawer_user_${userId}`;

  try {
    // Check Docker container status
    const status = await getContainerStatus(containerName);

    if (!status) {
      return {
        userId,
        containerName,
        port,
        healthy: false,
        error: 'Container not found',
      };
    }

    if (!status.includes('Up')) {
      return {
        userId,
        containerName,
        port,
        healthy: false,
        error: `Container not running: ${status}`,
      };
    }

    // Try HTTP health check
    const healthUrl = `http://localhost:${port}/health`;
    const isHealthy = await checkHttpHealth(healthUrl);

    if (!isHealthy) {
      return {
        userId,
        containerName,
        port,
        healthy: false,
        error: 'Health endpoint not responding',
      };
    }

    return {
      userId,
      containerName,
      port,
      healthy: true,
    };
  } catch (error) {
    return {
      userId,
      containerName,
      port,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check HTTP health endpoint
 */
async function checkHttpHealth(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Handle unhealthy container with auto-restart
 */
async function handleUnhealthyContainer(userId: string): Promise<void> {
  const attempts = restartAttempts.get(userId) || 0;

  if (attempts >= MAX_RESTART_ATTEMPTS) {
    console.error(
      `❌ Container for user ${userId} failed ${MAX_RESTART_ATTEMPTS} restart attempts, giving up`
    );
    // Could send alert/notification here
    return;
  }

  console.log(
    `🔄 Attempting to restart unhealthy container for user ${userId} (attempt ${attempts + 1}/${MAX_RESTART_ATTEMPTS})`
  );

  try {
    await restartContainer(userId);
    restartAttempts.set(userId, attempts + 1);
    console.log(`✅ Successfully restarted container for user ${userId}`);
  } catch (error) {
    console.error(`❌ Failed to restart container for user ${userId}:`, error);
    restartAttempts.set(userId, attempts + 1);
  }
}

/**
 * Manual health check for a specific user
 */
export async function checkUserHealth(userId: string): Promise<HealthCheckResult> {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
    columns: {
      containerPort: true,
    },
  });

  if (!user || !user.containerPort) {
    throw new Error(`No container found for user ${userId}`);
  }

  return checkContainer(userId, user.containerPort);
}
