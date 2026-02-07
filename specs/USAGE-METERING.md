# Usage Metering & Proxy Layer

**Implementation Order:** After core container orchestration (Tasks 1-10) is validated

## Architecture Overview

```
┌─────────────────┐
│  Telegram API   │
│  WhatsApp API   │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────┐
│  Clawer Proxy Layer                 │
│  /api/proxy/telegram?userId=abc     │
│  /api/proxy/whatsapp?userId=xyz     │
│                                     │
│  1. Identify user from bot token   │
│  2. trackMessage(userId)            │
│  3. Check limits                    │
│  4. Allow OR block                  │
└────────┬────────────────────────────┘
         │
         ├─[ALLOWED]──> Forward to Container Webhook
         │
         └─[BLOCKED]──> Send limit message directly via API
```

## Limits

- **Daily:** 500 messages per user
- **Monthly:** 3,000 messages per user
- **Reset:** Daily at midnight UTC, Monthly on 1st of month

## Task 11: Usage Tracker

**File:** `~/projects/clawer/src/lib/usage/tracker.ts`

```typescript
export interface UsageCheck {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limitType: 'daily' | 'monthly' | null;
}

export interface UsageStats {
  daily: number;
  monthly: number;
  dailyLimit: number;
  monthlyLimit: number;
  dailyResetAt: Date;
  monthlyResetAt: Date;
}

/**
 * Track a message for a user
 * Increments counters, checks limits
 * Returns whether message should be allowed
 */
export async function trackMessage(userId: string): Promise<UsageCheck> {
  // 1. Get user from DB
  // 2. Check if daily reset needed (dailyResetAt < now)
  //    - If yes: reset dailyMessageCount to 0, set dailyResetAt to tomorrow midnight
  // 3. Check if monthly reset needed (monthlyResetAt < now)
  //    - If yes: reset monthlyMessageCount to 0, set monthlyResetAt to next month
  // 4. Check daily limit (500)
  //    - If over: return { allowed: false, limitType: 'daily', resetAt: dailyResetAt }
  // 5. Check monthly limit (3000)
  //    - If over: return { allowed: false, limitType: 'monthly', resetAt: monthlyResetAt }
  // 6. Increment both counters
  // 7. Return { allowed: true, remaining: min(dailyRemaining, monthlyRemaining) }
}

/**
 * Get current usage stats for a user
 */
export async function getUsage(userId: string): Promise<UsageStats> {
  // Query user record, return current counts and limits
}
```

**Database Schema Changes:**

```sql
-- Add to users table
ALTER TABLE users ADD COLUMN daily_message_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN daily_reset_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 day';
ALTER TABLE users ADD COLUMN monthly_message_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN monthly_reset_at TIMESTAMP DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

-- Index for efficient queries
CREATE INDEX idx_users_reset_times ON users(daily_reset_at, monthly_reset_at);
```

**Drizzle Schema Update:**

```typescript
// In ~/projects/clawer/src/db/schema.ts
export const users = pgTable('users', {
  // ... existing fields ...
  dailyMessageCount: integer('daily_message_count').default(0).notNull(),
  dailyResetAt: timestamp('daily_reset_at').defaultNow().notNull(),
  monthlyMessageCount: integer('monthly_message_count').default(0).notNull(),
  monthlyResetAt: timestamp('monthly_reset_at').defaultNow().notNull(),
});
```

## Task 12: Webhook Proxy Routes

### Telegram Proxy

