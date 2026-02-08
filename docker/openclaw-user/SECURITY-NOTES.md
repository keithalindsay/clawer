# Security Hardening Notes

**Image:** `clawer-openclaw:secure`  
**OpenClaw Version:** 2026.2.6-3  
**Last Updated:** 2026-02-07  
**Security Level:** Production Multi-Tenant

---

## Summary of Hardening

This document describes the security measures applied to the hardened OpenClaw container image for Clawer's multi-tenant SaaS deployment.

---

## 1. Container-Level Hardening

### 1.1 Non-Root Execution

| Setting | Value |
|---------|-------|
| User | `agent` (UID 1000) |
| Group | `agent` (GID 1000) |
| Shell | `/bin/bash` |

**Why:** Running as non-root prevents privilege escalation attacks and limits damage from container compromise.

**Verification:**
```bash
docker run --rm clawer-openclaw:secure id
# uid=1000(agent) gid=1000(agent) groups=1000(agent)
```

### 1.2 Multi-Stage Build

- **Builder stage:** Contains build tools (python3, make, g++, git)
- **Production stage:** Contains only runtime dependencies

**Why:** Reduces attack surface by excluding build tools from production image.

**Size reduction:** ~400MB → ~180MB

### 1.3 Minimal Base Image

- Base: `node:22-slim` (Debian slim variant)
- Only essential runtime packages installed:
  - `ca-certificates` - TLS verification
  - `curl` - Health checks
  - `dumb-init` - PID 1 signal handling

### 1.4 dumb-init as PID 1

**Why:** Proper signal handling prevents zombie processes and ensures clean shutdown.

```dockerfile
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/usr/local/bin/entrypoint.sh"]
```

### 1.5 Read-Only Root Filesystem Compatible

The image is designed to run with `--read-only` flag:
- Config generated at startup in writable `/home/agent/.openclaw/`
- Workspace in `/home/agent/clawd/`
- Temp files in `/tmp/openclaw/`

**Deployment example:**
```bash
docker run --read-only \
  --tmpfs /tmp:noexec,nosuid,size=100m \
  --tmpfs /home/agent/.openclaw:size=10m \
  clawer-openclaw:secure
```

---

## 2. Tool Restrictions

### 2.1 Disabled Tools

| Tool | Status | Reason |
|------|--------|--------|
| `exec` | ❌ Disabled | Shell execution too dangerous in multi-tenant |
| `process` | ❌ Disabled | Process management not needed |
| `nodes` | ❌ Disabled | Node control not applicable |

### 2.2 Restricted Tools

| Tool | Restrictions |
|------|-------------|
| `read` | Only `/home/agent/clawd/**` and `/tmp/openclaw/**` |
| `write` | Only workspace, max 10MB per file |
| `edit` | Only workspace files |
| `browser` | Sandboxed, internal IPs blocked |
| `web_fetch` | Internal networks blocked, max 5MB response |
| `message` | Rate limited to 30/min |

### 2.3 Path Blocking

Blocked paths (cannot be read or written):
- `/home/agent/.openclaw/**` - Config with secrets
- `**/.env`, `**/.env.*` - Environment files
- `**/secrets/**`, `**/credentials/**` - Secret directories
- `**/.aws/**`, `**/.gcp/**`, `**/.azure/**` - Cloud credentials
- `**/*.pem`, `**/*.key` - Private keys
- `**/id_rsa*`, `**/id_ed25519*` - SSH keys
- `/etc/shadow`, `/etc/passwd` - System files

---

## 3. Network Restrictions

### 3.1 Egress Policy

**Default:** Restricted (allowlist-based)

**Allowed hosts:**
- `api.moonshot.ai` - LLM provider
- `api.anthropic.com` - LLM provider
- `api.openai.com` - LLM provider
- `api.github.com` - GitHub API
- `registry.npmjs.org` - NPM registry
- `pypi.org` - Python packages
- `cdn.jsdelivr.net` - CDN

### 3.2 Blocked Networks

| Network | Reason |
|---------|--------|
| `169.254.169.254/32` | Cloud metadata service (AWS/GCP/Azure) |
| `metadata.google.internal` | GCP metadata |
| `10.0.0.0/8` | Private network |
| `172.16.0.0/12` | Private network |
| `192.168.0.0/16` | Private network |
| `localhost`, `127.0.0.1` | Loopback |

**Why:** Prevents SSRF attacks against internal services and cloud metadata endpoints.

### 3.3 Kubernetes Network Policy

Apply this NetworkPolicy for additional enforcement:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: clawer-agent-egress
spec:
  podSelector:
    matchLabels:
      app: clawer-agent
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8
              - 172.16.0.0/12
              - 192.168.0.0/16
              - 169.254.0.0/16
      ports:
        - port: 443
          protocol: TCP
