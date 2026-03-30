/**
 * POST /api/mombrain/meal-plans/generate
 *
 * Asks Mel (the planner agent) to generate a weekly meal plan.
 * The agent writes the plan to ~/clawd/data/meal-plans/YYYY-WNN.json
 * and returns it in the response.
 *
 * Request body:
 * {
 *   week?: string          — target week label (default: current week)
 *   preferences?: object   — optional overrides (people count, special occasion, etc.)
 *   prompt?: string        — optional free-form instruction
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { containerApi } from '@/lib/container-client';
import { requireContainer, readContainerJson } from '../../_helpers';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    const body = await req.json().catch(() => ({}));
    const { week, preferences, prompt } = body;

    const targetWeek = week ?? getCurrentWeekLabel();

    // Build a structured prompt for the Mel (planner) agent
    const prefsNote = preferences
      ? `\n\nAdditional preferences for this week: ${JSON.stringify(preferences)}`
      : '';
    const customNote = prompt ? `\n\nSpecial request: ${prompt}` : '';

    const agentPrompt =
      `Please generate a meal plan for ${targetWeek}.` +
      prefsNote +
      customNote +
      `\n\nWrite the plan to ~/clawd/data/meal-plans/${targetWeek}.json and also update ~/clawd/data/grocery-list.json with the required ingredients.` +
      `\n\nReturn a brief summary of the plan.`;

    // Route to Mel (planner agent)
    const chatResult = await containerApi.chat(
      containerUser.containerPort,
      agentPrompt,
      'agent:planner:main',
      { model: 'google/gemini-3-flash' },
      containerUser.gatewayToken ?? undefined,
      'planner'
    );

    if (chatResult.error) {
      console.error('[meal-plans/generate] Container chat error:', chatResult.error);
      return apiErrors.internalError();
    }

    // Give the agent a moment to write the file, then read it back
    await sleep(1500);
    const plan = await readContainerJson(
      containerUser.containerId,
      `meal-plans/${targetWeek}.json`,
      null
    );

    return apiSuccess(
      {
        week: targetWeek,
        plan,
        agentSummary: chatResult.data?.content ?? null,
        generated: true,
      },
      201
    );
  } catch (error) {
    console.error('[meal-plans/generate POST]', error);
    return apiErrors.internalError();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCurrentWeekLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  );
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
