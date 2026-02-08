# Model Selection & Dynamic Pricing Specification

**Version:** 1.0  
**Created:** 2026-02-07  
**Status:** Draft  
**Depends on:** HYBRID-ORCHESTRATOR-SPEC.md

## Overview

Allow users to customize their AI configuration by selecting from curated model options for both the orchestrator (main brain) and worker models. Price is calculated dynamically based on their selections, creating a transparent "pay for what you need" experience.

## Value Proposition

| User Type | Behavior | Outcome |
|-----------|----------|---------|
| **Budget-conscious** | Picks cheapest options | Lower price, you keep margins |
| **Power user** | Picks premium brain | Pays more, gets more |
| **Technical user** | Optimizes mix | Feels in control, sticky |

## Model Tiers

### Orchestrator Models (Main Brain)

The orchestrator handles intent understanding, task decomposition, and response synthesis.

| Tier | Model | Input/1M | Output/1M | Monthly Add-on | Quality |
|------|-------|----------|-----------|----------------|---------|
| **Premium** | GPT-4o | $2.50 | $10.00 | +$35/mo | ⭐⭐⭐⭐⭐ |
| **Smart** | Gemini 3 Flash | $0.50 | $3.00 | +$20/mo | ⭐⭐⭐⭐ |
| **Balanced** | GPT-4o-mini | $0.15 | $0.60 | +$8/mo | ⭐⭐⭐ |
| **Budget** | Gemini 2.0 Flash | $0.10 | $0.40 | +$5/mo | ⭐⭐⭐ |

### Worker Models (Task Execution)

Workers handle bulk operations: search processing, document summarization, code generation.

| Tier | Model | Input/1M | Output/1M | Monthly Add-on | Best For |
|------|-------|----------|-----------|----------------|----------|
| **Standard** | Gemini 2.0 Flash-Lite | $0.05 | $0.20 | +$2/mo | General tasks |
| **Code-optimized** | Grok 4.1 Fast | $0.20 | $0.50 | +$5/mo | Development |
| **Speed** | Gemini 2.0 Flash | $0.10 | $0.40 | +$4/mo | Faster responses |

## Pricing Structure

### Base Price

```
Base: $29/mo
├── Platform access
├── Container hosting
├── 3.75M tokens/week base allocation
├── Web + WhatsApp + Telegram
└── Basic support
```

### Dynamic Pricing Formula

```typescript
function calculateMonthlyPrice(config: ModelConfig): number {
  const BASE_PRICE = 29;
  
  const orchestratorPricing = {
    'gpt-4o': 35,
    'gemini-3-flash': 20,
    'gpt-4o-mini': 8,
    'gemini-2.0-flash': 5,
  };
  
  const workerPricing = {
    'gemini-2.0-flash-lite': 2,
    'grok-4.1-fast': 5,
    'gemini-2.0-flash': 4,
  };
  
  return BASE_PRICE 
    + orchestratorPricing[config.orchestrator]
    + workerPricing[config.worker];
}
```

### Price Examples

| Configuration | Calculation | Monthly |
|--------------|-------------|---------|
| Budget (Flash + Flash-Lite) | $29 + $5 + $2 | **$36/mo** |
| Balanced (4o-mini + Flash-Lite) | $29 + $8 + $2 | **$39/mo** |
| Smart (Gemini 3 + Flash-Lite) | $29 + $20 + $2 | **$51/mo** |
| Developer (4o-mini + Grok Fast) | $29 + $8 + $5 | **$42/mo** |
| Power User (GPT-4o + Flash-Lite) | $29 + $35 + $2 | **$66/mo** |
| Maximum (GPT-4o + Grok Fast) | $29 + $35 + $5 | **$69/mo** |

## Database Schema

### Model Configuration Table

```sql
CREATE TABLE model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Selected models
  orchestrator_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  worker_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash-lite',
  
  -- Calculated pricing
  orchestrator_addon_cents INTEGER NOT NULL DEFAULT 800,  -- $8.00
  worker_addon_cents INTEGER NOT NULL DEFAULT 200,        -- $2.00
  total_monthly_cents INTEGER NOT NULL DEFAULT 3900,      -- $39.00
  
  -- When config was last changed
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Stripe price ID for this configuration (if custom)
  stripe_price_id TEXT,
  
  UNIQUE(user_id)
);

CREATE INDEX idx_model_configs_user ON model_configs(user_id);
```

### Drizzle Schema

