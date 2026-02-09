# Build Checklist - Clawer Docker Templates

Use this checklist to verify the build is complete and ready for deployment.

## ✅ Pre-Build Verification

- [x] Teams directory exists with 3 teams (ecommerce, lifeos, mom)
- [x] Each team has AGENTS.md and team-config.json
- [x] Skills directory created with 4 subdirectories (universal, ecommerce, lifeos, mom)
- [x] Skills fetched from openclaw/skills repo (18/19 successful, 1 placeholder)
- [x] Security scan completed (all checks passed)
- [x] Core Dockerfiles created (template + 3 specific)
- [x] Entrypoint script created (template-aware)
- [x] Build scripts created (build-templates.sh, validate-build.sh)
- [x] Docker Compose configuration created

## 📋 Files Created (Checklist)

### Core Build Files
- [x] `Dockerfile.template` - Master template Dockerfile
- [x] `Dockerfile.ecommerce` - E-commerce Dockerfile
- [x] `Dockerfile.lifeos` - Life OS Dockerfile
- [x] `Dockerfile.mom` - Mom Dockerfile
- [x] `entrypoint-template.sh` - Template-aware entrypoint
- [x] `build-templates.sh` - Build all templates
- [x] `docker-compose.templates.yml` - Docker Compose config

### Utility Files
- [x] `fetch-skills-robust.sh` - Skill fetcher
- [x] `security-scan.sh` - Security scanner
- [x] `validate-build.sh` - Build validator

### Documentation
- [x] `TEMPLATE-BUILD-SUMMARY.md` - Complete build summary
- [x] `README-TEMPLATES.md` - User guide
- [x] `BUILD-CHECKLIST.md` - This file

## 🧪 Build Tests (TODO)

Run these tests to verify everything works:

### Test 1: Validate Structure
```bash
./validate-build.sh
```
Expected: "✓ All required template files present"

### Test 2: Build All Templates
```bash
./build-templates.sh
```
Expected: 3 images built successfully

### Test 3: Verify Images
```bash
docker images | grep clawer-openclaw
```
Expected:
```
clawer-openclaw    ecommerce    ...
clawer-openclaw    lifeos       ...
clawer-openclaw    mom          ...
```

### Test 4: Inspect Image Contents
```bash
# Check skills are included
docker run --rm clawer-openclaw:lifeos ls -la /home/user/clawd/skills/

# Check team config is included
docker run --rm clawer-openclaw:lifeos ls -la /home/user/clawd/team/

# Check entrypoint is executable
docker run --rm clawer-openclaw:lifeos ls -la /usr/local/bin/entrypoint.sh
```

### Test 5: Run Container (Dry Run)
```bash
# Set a test API key
export OPENAI_API_KEY=sk-test-key-not-real

# Try to start container (will fail on health check with fake key, but should start)
docker run --rm --name test-lifeos \
  -e OPENAI_API_KEY \
  -p 8082:8080 \
  clawer-openclaw:lifeos &

# Wait 10 seconds
sleep 10

# Check if running
docker ps | grep test-lifeos

# Check logs for initialization
docker logs test-lifeos

# Stop
docker stop test-lifeos
```

Expected in logs:
- "OpenClaw configuration created"
- "Team template detected - installing team AGENTS.md"
- "Created USER.md template"
- "Created WORKING.md template"
- "Workspace initialized"

### Test 6: Docker Compose Test
```bash
# Create test .env
echo "OPENAI_API_KEY=sk-test-key" > .env

# Start one template
docker-compose -f docker-compose.templates.yml up -d lifeos

# Check status
docker-compose -f docker-compose.templates.yml ps

# Check logs
docker-compose -f docker-compose.templates.yml logs lifeos

# Stop
docker-compose -f docker-compose.templates.yml down
```

## 🔒 Security Verification (DONE)

- [x] Run security scan: `./security-scan.sh`
- [x] Verify no auto-execution patterns
- [x] Verify no prompt injection
- [x] Verify no credential harvesting
- [x] Verify no external script loading
- [x] All skills have proper structure

**Status:** ✅ All security checks passed

## 📦 Skills Inventory (DONE)

**Universal (2 + 1 built-in):**
- [x] gog (steipete) - Fetched
- [x] whatsapp-styling-guide (rubenfb23) - Fetched
- [x] weather (built-in) - N/A

**E-commerce (7):**
- [ ] shopify-admin-api (zachgodsell93) - **Placeholder** (not in repo yet)
- [x] marketing-skills (jchopard69) - Fetched
- [x] content-creator (alirezarezvani) - Fetched
- [x] copywriter (killerapp) - Fetched
- [x] seo-optimizer-pro (vedantsingh60) - Fetched
- [x] ga4 (jdrhyne) - Fetched
- [x] gsc (jdrhyne) - Fetched

**Life OS (6):**
- [x] todoist (mjrussell) - Fetched
- [x] daily-briefing (antgly) - Fetched
- [x] deepwork-tracker (adunne09) - Fetched
- [x] pomodoro (snail3d) - Fetched
- [x] remind-me (julianengel) - Fetched
- [x] qmd (steipete) - Fetched

**Mom (5):**
- [x] grocery-list (dbhurley) - Fetched
- [x] remind-me (julianengel) - Shared from lifeos
- [x] event-planner (udiedrichsen) - Fetched
- [x] healthy-eating (jhillin8) - Fetched
- [x] recipe-to-list (borahm) - Fetched

**Total:** 20 skills (18 fetched, 1 placeholder, 1 built-in)

## 🚀 Deployment Ready?

**Prerequisites:**
- [ ] Test builds completed successfully
- [ ] Test runs show proper initialization
- [ ] Real OPENAI_API_KEY available for testing
- [ ] Documentation reviewed
- [ ] Security verified

**Optional:**
- [ ] Push images to Docker Hub
- [ ] Create release notes
- [ ] Set up CI/CD for rebuilds
- [ ] Create demo video/screenshots

## 📝 Notes

**Placeholders:**
- shopify-admin-api: Not yet in openclaw/skills repo, placeholder created

**Shared Skills:**
- remind-me: Copied from lifeos to mom (both templates use same skill)

**Build Strategy:**
- Single `Dockerfile.template` with `--build-arg TEMPLATE=<name>`
- Convenience Dockerfiles for direct builds (Dockerfile.ecommerce, etc.)
- Docker Compose for easy multi-template deployment

**Port Mappings (Docker Compose):**
- E-commerce: 8080/8081
- Life OS: 8082/8083
- Mom: 8084/8085

---

## ✅ Sign-Off

**Build Completed:** 2026-02-08  
**Built By:** OpenClaw Agent (subagent cb5246b8)  
**Status:** Ready for testing  
**Next Step:** Run build tests above to verify

---

*Update this checklist as you complete tests and prepare for deployment.*
