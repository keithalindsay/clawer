# 🔧 Telegram Integration - Maintenance Guide

## Health Checks

### Daily Monitoring
```bash
# Check app is running
ssh root@YOUR_DOCKER_HOST "pm2 status clawer"

# Check for errors
ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --err --lines 50 --nostream"

# Check active bot count
ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && psql -U clawer -d clawer -c \"SELECT COUNT(*) FROM users WHERE telegram_bot_token IS NOT NULL;\""
```

---

## Common Issues

### Issue 1: Bot stops responding

**Symptoms:**
- User messages bot, no response
- No errors in logs

**Diagnosis:**
```bash
# Check if polling is active
ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --lines 100 | grep -i 'polling'"

# Check if bot token is valid
# (User should disconnect and reconnect)
```

**Fix:**
1. User disconnects bot via dashboard
2. User reconnects with fresh token
3. Or restart entire app: `pm2 restart clawer`

---

### Issue 2: "Polling error" in logs

**Symptoms:**
- Logs show repeated "polling_error"
- Bot may or may not respond

**Diagnosis:**
- Token revoked/changed
- Network connectivity issues
- Telegram API rate limiting

**Fix:**
```bash
# Restart app
ssh root@YOUR_DOCKER_HOST "pm2 restart clawer"

# If persists, user needs to regenerate bot token
```

---

### Issue 3: Server restart loses bots

**Symptoms:**
- After server reboot, bots don't auto-reconnect
- Users must visit dashboard to reconnect

**Fix (RECOMMENDED):**

Create `src/lib/telegram/startup.ts`:
```typescript
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { isNotNull } from 'drizzle-orm';
import { createTelegramBot } from './bot';

export async function reconnectTelegramBots() {
  console.log('[Telegram] Reconnecting active bots...');
  
  const activeUsers = await db.query.users.findMany({
    where: isNotNull(users.telegramBotToken),
    columns: {
      id: true,
      telegramBotToken: true,
      telegramBotUsername: true,
    },
  });

  for (const user of activeUsers) {
    try {
      await createTelegramBot({
        token: user.telegramBotToken!,
        userId: user.id,
      });
      console.log(`[Telegram] Reconnected bot for user ${user.id} (@${user.telegramBotUsername})`);
    } catch (error) {
      console.error(`[Telegram] Failed to reconnect bot for user ${user.id}:`, error);
    }
  }
  
  console.log(`[Telegram] Reconnected ${activeUsers.length} bots`);
}
```

Add to `src/app/layout.tsx`:
```typescript
// At top of file
if (typeof window === 'undefined') {
  import('@/lib/telegram/startup').then(({ reconnectTelegramBots }) => {
    reconnectTelegramBots().catch((error) => {
      console.error('[Telegram] Failed to reconnect bots on startup:', error);
    });
  });
}
```

---

### Issue 4: Database connection errors

**Symptoms:**
- Can't connect/disconnect bots
- API returns 500 errors

**Fix:**
```bash
# Check database is running
ssh root@YOUR_DOCKER_HOST "docker ps | grep postgres"

# Check connection string
ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && cat .env.local | grep DATABASE_URL"

# Restart database
ssh root@YOUR_DOCKER_HOST "docker restart clawer-postgres"
```

---

## Performance Monitoring

### Check Memory Usage
```bash
ssh root@YOUR_DOCKER_HOST "pm2 info clawer | grep memory"
```

**Expected:** < 200MB per instance

**Warning:** If > 500MB, may have memory leak

---

### Check CPU Usage
```bash
ssh root@YOUR_DOCKER_HOST "pm2 info clawer | grep cpu"
```

**Expected:** < 10% when idle

**Warning:** If constantly > 50%, investigate

---

### Check Active Connections
```bash
ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && psql -U clawer -d clawer -c \"SELECT telegram_bot_username, created_at FROM users WHERE telegram_bot_token IS NOT NULL ORDER BY created_at DESC;\""
```

---

## Security

### Token Encryption (TODO)

Currently bot tokens are stored in plaintext. **Recommended:**

```typescript
// Use crypto to encrypt tokens
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TELEGRAM_TOKEN_KEY!; // 32 bytes

function encryptToken(token: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

function decryptToken(encrypted: string, iv: string): string {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## Scaling Considerations

### Current Limit: ~1000 concurrent bots

**Why:**
- Each bot maintains long-polling connection
- Memory: ~200KB per bot = ~200MB for 1000 bots
- Node.js can handle this easily

### If you exceed 1000 users:

1. **Switch to webhooks** (more efficient)
2. **Use Redis** for bot state
3. **Horizontal scaling** with PM2 cluster mode
4. **Separate bot server** from web server

---

## Backup & Recovery

### Backup Bot Tokens
```bash
# Export all tokens (encrypted at rest recommended)
ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && psql -U clawer -d clawer -c \"COPY (SELECT id, email, telegram_bot_token, telegram_bot_username FROM users WHERE telegram_bot_token IS NOT NULL) TO STDOUT WITH CSV HEADER;\" > telegram_backup.csv"
```

### Restore After Migration
```bash
# Import tokens
ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && psql -U clawer -d clawer -c \"COPY users (id, email, telegram_bot_token, telegram_bot_username) FROM STDIN WITH CSV HEADER;\" < telegram_backup.csv"

# Restart bots
pm2 restart clawer
```

---

## Logging

### Enable Debug Logging

Add to `src/lib/telegram/bot.ts`:
```typescript
const DEBUG = process.env.TELEGRAM_DEBUG === 'true';

// In message handler
if (DEBUG) {
  console.log('[Telegram] Message received:', {
    userId,
    chatId,
    text: text.substring(0, 50),
    timestamp: new Date().toISOString(),
  });
}
```

---

## Rate Limiting (TODO)

**Recommended:**

```typescript
// src/lib/telegram/rate-limiter.ts
const MESSAGE_LIMIT_PER_MINUTE = 30;
const userMessageCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = userMessageCounts.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    userMessageCounts.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  
  if (userLimit.count >= MESSAGE_LIMIT_PER_MINUTE) {
    return false; // Rate limited
  }
  
  userLimit.count++;
  return true;
}
```

---

## Emergency Procedures

### Stop All Bots Immediately
```bash
ssh root@YOUR_DOCKER_HOST "pm2 stop clawer"
```

### Disable Telegram Integration
```bash
# Remove from dashboard
# Edit: src/app/dashboard/page.tsx
# Comment out: <TelegramCard isSubscribed={isSubscribed} />
```

### Rollback Deployment
```bash
ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && git checkout HEAD~1 && pm2 restart clawer"
```

---

## Questions?

**Main agent session:** agent:main:main  
**Subagent that built this:** clawer-telegram-builder-v2  
**Documentation:** See TELEGRAM-INTEGRATION-COMPLETE.md