```typescript
// src/lib/db/schema/model-configs.ts

import { pgTable, text, timestamp, uuid, integer, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const modelConfigs = pgTable('model_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Selected models
  orchestratorModel: text('orchestrator_model').notNull().default('gpt-4o-mini'),
  workerModel: text('worker_model').notNull().default('gemini-2.0-flash-lite'),
  
  // Calculated pricing (in cents)
  orchestratorAddonCents: integer('orchestrator_addon_cents').notNull().default(800),
  workerAddonCents: integer('worker_addon_cents').notNull().default(200),
  totalMonthlyCents: integer('total_monthly_cents').notNull().default(3900),
  
  // Timestamps
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  // Stripe integration
  stripePriceId: text('stripe_price_id'),
}, (table) => ({
  userUnique: unique('model_configs_user_unique').on(table.userId),
}));

// Available models with metadata
export const ORCHESTRATOR_MODELS = {
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Most capable. Best for complex reasoning.',
    addonCents: 3500,
    quality: 5,
    inputPer1M: 2.50,
    outputPer1M: 10.00,
  },
  'gemini-3-flash': {
    name: 'Gemini 3 Flash',
    provider: 'google',
    description: 'Fast and smart. Great all-rounder.',
    addonCents: 2000,
    quality: 4,
    inputPer1M: 0.50,
    outputPer1M: 3.00,
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Reliable and efficient. Best value.',
    addonCents: 800,
    quality: 3,
    inputPer1M: 0.15,
    outputPer1M: 0.60,
  },
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Budget-friendly. Good for simple tasks.',
    addonCents: 500,
    quality: 3,
    inputPer1M: 0.10,
    outputPer1M: 0.40,
  },
} as const;

export const WORKER_MODELS = {
  'gemini-2.0-flash-lite': {
    name: 'Flash Lite',
    provider: 'google',
    description: 'Ultra-efficient for bulk tasks.',
    addonCents: 200,
    bestFor: 'General',
    inputPer1M: 0.05,
    outputPer1M: 0.20,
  },
  'grok-4.1-fast': {
    name: 'Grok Fast',
    provider: 'xai',
    description: 'Optimized for code and technical tasks.',
    addonCents: 500,
    bestFor: 'Code',
    inputPer1M: 0.20,
    outputPer1M: 0.50,
  },
  'gemini-2.0-flash': {
    name: 'Gemini Flash',
    provider: 'google',
    description: 'Faster responses, slightly higher cost.',
    addonCents: 400,
    bestFor: 'Speed',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
  },
} as const;

export const BASE_PRICE_CENTS = 2900;  // $29.00

export type OrchestratorModelId = keyof typeof ORCHESTRATOR_MODELS;
export type WorkerModelId = keyof typeof WORKER_MODELS;
```

## API Endpoints

### GET /api/models

Returns available models and current configuration:

```typescript
interface ModelsResponse {
  orchestrators: {
    id: string;
    name: string;
    description: string;
    addonPrice: number;  // dollars
    quality: number;     // 1-5 stars
  }[];
  workers: {
    id: string;
    name: string;
    description: string;
    addonPrice: number;
    bestFor: string;
  }[];
  current: {
    orchestrator: string;
    worker: string;
    totalMonthly: number;
  };
  basePrice: number;
}
```

### POST /api/models/configure

Updates user's model configuration:

```typescript
interface ConfigureRequest {
  orchestrator: string;  // model ID
  worker: string;        // model ID
}

interface ConfigureResponse {
  success: boolean;
  newPrice: number;
  effectiveDate: string;  // When change takes effect
  requiresPaymentUpdate: boolean;
}
```

### GET /api/models/preview

Preview price for a configuration without saving:

```typescript
// GET /api/models/preview?orchestrator=gpt-4o&worker=grok-4.1-fast

interface PreviewResponse {
  orchestrator: {
    id: string;
    name: string;
    addonPrice: number;
  };
  worker: {
    id: string;
    name: string;
    addonPrice: number;
  };
  basePrice: number;
  totalMonthly: number;
  comparison: {
    currentPrice: number;
    difference: number;  // positive = more expensive
  };
}
```

## UI Components

### Model Selector Card

