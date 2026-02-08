# Clawer.ai Cleanup Checklist

Use this checklist to track cleanup progress. Mark items with `[x]` when complete.

---

## 🔴 Critical (Week 1) - 11.5 hours

### Database Schema
- [ ] Fix `instances.user_id` type (TEXT not UUID) - **20 min**
  - File: `src/lib/db/schema/instances.ts:4`
  - Change: `userId: text('user_id').notNull().references(() => users.id)`
  - Run: `npm run db:generate && npm run db:migrate`

### Security
- [ ] Add auth to container API - **2 hours**
  - File: `docker/openclaw-user/api-server.js`
  - Add: Bearer token validation middleware
  - Store: Shared secret in users table, pass to container
  
- [ ] Make STRIPE_WEBHOOK_SECRET required - **15 min**
  - File: `src/app/api/webhooks/stripe/route.ts:23`
  - Remove: Optional webhook secret logic
  - Add: Startup validation

- [ ] Add DATABASE_URL to .env.example - **5 min**
  - File: `.env.example`
  - Add: `DATABASE_URL=postgresql://user:pass@localhost:5432/clawer`

### Deployment
- [ ] Create PM2 config - **30 min**
  - File: `ecosystem.config.js` (new)
  - Content: See full report section 10

- [ ] Add health check endpoint - **30 min**
  - File: `src/app/api/health/route.ts` (new)
  - Return: DB status, container status, overall health

- [ ] Document deployment process - **1 hour**
  - File: `DEPLOYMENT.md` (new)
  - Include: Pre-deploy checklist, deploy steps, rollback

### Testing
- [ ] Test fresh database setup - **2 hours**
  - Create new DB, run migrations
  - Provision test container
  - Test signup flow end-to-end

- [ ] Test container API auth - **1 hour**
  - Verify requests without token fail
  - Verify requests with valid token succeed

### Monitoring
- [ ] Set up error tracking - **2 hours**
  - Option A: Sentry
  - Option B: Basic error logging to file
  
- [ ] Add uptime monitoring - **30 min**
  - Service: UptimeRobot (free)
  - Monitor: Main app + 2-3 sample containers

---

## 🟡 Important (Week 2) - 18 hours

### Token Tracking
- [ ] Wire up token tracking in chat flow - **3 hours**
  - File: `src/app/api/chat/route.ts`
  - Add: `await trackTokenUsage()` after response
  - Get tokens from container response metadata

- [ ] Add rate limit enforcement - **2 hours**
  - File: `src/app/api/chat/route.ts`
  - Add: `checkRateLimit()` before processing
  - Return 429 if over limit

- [ ] Deploy Redis or remove rate limiting - **2 hours**
  - Option A: Deploy Redis container
  - Option B: Remove all rate limit code

### Dead Code Removal
- [ ] Archive bot-engine - **30 min**
  ```bash
  mkdir -p archive/v2-bot-engine
  git mv src/lib/bot-engine archive/v2-bot-engine/
  git commit -m "Archive unused bot-engine"
  ```

- [ ] Delete unused orchestrator variant - **15 min**
  ```bash
  rm -rf src/lib/orchestrator/
  git commit -m "Remove unused orchestrator variant"
  ```

- [ ] Delete unused proxy script - **5 min**
  ```bash
  rm docker/searxng-proxy/proxy.js
  git commit -m "Remove unused SearXNG proxy"
  ```

### Database Cleanup
- [ ] Drop unused tables - **1 hour**
  ```sql
  DROP TABLE instances CASCADE;
  DROP TABLE whatsapp_connections;
  DROP TABLE discord_connections;
  DROP TABLE model_configs;
  DROP TABLE bot_settings;
  ```
  - Update: `src/lib/db/schema/index.ts` exports
  - Run: New migration

- [ ] Add missing indexes - **1 hour**
  ```sql
  CREATE INDEX users_container_port_idx ON users(container_port) WHERE container_port IS NOT NULL;
  CREATE INDEX users_stripe_subscription_idx ON users(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
  CREATE INDEX usage_records_user_period_idx ON usage_records(user_id, period_start);
  ```

- [ ] Consolidate container tracking - **2 hours**
  - Remove: `instances` table references
  - Use only: `users.containerId/Port/Status`

### Error Handling
- [ ] Standardize API error responses - **2 hours**
  - Use: `apiSuccess()` and `apiErrors.*()` everywhere
  - File: All `/api/**` routes

- [ ] Add retry logic to container client - **2 hours**
  - File: `src/lib/container-client.ts`
  - Add: Exponential backoff, max 3 retries

- [ ] Add circuit breaker pattern - **2 hours**
  - File: `src/lib/container-client.ts`
  - Skip container if 5 consecutive failures
  - Auto-recover after 60 seconds

---

## 🔵 Week 3: Strategic Decision - 0-6 hours

