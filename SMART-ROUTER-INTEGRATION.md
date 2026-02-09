# Smart Router Integration - Complete ✅

## Overview
The Smart Router has been successfully integrated into the Clawer.ai chat flow. All messages are now classified into complexity tiers (SIMPLE/MEDIUM/COMPLEX/REASONING) before being processed.

## Changes Made

### 1. Chat API Route (`src/app/api/chat/route.ts`)
- ✅ Imported `routeRequest` from `@/lib/router`
- ✅ Classify every message before sending to container
- ✅ Build system prompt from bot settings for better classification
- ✅ Pass routing metadata (model, tier, confidence) to container
- ✅ Include routing metadata in API response

**Routing Flow:**
```typescript
const routing = routeRequest({
  prompt: message,
  systemPrompt,
  userOrchestratorModel: 'openai/gpt-4o-mini',
  userWorkerModel: 'openai/gpt-4o-mini',
});

// Pass to container
containerApi.chat(port, message, context, {
  ...botSettings,
  model: routing.model,
  tier: routing.tier,
  confidence: routing.confidence,
});

// Return with metadata
return NextResponse.json({
  content: result.data?.content,
  routing: {
    tier: routing.tier,
    model: routing.model,
    confidence: routing.confidence,
  },
});
```

### 2. Container Client (`src/lib/container-client.ts`)
- ✅ Updated chat method signature to accept routing params
- ✅ Added `model`, `tier`, `confidence` to settings interface
- ✅ Passes routing metadata through to container API

### 3. Container API Server (`docker/openclaw-user/api-server.js`)
- ✅ Extracts routing info from settings param
- ✅ Logs routing decisions for debugging
- ✅ Passes `model` override to gateway's chat.send call
- ✅ Returns routing metadata in response

**Model Override:**
```javascript
const chatParams = {
  message: fullMessage,
  sessionKey: sessionKey,
  idempotencyKey: idempotencyKey,
  timeoutMs: 60000
};

// Add model override if provided by smart router
if (routingModel) {
  chatParams.model = routingModel;
}

const chatResult = await gatewayRequest('chat.send', chatParams);
```

### 4. Chat UI (`src/app/chat/[botId]/page.tsx`)
- ✅ Extended Message interface with optional `routing` field
- ✅ Added `getTierBadge()` helper function
- ✅ Capture routing metadata from API response
- ✅ Display tier badges on assistant messages

**Tier Badges:**
- ⚡ SIMPLE (green) - Fast, straightforward queries
- 🔧 MEDIUM (blue) - Moderate complexity
- 🧠 COMPLEX (purple) - Multi-step reasoning
- 🎯 REASONING (orange) - Deep analysis needed

**Badge displays:**
- Tier emoji + label
- Hover shows: model name + confidence percentage
- Positioned above message content

## Current Configuration

**Models:**
- Both orchestrator and worker use `openai/gpt-4o-mini` for now
- Router classifies tier but routes to same model
- Future: Can easily swap in different models per tier

**Available Models in Container:**
- `openai/gpt-4o-mini` (worker)
- `gemini/gemini-2.0-flash` (worker)

## Testing

### Direct Container API Test:
```bash
ssh root@YOUR_DOCKER_HOST "curl -s -X POST http://localhost:4010/api/chat \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_GATEWAY_TOKEN' \
  -d '{\"message\":\"What is 2+2?\",\"settings\":{\"tier\":\"SIMPLE\",\"model\":\"openai/gpt-4o-mini\",\"confidence\":0.95}}'"
```

**Expected Response:**
```json
{
  "content": "The answer to 2 + 2 is 4.",
  "routing": {
    "tier": "SIMPLE",
    "model": "openai/gpt-4o-mini",
    "confidence": 0.95
  }
}
```

### Full Flow Test (via Next.js UI):
1. Log into Clawer.ai dashboard
2. Open chat with any bot
3. Send a message (e.g., "What is 2+2?")
4. Observe tier badge on assistant response
5. Hover over badge to see model + confidence

