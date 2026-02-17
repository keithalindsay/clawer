FROM node:22-slim

RUN apt-get update && apt-get install -y \
    python3 make g++ git curl jq unzip \
    && rm -rf /var/lib/apt/lists/*

ENV HOME=/home/user
WORKDIR /home/user
RUN mkdir -p /home/user/clawd /home/user/.openclaw /home/user/.openclaw/skills \
    /var/lib/openclaw/soul-guardian

# Install OpenClaw v2026.2.16
COPY openclaw-2026.2.16.tgz /tmp/
RUN npm install -g /tmp/openclaw-2026.2.16.tgz && rm /tmp/openclaw-2026.2.16.tgz

# Copy files
COPY config-template.json /home/user/.openclaw/openclaw.json.template
COPY SOUL.md /home/user/clawd/SOUL.md
COPY api-server.js /usr/local/bin/api-server.js
COPY teams/ /opt/teams/
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY init_clawsec.sh /usr/local/bin/init_clawsec.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/api-server.js /usr/local/bin/init_clawsec.sh

WORKDIR /home/user/clawd
EXPOSE 8080 8081

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://localhost:8081/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
