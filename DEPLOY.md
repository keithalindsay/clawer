# Deployment Guide

## Overview

Clawer uses GitHub Actions for CI/CD with a manual fallback script for emergencies.

**Production server:** root@YOUR_DOCKER_HOST  
**Deploy directory:** /opt/clawer  
**Process manager:** PM2 (process name: `clawer`)

---

## Automated Deployment (GitHub Actions)

### How it works

1. **Push to main** triggers two workflows:
   - **CI Pipeline** (`.github/workflows/ci.yml`):
     - Type checking
     - Production build
     - Secret scanning (TruffleHog)
   - **Deploy Pipeline** (`.github/workflows/deploy.yml`):
     - Builds app
     - rsyncs to server (excludes node_modules, .env, .git)
     - Installs production dependencies on server
     - Restarts PM2
     - Health checks (3 retries, 5s intervals)
     - Comments deployment status on commit

2. **Docker changes** (`docker/openclaw-user/**`) trigger:
   - `.github/workflows/docker.yml`:
     - Syncs Docker files to server
     - Rebuilds image as `clawer-openclaw:ecommerce`

3. **Concurrency control:** Only one deploy runs at a time (no parallel deploys)

### Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `DEPLOY_SSH_KEY` | Private SSH key with root access to server |
| `DEPLOY_HOST` | `YOUR_DOCKER_HOST` |

**To generate SSH key:**
```bash
ssh-keygen -t ed25519 -C "github-actions-clawer" -f ~/.ssh/clawer_deploy
cat ~/.ssh/clawer_deploy.pub >> ~/.ssh/authorized_keys  # on server
cat ~/.ssh/clawer_deploy  # copy to GitHub secret
```

---

## Manual Deployment

Use `deploy.sh` when GitHub Actions is unavailable or for hotfixes.

```bash
cd ~/projects/clawer
bash deploy.sh
```

**What it does:**
1. Pre-deploy checks:
   - Warns if not on `main` branch
   - Warns if working directory is dirty
   - Blocks if .env is tracked by git
2. Creates timestamped backup on server
3. Builds locally
4. rsyncs to server
5. Installs deps on server
6. Restarts PM2
7. Health checks with retries
8. Shows rollback command if failure

---

## Rollback

### Automated backup (from deploy.sh)

If `deploy.sh` fails, it shows the rollback command:

```bash
ssh root@YOUR_DOCKER_HOST 'rm -rf /opt/clawer && mv /opt/clawer-backup-YYYYMMDD-HHMMSS /opt/clawer && pm2 restart clawer'
```

### Manual rollback (revert to previous commit)

```bash
cd ~/projects/clawer
git log --oneline -5  # find commit hash
git checkout <commit-hash>
bash deploy.sh
git checkout main  # return to main after
```

### PM2-only restart (no code changes)

```bash
ssh root@YOUR_DOCKER_HOST "pm2 restart clawer"
```

---

## Common Commands

| Task | Command |
|------|---------|
| Dev server | `make dev` or `npx next dev` |
| Build locally | `make build` or `NEXT_PRIVATE_WORKER_THREADS=0 npx next build` |
| Deploy | `make deploy` or `bash deploy.sh` |
| Health check | `make test` or `curl -s https://clawer.ai/ -o /dev/null -w '%{http_code}'` |
| Build Docker image | `make docker-build` |
| View server logs | `ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --lines 50"` |
| SSH to server | `ssh root@YOUR_DOCKER_HOST` |

---

## Adding New Secrets

### For GitHub Actions

1. Add secret to **Settings → Secrets and variables → Actions**
2. Reference in workflow: `${{ secrets.SECRET_NAME }}`

### For server environment

1. SSH to server: `ssh root@YOUR_DOCKER_HOST`
2. Edit PM2 ecosystem config: `nano /opt/clawer/ecosystem.config.cjs`
3. Add to `env` block
4. Restart: `pm2 restart clawer --update-env`

### For local development

1. Add to `.env.local` (never commit this file!)
2. Reference in code: `process.env.SECRET_NAME`

---

## Troubleshooting

### Deploy fails with "Health check failed"

1. Check PM2 logs:
   ```bash
   ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --lines 50"
   ```

2. Common causes:
   - Missing environment variables
   - Database connection issues
   - Port 3000 already in use
   - Build artifacts corrupt

3. Try manual restart:
   ```bash
   ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && pm2 restart clawer"
   ```

### GitHub Actions fails with "Permission denied"

- Check `DEPLOY_SSH_KEY` secret is correct
- Verify public key is in `/root/.ssh/authorized_keys` on server

### Build fails with worker thread error

- Ensure `NEXT_PRIVATE_WORKER_THREADS=0` is set (Next.js 15 compatibility)

### rsync excludes node_modules but server has old deps

- Manual fix: `ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && rm -rf node_modules && npm install --production"`

---

## Pre-commit Hooks (Optional)

To prevent bad commits, install Husky:

```bash
npm install --save-dev husky
npx husky init
```

Create `.husky/pre-commit`:
```bash
#!/bin/sh
npx tsc --noEmit || exit 1
NEXT_PRIVATE_WORKER_THREADS=0 npx next build || exit 1
git diff --cached --name-only | grep -q '^\.env$' && echo "❌ Cannot commit .env file" && exit 1
```

Make executable: `chmod +x .husky/pre-commit`

---

## Architecture

```
Developer push to main
  ↓
GitHub Actions CI
  ├─ Type check
  ├─ Build test
  └─ Secret scan
  ↓
GitHub Actions Deploy (after CI passes)
  ├─ Build production bundle
  ├─ rsync to server (excludes node_modules, .env)
  ├─ npm install on server
  ├─ PM2 restart
  └─ Health check
  ↓
Production (clawer.ai)
```

Manual path: `deploy.sh` → rsync → PM2 restart

---

## Questions?

- Check logs: `ssh root@YOUR_DOCKER_HOST "pm2 logs clawer"`
- Check process: `ssh root@YOUR_DOCKER_HOST "pm2 status"`
- Check GitHub Actions: https://github.com/Aigeninc/clawer/actions
