# Clawer Security Implementation Specification

**Version:** 1.0  
**Date:** 2026-02-07  
**Status:** Draft  
**Owner:** Security Team

---

## Executive Summary

Clawer.ai provides containerized OpenClaw instances to paying customers. This specification defines a defense-in-depth security architecture integrating ClawdStrike runtime guards, PromptGuard input sanitization, and SkillGuard vetting—informed by industry research showing 7.1% of ClawHub skills leak credentials and 396 malicious skills identified in the wild.

---

## 1. Threat Model

### 1.1 Attack Vectors

| Threat | Description | Severity | Likelihood |
|--------|-------------|----------|------------|
| **Direct Prompt Injection** | User crafts malicious prompts to bypass safety controls | Critical | High |
| **Indirect Prompt Injection** | Malicious content in external data sources (web pages, documents) manipulates model behavior | Critical | Medium |
| **Data Exfiltration** | Model leaks user secrets, API keys, or PII through outputs or tool calls | Critical | Medium |
| **Malicious Skills** | Third-party skills contain backdoors, credential stealers, or exfiltration logic | High | High |
| **Container Escape** | Attacker breaks out of container to access host system | Critical | Low |
| **Lateral Movement** | Compromised container accesses other customer containers or internal services | Critical | Low |
| **Model Jailbreaking** | Bypassing model safety training to generate harmful content | High | Medium |

### 1.2 Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERNET (Untrusted)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   API Gateway / WAF                          │
│                   (Rate limiting, DDoS)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              PromptGuard Input Sanitization                  │
│           (Injection detection, input validation)            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                 Customer Container (Isolated)                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  ClawdStrike SDK                     │    │
│  │  - Runtime guards    - Signed receipts               │    │
│  │  - Path restrictions - Egress controls               │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   OpenClaw Agent                     │    │
│  │  - Moonshot model    - Vetted skills only            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Output Filter / Secret Redaction                │
│              (PII masking, watermarking)                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Threat Actors

- **Malicious Users:** Customers attempting to abuse the system
- **Compromised Accounts:** Legitimate accounts under attacker control
- **Malicious Skill Authors:** Publishing backdoored skills to ClawHub
- **External Attackers:** Targeting Clawer infrastructure

---

## 2. Security Layers

### Layer 1: Container Isolation

**Objective:** Prevent container escape and lateral movement.

#### Network Policies

```yaml
# kubernetes/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: clawer-container-policy
spec:
  podSelector:
    matchLabels:
      app: clawer-agent
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: clawer-gateway
      ports:
        - port: 8080
  egress:
    # Allow only approved external APIs
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
      ports:
        - port: 443
    # Block access to metadata service
    - to:
        - ipBlock:
            cidr: 169.254.169.254/32
```

#### Resource Limits

```yaml
# Per-container limits
resources:
  limits:
    memory: "4Gi"
    cpu: "2"
    ephemeral-storage: "10Gi"
  requests:
    memory: "1Gi"
    cpu: "500m"
```

#### Security Context

```yaml
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

#### Filesystem Isolation

- Read-only root filesystem
- Writable `/tmp` with noexec mount
- Customer data in isolated ephemeral volume
- No access to host filesystem or other containers

---

### Layer 2: Skill Allowlist (SkillGuard)

**Objective:** Only permit vetted, safe skills in Clawer environments.

#### Approval Criteria

| Criterion | Requirement | Check Method |
|-----------|-------------|--------------|
| **No Secrets in Code** | Zero hardcoded credentials | Static analysis (trufflehog, gitleaks) |
| **No Network Calls** | Unless explicitly required | AST analysis of outbound requests |
| **Minimal Permissions** | Request only needed capabilities | Permission manifest review |
| **Known Author** | Verified identity on ClawHub | Identity verification |
| **Code Review** | Manual review for complex skills | Security team review |
| **Behavior Testing** | Sandbox execution passes | Automated test suite |

#### Vetting Pipeline

```python
# skills/vetting_pipeline.py
class SkillVetter:
    def __init__(self):
        self.static_analyzers = [
            TrufflehogScanner(),
            GitleaksScanner(),
            BanditScanner(),
            SemgrepScanner(),
        ]
        self.behavior_analyzer = SandboxExecutor()
    
    def vet_skill(self, skill_package: SkillPackage) -> VettingResult:
        """Run full vetting pipeline on a skill."""
        results = []
        
        # Static analysis
        for analyzer in self.static_analyzers:
            result = analyzer.scan(skill_package.source_code)
            if result.has_critical_findings():
                return VettingResult(
                    approved=False,
                    reason=f"Static analysis failed: {result.summary}"
                )
            results.append(result)
        
        # Permission analysis
        if not self._validate_permissions(skill_package.manifest):
            return VettingResult(
                approved=False,
                reason="Excessive permission requests"
            )
        
        # Sandbox behavior testing
        sandbox_result = self.behavior_analyzer.execute(
            skill_package,
            timeout_seconds=60,
            network_isolated=True
        )
        
        if sandbox_result.suspicious_behavior:
            return VettingResult(
                approved=False,
                reason=f"Suspicious behavior: {sandbox_result.findings}"
            )
        
        return VettingResult(
            approved=True,
            risk_score=self._calculate_risk_score(results),
            review_notes=self._generate_review_notes(results)
        )
