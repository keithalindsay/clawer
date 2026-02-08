/**
 * GET/PUT /api/admin/settings
 * 
 * Admin-only endpoint to manage system settings
 * Includes API keys, models, feature flags
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { adminSettings, SETTING_KEYS } from '@/lib/db/schema/admin-settings';
import { eq } from 'drizzle-orm';

// Admin user IDs (in production, use a proper role system)
const ADMIN_EMAILS = ['vavier@gmail.com', 'vavize@gmail.com'];

async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true },
  });
  return user ? ADMIN_EMAILS.includes(user.email) : false;
}

/**
 * GET - Retrieve all settings (sensitive values masked)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all settings
    const settings = await db.select().from(adminSettings);

    // Mask sensitive values
    const masked = settings.map(s => ({
      key: s.key,
      value: s.sensitive ? '••••••••' : s.value,
      description: s.description,
      sensitive: s.sensitive,
      updatedAt: s.updatedAt,
    }));

    // Add defaults for missing settings
    const allKeys = Object.values(SETTING_KEYS);
    const existingKeys = new Set(settings.map(s => s.key));
    
    for (const key of allKeys) {
      if (!existingKeys.has(key)) {
        masked.push({
          key,
          value: null,
          description: getDefaultDescription(key),
          sensitive: isSensitiveKey(key),
          updatedAt: null as any, // Default for unconfigured settings
        });
      }
    }

    return NextResponse.json({ settings: masked });
  } catch (error: any) {
    console.error('Get admin settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a setting
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Validate key
    const validKeys = Object.values(SETTING_KEYS);
    if (!validKeys.includes(key)) {
      return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 });
    }

    // Check if setting exists
    const existing = await db.query.adminSettings.findFirst({
      where: eq(adminSettings.key, key),
    });

    const sensitive = isSensitiveKey(key);
    const description = getDefaultDescription(key);

    if (existing) {
      // Update existing
      await db
        .update(adminSettings)
        .set({
          value,
          sensitive,
          description,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(adminSettings.key, key));
    } else {
      // Create new
      await db.insert(adminSettings).values({
        key,
        value,
        sensitive,
        description,
        updatedBy: userId,
      });
    }

    return NextResponse.json({ 
      success: true,
      key,
      value: sensitive ? '••••••••' : value,
    });
  } catch (error: any) {
    console.error('Update admin settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update setting' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a setting
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    await db.delete(adminSettings).where(eq(adminSettings.key, key));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete admin settings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete setting' },
      { status: 500 }
    );
  }
}

function isSensitiveKey(key: string): boolean {
  return key.includes('api_key') || key.includes('secret') || key.includes('token');
}

function getDefaultDescription(key: string): string {
  const descriptions: Record<string, string> = {
    [SETTING_KEYS.LLM_PROVIDER]: 'Default AI provider (openai, anthropic, google)',
    [SETTING_KEYS.LLM_API_KEY]: 'Fallback API key (used if provider-specific key missing)',
    [SETTING_KEYS.LLM_MODEL]: 'Default model ID (e.g., gpt-4o-mini)',
    [SETTING_KEYS.LLM_BASE_URL]: 'Custom API base URL (optional)',
    [SETTING_KEYS.LLM_API_KEY_OPENAI]: 'OpenAI API key (for GPT-4o, GPT-4o-mini)',
    [SETTING_KEYS.LLM_API_KEY_ANTHROPIC]: 'Anthropic API key (for Claude models)',
    [SETTING_KEYS.LLM_API_KEY_GOOGLE]: 'Google API key (for Gemini models)',
    [SETTING_KEYS.LLM_API_KEY_XAI]: 'xAI API key (for Grok models)',
    [SETTING_KEYS.LLM_API_KEY_DEEPSEEK]: 'DeepSeek API key',
    [SETTING_KEYS.SUPPORT_AGENT_ENABLED]: 'Enable AI support agent',
    [SETTING_KEYS.SUPPORT_AGENT_MODEL]: 'Model for support agent diagnostics',
    [SETTING_KEYS.SUPPORT_AGENT_MAX_DIAGNOSES_HOUR]: 'Max diagnoses per user per hour',
    [SETTING_KEYS.DEFAULT_CONTAINER_MODEL]: 'Default model for new containers',
    [SETTING_KEYS.DEFAULT_CONTAINER_PROVIDER]: 'Default provider for new containers',
    [SETTING_KEYS.FEATURE_MODEL_SELECTION]: 'Allow users to select their own models',
    [SETTING_KEYS.FEATURE_WHATSAPP]: 'Enable WhatsApp integration',
    [SETTING_KEYS.FEATURE_TELEGRAM]: 'Enable Telegram integration',
    [SETTING_KEYS.FEATURE_SLACK]: 'Enable Slack integration',
  };
  return descriptions[key] || key;
}
