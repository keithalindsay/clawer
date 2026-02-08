# CLAWER Bot Engine

Core bot execution engine for the CLAWER.AI platform.

## Architecture Overview

```
src/lib/bot-engine/
├── types.ts              # Core type definitions
├── model-router.ts       # Routes requests to appropriate LLM by tier
├── executor.ts           # Main execution engine
├── tool-sandbox.ts       # Tool execution and validation
├── index.ts              # Main export file
├── bots/
│   ├── email-assistant.ts    # Email bot definition
│   ├── calendar-manager.ts   # Calendar bot definition
│   └── index.ts              # Bot registry
└── models/
    ├── ollama.ts         # Ollama client (free tier - Qwen3)
    ├── kimi.ts           # Kimi API client (basic tier)
    ├── anthropic.ts      # Anthropic client (pro/enterprise - Claude)
    └── index.ts          # Unified model interface
```

## Key Components

### 1. **Types** (`types.ts`)
Core TypeScript interfaces for the bot engine:
- `BotDefinition` - Bot configuration
- `BotConstraints` - Rate limits and permissions
- `ExecutionContext` - User session context
- `ModelRequest/Response` - Model interaction types
- `ToolDefinition` - Tool specifications

### 2. **Model Router** (`model-router.ts`)
Routes requests to the correct LLM based on user tier:
- **Free** → Ollama (Qwen3) - Local, zero cost
- **Basic** → Kimi API - Low cost, good quality
- **Pro** → Claude Sonnet - High quality, tool use
- **Enterprise** → Claude Opus - Best quality, unlimited

### 3. **Executor** (`executor.ts`)
Main execution engine that:
- Checks rate limits
- Prepares model requests
- Executes tool calls
- Logs usage for billing
- Returns responses

### 4. **Tool Sandbox** (`tool-sandbox.ts`)
Validates and executes tools safely:
- Validates tool arguments
- Enforces timeouts (30s default)
- Checks allowed tools per bot
- Returns mock data in MVP (stubbed integrations)

### 5. **Bot Definitions** (`bots/`)
Pre-configured bot types:
- **Email Assistant** - Gmail management
- **Calendar Manager** - Google Calendar integration

### 6. **Model Clients** (`models/`)
Provider-specific clients with fallback to mock responses:
- **Ollama** - Local Qwen3 for free tier
- **Kimi** - Moonshot API (stubbed for MVP)
- **Anthropic** - Claude for premium tiers

## Usage Example

```typescript
import { botExecutor, getBotDefinition, ExecutionContext } from '@/lib/bot-engine';

// Get bot definition
const emailBot = getBotDefinition('email-assistant');

// Create execution context
const context: ExecutionContext = {
  userId: 'user_123',
  botId: 'email-assistant',
  tier: 'pro',
  conversationHistory: [],
};

// Execute bot interaction
const result = await botExecutor.execute(
  'Search for emails from my boss',
  context,
  emailBot!
);

if (result.success) {
  console.log('Response:', result.response);
  console.log('Usage:', result.usage);
} else {
  console.error('Error:', result.error);
}
```

## Tier-Based Model Routing

| Tier       | Model           | Provider   | Cost/1K Tokens (I/O) |
|------------|----------------|------------|----------------------|
| Free       | Qwen3 14B      | Ollama     | $0 / $0              |
| Basic      | Kimi 8K        | Moonshot   | $0.001 / $0.002      |
| Pro        | Claude Sonnet  | Anthropic  | $0.003 / $0.015      |
| Enterprise | Claude Opus    | Anthropic  | $0.015 / $0.075      |

## Rate Limits

| Tier       | Requests/Day | Concurrent Bots |
|------------|-------------|-----------------|
| Free       | 100         | 2               |
| Basic      | 500         | 5               |
| Pro        | 2,000       | 10              |
| Enterprise | Unlimited   | Unlimited       |

## Bot Definitions

Each bot has:
- **System Prompt** - Instructions for the AI
- **Tools** - Available functions (search, send email, etc.)
- **Constraints** - Token limits, rate limits, required confirmations
- **Allowed Integrations** - Which OAuth apps it can access

## Tool Execution

Tools are executed in a sandbox with:
- ✅ Argument validation
- ✅ Timeout enforcement (30s)
- ✅ Permission checking
- ✅ Mock responses (for MVP, before real integrations)

### Available Tools

**Email Tools:**
- `gmail_search` - Search emails
- `gmail_read` - Read email content
- `gmail_send` - Send email (requires confirmation)

**Calendar Tools:**
- `calendar_list` - List events
- `calendar_create` - Create event (requires confirmation)

## Testing

Run the demo script:
```bash
npx tsx src/lib/bot-engine/demo.ts
```

This will:
- List available bots
- Test email assistant
- Test calendar manager
- Show model routing
- Display available tools

## Environment Variables

```env
# Ollama (Free tier)
OLLAMA_HOST=http://localhost:11434

# Kimi API (Basic tier)
KIMI_API_KEY=your_kimi_key

# Anthropic (Pro/Enterprise)
ANTHROPIC_API_KEY=your_anthropic_key
```

## MVP Status

✅ **Complete:**
- Core types defined
- Model router with tier-based selection
- Bot executor with rate limiting
- Tool sandbox with validation
- Email and Calendar bot definitions
- All three model clients (with mock fallbacks)
- Bot registry and tier access control

🚧 **Stubbed (Post-MVP):**
- Real OAuth integration connections
- Database persistence for usage logs
- Redis for distributed rate limiting
- Container-based bot isolation
- Real-time streaming responses

## Next Steps

1. **Integration Proxy** - Connect OAuth apps (Gmail, Calendar)
2. **Database Layer** - Persist bots, conversations, usage
3. **API Routes** - Expose bot execution via Next.js API
4. **UI Components** - Chat interface for bot interactions
5. **Billing** - Usage tracking and tier enforcement

## Architecture Decisions

- **Mocked LLM OK**: All model clients return mock responses when APIs unavailable
- **Tool calls stubbed**: Tools return realistic mock data until integrations ready
- **In-memory rate limits**: Using Map instead of Redis for MVP
- **No streaming**: Simple request/response for MVP (streaming in v2)
- **Tier enforcement**: Model router selects appropriate model automatically

---

**Built by:** Engineer 4  
**Date:** 2026-02-06  
**Status:** ✅ Ready for integration