```

#### Default Allowlist

Clawer ships with these pre-vetted skills:

```yaml
# config/default-skill-allowlist.yaml
skills:
  core:
    - openclaw/filesystem      # File operations (sandboxed)
    - openclaw/web-search      # Web search integration
    - openclaw/browser         # Headless browser (isolated)
    - openclaw/code-execution  # Sandboxed code runner
  
  productivity:
    - verified/calendar-integration
    - verified/email-readonly
    - verified/document-analysis
  
  development:
    - verified/git-operations
    - verified/code-review
    - verified/test-runner
```

---

### Layer 3: Input Sanitization (PromptGuard)

**Objective:** Detect and block prompt injection attacks before they reach the model.

#### Detection Patterns

```python
# security/prompt_guard.py
from dataclasses import dataclass
from enum import Enum
import re

class ThreatLevel(Enum):
    SAFE = 0
    SUSPICIOUS = 1
    BLOCKED = 2

@dataclass
class PromptAnalysis:
    threat_level: ThreatLevel
    confidence: float
    patterns_matched: list[str]
    recommendation: str

class PromptGuard:
    """Multi-layer prompt injection detection."""
    
    # Known injection patterns (heuristic layer)
    INJECTION_PATTERNS = [
        # Instruction override attempts
        r"ignore\s+(previous|all|above)\s+(instructions?|prompts?)",
        r"disregard\s+(your|the)\s+(instructions?|rules?|guidelines?)",
        r"forget\s+(everything|what)\s+you",
        r"you\s+are\s+now\s+a?\s*(different|new|evil)",
        r"pretend\s+you\s+(are|have)\s+no\s+(restrictions?|rules?)",
        
        # Role manipulation
        r"you\s+are\s+(actually|really|secretly)",
        r"your\s+(true|real|actual)\s+(purpose|goal|role)",
        r"act\s+as\s+(if|though)\s+you",
        
        # System prompt extraction
        r"(show|reveal|display|print)\s+(your|the)\s+(system|initial)\s+prompt",
        r"what\s+(are|were)\s+your\s+(instructions?|guidelines?)",
        r"repeat\s+(your|the)\s+(system|initial)\s+(message|prompt)",
        
        # Delimiter injection
        r"<\|?(system|user|assistant)\|?>",
        r"\[INST\]|\[/INST\]",
        r"###\s*(instruction|system|human|assistant)",
        
        # Encoded payloads
        r"base64\s*:\s*[A-Za-z0-9+/=]{20,}",
        r"eval\s*\(\s*['\"]",
    ]
    
    # Suspicious but not blocked
    SUSPICIOUS_PATTERNS = [
        r"don't\s+tell\s+(anyone|the\s+user)",
        r"keep\s+this\s+(secret|private|hidden)",
        r"without\s+the\s+user\s+knowing",
        r"hide\s+this\s+from",
    ]
    
    def __init__(self, ml_classifier=None):
        self.ml_classifier = ml_classifier  # Optional ML model for advanced detection
        self.compiled_injection = [re.compile(p, re.I) for p in self.INJECTION_PATTERNS]
        self.compiled_suspicious = [re.compile(p, re.I) for p in self.SUSPICIOUS_PATTERNS]
    
    def analyze(self, prompt: str) -> PromptAnalysis:
        """Analyze prompt for injection attempts."""
        matched_patterns = []
        
        # Check blocked patterns
        for pattern in self.compiled_injection:
            if pattern.search(prompt):
                matched_patterns.append(pattern.pattern)
        
        if matched_patterns:
            return PromptAnalysis(
                threat_level=ThreatLevel.BLOCKED,
                confidence=0.95,
                patterns_matched=matched_patterns,
                recommendation="Block and log. Notify security team if repeated."
            )
        
        # Check suspicious patterns
        suspicious_matches = []
        for pattern in self.compiled_suspicious:
            if pattern.search(prompt):
                suspicious_matches.append(pattern.pattern)
        
        if suspicious_matches:
            return PromptAnalysis(
                threat_level=ThreatLevel.SUSPICIOUS,
                confidence=0.7,
                patterns_matched=suspicious_matches,
                recommendation="Flag for review. Allow with monitoring."
            )
        
        # ML classifier for advanced detection (if available)
        if self.ml_classifier:
            ml_score = self.ml_classifier.predict(prompt)
            if ml_score > 0.8:
                return PromptAnalysis(
                    threat_level=ThreatLevel.BLOCKED,
                    confidence=ml_score,
                    patterns_matched=["ml_classifier"],
                    recommendation="ML model detected likely injection."
                )
            elif ml_score > 0.5:
                return PromptAnalysis(
                    threat_level=ThreatLevel.SUSPICIOUS,
                    confidence=ml_score,
                    patterns_matched=["ml_classifier"],
                    recommendation="ML model detected possible injection."
                )
        
        return PromptAnalysis(
            threat_level=ThreatLevel.SAFE,
            confidence=0.9,
            patterns_matched=[],
            recommendation="Proceed normally."
        )