### Smart Router Decision
- [ ] **Decision Point:** Keep smart router? (Yes/No/Later)

**If YES:**
- [ ] Integrate router into chat flow - **3 hours**
  - File: `src/app/api/chat/route.ts`
  - Add: `const routing = routeRequest(...)`
  - Pass: `settings.routingModel` to container

- [ ] Modify container to use routing hint - **3 hours**
  - File: `docker/openclaw-user/api-server.js`
  - Parse: `settings.routingModel`
  - Override: OpenClaw model per-request

**If NO:**
- [ ] Delete router code - **30 min**
  ```bash
  rm -rf src/lib/router/
  git commit -m "Remove unused smart router"
  ```

**If LATER:**
- [ ] Document decision in `ARCHITECTURE.md` - **30 min**

---

## 🔵 Week 4+: Nice to Have - 60+ hours

### Message Persistence
- [ ] Implement conversation storage - **4 hours**
  - Use: `conversations` and `messages` tables
  - File: `src/app/api/chat/route.ts`

- [ ] Add conversation history UI - **4 hours**
  - File: `src/app/chat/[botId]/page.tsx`
  - Show: Past messages from DB

### Bot Management
- [ ] Build bot creation UI - **8 hours**
  - Page: `/bots/new`
  - Form: Bot name, type, settings

- [ ] Implement bot activation - **4 hours**
  - File: `src/app/api/bots/[botId]/activate/route.ts`
  - Logic: Update bot status, provision resources

- [ ] Add bot list page - **4 hours**
  - Page: `/bots`
  - Show: User's bots with status

### OAuth Integrations
- [ ] Implement Gmail OAuth - **12 hours**
  - Routes: `/api/integrations/gmail/connect`, `/callback`
  - Store: Encrypted tokens in `integrations` table

- [ ] Implement Google Calendar OAuth - **8 hours**
  - Similar flow to Gmail

- [ ] Add integration management UI - **4 hours**
  - Page: `/integrations`
  - Show: Connected services, disconnect button

### Container Security
- [ ] Switch to internal Docker network - **2 hours**
  ```bash
  docker network create --internal clawer-internal
  # Update orchestrator.ts to use --network flag
  ```

- [ ] Run containers as non-root - **2 hours**
  - File: `docker/openclaw-user/Dockerfile`
  - Add: `USER node`

- [ ] Add disk quotas - **2 hours**
  - Flag: `--storage-opt size=5G`
  - Update: orchestrator.ts

- [ ] Drop container capabilities - **2 hours**
  - Flags: `--cap-drop=ALL --security-opt=no-new-privileges`

### UX Improvements
- [ ] Add skeleton loaders - **4 hours**
  - Component: `<Skeleton />` wrapper
  - Use: Dashboard, chat, container status

- [ ] Add toast notifications - **2 hours**
  - Library: `react-hot-toast`
  - Use: Success/error feedback

- [ ] Add retry buttons - **2 hours**
  - Component: Error states with retry

- [ ] Improve loading states - **2 hours**
  - Add: Progress indicators
  - Add: Optimistic updates

### Usage Analytics
- [ ] Build usage dashboard - **8 hours**
  - Page: `/usage`
  - Charts: Token usage over time, cost breakdown

- [ ] Implement daily aggregation job - **4 hours**
  - Script: `scripts/aggregate-usage.ts`
  - Cron: Run daily at midnight

### Admin Tools
- [ ] Build user management UI - **8 hours**
  - Page: `/admin/users`
  - Features: Search, suspend, view usage

- [ ] Add container health overview - **4 hours**
  - Page: `/admin/containers`
  - Show: All containers, health status

- [ ] Implement bulk operations - **4 hours**
  - Actions: Restart all, stop unhealthy, etc.

---

## Progress Tracking

### Week 1 Summary
- Critical fixes: [ ] 0/11 complete
- Hours spent: _____ / 11.5 budgeted
- Blockers: _____________________

### Week 2 Summary
- Important fixes: [ ] 0/10 complete
- Hours spent: _____ / 18 budgeted
- Blockers: _____________________

### Week 3 Summary
- Strategic decision: [ ] Made (Yes/No/Later)
- Implementation: [ ] 0/1 complete
- Hours spent: _____ / 0-6 budgeted

### Week 4+ Summary
- Nice-to-haves: [ ] 0/25 complete
- Hours spent: _____ / 60+ budgeted

---

## Notes

**Started:** _______________  
**Target Completion:** _______________  
**Actual Completion:** _______________

**Team Members:**
- Developer 1: _____________________
- Developer 2: _____________________

**Decisions Made:**
- Smart Router: [ ] Keep [ ] Delete [ ] Later
- Dead Code: [ ] Archive [ ] Delete
- Unused Tables: [ ] Drop [ ] Keep for future

**Blockers:**
- _____________________
- _____________________

**Questions:**
- _____________________
- _____________________

---

**Last Updated:** _______________
