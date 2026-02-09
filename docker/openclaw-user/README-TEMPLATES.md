# Clawer Docker Templates

**3 pre-configured OpenClaw AI agent templates for immediate deployment.**

## Quick Start

### 1. Build All Templates

```bash
./build-templates.sh
```

This creates:
- `clawer-openclaw:ecommerce` - E-commerce store management
- `clawer-openclaw:lifeos` - Personal productivity system
- `clawer-openclaw:mom` - Family/household management

### 2. Run a Template

**Using Docker:**
```bash
export OPENAI_API_KEY=sk-your-key-here
docker run -it --rm \
  -e OPENAI_API_KEY \
  -p 8080:8080 -p 8081:8081 \
  clawer-openclaw:lifeos
```

**Using Docker Compose:**
```bash
# Create .env file
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# Run specific template
docker-compose -f docker-compose.templates.yml up lifeos
```

### 3. Access Your Agent

- **Gateway:** http://localhost:8080
- **API Dashboard:** http://localhost:8081 (if implemented)
- **WhatsApp/Telegram:** Configure via OpenClaw settings

---

## Templates

### 🛒 E-commerce (Port 8080/8081)

**For:** Online store owners, dropshippers, e-commerce managers

**Team:**
- Office Manager (coordinator)
- Marketing Specialist
- Content Writer
- Customer Support
- Data Analyst

**Skills:**
- Shopify admin operations
- 23 marketing playbooks
- SEO optimization
- Google Analytics 4
- Google Search Console
- Content creation
- Copywriting

**Use Cases:**
- Product description generation
- SEO campaign planning
- GA4 funnel analysis
- Marketing automation
- Content calendar management

---

### 📋 Life OS (Port 8082/8083)

**For:** Knowledge workers, productivity enthusiasts, GTD practitioners

**Team:**
- Office Manager (coordinator)

**Skills:**
- Todoist integration
- Daily briefing system
- Deep work tracking
- Pomodoro timer
- Smart reminders
- Quick markdown search (qmd)

**Use Cases:**
- Morning planning routine
- Deep work sessions
- Task management
- Note-taking and retrieval
- Time tracking

---

### 👩‍👧‍👦 Mom (Port 8084/8085)

**For:** Parents, household managers, family organizers

**Team:**
- Office Manager (coordinator)

**Skills:**
- Grocery list management
- Recipe to shopping list
- Event planning
- Healthy eating suggestions
- Smart reminders

**Use Cases:**
- Meal planning
- Shopping list creation
- Birthday party planning
- School event tracking
- Nutrition guidance

---

## Building

### Build Single Template

```bash
# Using build arg
docker build --build-arg TEMPLATE=lifeos -f Dockerfile.template -t clawer-openclaw:lifeos .

# Using specific Dockerfile
docker build -f Dockerfile.lifeos -t clawer-openclaw:lifeos .
```

### Build with Docker Compose

```bash
docker-compose -f docker-compose.templates.yml build ecommerce
docker-compose -f docker-compose.templates.yml build lifeos
docker-compose -f docker-compose.templates.yml build mom
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key for Claude/GPT |
| `GATEWAY_TOKEN` | ⚪ Optional | Auto-generated | Gateway authentication token |
| `SEARXNG_PROXY_URL` | ⚪ Optional | `http://172.17.0.1:8889/...` | SearXNG proxy URL |
| `BRAVE_API_KEY` | ⚪ Optional | `searxng-local-proxy` | Brave Search API (fallback) |

### Volumes (Docker Compose)

Each template has persistent storage:

```yaml
volumes:
  - ./workspace-lifeos:/home/user/clawd/workspace:rw
  - ./memory-lifeos:/home/user/clawd/memory:rw
```

**Workspace:** User files, projects, documents  
**Memory:** Daily notes, long-term memory

---

## Skills

### Universal Skills (All Templates)

- **gog** (steipete) - Google Workspace CLI
- **whatsapp-styling-guide** (rubenfb23) - Message formatting
- **weather** (built-in) - Weather information

