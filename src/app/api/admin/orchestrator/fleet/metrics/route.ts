import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import fs from 'fs/promises';
import path from 'path';

const METRICS_FILE = '/opt/orchestrator/logs/fleet-metrics.jsonl';

interface ContainerMetric {
  timestamp: string;
  container: string;
  username: string;
  port: number;
  cpu_percent: number;
  memory_usage: string;
  memory_percent: number;
  disk_usage_mb: number;
  network_io: string;
  block_io: string;
  uptime_seconds: number;
  restart_count: number;
  session_count: number;
  cron_count: number;
  health_status: string;
  last_heartbeat: string;
  image: string;
}

/**
 * GET /api/admin/orchestrator/fleet/metrics
 * 
 * Returns current fleet metrics
 * 
 * Response: {
 *   containers: ContainerMetric[],
 *   summary: {
 *     totalCpu: number,
 *     totalMemory: number,
 *     totalDisk: number,
 *     avgUptime: number,
 *     totalContainers: number,
 *     healthyContainers: number
 *   }
 * }
 */
export async function GET() {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Read metrics file
    let metricsData: string;
    try {
      metricsData = await fs.readFile(METRICS_FILE, 'utf-8');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({ 
          containers: [], 
          summary: {
            totalCpu: 0,
            totalMemory: 0,
            totalDisk: 0,
            avgUptime: 0,
            totalContainers: 0,
            healthyContainers: 0
          },
          message: 'No metrics data available yet'
        });
      }
      throw error;
    }

    // Parse JSONL (last 100 lines for recent metrics)
    const lines = metricsData.trim().split('\n').slice(-100);
    const allMetrics: ContainerMetric[] = lines
      .map(line => {
        try {
          return JSON.parse(line) as ContainerMetric;
        } catch {
          return null;
        }
      })
      .filter((m): m is ContainerMetric => m !== null);

    // Get latest metric for each container
    const containerMap = new Map<string, ContainerMetric>();
    for (const metric of allMetrics) {
      const existing = containerMap.get(metric.container);
      if (!existing || new Date(metric.timestamp) > new Date(existing.timestamp)) {
        containerMap.set(metric.container, metric);
      }
    }

    const containers = Array.from(containerMap.values());

    // Calculate summary
    const totalCpu = containers.reduce((sum, c) => sum + (c.cpu_percent || 0), 0);
    const totalMemory = containers.reduce((sum, c) => sum + (c.memory_percent || 0), 0);
    const totalDisk = containers.reduce((sum, c) => sum + (c.disk_usage_mb || 0), 0);
    const totalUptime = containers.reduce((sum, c) => sum + (c.uptime_seconds || 0), 0);
    const healthyContainers = containers.filter(c => c.health_status === 'healthy').length;
    const totalContainers = containers.length;

    const summary = {
      totalCpu: Math.round(totalCpu * 10) / 10,
      totalMemory: Math.round(totalMemory * 10) / 10,
      totalDisk: Math.round(totalDisk),
      avgUptime: totalContainers > 0 ? Math.round(totalUptime / totalContainers) : 0,
      totalContainers,
      healthyContainers
    };

    return NextResponse.json({ containers, summary });
  } catch (error: any) {
    console.error('Fleet metrics error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch fleet metrics' 
    }, { status: 500 });
  }
}
