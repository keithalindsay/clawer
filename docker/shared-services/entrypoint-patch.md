# entrypoint.sh Patch for Shared Services

This document shows the exact changes needed to `docker/openclaw-user/entrypoint.sh` 
to configure user containers to use shared services (SearXNG proxy + Ollama).

---

## Context

The current entrypoint.sh already:
- Patches OpenClaw's Brave Search URL to use `SEARXNG_PROXY_URL` (defaults to `http://172.17.0.1:8889`)
- Builds `openclaw.json` from env vars at container startup

Once containers join the `clawer_shared` Docker network, they can reach services 
by DNS name (`searxng-proxy`, `ollama`) instead of host IP (`172.17.0.1`).

---

## Change 1: SearXNG Proxy URL (Default Value)

Update the default `SEARXNG_PROXY_URL` from the host IP to Docker DNS name.

```diff
-SEARXNG_PROXY_URL="${SEARXNG_PROXY_URL:-http://172.17.0.1:8889/res/v1/web/search}"
+SEARXNG_PROXY_URL="${SEARXNG_PROXY_URL:-http://searxng-proxy:8889/res/v1/web/search}"
```

**Why:** When containers are on the `clawer_shared` network, Docker DNS resolves 
`searxng-proxy` to the correct container IP. No hardcoded IPs needed.

