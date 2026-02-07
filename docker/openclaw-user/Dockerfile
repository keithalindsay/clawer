FROM node:22-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set HOME environment variable so OpenClaw finds config
ENV HOME=/home/user

# Create workspace directory
WORKDIR /home/user
RUN mkdir -p /home/user/clawd /home/user/.openclaw

# Copy and install OpenClaw from tarball
COPY openclaw-2026.2.1.tgz /tmp/
RUN npm install -g /tmp/openclaw-2026.2.1.tgz && rm /tmp/openclaw-2026.2.1.tgz

# Copy configuration files
COPY config-template.json /home/user/.openclaw/openclaw.json.template
COPY SOUL.md /home/user/clawd/SOUL.md
COPY api-server.js /usr/local/bin/api-server.js
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/api-server.js

# Set working directory
WORKDIR /home/user/clawd

# Expose OpenClaw gateway port and API server port
EXPOSE 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://localhost:8080/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Run entrypoint script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