### Template-Specific Skills

See `TEMPLATE-BUILD-SUMMARY.md` for complete skill list with authors and status.

**Skill Loading:**
- Skills load from `/home/user/clawd/skills/` automatically
- Each skill is a folder with `SKILL.md` file
- Skills provide guidance/instructions to the AI agent
- No executable code - pure guidance

---

## Security

✅ **All skills security-scanned and verified safe**

Checks performed:
- No auto-execution patterns
- No prompt injection attempts
- No credential harvesting
- No external script loading
- All skills properly structured

See `TEMPLATE-BUILD-SUMMARY.md` for detailed security report.

---

## Troubleshooting

### "OPENAI_API_KEY not set"

**Solution:** Set the environment variable:
```bash
export OPENAI_API_KEY=sk-your-key-here
docker run -e OPENAI_API_KEY ...
```

Or add to `.env` file for Docker Compose.

### Port Already in Use

**Solution:** Use Docker Compose (different ports) or map to different port:
```bash
docker run -p 8090:8080 -p 8091:8081 ...
```

### Skills Not Loading

**Verify skills exist:**
```bash
docker exec -it container-name ls -la /home/user/clawd/skills/
```

**Re-fetch skills:**
```bash
./fetch-skills-robust.sh
docker build ...
```

### Template Not Initializing

**Check entrypoint logs:**
```bash
docker logs container-name
```

**Verify team files exist:**
```bash
docker exec -it container-name ls -la /home/user/clawd/team/
```

---

## Advanced Usage

### Custom Skills

Add your own skills:

```bash
mkdir -p skills/custom/my-skill
cat > skills/custom/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: My custom skill
---

# My Skill

Instructions for the AI agent...
EOF
```

Rebuild template to include custom skills.

### Override Team Configuration

Mount custom AGENTS.md:

```bash
docker run -v ./my-agents.md:/home/user/clawd/AGENTS.md:ro ...
```

### Development Mode

Mount workspace for live editing:

```bash
docker run -v ./workspace:/home/user/clawd:rw ...
```

Changes persist and reload on container restart.

---

## File Structure

```
/home/user/clawd/           # Container workspace
├── AGENTS.md               # Main agent config (from team)
├── SOUL.md                 # Agent identity
├── USER.md                 # User profile (you edit this)
├── WORKING.md              # Current task state
├── memory/                 # Daily notes and long-term memory
│   └── YYYY-MM-DD.md
├── skills/                 # All skills (universal + template)
│   ├── gog/
│   ├── todoist/
│   └── ...
├── team/                   # Original team configuration
│   ├── AGENTS.md
│   ├── team-config.json
│   └── members/
└── workspace/              # Your files (if mounted)
```

---

## Maintenance

### Update Skills

```bash
# Re-fetch all skills
./fetch-skills-robust.sh

# Rebuild templates
./build-templates.sh
```

### Add New Template

1. Create `teams/new-template/` with AGENTS.md
2. Add skills to `skills/new-template/`
3. Update `build-templates.sh` to include new template
4. Build: `docker build --build-arg TEMPLATE=new-template ...`

### Monitor openclaw/skills Repo

Watch for new skills:
```bash
# Check for updates
curl -sL https://api.github.com/repos/openclaw/skills/commits/main | jq '.[0].commit.message'
```

---

## Support

**Documentation:**
- Full build summary: `TEMPLATE-BUILD-SUMMARY.md`
- Security scan: `./security-scan.sh`
- Validation: `./validate-build.sh`

**OpenClaw:**
- GitHub: https://github.com/openclaw/openclaw
- Skills: https://github.com/openclaw/skills

**Clawer:**
- Project: https://github.com/your-org/clawer (update with actual URL)

---

## License

OpenClaw runtime: See OpenClaw project license  
Skills: Individual skill licenses (see each SKILL.md)  
Clawer templates: MIT License (or your chosen license)

---

**Built 2026-02-08 | OpenClaw 2026.2.6-3 | 3 Templates | 20 Skills**