**Fallback:** If the container is NOT on the shared network (e.g., old containers 
that haven't been migrated), set `SEARXNG_PROXY_URL=http://172.17.0.1:8889/res/v1/web/search` 
as an env var at provisioning time. The default only kicks in if the env var isn't set.

---

## Change 2: Heartbeat Model (Ollama Override)

Add heartbeat model config to the `openclaw.json` generation block.

The `heartbeat.model` key in openclaw config tells OpenClaw to use a different 
model for heartbeat checks instead of the primary model (MiniMax).

**Locate this section in entrypoint.sh:**
```bash
# Generate config file
cat > /home/user/.openclaw/openclaw.json << EOF
{
  "models": {"providers": {${PROVIDERS}}},
  "agents": {"defaults": {"model": {"primary": "${PRIMARY}", "fallbacks": [${FALLBACKS}]}, "workspace": "/home/user/clawd"${MEMORY_SEARCH_CONFIG}}},
  "gateway": {"port": 8080, "mode": "local", "auth": {"token": "${GATEWAY_TOKEN}"}, "controlUi": {"allowInsecureAuth": true, "dangerouslyDisableDeviceAuth": true}},
  "plugins": {"entries": {"whatsapp": {"enabled": true}, "telegram": {"enabled": true}}},
  "tools": {"web": {"search": {"enabled": true, "apiKey": "searxng-local-proxy"}, "fetch": {"enabled": true}}},
  "channels": {"whatsapp": {"dmPolicy": "open", "allowFrom": ["*"]}}
}
EOF
```

**Replace with (adds ollama provider + heartbeat config):**

First, add this block BEFORE the `cat > .../openclaw.json` section:
```bash
# Shared services config (Ollama for heartbeats + embeddings)
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://ollama:11434}"
HEARTBEAT_MODEL="${HEARTBEAT_MODEL:-ollama/qwen2.5:3b}"

# Build Ollama provider for heartbeats
OLLAMA_PROVIDER="\"ollama\":{\"baseUrl\":\"${OLLAMA_BASE_URL}\",\"api\":\"ollama\",\"models\":[{\"id\":\"qwen2.5:3b\",\"name\":\"Qwen3 3B (local)\",\"reasoning\":false,\"input\":[\"text\"],\"cost\":{\"input\":0,\"output\":0},\"contextWindow\":32768,\"maxTokens\":4096}]}"

# Add ollama to providers
PROVIDERS="${PROVIDERS},${OLLAMA_PROVIDER}"

# Build embedding config using Ollama's nomic-embed-text
# (Falls back to remote OpenAI/Gemini embedding if OLLAMA_BASE_URL not set)
if [ -n "$OLLAMA_BASE_URL" ] && [ -z "$MEMORY_SEARCH_CONFIG" ]; then
  # No remote embedding key — use Ollama local embeddings
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"ollama\",\"remote\":{\"baseUrl\":\"${OLLAMA_BASE_URL}\",\"model\":\"nomic-embed-text\"}}"
  echo "Memory search configured with local Ollama embeddings (nomic-embed-text)"
fi
```

Then update the `openclaw.json` generation to include heartbeat + ollama:
```diff
 cat > /home/user/.openclaw/openclaw.json << EOF
 {
   "models": {"providers": {${PROVIDERS}}},
   "agents": {"defaults": {"model": {"primary": "${PRIMARY}", "fallbacks": [${FALLBACKS}]}, "workspace": "/home/user/clawd"${MEMORY_SEARCH_CONFIG}}},
-  "gateway": {"port": 8080, "mode": "local", "auth": {"token": "${GATEWAY_TOKEN}"}, "controlUi": {"allowInsecureAuth": true, "dangerouslyDisableDeviceAuth": true}},
+  "gateway": {"port": 8080, "mode": "local", "auth": {"token": "${GATEWAY_TOKEN}"}, "controlUi": {"allowInsecureAuth": true, "dangerouslyDisableDeviceAuth": true}, "heartbeat": {"model": "${HEARTBEAT_MODEL}"}},
   "plugins": {"entries": {"whatsapp": {"enabled": true}, "telegram": {"enabled": true}}},
   "tools": {"web": {"search": {"enabled": true, "apiKey": "searxng-local-proxy"}, "fetch": {"enabled": true}}},
   "channels": {"whatsapp": {"dmPolicy": "open", "allowFrom": ["*"]}}
 }
 EOF
```

---

## Change 3: Embeddings via Ollama (Optional but Recommended)

The `MEMORY_SEARCH_CONFIG` block already handles this if no remote provider is configured.
If `OPENAI_API_KEY` is present, it'll still prefer OpenAI embeddings (higher quality).
This is fine — when you remove OpenAI keys from new users, they'll get Ollama embeddings automatically.

**To force Ollama embeddings even when OpenAI key is present:**
```bash
# Add this env var to docker run in provisioner.ts:
-e FORCE_LOCAL_EMBEDDINGS=1
```

And in entrypoint.sh:
```bash
if [ -n "$OLLAMA_BASE_URL" ] && { [ -z "$MEMORY_SEARCH_CONFIG" ] || [ -n "$FORCE_LOCAL_EMBEDDINGS" ]; }; then
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"ollama\",\"remote\":{\"baseUrl\":\"${OLLAMA_BASE_URL}\",\"model\":\"nomic-embed-text\"}}"
fi
```

---

## Complete Updated entrypoint.sh Sections

Here's the full updated version of the relevant sections (copy-pasteable):

```bash
# ─── Shared Services (Ollama) ──────────────────────────────────────────────

OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://ollama:11434}"
HEARTBEAT_MODEL="${HEARTBEAT_MODEL:-ollama/qwen2.5:3b}"

# Add Ollama as a provider for heartbeats and local inference
OLLAMA_PROVIDER="\"ollama\":{\"baseUrl\":\"${OLLAMA_BASE_URL}\",\"api\":\"ollama\",\"models\":[{\"id\":\"qwen2.5:3b\",\"name\":\"Qwen3 3B (local)\",\"reasoning\":false,\"input\":[\"text\"],\"cost\":{\"input\":0,\"output\":0},\"contextWindow\":32768,\"maxTokens\":4096}]}"
[ -n "$PROVIDERS" ] && PROVIDERS="${PROVIDERS},"
PROVIDERS="${PROVIDERS}${OLLAMA_PROVIDER}"

# ─── Embeddings ────────────────────────────────────────────────────────────

# Build memory search config
# Priority: OpenAI (best quality) > Ollama local (free) > disabled
MEMORY_SEARCH_CONFIG=""
if [ -n "$OPENAI_KEY" ]; then
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"openai\",\"remote\":{\"apiKey\":\"${OPENAI_KEY}\"}}"
  echo "Memory search configured with provider: openai"
elif [ -n "$GEMINI_KEY" ]; then
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"gemini\",\"remote\":{\"apiKey\":\"${GEMINI_KEY}\"}}"
  echo "Memory search configured with provider: gemini"
elif [ -n "$OLLAMA_BASE_URL" ]; then
  MEMORY_SEARCH_CONFIG=", \"memorySearch\":{\"enabled\":true,\"provider\":\"ollama\",\"remote\":{\"baseUrl\":\"${OLLAMA_BASE_URL}\",\"model\":\"nomic-embed-text\"}}"
  echo "Memory search configured with local Ollama embeddings"
else
  echo "WARNING: No embedding provider available — memory_search will be disabled"
fi

# ─── Generate openclaw.json ────────────────────────────────────────────────

cat > /home/user/.openclaw/openclaw.json << EOF
{
  "models": {"providers": {${PROVIDERS}}},
  "agents": {"defaults": {"model": {"primary": "${PRIMARY}", "fallbacks": [${FALLBACKS}]}, "workspace": "/home/user/clawd"${MEMORY_SEARCH_CONFIG}}},
  "gateway": {"port": 8080, "mode": "local", "auth": {"token": "${GATEWAY_TOKEN}"}, "controlUi": {"allowInsecureAuth": true, "dangerouslyDisableDeviceAuth": true}, "heartbeat": {"model": "${HEARTBEAT_MODEL}"}},
  "plugins": {"entries": {"whatsapp": {"enabled": true}, "telegram": {"enabled": true}}},
  "tools": {"web": {"search": {"enabled": true, "apiKey": "searxng-local-proxy"}, "fetch": {"enabled": true}}},
  "channels": {"whatsapp": {"dmPolicy": "open", "allowFrom": ["*"]}}
}
EOF

# ─── SearXNG Proxy URL ────────────────────────────────────────────────────

# Default uses Docker DNS name (works when container is on clawer_shared network)
# Override via env var for containers NOT on the shared network:
#   -e SEARXNG_PROXY_URL=http://172.17.0.1:8889/res/v1/web/search
SEARXNG_PROXY_URL="${SEARXNG_PROXY_URL:-http://searxng-proxy:8889/res/v1/web/search}"
for f in $(grep -rl "api.search.brave.com" /usr/local/lib/node_modules/openclaw/dist/ 2>/dev/null); do
    sed -i "s|https://api.search.brave.com/res/v1/web/search|${SEARXNG_PROXY_URL}|g" "$f"
done
export BRAVE_API_KEY="${BRAVE_API_KEY:-searxng-local-proxy}"
```

---

## Changes to provisioner.ts

In `src/lib/provisioner.ts`, add these to the `dockerCmd` array:

```typescript
// Network — join shared services network for DNS-based service discovery
'--network clawer_shared',

// Env vars for shared services (can be overridden per-deploy if needed)
'-e OLLAMA_BASE_URL=http://ollama:11434',
'-e HEARTBEAT_MODEL=ollama/qwen2.5:3b',
// SEARXNG_PROXY_URL defaults to Docker DNS in entrypoint — no need to set explicitly
```

---

## Migration for Existing Containers

Existing containers (provisioned before this change) are on the default bridge network 
and don't have Docker DNS access to `clawer_shared` services. Two options:

**Option A: Connect existing containers to the shared network (no restart needed)**
```bash
# Run on server:
for container in $(docker ps --filter "name=clawer_" --format "{{.Names}}"); do
  docker network connect clawer_shared "$container" && echo "Connected: $container"
done
```

After this, `searxng-proxy` and `ollama` are reachable by DNS inside existing containers.
BUT: `openclaw.json` still has the old URL. Force a config regen by restarting:
```bash
docker restart <container_name>
```

**Option B: Set env vars at connect time (if you don't want to rebuild the image yet)**
```bash
# The entrypoint reads SEARXNG_PROXY_URL from env on restart.
# Connect + restart regenerates the config with Docker DNS URLs.
docker network connect clawer_shared clawer_free_tier
docker restart clawer_free_tier
```

**The cleanest path:** Build the updated image, then do a rolling restart of all 
containers. Each restart picks up the new entrypoint defaults.

---

## Verification

After deploying, test from inside a user container:

```bash
# Enter a container
docker exec -it clawer_free_tier bash

# Test SearXNG proxy (should return JSON with search results)
curl "http://searxng-proxy:8889/res/v1/web/search?q=clawer+ai"

# Test Ollama API (should return version JSON)
curl http://ollama:11434/api/version

# Test heartbeat model (should generate a response)
curl http://ollama:11434/api/generate \
  -d '{"model":"qwen2.5:3b","prompt":"Say OK","stream":false}' \
  -H "Content-Type: application/json"

# Check openclaw.json has correct values
cat /home/user/.openclaw/openclaw.json | python3 -m json.tool | grep -E "heartbeat|searxng|ollama"
```
