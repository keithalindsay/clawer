/**
 * PUT    /api/mombrain/calendar/:id — update a calendar event
 * DELETE /api/mombrain/calendar/:id — delete a calendar event
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { requireContainer, readContainerJson, writeContainerJson } from '../../_helpers';

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

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(
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

    const events = await readContainerJson<CalendarEvent[]>(
      containerUser.containerId,
      EVENTS_FILE,
      []
    );

    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return apiErrors.notFound('Calendar event');

    const now = new Date().toISOString();
    events[idx] = {
      ...events[idx],
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.startDate !== undefined && { startDate: body.startDate }),
      ...(body.endDate !== undefined && { endDate: body.endDate }),
      ...(body.allDay !== undefined && { allDay: Boolean(body.allDay) }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.familyMemberId !== undefined && { familyMemberId: body.familyMemberId }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.reminderMinutes !== undefined && { reminderMinutes: body.reminderMinutes }),
      updatedAt: now,
    };

    await writeContainerJson(containerUser.containerId, EVENTS_FILE, events);

    return apiSuccess({ event: events[idx] });
  } catch (error) {
    console.error('[calendar/[id] PUT]', error);
    return apiErrors.internalError();
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    const { id } = await params;

    const events = await readContainerJson<CalendarEvent[]>(
      containerUser.containerId,
      EVENTS_FILE,
      []
    );

    const filtered = events.filter(e => e.id !== id);
    if (filtered.length === events.length) return apiErrors.notFound('Calendar event');

    await writeContainerJson(containerUser.containerId, EVENTS_FILE, filtered);

    return apiSuccess({ deleted: true, id });
  } catch (error) {
    console.error('[calendar/[id] DELETE]', error);
    return apiErrors.internalError();
  }
}
