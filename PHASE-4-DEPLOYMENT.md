# Phase 4 Deployment Checklist

**Date:** 2026-02-23  
**Status:** ✅ READY FOR DEPLOYMENT  
**Implementation:** COMPLETE

---

## Pre-Deployment Checklist

### 1. Database Migration ✅

**Migration File:** `drizzle/migrations/0010_create_custom_agents.sql`

**Run Migration:**
```bash
# On staging
npm run db:migrate

# Or manually via psql
psql $DATABASE_URL < drizzle/migrations/0010_create_custom_agents.sql
```

**Verify Migration:**
```sql
-- Check table exists
\dt custom_agents

-- Check indexes
\di custom_agents*

-- Check constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'custom_agents'::regclass;
```

**Expected Output:**
- Table: `custom_agents` (11 columns)
- Indexes: `custom_agents_user_id_idx`, `custom_agents_agent_id_idx`, `custom_agents_user_agent_unique`
- Constraints: `custom_agents_pkey`, unique constraint on (user_id, agent_id)

---

### 2. Code Deployment ✅

**Git Status:**
- [x] All Phase 4 files committed
- [x] Pushed to main branch
- [x] No uncommitted changes

**Files to Deploy:**
```
src/lib/db/schema/custom-agents.ts       # DB schema
src/lib/db/schema/index.ts               # Export update
src/lib/agent-templates.ts               # Templates library
src/lib/container/generate-soul.ts       # SOUL generation
src/lib/container/provision-custom-agent.ts  # Provisioning
src/app/api/team/agents/route.ts         # CRUD API
src/components/dashboard/CreateAgentDialog.tsx  # Creation UI
src/app/dashboard/agents/page.tsx        # Management UI
drizzle/migrations/0010_create_custom_agents.sql  # Migration
PHASE-4-IMPLEMENTATION.md                # Documentation
```

**Deploy Command:**
```bash
# Pull latest on server
git pull origin main

# Install dependencies (if new packages)
npm install

# Build Next.js app
npm run build

# Restart PM2/Docker
pm2 restart clawer-web
# or
docker-compose restart web
```

---

### 3. Environment Variables ✅

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Client auth

**No New Environment Variables Required** ✅

---

### 4. Dependencies ✅

**No New Dependencies Required** ✅

All Phase 4 features use existing packages:
- drizzle-orm (already installed)
- @clerk/nextjs (already installed)
- react, next.js (already installed)

---

## Post-Deployment Testing

### Smoke Tests (5 minutes)

1. **Database Connection**
   ```bash
   # SSH to server
   ssh root@YOUR_DOCKER_HOST
   
   # Test DB connection
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM custom_agents;"
   ```
   Expected: `0 rows` (or existing custom agents)

2. **API Health Check**
   ```bash
   curl -I https://clawer.ai/api/team/agents
   ```
   Expected: `200 OK` or `401 Unauthorized` (if not logged in)

3. **UI Access**
   - Visit https://clawer.ai/dashboard/agents
   - Expected: Agent management page loads
   - Click "Create Custom Agent" button
   - Expected: Modal opens with template selection

### Integration Tests (15 minutes)

#### Test 1: Create Custom Agent from Template
1. Go to /dashboard/agents
2. Click "Create Custom Agent"
3. Select "Finance Advisor" template
4. Verify form pre-fills:
   - Name: "Finance Advisor"
   - ID: "finance"
   - Emoji: 💰
   - Role: "Financial Analyst"
   - Triggers populated
   - Skills populated
5. Change name to "Sage"
6. Click "Create Agent"
7. Expected: Success → redirected to agent list → "Sage" visible

**Database Verification:**
```sql
SELECT agent_id, name, role, emoji, created_at 
FROM custom_agents 
WHERE user_id = 'user_...' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Container Verification:**
```bash
docker exec <container-name> ls -la /home/user/clawd/workspace-finance
# Expected: SOUL.md, AGENTS.md, USER.md, memory/
```

#### Test 2: Create Custom Agent from Scratch
1. Click "Create Custom Agent"
2. Click "Start from Scratch"
3. Fill in:
   - ID: `test-agent`
   - Name: `Test Agent`
   - Role: `Testing Specialist`
   - Emoji: 🧪
   - Triggers: `test`, `qa`, `verify`
4. Click "Create Agent"
5. Expected: Success → "Test Agent" appears in list

#### Test 3: View Agent Details
1. Click on any agent card
2. Expected: Sidebar slides in from right
3. Verify displays:
   - Agent emoji (large)
   - Name and role
   - Description
   - All triggers
   - All quick prompts
   - All skills/tools
4. Click X to close
5. Expected: Sidebar closes

#### Test 4: Delete Custom Agent
1. Find a custom agent card
2. Click "Delete Agent"
3. Expected: Button changes to "Click again to confirm"
4. Click again within 3 seconds
5. Expected: Agent removed from list

**Database Verification:**
```sql
SELECT COUNT(*) FROM custom_agents WHERE agent_id = 'test-agent';
-- Expected: 0
```

#### Test 5: Error Handling - Duplicate Agent ID
1. Create agent with ID `duplicate-test`
2. Try to create another agent with same ID
3. Expected: Error message "Agent with this ID already exists"

#### Test 6: Form Validation
1. Click "Create Custom Agent" → "Start from Scratch"
2. Leave ID, Name, or Role empty
3. Click "Create Agent"
4. Expected: Error "Please fill in all required fields"

---

### Load Testing (Optional, 10 minutes)

**Test Creation Speed:**
```bash
# Create 10 agents sequentially
for i in {1..10}; do
  curl -X POST https://clawer.ai/api/team/agents \
    -H "Authorization: Bearer $CLERK_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": \"agent-$i\",
      \"name\": \"Agent $i\",
      \"role\": \"Test Role\",
      \"emoji\": \"🤖\"
    }"
