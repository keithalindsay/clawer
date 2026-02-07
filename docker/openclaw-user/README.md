# OpenClaw User Container

Docker image for clawer.ai user containers running OpenClaw with Moonshot/Kimi.

## Quick Start

### Build

```bash
docker build -t clawer-openclaw:latest .
```

### Run

```bash
docker run -d \
  --name clawer-user-test \
  -p 4001:8080 \
  -e MOONSHOT_API_KEY="your-api-key" \
  -e USER_ID="test-123" \
  --memory=512m \
  --cpus=0.5 \
  clawer-openclaw:latest
```

### Health Check

```bash
curl http://localhost:4001/health
```

### View Logs

```bash
docker logs -f clawer-user-test
```

## Files

- **Dockerfile** - Image definition
- **config-template.json** - OpenClaw config (Moonshot provider)
- **entrypoint.sh** - Startup script (substitutes API key)
- **SOUL.md** - Assistant personality
- **openclaw-2026.2.1.tgz** - OpenClaw npm package

## Environment Variables

- `MOONSHOT_API_KEY` (required) - Moonshot API key
- `USER_ID` (optional) - User ID for logging

## Ports

- **8080** - OpenClaw gateway (map to host port)

## Resources

- **Memory:** 512MB (recommended)
- **CPU:** 0.5 cores (recommended)

## Documentation

See **DOCKER-BUILD-COMPLETE.md** for full details.
