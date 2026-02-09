/**
 * DELETE/PATCH /api/conversations/[id]
 * 
 * DELETE: Soft-delete a conversation
 * PATCH: Toggle starred/pinned
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * DELETE - Soft-delete a conversation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, id),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Soft delete
    await db
      .update(conversations)
      .set({ deletedAt: new Date() })
      .where(eq(conversations.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Toggle starred status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, id),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update metadata with starred field
    const currentMetadata = (conversation.metadata as Record<string, any>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      ...(body.starred !== undefined && { starred: body.starred }),
    };

    await db
      .update(conversations)
      .set({ metadata: updatedMetadata })
      .where(eq(conversations.id, id));

    return NextResponse.json({
      success: true,
      starred: updatedMetadata.starred || false,
    });
  } catch (error: any) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update conversation' },
      { status: 500 }
    );
  }
}
