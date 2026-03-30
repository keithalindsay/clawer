/**
 * MomBrain API Helpers
 *
 * Shared utilities for all /api/mombrain/* routes.
 * - Container data file reads / writes (via direct fs on mounted volume)
 * - User + container lookup shortcut
 * - OpenAI REST wrappers (no openai npm package required)
 */

import fs from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';
import { apiErrors } from '@/lib/api/response';

// ─── Container path ──────────────────────────────────────────────────────────

/**
 * Returns the clawd data directory for a given container.
 * e.g. /opt/clawer/userdata/<containerId>/clawd/data
 */
export function getContainerDataPath(containerId: string): string {
  return `/opt/clawer/userdata/${containerId}/clawd/data`;
}

/** Returns the clawd root directory (where SOUL.md etc. live). */
export function getContainerClawdPath(containerId: string): string {
  return `/opt/clawer/userdata/${containerId}/clawd`;
}

// ─── User + container helpers ─────────────────────────────────────────────────

export interface ContainerUser {
  containerId: string;
  containerPort: number;
  containerStatus: string | null;
  gatewayToken: string | null;
}

/**
 * Fetch user's container details from the DB.
 * Returns the error response directly if the user/container isn't ready,
 * so callers can do:  const [user, err] = await requireContainer(userId);  if (err) return err;
 */
export async function requireContainer(
  userId: string
): Promise<[ContainerUser, null] | [null, ReturnType<typeof apiErrors.unauthorized>]> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      containerId: true,
      containerPort: true,
      containerStatus: true,
      gatewayToken: true,
    },
  });

  if (!user?.containerId || !user?.containerPort) {
    return [null, apiErrors.notFound('Container') as any];
  }

  if (user.containerStatus !== 'running') {
    // Return a 503-style error re-using internal error slot
    const { NextResponse } = await import('next/server');
    return [
      null,
      NextResponse.json(
        {
          success: false,
          error: { code: 'CONTAINER_NOT_READY', message: `Container is ${user.containerStatus ?? 'not ready'}` },
          meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
        },
        { status: 503 }
      ) as any,
    ];
  }

  return [user as ContainerUser, null];
}

// ─── Container file read / write ──────────────────────────────────────────────

/**
 * Read a JSON file from the container workspace.
 * Returns the parsed value, or `defaultValue` if the file is missing.
 */
export async function readContainerJson<T>(
  containerId: string,
  relPath: string,   // e.g. "calendar-events.json" or "meal-plans/2026-W09.json"
  defaultValue: T
): Promise<T> {
  const fullPath = path.join(getContainerDataPath(containerId), relPath);
  try {
    const raw = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Write a value as JSON to the container workspace.
 * Creates parent directories as needed.
 */
export async function writeContainerJson(
  containerId: string,
  relPath: string,
  data: unknown
): Promise<void> {
  const fullPath = path.join(getContainerDataPath(containerId), relPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── OpenAI REST helpers (no npm package) ────────────────────────────────────

const OPENAI_API_URL = 'https://api.openai.com/v1';

function openAiHeaders(): Record<string, string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not configured');
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

/** GPT-4o-mini vision: analyse an image and return the text content. */
export async function visionAnalyze(
  imageBase64: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1500
): Promise<string> {
  const res = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: openAiHeaders(),
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI vision error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return (json.choices?.[0]?.message?.content as string) ?? '';
}

/** Whisper: transcribe audio buffer to text. */
export async function whisperTranscribe(
  audioBuffer: Buffer,
  format: string = 'm4a'
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not configured');

  const formData = new FormData();
  // Convert Buffer to Uint8Array for Blob compatibility
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: `audio/${format}` });
  formData.append('file', blob, `audio.${format}`);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const res = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return (json.text as string) ?? '';
}

/** TTS: convert text to audio, returns base64-encoded mp3. */
export async function textToSpeech(text: string, voice = 'nova'): Promise<string> {
  const res = await fetch(`${OPENAI_API_URL}/audio/speech`, {
    method: 'POST',
    headers: openAiHeaders(),
    body: JSON.stringify({
      model: 'tts-1',
      voice,
      input: text.slice(0, 4096),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS error ${res.status}: ${err}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:audio/mp3;base64,${buffer.toString('base64')}`;
}

// ─── Vision prompt lookup ─────────────────────────────────────────────────────

export function getVisionSystemPrompt(photoType: string): string {
  const prompts: Record<string, string> = {
    homework: `You are an educational assistant. Analyze this homework image and identify:
- The subject (math, reading, science, etc.)
- The specific problem or assignment
- The child's current work (if visible)
Provide a structured description that a tutor agent can use to guide the student.`,

    fridge: `You are a meal planning assistant. Analyze this fridge/pantry image and list:
- Visible ingredients and approximate quantities
- Items that may be expiring soon (if apparent)
- Notable absences (e.g., no protein, no vegetables)
Format as a JSON-friendly ingredient list.`,

    flyer: `You are a school calendar assistant. Analyze this school flyer or notice and extract:
- Event name(s)
- Date(s) and time(s)
- Location (if mentioned)
- Any deadlines or action items (e.g., permission slip, payment due)
- Any notes for parents
Return structured data.`,

    receipt: `You are a budget tracking assistant. Analyze this receipt and extract:
- Store name
- Date
- Individual line items with prices
- Subtotal, tax, and total
- Payment method (if visible)
Return as structured JSON.`,

    identify: `You are a curious educator. Identify the main subject in this image (plant, bug, animal, object, etc.).
Provide:
- What it is (common name + scientific name if applicable)
- Key identifying features
- One fascinating fact a child would love
- Any safety considerations (if it's an animal/plant that could be dangerous)`,

    auto: `You are a helpful family assistant. Analyze this image and describe what you see in a helpful, actionable way.`,
  };

  return prompts[photoType] ?? prompts.auto;
}

/** Maps photo type to the agent that should handle the result */
export const AGENT_FOR_PHOTO_TYPE: Record<string, string> = {
  homework: 'tutor',
  fridge: 'planner',
  flyer: 'scheduler',
  receipt: 'organizer',
  identify: 'tutor',
  auto: 'default',
};
