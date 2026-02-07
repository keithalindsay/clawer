/**
 * POST /api/chat
 * 
 * Proxy chat messages to user's OpenClaw container
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's container info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { containerPort: true, containerStatus: true },
    });

    if (!user?.containerPort) {
      return NextResponse.json(
        { error: 'Container not provisioned' },
        { status: 404 }
      );
    }

    if (user.containerStatus !== 'running') {
      return NextResponse.json(
        { error: 'Container not running' },
        { status: 503 }
      );
    }

    // Parse request
    const body = await request.json();
    const { botId, messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array required' },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found' },
        { status: 400 }
      );
    }

    // Route to container's chat endpoint
    // The container runs OpenClaw which can handle chat via WebSocket
    // For now, we'll use a simple HTTP endpoint on the API server
    const apiPort = user.containerPort + 1;
    
    try {
      // For now, call the container's agent endpoint via gateway
      const response = await fetch(`http://localhost:${apiPort}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMessage.content,
          context: botId,
        }),
      });

      if (!response.ok) {
        // If container doesn't have /api/chat, return a placeholder
        return NextResponse.json({
          content: `I'm your ${botId || 'AI'} assistant. Your OpenClaw container is running but the chat endpoint is still being set up. Try connecting via WhatsApp or Telegram for full functionality!`,
        });
      }

      const data = await response.json();
      return NextResponse.json(data);
      
    } catch (containerError) {
      // Container might not have the chat endpoint yet
      console.error('Container chat error:', containerError);
      return NextResponse.json({
        content: `I'm connected to your personal AI container! The web chat feature is still being finalized. In the meantime, try connecting via WhatsApp for the full experience.`,
      });
    }

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