### Server Logs:
```bash
# Check routing decisions
ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --lines 100 | grep -A 3 'Smart routing'"

# Example output:
# [chat] Smart routing decision: {
#   tier: 'SIMPLE',
#   model: 'openai/gpt-4o-mini',
#   confidence: 0.92,
#   signals: [ 'direct_answer', 'short_prompt', 'calculation' ]
# }
```

## Deployment

**Deploy command:**
```bash
cd /home/keith/projects/clawer && bash deploy.sh
```

**Manual sync (faster for iterating):**
```bash
# Sync specific files
rsync -avz src/app/api/chat/route.ts root@YOUR_DOCKER_HOST:/opt/clawer/src/app/api/chat/
rsync -avz docker/openclaw-user/api-server.js root@YOUR_DOCKER_HOST:/opt/clawer/docker/openclaw-user/

# Restart
ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && pm2 restart clawer"
```

**Container updates:**
Containers pick up the updated api-server.js from the shared volume on next restart.

## Future Enhancements

### 1. Multi-Model Routing
Currently all tiers use the same model. To enable true tier-based routing:

```typescript
// In chat API route
const routing = routeRequest({
  prompt: message,
  systemPrompt,
  userOrchestratorModel: 'openai/gpt-4o',      // Complex/Reasoning
  userWorkerModel: 'openai/gpt-4o-mini',       // Simple/Medium
});
```

### 2. Cost Tracking
Add cost accumulation based on routing decisions:
- Log each routing decision with estimated cost
- Track savings vs always using orchestrator model
- Display in user dashboard

### 3. Tier Override
Allow users to force a specific tier:
```typescript
// In chat UI
<select onChange={(e) => setForceTier(e.target.value)}>
  <option value="">Auto</option>
  <option value="SIMPLE">Force SIMPLE</option>
  <option value="COMPLEX">Force COMPLEX</option>
</select>
```

### 4. Analytics
- Track tier distribution per user/bot
- A/B test different routing configs
- Identify patterns in misclassifications

### 5. Streaming with Tiers
When streaming is enabled, show tier badge immediately:
```typescript
// Show tier badge while streaming
<TierBadge tier={routing.tier} streaming={true} />
<StreamingMessage content={streamedContent} />
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User sends message via UI                                    │
│ src/app/chat/[botId]/page.tsx                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Next.js Chat API                                             │
│ src/app/api/chat/route.ts                                   │
│  1. Authenticate user                                        │
│  2. Check container status                                   │
│  3. Build system prompt from bot settings                    │
│  4. 🎯 CALL SMART ROUTER (routeRequest)                     │
│     - Classify prompt into tier                              │
│     - Select model based on tier                             │
│     - Return confidence score                                │
│  5. Pass routing to container                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Container API Server                                         │
│ docker/openclaw-user/api-server.js                          │
│  1. Extract routing params (model, tier, confidence)         │
│  2. Build personalized system prompt                         │
│  3. Call gateway's chat.send with model override             │
│  4. Return response + routing metadata                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ OpenClaw Gateway                                             │
│  1. Process message with specified model                     │
│  2. Generate response                                        │
│  3. Return content                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ UI displays response with tier badge                         │
│  ⚡ SIMPLE | 🔧 MEDIUM | 🧠 COMPLEX | 🎯 REASONING          │
│  Hover: "Model: gpt-4o-mini | Confidence: 92%"              │
└─────────────────────────────────────────────────────────────┘
```

## Verification Checklist

- [x] Router successfully classifies prompts into tiers
- [x] Chat API passes routing metadata to container
- [x] Container API passes model override to gateway
- [x] Response includes routing metadata
- [x] UI displays tier badges on assistant messages
- [x] Tier badge hover shows model + confidence
- [x] Console logs show routing decisions
- [x] Existing chat functionality unchanged
- [x] Error handling preserved
- [x] Code deployed to production server

## Success Metrics

Monitor these in production:
1. **Classification accuracy** - Are tiers appropriate for prompts?
2. **User engagement** - Do users interact with tier badges?
3. **Cost savings** - Once different models per tier enabled
4. **Response quality** - No degradation from routing

## Notes

- All routing currently uses `gpt-4o-mini` (both orchestrator and worker)
- Tier classification is working and visible in logs
- UI tier badges ready to display different models when configured
- Easy to swap in different models per tier in the future
- No breaking changes to existing functionality
