# AI Teams Phase 1 Testing Guide

**Status:** Ready for Testing  
**Created:** 2026-02-23  
**Phase:** 1 - Single Agent with Proper Session Management

---

## What Changed

### Before (Prompt Switching)
- All "team members" share one brain, one workspace, one session
- System prompts injected per agent at runtime
- No real isolation between agents
- All files in `/home/user/clawd/`

### After (Phase 1: Real Agent)
- ONE real agent provisioned with isolated workspace
- Agent has own SOUL.md and AGENTS.md
- Session routing: `agent:<agentId>:main`
- Files in `/home/user/clawd/workspace-<agentId>/`
- No system prompt injection - agent reads SOUL.md

---

## Testing Checklist

### ✅ Prerequisites
- [ ] Server accessible at root@YOUR_DOCKER_HOST
- [ ] Database migration applied: `default_agent_id` column added
- [ ] Docker images rebuilt with new entrypoint.sh
- [ ] Test user with paid subscription (team provisioning requires paid tier)

### ✅ Provisioning Flow

1. **Check Provisioning Status (Before)**
   ```bash
   curl -X GET https://clawer.ai/api/team/provision \
     -H "Authorization: Bearer <user-token>"
   ```
   Expected: `{ provisioned: false }`

2. **Provision Team**
   ```bash
   curl -X POST https://clawer.ai/api/team/provision \
     -H "Authorization: Bearer <user-token>" \
     -H "Content-Type: application/json" \
     -d '{ "templateName": "lifeos" }'
   ```
   Expected: `{ success: true, defaultAgent: "chief-of-staff" }`

3. **Verify Container State**
   ```bash
   # SSH into server
   ssh root@YOUR_DOCKER_HOST
   
   # Find user's container
   docker ps | grep <user-container-name>
   
   # Check team config created
   docker exec <container> cat /home/user/clawd/.team-config
   ```
   Expected:
   ```json
   {
     "template": "lifeos",
     "defaultAgent": "chief-of-staff",
     "provisionedAt": "2026-02-23T..."
   }
   ```