done
```

**Expected:**
- Each request completes in <2 seconds
- All 10 agents created successfully
- No timeout errors
- Database has 10 new records

**Cleanup:**
```sql
DELETE FROM custom_agents WHERE agent_id LIKE 'agent-%';
```

---

## Rollback Plan

### If Critical Bug Found

**Step 1: Revert Code**
```bash
git revert e48604d  # Revert Phase 4 commits
git push origin main
npm run build
pm2 restart clawer-web
```

**Step 2: Rollback Database (Optional)**
```sql
-- Only if custom_agents table causes issues
DROP TABLE IF EXISTS custom_agents;
DROP INDEX IF EXISTS custom_agents_user_id_idx;
DROP INDEX IF EXISTS custom_agents_agent_id_idx;
DROP INDEX IF EXISTS custom_agents_user_agent_unique;
```

**Step 3: Verify Rollback**
- Visit /dashboard/agents
- Expected: 404 or redirects to /dashboard
- API /api/team/agents returns 404
- No custom agent features visible

---

## Monitoring

### Metrics to Watch (First 24 Hours)

1. **Database Performance**
   - Query time on custom_agents table
   - Index usage
   - Storage growth

   ```sql
   -- Check query performance
   EXPLAIN ANALYZE 
   SELECT * FROM custom_agents WHERE user_id = 'user_...';
   
   -- Check table size
   SELECT pg_size_pretty(pg_total_relation_size('custom_agents'));
   ```

2. **API Response Times**
   - GET /api/team/agents - Should be <200ms
   - POST /api/team/agents - Should be <3s (includes provisioning)
   - DELETE /api/team/agents - Should be <500ms

3. **Error Rates**
   - 500 errors on /api/team/agents
   - Failed provisioning (check logs)
   - Docker exec failures

4. **User Activity**
   - How many users create custom agents?
   - Average agents per user
   - Most popular templates

   ```sql
   -- Custom agent stats
   SELECT 
     COUNT(DISTINCT user_id) as users_with_custom_agents,
     COUNT(*) as total_custom_agents,
     AVG(agent_count) as avg_agents_per_user
   FROM (
     SELECT user_id, COUNT(*) as agent_count
     FROM custom_agents
     GROUP BY user_id
   ) subquery;
   
   -- Most popular templates (based on similar configs)
   SELECT role, COUNT(*) as count
   FROM custom_agents
   GROUP BY role
   ORDER BY count DESC
   LIMIT 10;
   ```

---

## Known Issues & Workarounds

### Issue 1: OpenClaw.json Update Not Implemented
**Impact:** Custom agents may not appear in OpenClaw Gateway routing  
**Workaround:** Manual gateway restart  
**Fix:** Implement in Phase 4.1

### Issue 2: Workspace Cleanup on Delete Not Implemented
**Impact:** Deleted agent workspaces remain in container  
**Workaround:** Manual cleanup via Docker exec  
**Fix:** Implement in Phase 4.1

### Issue 3: SOUL.md Not Regenerated on Update
**Impact:** Updating agent config doesn't update SOUL.md  
**Workaround:** Delete and recreate agent  
**Fix:** Implement in Phase 4.1

---

## Success Criteria

Phase 4 deployment is successful if:

✅ Database migration completes without errors  
✅ API endpoints respond correctly (200/401/404)  
✅ UI loads without console errors  
✅ Users can create custom agents from templates  
✅ Users can create custom agents from scratch  
✅ Agents appear in management UI immediately  
✅ Agent workspaces created in containers  
✅ SOUL.md generated correctly  
✅ No regression in existing features  

**Expected Metrics (First Week):**
- 30%+ of active users create at least 1 custom agent
- Average 1-2 custom agents per user
- <5% error rate on agent creation
- 95%+ uptime for /api/team/agents

---

## Support & Documentation

### User Docs
- [x] PHASE-4-IMPLEMENTATION.md (technical)
- [ ] TODO: User-facing guide (how to create agents)
- [ ] TODO: Video tutorial (agent creation walkthrough)
- [ ] TODO: FAQ (common questions)

### Internal Docs
- [x] Implementation details (PHASE-4-IMPLEMENTATION.md)
- [x] Deployment checklist (this file)
- [x] Database schema documentation
- [x] API documentation (inline JSDoc)

### Support Channels
- **Slack:** #clawer-ai-teams
- **GitHub Issues:** Tag with `ai-teams` and `phase-4`
- **User Support:** help@clawer.ai

---

## Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check first custom agent creation
- [ ] Verify database performance

### Short-term (Week 1)
- [ ] Analyze user adoption metrics
- [ ] Gather user feedback
- [ ] Fix critical bugs (if any)
- [ ] Write user-facing documentation

### Medium-term (Month 1)
- [ ] Implement Phase 4.1 fixes (openclaw.json, cleanup, SOUL regen)
- [ ] Add agent usage analytics
- [ ] Expand template library (community submissions)
- [ ] Plan Phase 5 (Agent Marketplace)

---

## Contact

**Implementation:** Sub-Agent 68cadffe (AI Teams Phase 4)  
**Spec Author:** Keith (Main Agent)  
**Server:** root@YOUR_DOCKER_HOST  
**Codebase:** ~/projects/clawer/

---

**Status:** ✅ READY TO DEPLOY  
**Risk Level:** LOW (no breaking changes, new feature only)  
**Estimated Deployment Time:** 15 minutes  
**Rollback Time:** 5 minutes
