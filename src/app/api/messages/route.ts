/**
 * GET/POST /api/messages
 * 
 * Load and save chat messages for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { messages, conversations, bots } from '@/lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

/**
 * GET - Load messages for user's main conversation
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get limit from query params (default 50)
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const conversationId = searchParams.get('conversationId');

    // Get or create default bot
    let bot = await db.query.bots.findFirst({
      where: and(
        eq(bots.userId, userId),
        eq(bots.type, 'assistant')
      ),
    });

    if (!bot) {
      // Create default assistant bot
      [bot] = await db
        .insert(bots)
        .values({
          userId,
          type: 'assistant',
          name: 'AI Assistant',
          description: 'Your personal AI assistant',
          status: 'active',
        })
        .returning();
    }

    // Get or create main conversation
    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.userId, userId),
        eq(conversations.botId, bot.id),
        conversationId ? eq(conversations.id, conversationId) : undefined
      ),
      orderBy: desc(conversations.lastMessageAt),
    });

    if (!conversation) {
      // Create main conversation
      [conversation] = await db
        .insert(conversations)
        .values({
          userId,
          botId: bot.id,
          title: 'Chat',
          messageCount: 0,
          totalTokens: 0,
        })
        .returning();
    }

    // Load messages
    const messageList = await db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(asc(messages.createdAt))
      .limit(limit);

    return NextResponse.json({
      conversationId: conversation.id,
      messages: messageList.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Load messages error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load messages' },
      { status: 500 }
    );
  }
}

/**
 * POST - Save a new message
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role, content, conversationId } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Get or create bot
    let bot = await db.query.bots.findFirst({
      where: and(
        eq(bots.userId, userId),
        eq(bots.type, 'assistant')
      ),
    });

    if (!bot) {
      [bot] = await db
        .insert(bots)
        .values({
          userId,
          type: 'assistant',
          name: 'AI Assistant',
          description: 'Your personal AI assistant',
          status: 'active',
        })
        .returning();
    }

    // Get or create conversation
    let conversation;
    
    if (conversationId) {
      conversation = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        ),
      });
    }

    if (!conversation) {
      [conversation] = await db
        .insert(conversations)
        .values({
          userId,
          botId: bot.id,
          title: 'Chat',
          messageCount: 0,
          totalTokens: 0,
        })
        .returning();
    }

    // Save message
    const [message] = await db
      .insert(messages)
      .values({
        conversationId: conversation.id,
        role,
        content,
        tokenCount: Math.ceil(content.length / 4), // Rough estimate
      })
      .returning();

    // Update conversation
    await db
      .update(conversations)
      .set({
        messageCount: conversation.messageCount + 1,
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, conversation.id));

    return NextResponse.json({
      id: message.id,
      conversationId: conversation.id,
      role: message.role,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Save message error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear conversation history
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Delete messages
    await db
      .delete(messages)
      .where(eq(messages.conversationId, conversationId));

    // Reset conversation
    await db
      .update(conversations)
      .set({
        messageCount: 0,
        totalTokens: 0,
      })
      .where(eq(conversations.id, conversationId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete messages error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete messages' },
      { status: 500 }
    );
  }
}
