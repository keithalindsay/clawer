import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { alertHistory } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * GET /api/admin/orchestrator/alerts/history
 * 
 * List alert history with pagination and filtering (admin only)
 * 
 * Query params:
 *   - userId: Filter by user ID
 *   - severity: Filter by severity (info|warning|critical)
 *   - limit: Max results (default 50, max 500)
 *   - offset: Pagination offset (default 0)
 */
export async function GET(req: Request) {
  const { userId: adminId } = await auth();
  
  if (!adminId || !(await isAdmin(adminId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const severity = searchParams.get('severity');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with filters
    const conditions = [];
    if (userId) {
      conditions.push(eq(alertHistory.userId, userId));
    }
    if (severity) {
      conditions.push(eq(alertHistory.severity, severity));
    }

    let query = db
      .select()
      .from(alertHistory)
      .orderBy(desc(alertHistory.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const history = await query;

    // Get total count for pagination
    const totalQuery = db
      .select({ count: alertHistory.id })
      .from(alertHistory);
    
    const total = conditions.length > 0 
      ? await totalQuery.where(and(...conditions))
      : await totalQuery;

    return NextResponse.json({ 
      history,
      total: total.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Admin alert history error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch alert history' 
    }, { status: 500 });
  }
}