```

---

## 4. Rate Limiting

### 4.1 Global Limits

| Metric | Limit |
|--------|-------|
| Requests/minute | 60 |
| Requests/hour | 500 |
| Tokens/minute | 100,000 |
| Tokens/hour | 1,000,000 |

### 4.2 Per-Tool Limits

| Tool | Per Minute | Per Hour |
|------|------------|----------|
| `web_search` | 10 | 100 |
| `web_fetch` | 20 | 200 |
| `browser` | 5 | 50 |
| `message` | 30 | 300 |
| `write` | 30 | 500 |

### 4.3 Prompt Limits

| Setting | Value |
|---------|-------|
| Max prompt length | 50,000 chars |
| Complex prompt threshold | 1,000 chars |
| Complex prompts/hour | 100 |

---

## 5. Secret Detection & Redaction

### 5.1 Output Scanning

All agent outputs are scanned for:
- API keys (`sk-*`, `pk_*`, `api_key*`)
- AWS access keys (`AKIA*`)
- JWTs (`eyJ*`)
- Private keys (`-----BEGIN * PRIVATE KEY-----`)
- GitHub tokens (`gh[pousr]_*`)

**Action on detection:** Redact and log

### 5.2 Input Validation

Prompts are scanned for injection patterns:
- Instruction override attempts
- Role manipulation
- System prompt extraction
- Delimiter injection

---

## 6. Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -sf http://localhost:8080/health || exit 1
```

| Parameter | Value | Reason |
|-----------|-------|--------|
| Interval | 30s | Balance between responsiveness and overhead |
| Timeout | 10s | Allow for slow responses under load |
| Start period | 60s | Allow gateway to fully initialize |
| Retries | 3 | Avoid false positives from transient issues |

---

## 7. Resource Limits

### 7.1 Recommended Docker Run Flags

```bash
docker run \
  --memory=4g \
  --memory-swap=4g \
  --cpus=2 \
  --ulimit nofile=1024:1024 \
  --ulimit nproc=256:256 \
  --read-only \
  --security-opt=no-new-privileges:true \
  --cap-drop=ALL \
  clawer-openclaw:secure
```

### 7.2 Kubernetes Resource Spec

```yaml
resources:
  limits:
    memory: "4Gi"
    cpu: "2"
    ephemeral-storage: "10Gi"
  requests:
    memory: "1Gi"
    cpu: "500m"
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  seccompProfile:
    type: RuntimeDefault
```

---

## 8. Audit Logging

| Feature | Enabled |
|---------|---------|
| Tool calls | ✅ |
| Path access | ✅ |
| Network egress | ✅ |
| Signed receipts | ✅ |
| Retention | 30 days |

---

## 9. Comparison: Original vs Hardened

| Feature | Original | Hardened |
|---------|----------|----------|
| OpenClaw version | 2026.2.1 | 2026.2.6-3 |
| Run as | root | agent (1000) |
| Build stages | 1 | 2 (multi-stage) |
| exec tool | Enabled | ❌ Disabled |
| File access | Unrestricted | Workspace only |
| Network egress | Unrestricted | Allowlist |
| Metadata access | Allowed | ❌ Blocked |
| Rate limiting | None | ✅ Configured |
| Secret scanning | None | ✅ Enabled |
| Health check | Basic | ✅ Robust |
| Init system | None | dumb-init |
| Image size | ~400MB | ~180MB |

---

## 10. Deployment Checklist

Before deploying to production:

- [ ] Update `openclaw-2026.2.6-3.tgz` in build context
- [ ] Set `GATEWAY_TOKEN` environment variable
- [ ] Set `MOONSHOT_API_KEY` environment variable
- [ ] Apply Kubernetes NetworkPolicy
- [ ] Configure resource limits in orchestrator
- [ ] Enable audit log collection
- [ ] Set up health check monitoring
- [ ] Test with `--read-only` flag

---

## 11. Known Limitations

1. **No shell access:** Users cannot run arbitrary commands. This is intentional.

2. **Limited file access:** Only workspace directory accessible. Users must work within `/home/agent/clawd/`.

3. **Network restrictions:** Some legitimate external APIs may be blocked. Add to allowlist as needed.

4. **Rate limits:** Heavy automation workloads may hit limits. Adjust per customer tier.

---

## 12. Incident Response

If a container is compromised:

1. **Isolate:** Remove from load balancer, block network
2. **Preserve:** Snapshot container state for forensics
3. **Terminate:** Kill the container
4. **Review:** Check audit logs for scope of breach
5. **Notify:** Alert affected customer if data exposed
6. **Patch:** Address vulnerability, rebuild image

---

*Document maintained by Security Team*  
*Review schedule: Monthly*
