/**
 * POST /api/mombrain/nudges/:id/respond
 *
 * Records the user's response to a nudge and optionally routes
 * the action to the responsible agent.
 *
 * Request body:
 * {
 *   action: 'act' | 'dismiss' | 'snooze'
 *   snoozeMinutes?: number   — required when action === 'snooze' (default: 60)
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { containerApi } from '@/lib/container-client';
import { requireContainer, readContainerJson, writeContainerJson } from '../../../_helpers';

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    const { id } = await params;
    const body = await req.json();
    const { action, snoozeMinutes = 60 } = body;

    if (!['act', 'dismiss', 'snooze'].includes(action)) {
      return apiErrors.validationError({
        field: 'action',
        message: 'action must be one of: act, dismiss, snooze',
      });
    }

    const nudges = await readContainerJson<Nudge[]>(
      containerUser.containerId,
      NUDGES_FILE,
      []
    );

    const idx = nudges.findIndex(n => n.id === id);
    if (idx === -1) return apiErrors.notFound('Nudge');

    const nudge = nudges[idx];

    // Update status
    if (action === 'act') {
      nudges[idx] = { ...nudge, status: 'acted' };
    } else if (action === 'dismiss') {
      nudges[idx] = { ...nudge, status: 'dismissed' };
    } else if (action === 'snooze') {
      // Re-schedule the nudge
      const newScheduledFor = new Date(
        Date.now() + snoozeMinutes * 60 * 1000
      ).toISOString();
      nudges[idx] = { ...nudge, status: 'pending', scheduledFor: newScheduledFor };
    }

    await writeContainerJson(containerUser.containerId, NUDGES_FILE, nudges);

    // If acted, route to agent for follow-through
    let agentResponse: string | null = null;
    if (action === 'act') {
      const agentId = nudge.agent || 'default';
      const agentPrompt = `The user acted on this nudge: "${nudge.title}" — ${nudge.body}. Please help them follow through.`;

      const chatResult = await containerApi.chat(
        containerUser.containerPort,
        agentPrompt,
        `agent:${agentId}:main`,
        { model: 'google/gemini-3-flash' },
        containerUser.gatewayToken ?? undefined,
        agentId
      );

      agentResponse = chatResult.data?.content ?? null;
    }

    return apiSuccess({
      nudge: nudges[idx],
      action,
      agentResponse,
    });
  } catch (error) {
    console.error('[nudges/[id]/respond POST]', error);
    return apiErrors.internalError();
  }
}
