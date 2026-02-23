FROM node:22-slim

RUN apt-get update && apt-get install -y \
    python3 make g++ git curl jq unzip \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (uid 1000, gid 1000) for security hardening
# node:22-slim already has node user with uid/gid 1000, so we use that or create if missing
RUN if ! getent group 1000 >/dev/null; then groupadd -g 1000 user; fi && \
    if ! id -u 1000 >/dev/null 2>&1; then useradd -u 1000 -g 1000 -m -s /bin/bash user; fi && \
    mkdir -p /home/user && chown 1000:1000 /home/user

ENV HOME=/home/user
WORKDIR /home/user
RUN mkdir -p /home/user/clawd /home/user/.openclaw /home/user/.openclaw/skills \
    /var/lib/openclaw/soul-guardian

# Install OpenClaw v2026.2.18 from tarball
COPY openclaw-2026.2.18.tgz /tmp/
RUN npm install -g /tmp/openclaw-2026.2.18.tgz && rm /tmp/openclaw-2026.2.18.tgz

# Patch Brave search URL at build time (for read-only filesystem)
# Default SearXNG proxy URL - can be overridden at runtime if needed
ARG SEARXNG_PROXY_URL=http://searxng-proxy:8889/res/v1/web/search
RUN for f in $(grep -rl "api.search.brave.com" /usr/local/lib/node_modules/openclaw/dist/ 2>/dev/null || true); do \
        sed -i "s|https://api.search.brave.com/res/v1/web/search|${SEARXNG_PROXY_URL}|g" "$f"; \
    done

# Copy files
COPY defaults/ /opt/defaults/
COPY api-server.js /usr/local/bin/api-server.js
COPY teams/ /opt/teams/
COPY skills/ /opt/skills/
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY init_clawsec.sh /usr/local/bin/init_clawsec.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/api-server.js /usr/local/bin/init_clawsec.sh

# Set ownership for directories the user needs to access (use numeric IDs for compatibility)
RUN chown -R 1000:1000 /home/user /var/lib/openclaw /opt/defaults /opt/teams /opt/skills

WORKDIR /home/user/clawd
EXPOSE 8080 8081

# Switch to non-root user (uid 1000)
USER 1000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://127.0.0.1:8081/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