4. **Verify Agent Workspace Created**
   ```bash
   docker exec <container> ls -la /home/user/clawd/workspace-chief-of-staff/
   ```
   Expected files:
   - SOUL.md
   - AGENTS.md
   - USER.md
   - memory/ (directory)
   - skills/ (directory)
   - memory/YYYY-MM-DD.md (today's note)

5. **Verify SOUL.md Content**
   ```bash
   docker exec <container> cat /home/user/clawd/workspace-chief-of-staff/SOUL.md
   ```
   Expected: Agent-specific SOUL.md with:
   - Agent name and role
   - Description
   - Team context
   - Triggers and quick prompts

### ✅ Session Routing

6. **Send Message to Agent**
   ```bash
   curl -X POST https://clawer.ai/api/chat \
     -H "Authorization: Bearer <user-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "message": "What can you help me with?",
       "agentId": "chief-of-staff"
     }'
   ```
   Expected: Response in character as Max (Chief of Staff)

7. **Verify Session Key**
   - Check container logs for session key used
   - Should be: `agent:chief-of-staff:main`
   - NOT: `user-<userId>-agent-chief-of-staff`

8. **Verify File Operations**
   ```bash
   # Send message that writes a file
   curl -X POST https://clawer.ai/api/chat \
     -H "Authorization: Bearer <user-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Create a test note in your workspace",
       "agentId": "chief-of-staff"
     }'
   
   # Check file created in agent's workspace
   docker exec <container> ls -la /home/user/clawd/workspace-chief-of-staff/
   ```
   Expected: Files created in agent's workspace, not main workspace

### ✅ Entrypoint Logic

9. **Verify Environment Variables**
   ```bash
   docker exec <container> printenv | grep OPENCLAW
   ```
   Expected:
   - `OPENCLAW_AGENT_ID=chief-of-staff`
   - `OPENCLAW_WORKSPACE=/home/user/clawd/workspace-chief-of-staff`

10. **Test Gateway Restart**
    ```bash
    docker exec <container> openclaw gateway status
    ```
    Expected: Gateway running with agent-specific workspace

### ✅ Legacy Compatibility

11. **Test Non-Provisioned User**
    - Use a user without team provisioned
    - Send chat message
    - Expected: Works as before (legacy mode)
    - Workspace: `/home/user/clawd/` (not workspace-X)

12. **Test Free Tier User**
    - Try provisioning team as free tier user
    - Expected: 403 error - "Team provisioning requires paid subscription"

### ✅ Database State

13. **Verify User Record**
    ```sql
    SELECT id, team_template, default_agent_id, container_id, container_status
    FROM users
    WHERE id = '<test-user-id>';
    ```
    Expected:
    - `team_template`: "lifeos"
    - `default_agent_id`: "chief-of-staff"
    - `container_status`: "running"

### ✅ Edge Cases

14. **Double Provisioning**
    - Try provisioning team twice for same user
    - Expected: 409 error - "Team already provisioned"

15. **Invalid Template**
    ```bash
    curl -X POST https://clawer.ai/api/team/provision \
      -H "Authorization: Bearer <user-token>" \
      -H "Content-Type: application/json" \
      -d '{ "templateName": "invalid-template" }'
    ```
    Expected: 400 error - "Unknown team template"

16. **Container Not Running**
    - Stop user's container
    - Try provisioning
    - Expected: 503 error - "Container is stopped. Please wait."

---

## Success Criteria

### Phase 1 Complete When:
- [x] Provisioning API creates agent workspace
- [x] SOUL.md and AGENTS.md generated correctly
- [x] Entrypoint detects team config and sets agent workspace
- [x] Chat messages route to agent session (not legacy prompt injection)
- [x] Agent operates in isolated workspace
- [x] Legacy users (no team) still work
- [x] Free tier blocked from team provisioning
- [x] Database migration applied
- [x] No regressions in existing functionality

---

## Rollback Plan

If Phase 1 breaks production:

1. **Revert Entrypoint**
   ```bash
   # SSH to server
   cd /path/to/docker/openclaw-user/
   git revert <commit-hash>
   docker build -t openclaw-user:rollback .
   docker service update --image openclaw-user:rollback <service-name>
   ```

2. **Revert Chat Route**
   - Restore system prompt injection logic
   - Use `user-<userId>-agent-<agentId>` session keys

3. **Database Rollback**
   ```sql
   ALTER TABLE users DROP COLUMN default_agent_id;
   ```

---

## Next Steps (Phase 2)

After Phase 1 is stable:
- Provision ALL team members (not just default)
- UI agent selector
- Per-agent conversation history
- Agent switching in UI

---

## Test Script

```bash
#!/bin/bash
# Quick smoke test for Phase 1

USER_TOKEN="<your-test-user-token>"
API_URL="https://clawer.ai"

echo "=== AI Teams Phase 1 Smoke Test ==="

echo -n "1. Checking provision status... "
curl -s -X GET "$API_URL/api/team/provision" \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.provisioned'

echo -n "2. Provisioning team... "
curl -s -X POST "$API_URL/api/team/provision" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"templateName":"lifeos"}' | jq '.success'

echo -n "3. Sending test message... "
curl -s -X POST "$API_URL/api/chat" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Who are you?","agentId":"chief-of-staff"}' | jq '.content' | head -c 50

echo -e "\n\n=== Test Complete ==="
```

---

## Known Issues / Limitations

1. **Phase 1 Scope**
   - Only ONE agent provisioned per team (default agent)
   - No inter-agent communication yet
   - No UI agent selector yet
   - User must specify `agentId` in chat request

2. **Gateway Restart**
   - May take 5-10 seconds after provisioning
   - First message might timeout - retry fixes it

3. **Migration**
   - Existing users stay in legacy mode until they provision
   - No automatic migration (by design)

---

**Contact:** Keith (main agent) for issues
**Docs:** ~/clawd/specs/AI-TEAMS-NATIVE-AGENTS.md (full spec)
