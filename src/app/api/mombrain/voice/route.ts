/**
 * POST /api/mombrain/voice
 *
 * Voice pipeline:
 *   1. Whisper transcribes the audio
 *   2. Transcribed text is routed through the normal container chat
 *   3. OpenAI TTS converts the agent's text response to audio
 *
 * Request body:
 * {
 *   audioBase64: string   // base64-encoded audio
 *   format?: string       // audio format (default: 'm4a')
 *   agentId?: string      // optional: target specific agent (default: routing is automatic)
 * }
 *
 * Response:
 * {
 *   transcription: string   // what the user said
 *   content: string         // agent text response
 *   audioUrl: string        // data:audio/mp3;base64,... for auto-play
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { containerApi } from '@/lib/container-client';
import { requireContainer, whisperTranscribe, textToSpeech } from '../_helpers';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const body = await req.json();
    const { audioBase64, format = 'm4a', agentId } = body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return apiErrors.validationError({ field: 'audioBase64', message: 'audioBase64 is required' });
    }

    // 1. Get container details
    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    // 2. Whisper transcription
    let transcription: string;
    try {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      transcription = await whisperTranscribe(audioBuffer, format);
    } catch (err: any) {
      console.error('[voice] Whisper error:', err.message);
      return apiErrors.internalError();
    }

    if (!transcription.trim()) {
      return apiErrors.validationError({
        field: 'audioBase64',
        message: 'Could not transcribe audio — no speech detected',
      });
    }

    // 3. Route transcribed text through container chat (same as text chat)
    const effectiveAgentId = agentId ?? 'default';
    const sessionKey = agentId ? `agent:${agentId}:main` : undefined;

    const chatResult = await containerApi.chat(
      containerUser.containerPort,
      transcription,
      sessionKey,
      { model: 'google/gemini-3-flash' },
      containerUser.gatewayToken ?? undefined,
      effectiveAgentId
    );

    if (chatResult.error) {
      console.error('[voice] Container chat error:', chatResult.error);
      return apiErrors.internalError();
    }

    const agentText = chatResult.data?.content ?? '';

    // 4. TTS: convert agent response to audio
    let audioUrl: string;
    try {
      audioUrl = await textToSpeech(agentText);
    } catch (err: any) {
      console.error('[voice] TTS error:', err.message);
      // Return text-only response if TTS fails — better than nothing
      return apiSuccess({
        transcription,
        content: agentText,
        audioUrl: null,
        ttsError: 'TTS unavailable',
      });
    }

    return apiSuccess({
      transcription,
      content: agentText,
      audioUrl,
    });
  } catch (error) {
    console.error('[voice POST]', error);
    return apiErrors.internalError();
  }
}
