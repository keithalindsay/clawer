# Engineering Workflow

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
git commit -m "feat: description"

# Push branch
git push -u origin feature/my-feature

# Create PR on GitHub, review, then merge
# After merge, deploy to prod
```

## Deployment

```bash
# After PR merged to main
git checkout main
git pull

# Deploy to production
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env*' \
  ./ root@YOUR_DOCKER_HOST:/opt/clawer/

# On server
ssh root@YOUR_DOCKER_HOST
cd /opt/clawer
npm run build
pm2 restart clawer
```

## Commit Messages

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactor (no behavior change)
- `test:` Adding tests
- `chore:` Maintenance

## Database Changes

1. Create migration locally: `npx drizzle-kit generate`
2. Test locally first
3. After merge, push to prod: `npx drizzle-kit push`

## Pre-Launch Checklist

Before any deploy:
- [ ] Local build passes (`npm run build`)
- [ ] No TypeScript errors
- [ ] Tested locally if possible
- [ ] PR reviewed (when we have team)

## Hotfix Process

For urgent prod issues:
```bash
git checkout main
git checkout -b hotfix/critical-bug
# Fix, commit
git push -u origin hotfix/critical-bug
# Merge immediately, deploy
```

---

*Effective: Feb 8, 2026*
