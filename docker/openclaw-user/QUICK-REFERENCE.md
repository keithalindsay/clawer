# Hardened OpenClaw Container - Quick Reference

**Version:** 2026.2.1-secure  
**Last Updated:** 2026-02-07

---

## 🚀 Quick Start

### Build
```bash
cd ~/projects/clawer/docker/openclaw-user
./build-secure.sh
```

### Run
```bash
docker run -d \
  --name openclaw-secure \
  -p 8080:8080 \
  -p 8081:8081 \
  -e MOONSHOT_API_KEY=your_key \
  -e GATEWAY_TOKEN=your_token \
  clawer-openclaw:secure
```

### Verify
```bash
# Check user
docker exec openclaw-secure whoami
# Expected: openclaw

# Check health
curl http://localhost:8080/health
# Expected: {"status":"ok"}
```

---

## 🔒 Security Features

### What's Disabled
- ❌ Shell execution (exec tool)
- ❌ Process management (process tool)
- ❌ Root access
- ❌ Unrestricted file access
- ❌ Unrestricted network access

### What's Enabled
- ✅ File operations (workspace only)
- ✅ Web search (allowed domains)
- ✅ API calls (allowed domains)
- ✅ Model interactions
- ✅ Audit logging

---

## 📁 File Access Rules

### ✅ Allowed
```
/home/openclaw/workspace/**
/home/openclaw/clawd/**
/tmp/openclaw/**
```

### ❌ Blocked
```
**/.ssh/**
**/.env*
**/secrets/**
**/credentials/**
**/.aws/**
**/.gcp/**
**/*.pem
**/*.key
```

---

## 🌐 Network Rules

### ✅ Allowed Domains
- api.moonshot.ai
- api.anthropic.com
- api.openai.com
- api.github.com
- registry.npmjs.org
- pypi.org

### ❌ Blocked
- 169.254.169.254 (cloud metadata)
- metadata.google.internal
- metadata.azure.com
- Private networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)

---

## ⏱️ Rate Limits

| Limit Type | Value |
|------------|-------|
| Prompts/minute | 20 |
| Prompts/hour | 200 |
| Complex prompts/hour | 50 |
| Max prompt length | 50,000 chars |
| Max output length | 100,000 chars |
| Concurrent sessions | 5 |
| Max sub-agents | 3 |

---

## 🔍 Common Commands

### Build & Deploy
```bash
# Build
./build-secure.sh

# Tag for registry
docker tag clawer-openclaw:secure registry.clawer.ai/openclaw:secure

# Push
docker push registry.clawer.ai/openclaw:secure

# Pull on deployment server
docker pull registry.clawer.ai/openclaw:secure
```

### Testing
```bash
# Security scan
trivy image clawer-openclaw:secure

# Run with test config
docker run --rm \
  -v $(pwd)/test-config.json:/home/openclaw/.openclaw/openclaw.json:ro \
  clawer-openclaw:secure

# Check logs
docker logs openclaw-secure

# Interactive shell (for debugging)
docker exec -it openclaw-secure /bin/bash
```

### Monitoring
```bash
# Resource usage
docker stats openclaw-secure

# Health check status
docker inspect openclaw-secure | jq '.[0].State.Health'

# View audit logs (if mounted)
docker exec openclaw-secure cat /home/openclaw/.openclaw/audit.log
```

---

## 🐛 Troubleshooting

### "Permission denied" during build
**Solution:**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### "Tool disabled for security" error
**Cause:** Exec or process tool is disabled in config.

**Solution:** This is intentional. Use file operations instead, or enable for trusted customers only.

### Health check failing
**Check:**
```bash
docker exec openclaw-secure curl http://localhost:8080/health
```

**Common causes:**
- Container still starting (wait 60s)
- Gateway not running
- Config error

### Rate limit errors
**Check config:**
```bash
docker exec openclaw-secure cat /home/openclaw/.openclaw/openclaw.json | jq .gateway.rateLimiting
```

**Adjust for customer tier:**
- Standard: 20/min, 200/hr
- Enterprise: 100/min, 2000/hr (update config)

---

## 📝 Configuration Override

### Custom rate limits (enterprise)
```json
{
  "gateway": {
    "rateLimiting": {
      "enabled": true,
      "prompts": {
        "perMinute": 100,
        "perHour": 2000,
        "maxComplexPerHour": 500
      }
    }
  }
}
```

### Allow additional domains
```json
{
  "security": {
    "toolRestrictions": {
      "network": {
        "allowedDomains": [
          "api.moonshot.ai",
          "api.customer-internal.com"
        ]
      }
    }
  }
}
```

### Expand workspace paths
```json
{
  "security": {
    "toolRestrictions": {
      "fileSystem": {
        "allowedPaths": [
          "/home/openclaw/workspace/**",
          "/home/openclaw/custom-data/**"
        ]
      }
    }
  }
}
```

---

## 🚨 Security Alerts

### What triggers alerts
- Blocked exec/process attempts
- File access outside allowlist
- Network requests to blocked domains
- Rate limit violations (>3x in 10 min)
- Prompt injection detection
- Secret detection in output

### Where alerts go
- Audit log: `/home/openclaw/.openclaw/audit.log`
- Stdout: Docker logs
- External: Configure in orchestrator

---

## 📊 Metrics to Monitor

### Security Metrics
- `blocked_exec_attempts` (should be 0 for legitimate users)
- `file_access_denials` (tune allowlist if high)
- `network_blocks` (tune allowlist if high)
- `rate_limit_hits` (tune limits if affecting real users)
- `secrets_redacted` (investigate if >0)
- `injection_detections` (investigate all instances)

### Performance Metrics
- `startup_time` (target: <60s)
- `health_check_latency` (target: <100ms)
- `memory_usage` (should stay under 3GB)
- `cpu_usage` (should be <80% sustained)

---

## 🔄 Version Upgrade

### When v2026.2.6-3 available:
```bash
# 1. Download tarball
cp openclaw-2026.2.6-3.tgz ~/projects/clawer/docker/openclaw-user/

# 2. Update Dockerfile
sed -i 's/2026.2.1/2026.2.6-3/g' Dockerfile.secure

# 3. Rebuild
./build-secure.sh

# 4. Tag
docker tag clawer-openclaw:secure clawer-openclaw:2026.2.6-3-secure

# 5. Test in staging
docker run --rm clawer-openclaw:2026.2.6-3-secure openclaw --version

# 6. Deploy
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `SECURITY-NOTES.md` | Comprehensive security documentation |
| `HARDENING-SUMMARY.md` | Executive summary of improvements |
| `VALIDATION-REPORT.md` | Detailed validation status |
| `QUICK-REFERENCE.md` | This file (quick reference) |

---

## 📞 Support

**Security Issues:**
- Email: security@clawer.ai
- PagerDuty: [link]

**General Support:**
- Email: support@clawer.ai
- Slack: #openclaw-support

**Vulnerability Reports:**
- Email: security+vuln@clawer.ai
- PGP: [public key]

---

## ✅ Pre-Deployment Checklist

- [ ] Docker build successful
- [ ] Non-root user verified (whoami → openclaw)
- [ ] Health check passing
- [ ] Security scan clean (trivy/grype)
- [ ] Test with sample workflows
- [ ] Rate limits tested
- [ ] File restrictions tested
- [ ] Network restrictions tested
- [ ] Kubernetes security context added
- [ ] Network policies deployed
- [ ] Monitoring configured
- [ ] Alerting configured
- [ ] Documentation updated
- [ ] Team trained

---

*Quick reference for hardened OpenClaw container operations*  
*For detailed information, see SECURITY-NOTES.md*