```

#### Rate Limiting

```python
# security/rate_limiter.py
class PromptRateLimiter:
    """Rate limit based on prompt complexity and history."""
    
    LIMITS = {
        "standard": {
            "prompts_per_minute": 20,
            "prompts_per_hour": 200,
            "complex_prompts_per_hour": 50,  # >1000 chars
            "max_prompt_length": 50000,
        },
        "enterprise": {
            "prompts_per_minute": 100,
            "prompts_per_hour": 2000,
            "complex_prompts_per_hour": 500,
            "max_prompt_length": 200000,
        }
    }
    
    def check_limit(self, customer_id: str, prompt: str) -> RateLimitResult:
        tier = self.get_customer_tier(customer_id)
        limits = self.LIMITS[tier]
        
        if len(prompt) > limits["max_prompt_length"]:
            return RateLimitResult(allowed=False, reason="Prompt too long")
        
        # Check rate limits
        current = self.get_current_usage(customer_id)
        if current.per_minute >= limits["prompts_per_minute"]:
            return RateLimitResult(allowed=False, reason="Rate limit (minute)")
        
        if current.per_hour >= limits["prompts_per_hour"]:
            return RateLimitResult(allowed=False, reason="Rate limit (hour)")
        
        if len(prompt) > 1000:
            if current.complex_per_hour >= limits["complex_prompts_per_hour"]:
                return RateLimitResult(allowed=False, reason="Complex prompt limit")
        
        return RateLimitResult(allowed=True)
```

---

### Layer 4: Runtime Guards (ClawdStrike)

**Objective:** Enforce security policies during agent execution.

#### ClawdStrike SDK Integration

```python
# runtime/clawdstrike_integration.py
from clawdstrike import Guard, Policy, Receipt
from clawdstrike.detectors import JailbreakDetector, SecretDetector

class ClawerGuard:
    """ClawdStrike integration for Clawer containers."""
    
    def __init__(self, customer_id: str, policy_path: str):
        self.customer_id = customer_id
        self.policy = Policy.load(policy_path)
        self.guard = Guard(policy=self.policy)
        
        # Initialize detectors
        self.jailbreak_detector = JailbreakDetector(
            mode="strict",
            ml_model="clawdstrike/jailbreak-v2"
        )
        self.secret_detector = SecretDetector(
            patterns=["api_key", "password", "token", "secret", "credential"],
            entropy_threshold=4.5
        )
    
    def check_tool_call(self, tool_name: str, args: dict) -> GuardResult:
        """Check if a tool call is allowed by policy."""
        result = self.guard.check_tool(tool_name, args)
        
        if not result.allowed:
            self._log_blocked_action(tool_name, args, result.reason)
            return GuardResult(
                allowed=False,
                reason=result.reason,
                receipt=self._sign_receipt("blocked", tool_name, args)
            )
        
        return GuardResult(
            allowed=True,
            receipt=self._sign_receipt("allowed", tool_name, args)
        )
    
    def check_file_access(self, path: str, mode: str) -> GuardResult:
        """Check if file access is allowed."""
        return self.guard.check_path(path, mode)
    
    def check_network_egress(self, url: str) -> GuardResult:
        """Check if network request is allowed."""
        return self.guard.check_egress(url)
    
    def check_output(self, output: str) -> OutputCheckResult:
        """Scan output for secrets and jailbreak indicators."""
        secrets = self.secret_detector.scan(output)
        jailbreak = self.jailbreak_detector.check(output)
        
        return OutputCheckResult(
            has_secrets=len(secrets) > 0,
            secrets_found=secrets,
            jailbreak_detected=jailbreak.detected,
            jailbreak_confidence=jailbreak.confidence
        )
    
    def _sign_receipt(self, action: str, tool: str, args: dict) -> Receipt:
        """Generate cryptographically signed receipt for audit trail."""
        return Receipt.sign(
            action=action,
            tool=tool,
            args_hash=self._hash_args(args),
            timestamp=datetime.utcnow(),
            customer_id=self.customer_id,
            signing_key=self.policy.signing_key
        )
