/**
 * POST /api/mombrain/image
 *
 * Vision pipeline:
 *   1. GPT-4o-mini analyses the photo and returns structured text
 *   2. The analysis is routed to the appropriate container agent
 *   3. The agent's response is returned alongside the raw analysis
 *
 * Request body:
 * {
 *   imageBase64: string   // base64-encoded JPEG
 *   photoType?: 'homework' | 'fridge' | 'flyer' | 'receipt' | 'identify' | 'auto'
 *   prompt?: string       // optional override for the user message
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { containerApi } from '@/lib/container-client';
import {
  requireContainer,
  visionAnalyze,
  getVisionSystemPrompt,
  AGENT_FOR_PHOTO_TYPE,
} from '../_helpers';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await req.json();
    const { imageBase64, photoType = 'auto', prompt } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return apiErrors.validationError({ field: 'imageBase64', message: 'imageBase64 is required' });
    }

    // 1. Get container details
    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    // 2. Vision analysis via GPT-4o-mini
    let analysisText: string;
    try {
      const systemPrompt = getVisionSystemPrompt(photoType);
      const userPrompt = prompt ?? `Analyze this ${photoType} image.`;
      analysisText = await visionAnalyze(imageBase64, systemPrompt, userPrompt);
    } catch (err: any) {
      console.error('[image] Vision API error:', err.message);
      return apiErrors.internalError();
    }

    // 3. Route the analysis to the appropriate container agent
    const agentId = AGENT_FOR_PHOTO_TYPE[photoType] ?? 'default';
    const sessionKey = `agent:${agentId}:main`;

    const agentMessage = `[Image Analysis — ${photoType}]\n\n${analysisText}`;

    const chatResult = await containerApi.chat(
      containerUser.containerPort,
      agentMessage,
      sessionKey,
      { model: 'google/gemini-3-flash' },
      containerUser.gatewayToken ?? undefined,
      agentId
    );

    if (chatResult.error) {
      console.error('[image] Container chat error:', chatResult.error);
      // Return the analysis even if agent chat fails
      return apiSuccess({
        analysis: analysisText,
        agentResponse: null,
        agent: agentId,
        photoType,
        error: 'Agent unavailable — analysis returned without agent response',
      });
    }

    return apiSuccess({
      analysis: analysisText,
      agentResponse: chatResult.data?.content ?? null,
      agent: agentId,
      photoType,
    });
  } catch (error) {
    console.error('[image POST]', error);
    return apiErrors.internalError();
  }
}
