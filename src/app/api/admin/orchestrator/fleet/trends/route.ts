import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import fs from 'fs/promises';

const METRICS_FILE = '/opt/orchestrator/logs/fleet-metrics.jsonl';

interface ContainerMetric {
  timestamp: string;
  container: string;
  username: string;
  port: number;
  cpu_percent: number;
  memory_percent: number;
  disk_usage_mb: number;
  uptime_seconds: number;
  restart_count: number;
  health_status: string;
}

interface TrendDataPoint {
  timestamp: string;
  containers: number;
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  avgUptime: number;
  healthyContainers: number;
}

/**
 * GET /api/admin/orchestrator/fleet/trends
 * 
 * Returns metrics over time (aggregated by hour)
 * 
 * Query params:
 *   ?period=24h|7d|30d (default: 24h)
 * 
 * Response: {
 *   dataPoints: TrendDataPoint[],
 *   period: string
 * }
 */
export async function GET(req: Request) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse query params
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '24h';

    // Calculate time range
    const now = new Date();
    let hoursAgo = 24;
    
    switch (period) {
      case '7d':
        hoursAgo = 7 * 24;
        break;
      case '30d':
        hoursAgo = 30 * 24;
        break;
      case '24h':
      default:
        hoursAgo = 24;
    }

    const since = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    // Read metrics file
    let metricsData: string;
    try {
      metricsData = await fs.readFile(METRICS_FILE, 'utf-8');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({ 
          dataPoints: [], 
          period,
          message: 'No metrics data available yet'
        });
      }
      throw error;
    }

    // Parse JSONL and filter by time range
    const lines = metricsData.trim().split('\n');
    const metrics: ContainerMetric[] = lines
      .map(line => {
        try {
          return JSON.parse(line) as ContainerMetric;
        } catch {
          return null;
        }
      })
      .filter((m): m is ContainerMetric => {
        if (!m) return false;
        const timestamp = new Date(m.timestamp);
        return timestamp >= since;
      });

    if (metrics.length === 0) {
      return NextResponse.json({ 
        dataPoints: [], 
        period,
        message: 'No metrics in requested time range'
      });
    }

    // Group by hour
    const hourlyData = new Map<string, ContainerMetric[]>();
    
    for (const metric of metrics) {
      const timestamp = new Date(metric.timestamp);
      const hourKey = new Date(
        timestamp.getFullYear(),
        timestamp.getMonth(),
        timestamp.getDate(),
        timestamp.getHours()
      ).toISOString();
      
      if (!hourlyData.has(hourKey)) {
        hourlyData.set(hourKey, []);
      }
      hourlyData.get(hourKey)!.push(metric);
    }

    // Aggregate each hour
    const dataPoints: TrendDataPoint[] = [];
    
    for (const [timestamp, hourMetrics] of hourlyData.entries()) {
      // Get unique containers in this hour (latest reading per container)
      const containerMap = new Map<string, ContainerMetric>();
      for (const m of hourMetrics) {
        const existing = containerMap.get(m.container);
        if (!existing || new Date(m.timestamp) > new Date(existing.timestamp)) {
          containerMap.set(m.container, m);
        }
      }
      
      const uniqueMetrics = Array.from(containerMap.values());
      const count = uniqueMetrics.length;
      
      if (count === 0) continue;

      const avgCpu = uniqueMetrics.reduce((sum, m) => sum + (m.cpu_percent || 0), 0) / count;
      const avgMemory = uniqueMetrics.reduce((sum, m) => sum + (m.memory_percent || 0), 0) / count;
      const avgDisk = uniqueMetrics.reduce((sum, m) => sum + (m.disk_usage_mb || 0), 0) / count;
      const avgUptime = uniqueMetrics.reduce((sum, m) => sum + (m.uptime_seconds || 0), 0) / count;
      const healthyCount = uniqueMetrics.filter(m => m.health_status === 'healthy').length;

      dataPoints.push({
        timestamp,
        containers: count,
        avgCpu: Math.round(avgCpu * 10) / 10,
        avgMemory: Math.round(avgMemory * 10) / 10,
        avgDisk: Math.round(avgDisk),
        avgUptime: Math.round(avgUptime),
        healthyContainers: healthyCount
      });
    }

    // Sort by timestamp
    dataPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({ dataPoints, period });
  } catch (error: any) {
    console.error('Fleet trends error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch fleet trends' 
    }, { status: 500 });
  }
}
