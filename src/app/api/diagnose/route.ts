/**
 * POST /api/diagnose
 * 
 * Run diagnostics on user's container
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { collectDiagnostics } from '@/lib/diagnostics/collector';
import { analyze } from '@/lib/diagnostics/analyzer';

// Rate limiting (in-memory for now)
const diagnosisRateLimit = new Map<string, { count: number; resetAt: number }>();
const MAX_DIAGNOSES_PER_HOUR = 10;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const now = Date.now();
    const userLimit = diagnosisRateLimit.get(userId);
    
    if (userLimit) {
      if (now < userLimit.resetAt) {
        if (userLimit.count >= MAX_DIAGNOSES_PER_HOUR) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please wait before running more diagnostics.' },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        // Reset counter
        diagnosisRateLimit.set(userId, { count: 1, resetAt: now + 3600000 });
      }
    } else {
      diagnosisRateLimit.set(userId, { count: 1, resetAt: now + 3600000 });
    }

    // Get user's container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        containerPort: true,
        containerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get optional user-reported issue
    let userReportedIssue: string | null = null;
    try {
      const body = await request.json();
      userReportedIssue = body.issue || null;
    } catch {
      // No body or invalid JSON - that's fine
    }

    // Collect diagnostic data
    const context = await collectDiagnostics(
      user.containerPort,
      user.containerId
    );

    // Add user-reported issue if provided
    if (userReportedIssue) {
      context.userReportedIssue = userReportedIssue;
    }

    // Check subscription status
    if (!user.stripeSubscriptionId) {
      context.configErrors.push('No active subscription');
    }

    // Analyze and generate result
    const result = analyze(context);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Diagnose error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run diagnostics' },
      { status: 500 }
    );
  }
}