**File:** `~/projects/clawer/src/app/api/proxy/telegram/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { trackMessage } from '@/lib/usage/tracker';
import { db } from '@/db';
import { users, instances } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // 1. Get userId from query params
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 2. Get bot token from request body (Telegram sends it)
    const body = await req.json();
    
    // 3. Track message usage
    const usageCheck = await trackMessage(userId);
    
    // 4. If blocked, send limit message directly via Telegram API
    if (!usageCheck.allowed) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      const chatId = body.message?.chat?.id || body.callback_query?.message?.chat?.id;
      const botToken = user?.telegramBotToken;
      
      if (chatId && botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `⚠️ Message limit reached.\n\n${usageCheck.limitType === 'daily' ? 'Daily' : 'Monthly'} limit exceeded.\nResets: ${usageCheck.resetAt.toLocaleString()}\n\nUpgrade your plan at https://clawer.ai/billing`,
          }),
        });
      }
      
      return NextResponse.json({ ok: true, blocked: true });
    }
    
    // 5. Get user's container webhook URL
    const instance = await db.query.instances.findFirst({
      where: eq(instances.userId, userId),
    });
    
    if (!instance?.webhookUrl) {
      return NextResponse.json({ error: 'No container found' }, { status: 404 });
    }
    
    // 6. Forward to container
    const containerResponse = await fetch(instance.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const containerData = await containerResponse.json();
    
    // 7. Return container's response
    return NextResponse.json(containerData);
    
  } catch (error) {
    console.error('Telegram proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
```

### WhatsApp Proxy

**File:** `~/projects/clawer/src/app/api/proxy/whatsapp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { trackMessage } from '@/lib/usage/tracker';
import { db } from '@/db';
import { users, instances } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // 1. Get userId from query params
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 2. Get WhatsApp payload
    const body = await req.json();
    
    // 3. Track message usage
    const usageCheck = await trackMessage(userId);
    
    // 4. If blocked, send limit message directly via WhatsApp API
    if (!usageCheck.allowed) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      const phoneNumber = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
      const whatsappToken = user?.whatsappAccessToken;
      const whatsappPhoneId = user?.whatsappPhoneNumberId;
      
      if (phoneNumber && whatsappToken && whatsappPhoneId) {
        await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            text: {
              body: `⚠️ Message limit reached.\n\n${usageCheck.limitType === 'daily' ? 'Daily' : 'Monthly'} limit exceeded.\nResets: ${usageCheck.resetAt.toLocaleString()}\n\nUpgrade your plan at https://clawer.ai/billing`,
            },
          }),
        });
      }
      
      return NextResponse.json({ ok: true, blocked: true });
    }
    
    // 5. Get user's container webhook URL
    const instance = await db.query.instances.findFirst({
      where: eq(instances.userId, userId),
    });
    
    if (!instance?.webhookUrl) {
      return NextResponse.json({ error: 'No container found' }, { status: 404 });
    }
    
    // 6. Forward to container
    const containerResponse = await fetch(instance.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    const containerData = await containerResponse.json();
    
    // 7. Return container's response
    return NextResponse.json(containerData);
    
  } catch (error) {
    console.error('WhatsApp proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}

// WhatsApp requires GET for webhook verification
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');
  
  // Verify token should match what user configured
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Task 13: Container Webhook Configuration

When provisioning a container, configure OpenClaw to send webhooks to our proxy:

**In provisioning script:**

```bash
# After OpenClaw installation, configure webhook URLs

# Telegram
openclaw config set TELEGRAM_WEBHOOK_URL "https://clawer.ai/api/proxy/telegram?userId=${USER_ID}"

# WhatsApp
openclaw config set WHATSAPP_WEBHOOK_URL "https://clawer.ai/api/proxy/whatsapp?userId=${USER_ID}"

# Restart gateway to apply
openclaw gateway restart
```

**Database:** Store the container's local webhook URL in `instances.webhookUrl` for forwarding

## Task 14: Usage Dashboard

**Component:** `~/projects/clawer/src/components/UsageDashboard.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getUsage } from '@/lib/usage/tracker';

interface UsageStats {
  daily: number;
  monthly: number;
  dailyLimit: number;
  monthlyLimit: number;
  dailyResetAt: Date;
  monthlyResetAt: Date;
}

export function UsageDashboard({ userId }: { userId: string }) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      const stats = await getUsage(userId);
      setUsage(stats);
      setLoading(false);
    }
    
    fetchUsage();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading || !usage) {
    return <div>Loading usage...</div>;
  }

  const dailyPercent = (usage.daily / usage.dailyLimit) * 100;
  const monthlyPercent = (usage.monthly / usage.monthlyLimit) * 100;

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">Message Usage</h3>
      
      {/* Daily Usage */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">Today</span>
          <span className="text-sm font-medium">
            {usage.daily}/{usage.dailyLimit} messages
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${dailyPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Resets in {getTimeUntil(usage.dailyResetAt)}
        </p>
      </div>

      {/* Monthly Usage */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">This Month</span>
          <span className="text-sm font-medium">
            {usage.monthly.toLocaleString()}/{usage.monthlyLimit.toLocaleString()} messages
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${monthlyPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Resets in {getTimeUntil(usage.monthlyResetAt)}
        </p>
      </div>

      {/* Warning if approaching limits */}
      {(dailyPercent > 80 || monthlyPercent > 80) && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ You're approaching your message limit. 
            <a href="/billing" className="underline ml-1">Upgrade now</a>
          </p>
        </div>
      )}
    </div>
  );
}

function getTimeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${minutes}m`;
}
```

**Usage in Dashboard:**

```tsx
// In ~/projects/clawer/src/app/dashboard/page.tsx

import { UsageDashboard } from '@/components/UsageDashboard';

export default function DashboardPage() {
  const userId = getUserIdFromSession(); // Your auth logic
  
  return (
    <div className="container mx-auto p-8">
      <h1>Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <UsageDashboard userId={userId} />
        {/* Other dashboard widgets */}
      </div>
    </div>
  );
}
```

## Testing Plan

### Unit Tests

**`tracker.test.ts`:**
```typescript
import { trackMessage, getUsage } from './tracker';

describe('Usage Tracker', () => {
  test('allows message under daily limit', async () => {
    const result = await trackMessage('user-123');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(500);
  });

  test('blocks message over daily limit', async () => {
    // Set user to 500 messages
    // Try one more
    const result = await trackMessage('user-123');
    expect(result.allowed).toBe(false);
    expect(result.limitType).toBe('daily');
  });

  test('resets daily count at midnight', async () => {
    // Mock time to be past reset time
    // Verify count is reset
  });
});
```

### Integration Tests

**Test proxy flow:**
```bash
# Send webhook to proxy
curl -X POST "https://clawer.ai/api/proxy/telegram?userId=abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": { "id": 123456 },
      "text": "Hello"
    }
  }'

# Should forward to container and increment count

# Check usage
curl "https://clawer.ai/api/usage?userId=abc123"
# Should show daily: 1, monthly: 1
```

## Deployment Checklist

- [ ] Run migration to add usage columns to users table
- [ ] Deploy tracker functions
- [ ] Deploy proxy routes
- [ ] Update container provisioning script to use proxy URLs
- [ ] Deploy usage dashboard component
- [ ] Test rate limiting with test user (send 501 messages)
- [ ] Verify limit messages are sent correctly
- [ ] Monitor logs for proxy errors
- [ ] Set up alerts for high usage users

## Future Enhancements

1. **Usage Analytics:**
   - Track peak usage times
   - Message type breakdown (text, image, voice)
   - Response time metrics

2. **Flexible Limits:**
   - Per-plan limits (Pro = 1000/day, Basic = 500/day)
   - Burst allowance (100 messages above limit before hard block)
   - Overage pricing ($0.01/message over limit)

3. **Admin Dashboard:**
   - View all users approaching limits
   - Manually adjust limits for specific users
   - Usage trends and forecasting

4. **Optimization:**
   - Cache usage counts in Redis for faster checks
   - Batch DB updates (increment every 10 messages instead of every 1)
   - Use Redis counters with periodic DB sync
