import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { bots } from '@/lib/db/schema/bots';
import { conversations } from '@/lib/db/schema/conversations';
import { messages } from '@/lib/db/schema/messages';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { getTeamConfig, getAgentFromTeam } from '@/lib/teams';

interface RouteContext {
  params: Promise<{
    agentId: string;
  }>;
}

/**
 * GET /api/agents/[agentId]/thread
 * 
 * Gets or creates a conversation thread for the current user and specified agent
 * 
 * @returns Conversation with messages and agent metadata
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { agentId } = await context.params;

    // Get user's team template
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        teamTemplate: true,
        name: true,
      },
    });

    const templateName = user?.teamTemplate || 'lifeos';
    const teamConfig = getTeamConfig(templateName);
    
    if (!teamConfig) {
      return NextResponse.json(
        { error: 'Team template not found' },
        { status: 404 }
      );
    }

    // Validate agent exists in user's team
    const agent = getAgentFromTeam(templateName, agentId);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found in your team' },
        { status: 404 }
      );
    }

    // Find or create conversation for this user + agent
    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.userId, userId),
        eq(conversations.agentId, agentId),
        isNull(conversations.deletedAt)
      ),
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      // Get user's default bot (needed for conversation foreign key)
      const userBot = await db.query.bots.findFirst({
        where: eq(bots.userId, userId),
      });

      if (!userBot) {
        return NextResponse.json(
          { error: 'No bot found for user' },
          { status: 500 }
        );
      }

      const [newConversation] = await db
        .insert(conversations)
        .values({
          userId,
          botId: userBot.id,
          title: `Chat with ${agent.name}`,
          agentId: agent.id,
          agentName: agent.name,
          agentEmoji: agent.emoji || '',
          agentRole: agent.role,
          metadata: {
            agentDescription: agent.description,
            triggers: agent.triggers,
          },
        })
        .returning();

      conversation = newConversation;
    }

    // Fetch recent messages (last 50)
    const recentMessages = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversation.id),
      orderBy: [desc(messages.createdAt)],
      limit: 50,
    });

    // Reverse to get chronological order
    recentMessages.reverse();

    return NextResponse.json({
      thread: {
        id: conversation.id,
        agentId: agent.id,
        agentName: agent.name,
        agentEmoji: agent.emoji,
        agentRole: agent.role,
        agentDescription: agent.description,
        title: conversation.title,
        messageCount: conversation.messageCount,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
      },
      messages: recentMessages,
    });

  } catch (error: any) {
    console.error('Error fetching agent thread:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent thread' },
      { status: 500 }
    );
  }
}
