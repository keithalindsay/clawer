/**
 * PUT    /api/mombrain/grocery-items/:id — update a grocery item (e.g. mark as checked)
 * DELETE /api/mombrain/grocery-items/:id — remove a grocery item
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { requireContainer, readContainerJson, writeContainerJson } from '../../_helpers';

interface GroceryItem {
  id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  checked: boolean;
  addedAt: string;
  updatedAt: string;
}

const LIST_FILE = 'grocery-list.json';

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

    const items = await readContainerJson<GroceryItem[]>(
      containerUser.containerId,
      LIST_FILE,
      []
    );

    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return apiErrors.notFound('Grocery item');

    const now = new Date().toISOString();
    items[idx] = {
      ...items[idx],
      ...(body.name !== undefined && { name: String(body.name).trim() }),
      ...(body.quantity !== undefined && { quantity: body.quantity }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.checked !== undefined && { checked: Boolean(body.checked) }),
      updatedAt: now,
    };

    await writeContainerJson(containerUser.containerId, LIST_FILE, items);

    return apiSuccess({ item: items[idx] });
  } catch (error) {
    console.error('[grocery-items/[id] PUT]', error);
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

    const items = await readContainerJson<GroceryItem[]>(
      containerUser.containerId,
      LIST_FILE,
      []
    );

    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) return apiErrors.notFound('Grocery item');

    await writeContainerJson(containerUser.containerId, LIST_FILE, filtered);

    return apiSuccess({ deleted: true, id });
  } catch (error) {
    console.error('[grocery-items/[id] DELETE]', error);
    return apiErrors.internalError();
  }
}
