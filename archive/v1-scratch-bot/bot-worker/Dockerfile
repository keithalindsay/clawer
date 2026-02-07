FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json .

# Install dependencies
RUN npm install

# Copy worker script
COPY worker.js .

# Expose container port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

CMD ["node", "worker.js"]