```

#### Default Policy Configuration

```yaml
# policies/default-policy.yaml
version: "1.0"
name: "clawer-default-strict"
description: "Default security policy for Clawer containers"

# Path access restrictions
paths:
  blocked:
    - "/root/.ssh/**"
    - "/home/*/.ssh/**"
    - "/etc/shadow"
    - "/etc/passwd"
    - "**/.env"
    - "**/.env.*"
    - "**/secrets/**"
    - "**/credentials/**"
    - "**/.aws/**"
    - "**/.gcp/**"
    - "**/.azure/**"
    - "**/id_rsa*"
    - "**/id_ed25519*"
    - "**/*.pem"
    - "**/*.key"
    - "**/serviceAccountKey.json"
  
  allowed:
    - "/workspace/**"        # Customer workspace
    - "/tmp/**"              # Temporary files
    - "/home/agent/**"       # Agent home directory

# Network egress controls
network:
  default: deny
  allowed:
    - "api.anthropic.com:443"
    - "api.openai.com:443"
    - "api.github.com:443"
    - "registry.npmjs.org:443"
    - "pypi.org:443"
    # Customer-specific additions loaded from customer config
  
  blocked:
    - "169.254.169.254"      # Cloud metadata services
    - "metadata.google.internal"
    - "10.0.0.0/8"           # Internal networks
    - "172.16.0.0/12"
    - "192.168.0.0/16"

# Tool restrictions
tools:
  blocked:
    - "shell:rm -rf /"
    - "shell:dd if=/dev/*"
    - "shell:chmod 777"
    - "shell:curl * | sh"
    - "shell:wget * | sh"
  
  require_confirmation:
    - "shell:rm *"
    - "shell:git push --force"
    - "network:POST *"
    - "network:DELETE *"
  
  allowed:
    - "read:*"
    - "write:/workspace/**"
    - "exec:safe_commands"

# Jailbreak detection
jailbreak:
  mode: strict
  actions:
    on_detection: block_and_alert
    confidence_threshold: 0.7
  
  heuristics:
    - roleplay_detection
    - instruction_override_detection
    - system_prompt_extraction
  
  ml_model:
    enabled: true
    model: "clawdstrike/jailbreak-v2"
    fallback_to_heuristics: true

# Secret detection in outputs
secrets:
  scan_outputs: true
  action: redact
  patterns:
    - type: api_key
      regex: "(sk-|pk_|api[_-]?key)[a-zA-Z0-9]{20,}"
    - type: aws_key
      regex: "AKIA[0-9A-Z]{16}"
    - type: jwt
      regex: "eyJ[a-zA-Z0-9_-]*\\.[a-zA-Z0-9_-]*\\.[a-zA-Z0-9_-]*"
    - type: private_key
      regex: "-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"
  
  entropy_detection:
    enabled: true
    threshold: 4.5
    min_length: 16

# Audit logging
audit:
  log_all_tool_calls: true
  sign_receipts: true
  retention_days: 90
  export_format: jsonl
```

---

### Layer 5: Output Filtering

**Objective:** Prevent sensitive data from leaving the system.

```python
# security/output_filter.py
import re
from typing import Optional
from dataclasses import dataclass

@dataclass
class FilteredOutput:
    content: str
    redactions: list[dict]
    pii_detected: list[dict]
    watermark: Optional[str]

