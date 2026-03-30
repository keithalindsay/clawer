/**
 * GET /api/mombrain/nudges
 *
 * Returns pending nudges from the container workspace.
 * Query params:
 *   status?: 'pending' | 'sent' | 'acted' | 'dismissed' | 'all'  (default: 'pending')
 *   limit?: number  (default: 20)
 *
 * Nudge shape (matches AGENTS.md spec):
 * {
 *   id: string
 *   type: string            e.g. "picture_day" | "meal_plan" | "deadline" | "birthday" | "grocery"
 *   title: string
 *   body: string            friendly message text
 *   agent: string           which agent owns this nudge
 *   priority: string        "urgent" | "timely" | "helpful"
 *   scheduledFor: string    ISO timestamp
 *   status: string          "pending" | "sent" | "acted" | "dismissed"
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { requireContainer, readContainerJson } from '../_helpers';

interface Nudge {
  id: string;
  type: string;
  title: string;
  body: string;
  agent: string;
  priority: 'urgent' | 'timely' | 'helpful';
  scheduledFor: string;
  status: 'pending' | 'sent' | 'acted' | 'dismissed';
}

const NUDGES_FILE = 'nudges.json';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') ?? 'pending';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

    const nudges = await readContainerJson<Nudge[]>(
      containerUser.containerId,
      NUDGES_FILE,
      []
    );

    let filtered = nudges;

    if (statusFilter !== 'all') {
      filtered = nudges.filter(n => n.status === statusFilter);
    }

    // Sort by priority then scheduledFor
    const priorityOrder: Record<string, number> = { urgent: 0, timely: 1, helpful: 2 };
    filtered.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 3;
      const pb = priorityOrder[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return a.scheduledFor.localeCompare(b.scheduledFor);
    });

    return apiSuccess({ nudges: filtered.slice(0, limit), total: filtered.length });
  } catch (error) {
    console.error('[nudges GET]', error);
    return apiErrors.internalError();
  }
}
