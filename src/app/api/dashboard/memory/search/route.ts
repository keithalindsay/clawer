/**
 * Memory Search API
 * 
 * Provides semantic search across agent memory using OpenClaw CLI.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { searchMemory } from '@/lib/container-client';

/**
 * POST /api/dashboard/memory/search
 * 
 * Search agent memory using OpenClaw's semantic search.
 * 
 * Body: { query: string }
 * 
 * Response:
 * {
 *   results: OpenClawMemorySearchResult[],
 *   error?: string
 * }
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        error: 'Missing or invalid query parameter' 
      }, { status: 400 });
    }

    const { results, error } = await searchMemory(userId, query.trim());

    if (error) {
      return NextResponse.json({ 
        results: [], 
        error 
      }, { status: 200 }); // Graceful error
    }

    return NextResponse.json({ results, error: null });
  } catch (error: any) {
    return NextResponse.json({ 
      results: [], 
      error: error.message 
    }, { status: 500 });
  }
}