class OutputFilter:
    """Filter sensitive data from agent outputs."""
    
    SECRET_PATTERNS = {
        "api_key": r"(sk-|pk_|api[_-]?key)[a-zA-Z0-9]{20,}",
        "aws_access_key": r"AKIA[0-9A-Z]{16}",
        "aws_secret_key": r"[A-Za-z0-9/+=]{40}",
        "jwt": r"eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*",
        "private_key": r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
        "github_token": r"gh[pousr]_[A-Za-z0-9_]{36,}",
        "password_assignment": r"password\s*[=:]\s*['\"]?[^'\"\\s]{8,}['\"]?",
    }
    
    PII_PATTERNS = {
        "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
        "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
        "credit_card": r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
    }
    
    def __init__(self, customer_config: dict):
        self.config = customer_config
        self.redact_secrets = customer_config.get("redact_secrets", True)
        self.mask_pii = customer_config.get("mask_pii", True)
        self.add_watermark = customer_config.get("watermark", True)
    
    def filter(self, output: str, customer_id: str) -> FilteredOutput:
        """Apply all output filters."""
        redactions = []
        pii_detected = []
        filtered = output
        
        # Redact secrets
        if self.redact_secrets:
            for secret_type, pattern in self.SECRET_PATTERNS.items():
                matches = re.finditer(pattern, filtered)
                for match in matches:
                    redactions.append({
                        "type": secret_type,
                        "position": match.span(),
                        "preview": match.group()[:4] + "..." if len(match.group()) > 4 else "***"
                    })
                filtered = re.sub(pattern, f"[YOUR_SECRET:{secret_type.upper()}]", filtered)
        
        # Detect and optionally mask PII
        if self.mask_pii:
            for pii_type, pattern in self.PII_PATTERNS.items():
                matches = re.finditer(pattern, filtered)
                for match in matches:
                    pii_detected.append({
                        "type": pii_type,
                        "position": match.span(),
                    })
                filtered = re.sub(pattern, f"[{pii_type.upper()}]", filtered)
        
        # Add watermark for attribution
        watermark = None
        if self.add_watermark:
            watermark = self._generate_watermark(customer_id)
        
        return FilteredOutput(
            content=filtered,
            redactions=redactions,
            pii_detected=pii_detected,
            watermark=watermark
        )
    
    def _generate_watermark(self, customer_id: str) -> str:
        """Generate invisible watermark for attribution."""
        # Unicode zero-width character encoding
        import hashlib
        from datetime import datetime
        
        timestamp = datetime.utcnow().isoformat()
        payload = f"{customer_id}:{timestamp}"
        signature = hashlib.sha256(payload.encode()).hexdigest()[:16]
        
        return f"<!-- clawer:{signature} -->"
```

---

### Layer 6: Audit Trail

**Objective:** Maintain tamper-evident, compliance-ready logs.

```python
# audit/audit_logger.py
import json
import hashlib
from datetime import datetime
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

class AuditLogger:
    """Tamper-evident audit logging with signed receipts."""
    
    def __init__(self, private_key_path: str, log_path: str):
        self.log_path = log_path
        self._load_signing_key(private_key_path)
        self.previous_hash = self._get_last_hash()
    
    def log_tool_call(
        self,
        customer_id: str,
        session_id: str,
        tool_name: str,
        args: dict,
        result: str,
        allowed: bool,
        policy_version: str
    ) -> dict:
        """Log a tool call with signed receipt."""
        
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "customer_id": customer_id,
            "session_id": session_id,
            "event_type": "tool_call",
            "tool": tool_name,
            "args_hash": self._hash_data(args),
            "result_hash": self._hash_data(result),
            "allowed": allowed,
            "policy_version": policy_version,
            "previous_hash": self.previous_hash,
        }
        
        # Create chain hash
        entry["entry_hash"] = self._hash_data(entry)
        
        # Sign the entry
        entry["signature"] = self._sign_entry(entry)
        
        # Update chain
        self.previous_hash = entry["entry_hash"]
        
        # Write to log
        self._append_to_log(entry)
        
        return {
            "receipt_id": entry["entry_hash"][:16],
            "timestamp": entry["timestamp"],
            "signature": entry["signature"][:32] + "...",
        }
    
    def log_security_event(
        self,
        customer_id: str,
        event_type: str,
        severity: str,
        details: dict
    ) -> dict:
        """Log security-relevant events."""
        
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "customer_id": customer_id,
            "event_type": "security_event",
            "security_type": event_type,
            "severity": severity,
            "details": details,
            "previous_hash": self.previous_hash,
        }
        
        entry["entry_hash"] = self._hash_data(entry)
        entry["signature"] = self._sign_entry(entry)
        self.previous_hash = entry["entry_hash"]
        self._append_to_log(entry)
        
        return {"receipt_id": entry["entry_hash"][:16]}
    
    def export_for_compliance(
        self,
        customer_id: str,
        start_date: datetime,
        end_date: datetime,
        format: str = "jsonl"
    ) -> str:
        """Export audit logs for compliance review."""
        # Implementation for SOC2/GDPR compliance exports
        pass
    
    def verify_chain_integrity(self) -> bool:
        """Verify the audit log chain hasn't been tampered with."""
        # Walk the chain and verify each hash links correctly
        pass
