/**
 * GET /api/mombrain/meal-plans
 *
 * Returns meal plans stored in the container workspace.
 * Query params:
 *   week?: string  — ISO week label e.g. "2026-W09" (defaults to current week)
 *   all?: "true"   — return all weeks (index of available plans)
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { requireContainer, readContainerJson } from '../_helpers';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    const { searchParams } = new URL(req.url);
    const requestedWeek = searchParams.get('week');
    const returnAll = searchParams.get('all') === 'true';
    const containerId = containerUser.containerId;

    const mealPlansDir = `/opt/clawer/userdata/${containerId}/clawd/data/meal-plans`;

    if (returnAll) {
      // Return list of all available meal plan files
      try {
        const files = await fs.readdir(mealPlansDir);
        const plans = await Promise.all(
          files
            .filter(f => f.endsWith('.json'))
            .map(async f => {
              const week = f.replace('.json', '');
              const data = await readContainerJson(containerId, `meal-plans/${f}`, null);
              return { week, data };
            })
        );
        return apiSuccess({ plans });
      } catch {
        return apiSuccess({ plans: [] });
      }
    }

    // Return a specific week (or current week)
    const week = requestedWeek ?? getCurrentWeekLabel();
    const plan = await readContainerJson(containerId, `meal-plans/${week}.json`, null);

    return apiSuccess({ week, plan });
  } catch (error) {
    console.error('[meal-plans GET]', error);
    return apiErrors.internalError();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCurrentWeekLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  // ISO week number
  const start = new Date(year, 0, 1);
  const week = Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  );
  return `${year}-W${String(week).padStart(2, '0')}`;
}