```tsx
// src/components/ModelSelector.tsx

interface ModelSelectorProps {
  type: 'orchestrator' | 'worker';
  selected: string;
  onSelect: (modelId: string) => void;
}

function ModelSelector({ type, selected, onSelect }: ModelSelectorProps) {
  const models = type === 'orchestrator' ? ORCHESTRATOR_MODELS : WORKER_MODELS;
  
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-lg">
        {type === 'orchestrator' ? '🧠 Main Brain' : '⚡ Worker Model'}
      </h3>
      <p className="text-sm text-gray-500">
        {type === 'orchestrator' 
          ? 'Handles thinking, planning, and conversation'
          : 'Executes search, summaries, and code tasks'}
      </p>
      
      <div className="grid gap-3">
        {Object.entries(models).map(([id, model]) => (
          <ModelCard
            key={id}
            id={id}
            model={model}
            selected={selected === id}
            onSelect={() => onSelect(id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Configuration Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Configure Your AI                                               │
│                                                                  │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ 🧠 Main Brain               │ │ ⚡ Worker Model             │ │
│  │                             │ │                             │ │
│  │ ┌─────────────────────────┐ │ │ ┌─────────────────────────┐ │ │
│  │ │ ○ GPT-4o        +$35/mo │ │ │ │ ● Flash Lite    +$2/mo │ │ │
│  │ │   Most capable          │ │ │ │   Ultra-efficient      │ │ │
│  │ │   ⭐⭐⭐⭐⭐              │ │ │ │   Best for: General    │ │ │
│  │ └─────────────────────────┘ │ │ └─────────────────────────┘ │ │
│  │ ┌─────────────────────────┐ │ │ ┌─────────────────────────┐ │ │
│  │ │ ○ Gemini 3 Flash +$20/mo│ │ │ │ ○ Grok Fast     +$5/mo │ │ │
│  │ │   Fast and smart        │ │ │ │   Code-optimized       │ │ │
│  │ │   ⭐⭐⭐⭐                │ │ │ │   Best for: Code       │ │ │
│  │ └─────────────────────────┘ │ │ └─────────────────────────┘ │ │
│  │ ┌─────────────────────────┐ │ │ ┌─────────────────────────┐ │ │
│  │ │ ● GPT-4o Mini    +$8/mo │ │ │ │ ○ Gemini Flash  +$4/mo │ │ │
│  │ │   Reliable, efficient   │ │ │ │   Faster responses     │ │ │
│  │ │   ⭐⭐⭐  RECOMMENDED    │ │ │ │   Best for: Speed      │ │ │
│  │ └─────────────────────────┘ │ │ └─────────────────────────┘ │ │
│  │ ┌─────────────────────────┐ │ │                             │ │
│  │ │ ○ Gemini 2.0 Flash +$5  │ │ │                             │ │
│  │ │   Budget-friendly       │ │ │                             │ │
│  │ │   ⭐⭐⭐                  │ │ │                             │ │
│  │ └─────────────────────────┘ │ │                             │ │
│  └─────────────────────────────┘ └─────────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                     Your Plan                                ││
│  │                                                              ││
│  │  Base platform ............................ $29.00          ││
│  │  GPT-4o Mini (Brain) ...................... $8.00           ││
│  │  Flash Lite (Worker) ...................... $2.00           ││
│  │  ──────────────────────────────────────────────────         ││
│  │  Monthly Total ............................ $39.00          ││
│  │                                                              ││
│  │  Includes: 3.75M tokens/week • WhatsApp • Telegram          ││
│  │                                                              ││
│  │  [Save Configuration]                    [Start Free Trial] ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

## Stripe Integration

### Approach: Metered Billing + Base Subscription

Since configurations vary, use Stripe's metered billing:

```typescript
// Create base subscription
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [
    { price: 'price_base_29' },           // $29 base
    { price: 'price_metered_addon' },     // Metered add-on
  ],
});

// When config changes, update usage
await stripe.subscriptionItems.createUsageRecord(
  subscription.items.data[1].id,
  {
    quantity: newAddonCents,  // e.g., 1000 for $10 add-on
    action: 'set',
  }
);
```

### Alternative: Pre-defined Price Points

Create Stripe prices for common configurations:

| Config | Price ID | Monthly |
|--------|----------|---------|
| Budget | `price_budget_36` | $36 |
| Balanced | `price_balanced_39` | $39 |
| Smart | `price_smart_51` | $51 |
| Developer | `price_developer_42` | $42 |
| Power | `price_power_66` | $66 |

Simpler to implement, less flexible.

## Container Configuration

When user changes models, update their container config:

```typescript
async function updateContainerConfig(userId: string, config: ModelConfig) {
  const containerConfig = {
    providers: {
      // Orchestrator provider
      [getProvider(config.orchestrator)]: {
        apiKey: getApiKey(config.orchestrator),
        models: [config.orchestrator],
      },
      // Worker provider (if different)
      [getProvider(config.worker)]: {
        apiKey: getApiKey(config.worker),
        models: [config.worker],
      },
    },
    routing: {
      orchestrator: config.orchestrator,
      worker: config.worker,
    },
  };
  
  // Hot-reload container config or restart
  await updateContainer(userId, containerConfig);
}
```

## Migration Path

### For Existing Users

1. Default all existing users to "Balanced" config (4o-mini + Flash-Lite)
2. Grandfather their current price if lower
3. Show "Upgrade your AI" prompt in dashboard

### Rollout Phases

| Phase | Scope | Timeline |
|-------|-------|----------|
| 1. Schema + API | Backend only | Week 1 |
| 2. UI + Preview | Frontend, no saves | Week 2 |
| 3. New Signups | Enable for new users | Week 3 |
| 4. Existing Users | Migration + announcement | Week 4 |

## Analytics

Track model selection patterns:

```typescript
const METRICS = {
  // Selection distribution
  orchestratorDistribution: 'gauge',  // % per model
  workerDistribution: 'gauge',
  
  // Revenue impact
  avgMonthlyPrice: 'gauge',
  configChangesPerWeek: 'counter',
  
  // Upgrade/downgrade
  upgradeRate: 'gauge',    // % who pick premium
  downgradeRate: 'gauge',  // % who switch to budget
  
  // Churn correlation
  churnByConfig: 'gauge',  // Do budget users churn more?
};
```

## Future Enhancements

1. **Model Comparison Tool**: Side-by-side output comparison
2. **Smart Recommendations**: "Based on your usage, Gemini 3 would save you $X"
3. **A/B Routing**: "Try premium for 10% of requests"
4. **Custom Models**: BYOK (Bring Your Own Key) for power users
5. **Team Plans**: Different configs per team member
6. **Usage-Based Pricing**: Pay per token instead of flat add-on
