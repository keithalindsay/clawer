/**
 * GET /api/conversations
 * 
 * List user conversations with pagination, search, and sorting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { conversations, messages, bots } from '@/lib/db/schema';
import { eq, and, desc, isNull, ilike, sql, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'recent'; // recent | messages | starred
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [
      eq(conversations.userId, userId),
      isNull(conversations.deletedAt),
    ];

    if (search) {
      conditions.push(ilike(conversations.title, `%${search}%`));
    }

    // Build order clause
    let orderClause;
    switch (sort) {
      case 'messages':
        orderClause = desc(conversations.messageCount);
        break;
      case 'starred':
        // Starred first (metadata->starred = true), then by recent
        orderClause = desc(conversations.lastMessageAt);
        break;
      case 'recent':
      default:
        orderClause = desc(conversations.lastMessageAt);
        break;
    }

    // Fetch conversations with bot info
    const convos = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        messageCount: conversations.messageCount,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        metadata: conversations.metadata,
        botId: conversations.botId,
        botName: bots.name,
        botType: bots.type,
      })
      .from(conversations)
      .leftJoin(bots, eq(conversations.botId, bots.id))
      .where(and(...conditions))
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    // If sorting by starred, re-sort in JS to put starred first
    let sortedConvos = convos;
    if (sort === 'starred') {
      sortedConvos = [...convos].sort((a, b) => {
        const aStarred = (a.metadata as any)?.starred ? 1 : 0;
        const bStarred = (b.metadata as any)?.starred ? 1 : 0;
        if (bStarred !== aStarred) return bStarred - aStarred;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
    }

    // Get first user message for each conversation as preview
    const convoIds = sortedConvos.map(c => c.id);
    let previews: Record<string, string> = {};
    
    if (convoIds.length > 0) {
      const previewMessages = await db
        .select({
          conversationId: messages.conversationId,
          content: messages.content,
        })
        .from(messages)
        .where(
          and(
            sql`${messages.conversationId} IN (${sql.join(convoIds.map(id => sql`${id}`), sql`, `)})`,
            eq(messages.role, 'user')
          )
        )
        .orderBy(asc(messages.createdAt));

      // Take first user message per conversation
      for (const msg of previewMessages) {
        if (!previews[msg.conversationId]) {
          previews[msg.conversationId] = msg.content.slice(0, 150);
        }
      }
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    // Detect platform from metadata
    const getPlatform = (metadata: any): string => {
      if (metadata?.platform) return metadata.platform;
      if (metadata?.source === 'whatsapp' || metadata?.whatsapp) return 'whatsapp';
      if (metadata?.source === 'telegram' || metadata?.telegram) return 'telegram';
      if (metadata?.source === 'slack' || metadata?.slack) return 'slack';
      return 'web';
    };

    const result = sortedConvos.map(convo => ({
      id: convo.id,
      title: convo.title || 'Untitled conversation',
      preview: previews[convo.id] || null,
      messageCount: convo.messageCount,
      lastMessageAt: convo.lastMessageAt.toISOString(),
      createdAt: convo.createdAt.toISOString(),
      starred: !!(convo.metadata as any)?.starred,
      platform: getPlatform(convo.metadata),
      botId: convo.botId,
      botName: convo.botName || 'Assistant',
      botType: convo.botType || 'assistant',
    }));

    return NextResponse.json({
      conversations: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List conversations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list conversations' },
      { status: 500 }
    );
  }
}
