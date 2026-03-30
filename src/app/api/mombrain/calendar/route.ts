/**
 * GET  /api/mombrain/calendar  — list events (optionally filtered by date range)
 * POST /api/mombrain/calendar  — create a new calendar event
 *
 * Storage: ~/clawd/data/calendar-events.json
 *
 * Event shape:
 * {
 *   id: string
 *   title: string
 *   description?: string
 *   startDate: string    ISO datetime or date
 *   endDate?: string
 *   allDay?: boolean
 *   location?: string
 *   familyMemberId?: string   — which child (null = whole family)
 *   type?: string             — e.g. "school", "sports", "medical", "birthday"
 *   reminderMinutes?: number
 *   createdAt: string
 *   updatedAt: string
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { requireContainer, readContainerJson, writeContainerJson } from '../_helpers';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  location: string | null;
  familyMemberId: string | null;
  type: string | null;
  reminderMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

const EVENTS_FILE = 'calendar-events.json';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const familyMemberId = searchParams.get('familyMemberId');

    const events = await readContainerJson<CalendarEvent[]>(
      containerUser.containerId,
      EVENTS_FILE,
      []
    );

    let filtered = events;

    if (startDate) {
      filtered = filtered.filter(e => e.startDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.startDate <= endDate);
    }
    if (familyMemberId) {
      filtered = filtered.filter(
        e => e.familyMemberId === familyMemberId || e.familyMemberId === null
      );
    }

    // Sort by start date ascending
    filtered.sort((a, b) => a.startDate.localeCompare(b.startDate));

    return apiSuccess({ events: filtered, total: filtered.length });
  } catch (error) {
    console.error('[calendar GET]', error);
    return apiErrors.internalError();
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    const body = await req.json();
    const { title, description, startDate, endDate, allDay, location, familyMemberId, type, reminderMinutes } = body;

    if (!title || typeof title !== 'string') {
      return apiErrors.validationError({ field: 'title', message: 'title is required' });
    }
    if (!startDate || typeof startDate !== 'string') {
      return apiErrors.validationError({ field: 'startDate', message: 'startDate is required' });
    }

    const events = await readContainerJson<CalendarEvent[]>(
      containerUser.containerId,
      EVENTS_FILE,
      []
    );

    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      id: randomUUID(),
      title: title.trim(),
      description: description ?? null,
      startDate,
      endDate: endDate ?? null,
      allDay: allDay ?? false,
      location: location ?? null,
      familyMemberId: familyMemberId ?? null,
      type: type ?? null,
      reminderMinutes: reminderMinutes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    events.push(newEvent);
    await writeContainerJson(containerUser.containerId, EVENTS_FILE, events);

    return apiSuccess({ event: newEvent }, 201);
  } catch (error) {
    console.error('[calendar POST]', error);
    return apiErrors.internalError();
  }
}
