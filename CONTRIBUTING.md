# Contributing to Clawer.ai

Welcome! This guide covers the engineering workflow, coding standards, and deployment procedures.

## Documentation

Before contributing, familiarize yourself with:

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and data flow
- **[docs/RUNBOOK.md](docs/RUNBOOK.md)** - Operations and troubleshooting
- **[specs/](specs/)** - Feature specifications (some are future plans)

## Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/clawer.git
cd clawer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Git Branching Strategy

```
main (production)
  └── feature/xxx (new features)
  └── fix/xxx (bug fixes)
  └── hotfix/xxx (urgent prod fixes)
```

### Rules

1. **Never commit directly to `main`** (except hotfixes)
2. **All features go through branches** → PR → merge
3. **Branch naming:** `feature/bot-settings`, `fix/type-error`, `hotfix/auth-crash`

### Workflow

```bash
# Start new feature
git checkout main
git pull
git checkout -b feature/my-feature

# Work, commit often
git add -A
git commit -m "feat: add bot personality selector"

# Push branch
git push -u origin feature/my-feature

# Create PR on GitHub, review, then merge
# After merge, deploy to prod
```

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactor (no behavior change)
- `test:` Adding tests
- `chore:` Maintenance

**Examples:**
```
feat: add telegram bot configuration UI
fix: container restart loop on invalid API key
docs: update deployment runbook
refactor: extract container client to separate module
test: add integration tests for chat API
chore: upgrade next.js to 15.1.0
```

## Code Style

- **TypeScript:** All new code must be TypeScript
- **Formatting:** Run `npm run format` before committing (Prettier)
- **Linting:** Run `npm run lint` before pushing (ESLint)
- **Types:** No `any` types unless absolutely necessary

## Database Changes

```bash
# 1. Update schema in src/lib/db/schema/
# 2. Generate migration
npm run db:generate

# 3. Test locally
npm run db:push

# 4. Commit migration files in drizzle/ directory
git add drizzle/
git commit -m "feat: add model_configs table"

# 5. After merge, apply to production (see Deployment)
```

## Testing

```bash
# Run tests (when implemented)
npm test

# Type check
npm run type-check

# Build check
npm run build
```

## Deployment

See **[docs/RUNBOOK.md#deployment](docs/RUNBOOK.md#deployment)** for detailed procedures.

**Quick reference:**
```bash
# After PR merged to main
git checkout main
git pull

# Build and deploy
npm run build

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env*' \
  ./ root@YOUR_DOCKER_HOST:/opt/clawer/

# On server
ssh root@YOUR_DOCKER_HOST
cd /opt/clawer
npm install --production
npm run build
npm run db:push  # Apply migrations
pm2 restart clawer-web
```

## Pre-Deploy Checklist

Before any deploy:
- [ ] Local build passes (`npm run build`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Database migrations tested locally
- [ ] PR reviewed and approved
- [ ] Backup database (for schema changes)
- [ ] Check current server status (`pm2 status`)

## Hotfix Process

For urgent production issues:

```bash
git checkout main
git checkout -b hotfix/critical-bug

# Fix, test, commit
git add -A
git commit -m "hotfix: prevent container crash on null API key"

# Push and deploy immediately
git push -u origin hotfix/critical-bug
# Merge PR
# Deploy (see Deployment)
```

## Container Development

When modifying container code (`docker/openclaw-user/`):

```bash
# Build image locally
cd docker/openclaw-user
docker build -t clawer-openclaw:latest .

# Test locally
docker run -it --rm \
  -e OPENAI_API_KEY=sk-test... \
  -p 8080:8080 \
  clawer-openclaw:latest

# Deploy to server (see RUNBOOK.md)
```

## Common Tasks

### Add a new API route

1. Create file: `src/app/api/your-route/route.ts`
2. Add authentication check (Clerk)
3. Add TypeScript types
4. Update ARCHITECTURE.md API routes inventory
5. Test with curl or Postman

### Add a new database table

1. Create schema: `src/lib/db/schema/your-table.ts`
2. Export from `src/lib/db/schema/index.ts`
3. Generate migration: `npm run db:generate`
4. Test locally: `npm run db:push`
5. Update ARCHITECTURE.md database schema section
6. Commit migration files

### Add a new dashboard component

1. Create component: `src/components/YourComponent.tsx`
2. Add to dashboard: `src/app/dashboard/page.tsx`
3. Style with Tailwind CSS
4. Test responsiveness (mobile + desktop)

## Architecture Decisions

When making significant architectural changes:

1. **Document first** - Create or update spec in `specs/`
2. **Discuss** - Open issue or PR for feedback
3. **Update docs** - Keep ARCHITECTURE.md current
4. **Migrate gradually** - Don't break existing users

## Getting Help

- **Bug or feature request?** Open a GitHub issue
- **Question?** Check docs/ARCHITECTURE.md or docs/RUNBOOK.md
- **Urgent production issue?** See Emergency Contacts in RUNBOOK.md

## Code Review Guidelines

**For reviewers:**
- Check TypeScript types are correct
- Verify authentication on API routes
- Test database migrations don't break schema
- Look for security issues (API key exposure, SQL injection, etc.)
- Ensure code follows existing patterns

**For contributors:**
- Keep PRs focused (one feature per PR)
- Write descriptive PR descriptions
- Include screenshots for UI changes
- Link related issues
- Update documentation if needed

---

**Last Updated:** 2026-02-08