```

---

## 3. Integration Plan

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Core security infrastructure in place.

| Task | Owner | Days | Dependencies |
|------|-------|------|--------------|
| Integrate ClawdStrike SDK into base container image | Platform | 3 | None |
| Deploy default strict policy to all containers | Security | 2 | SDK integration |
| Set up centralized audit logging (CloudWatch/Loki) | Platform | 2 | None |
| Implement signed receipt generation | Security | 2 | Audit logging |
| Create security event alerting pipeline | Security | 1 | Audit logging |

**Deliverables:**
- Container image with ClawdStrike v1.0
- Default policy deployed
- Audit logs flowing to central system
- PagerDuty alerts on critical security events

### Phase 2: Input Protection (Weeks 3-4)

**Goal:** Protect against prompt injection and abuse.

| Task | Owner | Days | Dependencies |
|------|-------|------|--------------|
| Deploy PromptGuard middleware to API gateway | Security | 3 | None |
| Integrate ML classifier for advanced detection | ML Team | 5 | PromptGuard |
| Implement prompt rate limiting | Platform | 2 | None |
| Add blocked action alerting | Security | 1 | PromptGuard |
| Customer notification for blocked prompts | Product | 2 | Alerting |

**Deliverables:**
- PromptGuard in production
- ML classifier with 95% precision target
- Rate limiting per customer tier
- Customer-visible "prompt blocked" messages

### Phase 3: Skill Security (Weeks 5-6)

**Goal:** Secure skill ecosystem.

| Task | Owner | Days | Dependencies |
|------|-------|------|--------------|
| Build skill vetting pipeline | Security | 4 | None |
| Create allowlist management in admin panel | Product | 3 | Vetting pipeline |
| Migrate existing customers to allowlist model | Platform | 2 | Admin panel |
| Customer-facing skill security dashboard | Product | 3 | Allowlist |
| Documentation for skill authors | Docs | 2 | All |

**Deliverables:**
- Automated skill vetting on submission
- Admin panel for allowlist management
- All customers on explicit allowlist
- Security dashboard in customer portal

---

## 4. Default Security Policies

### Standard Tier Policy

```yaml
# policies/tier-standard.yaml
version: "1.0"
tier: standard

paths:
  blocked:
    - "/root/**"
    - "/home/*/.ssh/**"
    - "**/.env*"
    - "**/secrets/**"
    - "**/*.pem"
    - "**/*.key"
  
  writable:
    - "/workspace/**"
    - "/tmp/**"

network:
  default: deny
  allowed_hosts:
    - "*.anthropic.com"
    - "*.openai.com"
    - "api.github.com"
    - "registry.npmjs.org"
    - "pypi.org"
  
  max_egress_per_hour: 1000

tools:
  blocked_commands:
    - "rm -rf"
    - "chmod 777"
    - "curl * | sh"
    - "wget * | sh"
  
  require_user_confirmation:
    - "git push"
    - "npm publish"

secrets:
  scan_outputs: true
  redact_on_detect: true
  alert_threshold: 3  # Alert after 3 detected secrets

jailbreak:
  mode: strict
  on_detection: block_and_log
  
rate_limits:
  prompts_per_minute: 20
  prompts_per_hour: 200
  max_prompt_length: 50000

audit:
  log_level: standard
  retention_days: 30
  signed_receipts: true
```

### Enterprise Tier Policy

```yaml
# policies/tier-enterprise.yaml
version: "1.0"
tier: enterprise

# Inherits from standard, with overrides
extends: tier-standard

network:
  allowed_hosts:
    - "*"  # Enterprise can customize
  max_egress_per_hour: 10000

rate_limits:
  prompts_per_minute: 100
  prompts_per_hour: 2000
  max_prompt_length: 200000

audit:
  log_level: verbose
  retention_days: 365
  signed_receipts: true
  compliance_exports: true

