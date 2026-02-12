import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { sql } from 'drizzle-orm';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import { isAdmin } from '@/lib/admin';
const PRODUCTION_SERVER = 'root@YOUR_DOCKER_HOST';

async function sshExec(command: string): Promise<{ stdout: string; stderr: string }> {
  const sshCommand = `ssh -o StrictHostKeyChecking=no ${PRODUCTION_SERVER} "${command.replace(/"/g, '\\"')}"`;
  return await execAsync(sshCommand);
}

export async function GET() {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get platform stats from DB
    const [
      totalUsersResult,
      subscribedUsersResult,
      runningContainersResult,
      messagesTodayResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users).where(sql`stripe_subscription_id IS NOT NULL`),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users).where(sql`container_status = 'running'`),
      db.select({ count: sql<number>`cast(sum(daily_message_count) as integer)` }).from(users),
    ]);

    const totalUsers = totalUsersResult[0]?.count || 0;
    const activeSubscriptions = subscribedUsersResult[0]?.count || 0;
    const containersRunning = runningContainersResult[0]?.count || 0;
    const messagesToday = messagesTodayResult[0]?.count || 0;

    // Get system health from production server
    let systemHealth = {
      cpuPercent: 0,
      memoryPercent: 0,
      diskPercent: 0,
      totalContainers: 0,
    };

    try {
      // Get CPU usage (1-minute load average / cores)
      const { stdout: cpuInfo } = await sshExec("nproc && cat /proc/loadavg");
      const [cores, loadavg] = cpuInfo.split('\n');
      const coreCount = parseInt(cores);
      const load = parseFloat(loadavg.split(' ')[0]);
      systemHealth.cpuPercent = Math.round((load / coreCount) * 100);

      // Get memory usage
      const { stdout: memInfo } = await sshExec("free | grep Mem | awk '{print ($3/$2) * 100.0}'");
      systemHealth.memoryPercent = Math.round(parseFloat(memInfo));

      // Get disk usage
      const { stdout: diskInfo } = await sshExec("df -h / | tail -1 | awk '{print $5}' | sed 's/%//'");
      systemHealth.diskPercent = parseInt(diskInfo);

      // Get total Docker containers
      const { stdout: containerCount } = await sshExec("docker ps -a | tail -n +2 | wc -l");
      systemHealth.totalContainers = parseInt(containerCount);
    } catch (error) {
      console.error('Failed to get system health:', error);
    }

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      containersRunning,
      messagesToday,
      systemHealth,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get stats' 
    }, { status: 500 });
  }
}
