import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import fs from 'fs/promises';

const RECOMMENDATIONS_FILE = '/opt/orchestrator/logs/recommendations.json';

interface Recommendation {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  container: string;
  username: string;
  message: string;
  action: string;
}

interface FleetSummary {
  total_containers: number;
  unhealthy_containers: number;
  avg_cpu_percent: number;
  avg_memory_percent: number;
}

/**
 * GET /api/admin/orchestrator/fleet/recommendations
 * 
 * Returns actionable recommendations based on fleet data
 * 
 * Response: {
 *   recommendations: Recommendation[],
 *   fleet_summary: FleetSummary,
 *   timestamp: string
 * }
 */
export async function GET() {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Read recommendations file
    let recommendationsData: string;
    try {
      recommendationsData = await fs.readFile(RECOMMENDATIONS_FILE, 'utf-8');
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return NextResponse.json({ 
          recommendations: [],
          fleet_summary: {
            total_containers: 0,
            unhealthy_containers: 0,
            avg_cpu_percent: 0,
            avg_memory_percent: 0
          },
          timestamp: new Date().toISOString(),
          message: 'No recommendations available yet. Run generate-recommendations.sh to create them.'
        });
      }
      throw error;
    }

    // Parse recommendations JSON
    const data = JSON.parse(recommendationsData);

    // Sort recommendations by severity (critical > warning > info)
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const recommendations = (data.recommendations || []).sort((a: Recommendation, b: Recommendation) => {
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return NextResponse.json({
      recommendations,
      fleet_summary: data.fleet_summary || {
        total_containers: 0,
        unhealthy_containers: 0,
        avg_cpu_percent: 0,
        avg_memory_percent: 0
      },
      timestamp: data.timestamp || new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fleet recommendations error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch fleet recommendations' 
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/orchestrator/fleet/recommendations
 * 
 * Trigger recommendation generation on-demand
 * 
 * Returns: {
 *   success: boolean,
 *   message: string
 * }
 */
export async function POST() {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Run the recommendation script
    const { stdout, stderr } = await execAsync(
      'sudo -u orchestrator /opt/orchestrator/scripts/generate-recommendations.sh',
      { timeout: 30000 }
    );

    if (stderr && !stderr.includes('jq')) { // jq warnings are normal
      console.warn('Recommendation generation stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Recommendations generated successfully',
      output: stdout.trim()
    });
  } catch (error: any) {
    console.error('Generate recommendations error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate recommendations',
      details: error.stderr || error.stdout
    }, { status: 500 });
  }
}