# Enterprise-only features
custom_policies:
  enabled: true
  require_approval: true

dedicated_support:
  enabled: true
  sla_response_minutes: 60
```

---

## 5. Admin Controls

### Per-Customer Configuration

```yaml
# Example customer configuration
customer:
  id: "cust_abc123"
  name: "Acme Corp"
  tier: "enterprise"
  
  security_overrides:
    # Additional allowed egress
    network:
      additional_allowed:
        - "internal.acme.com"
        - "api.acme-tools.io"
      
    # Custom blocked paths
    paths:
      additional_blocked:
        - "/workspace/confidential/**"
    
    # Stricter jailbreak policy
    jailbreak:
      mode: paranoid
      on_detection: block_terminate_alert
    
    # Custom skill allowlist
    skills:
      mode: explicit  # Only listed skills allowed
      allowed:
        - "openclaw/filesystem"
        - "openclaw/web-search"
        - "custom/acme-internal"
      blocked:
        - "*"  # Block all others
```

### Admin Panel Features

1. **Policy Editor**
   - Visual policy builder
   - Diff view for changes
   - Rollback capability
   - Policy testing sandbox

2. **Skill Management**
   - View allowed skills per customer
   - Add/remove skills
   - See skill security scores
   - Request skill vetting

3. **Security Dashboard**
   - Blocked actions (last 24h/7d/30d)
   - Detected threats
   - Jailbreak attempts
   - Secret exposure events

4. **Audit Log Viewer**
   - Searchable logs
   - Filter by severity/type
   - Export for compliance
   - Chain integrity verification

---

## 6. Security Monitoring

### Real-Time Alerting

```python
# monitoring/alerts.py
ALERT_RULES = [
    {
        "name": "high_jailbreak_rate",
        "condition": "jailbreak_attempts > 5 in 1h for customer",
        "severity": "high",
        "action": "page_security_oncall",
    },
    {
        "name": "secret_exposure",
        "condition": "secret_detected in output",
        "severity": "critical",
        "action": "immediate_notification",
    },
    {
        "name": "container_escape_attempt",
        "condition": "blocked_path in ['/proc', '/sys', '/dev']",
        "severity": "critical",
        "action": "terminate_container + page_security",
    },
    {
        "name": "unusual_egress",
        "condition": "egress_volume > 10x baseline",
        "severity": "medium",
        "action": "flag_for_review",
    },
    {
        "name": "repeated_prompt_injection",
        "condition": "injection_blocked > 3 in 10m for session",
        "severity": "medium",
        "action": "rate_limit_session",
    },
]
```

### Daily Security Digest

Automated report sent to security team:

- Total prompts processed
- Blocked injections (count + examples)
- Jailbreak attempts (count + trends)
- Secrets detected and redacted
- Policy violations by category
- New skills submitted for vetting
- Anomalies detected

### Incident Response Playbook

```markdown
## Incident Levels

### P1 - Critical (15min response)
- Confirmed data exfiltration
- Container escape
- Active attack in progress

### P2 - High (1hr response)
- Suspected data leak
- Repeated jailbreak success
- Unusual lateral movement

### P3 - Medium (4hr response)
- High volume blocked actions
- New attack pattern detected
- Customer security concern

### P4 - Low (24hr response)
- False positive investigation
- Policy tuning needed
- Documentation updates

## Response Steps

1. **Contain** - Terminate affected containers
2. **Assess** - Review audit logs for scope
3. **Notify** - Inform affected customers (if needed)
4. **Remediate** - Patch vulnerability, update policies
5. **Document** - Post-incident report
```

---

## 7. Compliance Features

### SOC2 Readiness

| Control | Implementation | Evidence |
|---------|----------------|----------|
| **CC6.1** Access controls | ClawdStrike path restrictions | Audit logs |
| **CC6.2** Logical access | Customer isolation, skill allowlist | Policy configs |
| **CC6.3** Access removal | Automatic on subscription end | Provisioning logs |
| **CC7.1** System monitoring | Real-time alerting | Alert history |
| **CC7.2** Anomaly detection | ML-based detection | Detection reports |
| **CC7.3** Vulnerability mgmt | Container scanning | Scan reports |

### GDPR Considerations

```yaml
gdpr_features:
  data_residency:
    available_regions:
      - eu-west-1      # Ireland
      - eu-central-1   # Frankfurt
    default: eu-west-1
  
  data_retention:
    audit_logs: 90_days  # Configurable to 30 for GDPR
    customer_data: until_deletion_request
    backups: 30_days
  
  data_subject_rights:
    export: true        # Customer can export all data
    deletion: true      # Full data deletion on request
    portability: true   # Standard format export
  
  processing_records:
    maintained: true
    location: "gdpr/processing-records/"
