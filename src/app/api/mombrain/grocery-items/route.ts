/**
 * GET  /api/mombrain/grocery-items  — list all grocery items
 * POST /api/mombrain/grocery-items  — add a new item to the grocery list
 *
 * Storage: ~/clawd/data/grocery-list.json in the user's container
 *
 * Item shape:
 * {
 *   id: string          UUID
 *   name: string
 *   quantity?: string   e.g. "2 lbs", "1 dozen"
 *   category?: string   e.g. "produce", "dairy", "meat"
 *   checked: boolean    whether it has been purchased
 *   addedAt: string     ISO timestamp
 *   updatedAt: string
 * }
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { apiSuccess, apiErrors } from '@/lib/api/response';
import { requireContainer, readContainerJson, writeContainerJson } from '../_helpers';

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

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const [containerUser, containerErr] = await requireContainer(userId);
    if (containerErr) return containerErr;

    const { searchParams } = new URL(req.url);
    const showChecked = searchParams.get('showChecked') !== 'false'; // default true

    const items = await readContainerJson<GroceryItem[]>(
      containerUser.containerId,
      LIST_FILE,
      []
    );

    const filtered = showChecked ? items : items.filter(i => !i.checked);

    return apiSuccess({ items: filtered, total: filtered.length });
  } catch (error) {
    console.error('[grocery-items GET]', error);
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
    const { name, quantity, category } = body;

    if (!name || typeof name !== 'string') {
      return apiErrors.validationError({ field: 'name', message: 'name is required' });
    }

    const items = await readContainerJson<GroceryItem[]>(
      containerUser.containerId,
      LIST_FILE,
      []
    );

    const now = new Date().toISOString();
    const newItem: GroceryItem = {
      id: randomUUID(),
      name: name.trim(),
      quantity: quantity ?? null,
      category: category ?? null,
      checked: false,
      addedAt: now,
      updatedAt: now,
    };

    items.push(newItem);

    await writeContainerJson(containerUser.containerId, LIST_FILE, items);

    return apiSuccess({ item: newItem }, 201);
  } catch (error) {
    console.error('[grocery-items POST]', error);
    return apiErrors.internalError();
  }
}
