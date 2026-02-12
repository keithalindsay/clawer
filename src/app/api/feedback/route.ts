import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { feedback } from '@/lib/db/schema/feedback';
import { desc, eq } from 'drizzle-orm';

// Simple in-memory rate limiter (10 submissions per hour per user/IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * POST /api/feedback - Submit feedback
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { category, message, email, page } = body;

    // Validate required fields
    if (!category || !message) {
      return NextResponse.json(
        { error: 'Category and message are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['feature_request', 'bug', 'skill_request', 'general'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Rate limiting: use userId if logged in, otherwise IP
    const identifier = userId || req.headers.get('x-forwarded-for') || 'anonymous';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 submissions per hour.' },
        { status: 429 }
      );
    }

    // For anonymous feedback, require email
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Email is required for anonymous feedback' },
        { status: 400 }
      );
    }

    // Insert feedback
    const [newFeedback] = await db.insert(feedback).values({
      userId: userId || null,
      category,
      message: message.trim(),
      email: email?.trim() || null,
      page: page || null,
      status: 'new',
    }).returning();

    return NextResponse.json({
      success: true,
      feedback: newFeedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback - List all feedback (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Parse pagination params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Fetch feedback with pagination
    const feedbackList = await db
      .select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      feedback: feedbackList,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/feedback/:id - Update feedback status (admin only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['new', 'reviewed', 'planned', 'done', 'wont_fix'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update feedback
    const [updated] = await db
      .update(feedback)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(feedback.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: updated,
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
