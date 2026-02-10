FROM node:22-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    curl \
    jq \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Set HOME environment variable so OpenClaw finds config
ENV HOME=/home/user

# Create workspace directory
WORKDIR /home/user
RUN mkdir -p /home/user/clawd /home/user/.openclaw

# Copy and install OpenClaw from tarball
COPY openclaw-2026.2.6-3.tgz /tmp/
RUN npm install -g /tmp/openclaw-2026.2.6-3.tgz && rm /tmp/openclaw-2026.2.6-3.tgz

# ===== ClawSec Security Skills Integration =====
# Copy checksum verification script
COPY verify_skill_checksums.sh /tmp/verify_skill_checksums.sh
RUN chmod +x /tmp/verify_skill_checksums.sh

# Create skills directory
RUN mkdir -p /home/user/.openclaw/skills

# Download and install soul-guardian v0.0.2
ARG SOUL_GUARDIAN_VERSION=0.0.2
RUN curl -fsSL "https://github.com/prompt-security/clawsec/releases/download/soul-guardian-v${SOUL_GUARDIAN_VERSION}/checksums.json" \
    -o /tmp/soul-guardian-checksums.json && \
    curl -fsSL "https://github.com/prompt-security/clawsec/releases/download/soul-guardian-v${SOUL_GUARDIAN_VERSION}/soul-guardian.skill" \
    -o /tmp/soul-guardian.skill && \
    /tmp/verify_skill_checksums.sh soul-guardian /tmp/soul-guardian-checksums.json /tmp/soul-guardian.skill && \
    unzip -q /tmp/soul-guardian.skill -d /home/user/.openclaw/skills/soul-guardian && \
    rm /tmp/soul-guardian.*

# Download and install clawsec-feed v0.0.4
ARG CLAWSEC_FEED_VERSION=0.0.4
RUN curl -fsSL "https://github.com/prompt-security/clawsec/releases/download/clawsec-feed-v${CLAWSEC_FEED_VERSION}/checksums.json" \
    -o /tmp/clawsec-feed-checksums.json && \
    curl -fsSL "https://github.com/prompt-security/clawsec/releases/download/clawsec-feed-v${CLAWSEC_FEED_VERSION}/clawsec-feed.skill" \
    -o /tmp/clawsec-feed.skill && \
    /tmp/verify_skill_checksums.sh clawsec-feed /tmp/clawsec-feed-checksums.json /tmp/clawsec-feed.skill && \
    unzip -q /tmp/clawsec-feed.skill -d /home/user/.openclaw/skills/clawsec-feed && \
    rm /tmp/clawsec-feed.*

# Download and install openclaw-audit-watchdog v0.0.4
ARG AUDIT_WATCHDOG_VERSION=0.0.4
RUN curl -fsSL "https://github.com/prompt-security/clawsec/releases/download/openclaw-audit-watchdog-v${AUDIT_WATCHDOG_VERSION}/checksums.json" \
    -o /tmp/audit-watchdog-checksums.json && \
    curl -fsSL "https://github.com/prompt-security/clawsec/releases/download/openclaw-audit-watchdog-v${AUDIT_WATCHDOG_VERSION}/openclaw-audit-watchdog.skill" \
    -o /tmp/audit-watchdog.skill && \
    /tmp/verify_skill_checksums.sh openclaw-audit-watchdog /tmp/audit-watchdog-checksums.json /tmp/audit-watchdog.skill && \
    unzip -q /tmp/audit-watchdog.skill -d /home/user/.openclaw/skills/openclaw-audit-watchdog && \
    rm /tmp/audit-watchdog.*

# Create soul-guardian state directory (outside workspace for tamper resistance)
RUN mkdir -p /var/lib/openclaw/soul-guardian

# Set ClawSec environment variables
ENV CLAWSEC_FEED_URL="https://raw.githubusercontent.com/prompt-security/clawsec/main/advisories/feed.json"
ENV SOUL_GUARDIAN_STATE_DIR="/var/lib/openclaw/soul-guardian"

# Cleanup verification script
RUN rm /tmp/verify_skill_checksums.sh
# ===== End ClawSec Integration =====

# Copy configuration files
COPY config-template.json /home/user/.openclaw/openclaw.json.template
COPY SOUL.md /home/user/clawd/SOUL.md
COPY api-server.js /usr/local/bin/api-server.js
# Copy AI team templates
COPY teams/ /opt/teams/

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY init_clawsec.sh /usr/local/bin/init_clawsec.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/api-server.js /usr/local/bin/init_clawsec.sh

# Set working directory
WORKDIR /home/user/clawd

# Expose OpenClaw gateway port and API server port
EXPOSE 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://localhost:8080/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
