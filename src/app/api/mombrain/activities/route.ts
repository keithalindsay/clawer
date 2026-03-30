/**
 * GET /api/mombrain/activities
 *
 * Returns family activity suggestions from the Care (wellness) agent.
 * The agent uses location, weather context, and family profile to
 * return age-appropriate suggestions.
 *
 * Query params:
 *   lat?: number       — user latitude
 *   lng?: number       — user longitude
 *   date?: string      — target date (ISO, default: today)
 *   ageGroup?: string  — optional filter: "toddler" | "elementary" | "teen" | "all"
 *   type?: string      — optional filter: "indoor" | "outdoor" | "free" | "paid" | "all"
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { containerApi } from '@/lib/container-client';
import { requireContainer } from '../_helpers';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
    const ageGroup = searchParams.get('ageGroup') ?? 'all';
    const type = searchParams.get('type') ?? 'all';

    // Build context-rich prompt for the Care (wellness) agent
    const locationNote = lat && lng
      ? `\nLocation: latitude ${lat}, longitude ${lng}`
      : '\nLocation: not provided (suggest general activities)';

    const agentPrompt =
      `Please suggest family activities for ${date}.` +
      locationNote +
      `\nAge group preference: ${ageGroup}` +
      `\nActivity type preference: ${type}` +
      `\n\nProvide 5-8 specific, actionable suggestions. For each include:` +
      `\n- Activity name and brief description` +
      `\n- Why it's great for the family` +
      `\n- Approximate cost (free / $10-20 / $20-50 / $50+)` +
      `\n- Best age range` +
      `\n- Duration estimate` +
      `\n\nFormat as JSON array: [{ name, description, why, cost, ageRange, duration, type }]`;

    const chatResult = await containerApi.chat(
      containerUser.containerPort,
      agentPrompt,
      'agent:wellness:main',
      { model: 'google/gemini-3-flash' },
      containerUser.gatewayToken ?? undefined,
      'wellness'
    );

    if (chatResult.error) {
      console.error('[activities] Container chat error:', chatResult.error);
      return apiErrors.internalError();
    }

    const rawContent = chatResult.data?.content ?? '';

    // Try to parse structured JSON from the agent response
    let suggestions: unknown[] = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Return raw text if JSON parsing fails
    }

    return apiSuccess({
      suggestions,
      rawContent: suggestions.length === 0 ? rawContent : undefined,
      context: {
        date,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        ageGroup,
        type,
      },
    });
  } catch (error) {
    console.error('[activities GET]', error);
    return apiErrors.internalError();
  }
}