```

### Audit Log Retention

| Tier | Retention | Export Formats | Access |
|------|-----------|----------------|--------|
| Standard | 30 days | JSON, CSV | API |
| Professional | 90 days | JSON, CSV, SIEM | API + Console |
| Enterprise | 365 days | All + Custom | API + Console + Direct |

---

## 8. Premium Security Tier

### Enterprise Security Features

| Feature | Standard | Professional | Enterprise |
|---------|----------|--------------|------------|
| ClawdStrike Guards | ✓ | ✓ | ✓ |
| Signed Receipts | ✓ | ✓ | ✓ |
| PromptGuard | Basic | Full | Full + Custom |
| Skill Allowlist | Curated | Curated + Custom | Fully Custom |
| Audit Retention | 30 days | 90 days | 365 days |
| Custom Policies | ✗ | Limited | Full |
| Dedicated Reviews | ✗ | Quarterly | Monthly |
| Compliance Reports | ✗ | SOC2 | SOC2 + Custom |
| SLA Response | 24h | 4h | 1h |
| Security Hotline | ✗ | ✗ | ✓ |

### Enterprise-Only Features

1. **Custom Security Policies**
   - Work with security team to define policies
   - Custom egress rules for internal APIs
   - Stricter/looser controls as needed

2. **Dedicated Security Reviews**
   - Monthly review of security posture
   - Recommendations for improvement
   - Early access to new security features

3. **Compliance Package**
   - SOC2 Type II report
   - Custom compliance mappings (HIPAA, PCI, etc.)
   - Audit support and evidence provision

4. **Incident SLA**
   - 1-hour response for P1/P2
   - Dedicated security contact
   - Priority patching for security issues

---

## Appendix A: ClawdStrike API Reference

### Policy Definition

```python
from clawdstrike import Policy, PathRule, NetworkRule, ToolRule

policy = Policy(
    name="clawer-production",
    version="1.0.0",
    
    paths=PathRule(
        blocked=["/etc/shadow", "~/.ssh/**"],
        allowed=["/workspace/**", "/tmp/**"],
    ),
    
    network=NetworkRule(
        default="deny",
        allowed=["*.anthropic.com", "api.github.com"],
        blocked=["169.254.169.254"],
    ),
    
    tools=ToolRule(
        blocked=["shell:rm -rf /"],
        require_confirmation=["shell:git push --force"],
    ),
    
    jailbreak=JailbreakConfig(
        mode="strict",
        on_detection="block",
        ml_model="clawdstrike/jailbreak-v2",
    ),
)
```

### Guard Usage

```python
from clawdstrike import Guard

guard = Guard(policy=policy)

# Check tool call
result = guard.check_tool("shell", {"command": "ls -la"})
if result.allowed:
    # Execute
    pass
else:
    # Block and log
    logging.warning(f"Blocked: {result.reason}")

# Check output
output_result = guard.check_output(agent_output)
if output_result.secrets_detected:
    agent_output = output_result.redacted_output
```

### Receipt Verification

```python
from clawdstrike import Receipt

# Verify a receipt
receipt = Receipt.from_json(receipt_json)
is_valid = receipt.verify(public_key)

# Check receipt chain
chain = Receipt.load_chain(log_file)
chain_valid = chain.verify_integrity()
```

---

## Appendix B: Deployment Checklist

### Pre-Launch

- [ ] ClawdStrike SDK integrated in container image
- [ ] Default policy tested in staging
- [ ] Audit logging pipeline verified
- [ ] Alerting configured and tested
- [ ] PromptGuard deployed to API gateway
- [ ] Rate limiting configured
- [ ] Skill allowlist finalized
- [ ] Customer documentation complete

### Post-Launch (Week 1)

- [ ] Monitor blocked action rates
- [ ] Review false positive rates
- [ ] Tune ML classifiers based on real data
- [ ] Address customer feedback on blocked actions
- [ ] Verify audit log integrity

### Ongoing

- [ ] Weekly security digest review
- [ ] Monthly policy review
- [ ] Quarterly penetration testing
- [ ] Annual compliance audit

---

*Document Version: 1.0*  
*Last Updated: 2026-02-07*  
*Next Review: 2026-03-07*
