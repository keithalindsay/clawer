# Hacker News Show HN Post

## Title
Show HN: Clawer – Hosted OpenClaw, personal AI assistant in your WhatsApp

## URL
https://clawer.ai

---

## First Comment
*Post immediately after submitting - HN values technical depth and honesty*

Hey HN! I'm Keith, creator of OpenClaw (open-source AI assistant framework, 300K users).

### What I built

Clawer.ai is hosted OpenClaw with zero-setup templates. You pick a use case (Solopreneur, Parent, Fitness, E-commerce, etc.), connect to WhatsApp/Telegram/Slack, and get a fully configured AI assistant in 60 seconds.

### Why this exists

The managed AI assistant market charges $2,400 setup + $1,875/mo (SetupClaw, etc.). Self-hosting OpenClaw is free but takes 3-5 hours of technical setup. Most people do neither.

I automated the setup process and dropped the price to $49/mo.

### How it works

**Architecture:**
- Each template is a pre-configured agent with specialized tools, system prompts, and workflow definitions
- Example: "Solopreneur" template includes lead tracking, content drafting tools, research APIs, task management, email integration
- Users interact via WhatsApp/Telegram/Slack (wherever they already work)
- Backend routes messages to appropriate agent, maintains conversation state, handles tool calls

**Templates vs Generic AI:**
- Generic ChatGPT = overwhelming blank canvas, no memory, no integrations
- Clawer templates = domain-specific prompts + tool access + memory structures
- Retention data: 3x higher with templates vs "build your own" approach

**Infrastructure:**
- Built on OpenClaw core (Node.js, 2+ years battle-tested)
- Multi-channel support via WhatsApp Business API, Telegram Bot API, Slack Events API
- Models: Claude Opus/Sonnet, GPT-4 (user-configurable, routed via LiteLLM)
- Isolated Docker containers per user for security
- Hosted on [your infrastructure - AWS/GCP/DigitalOcean/etc.]

**Pricing & Economics:**
- Free tier: 200 messages/mo (enough to test real workflows)
- Pro: $49/mo unlimited
- COGS: ~$8-12/user/month (AI API costs + infrastructure)
- All models included - no BYOK (bring your own key)

### Technical challenges solved

**1. Multi-channel normalization**

WhatsApp, Telegram, and Slack all have different message formats, attachment handling, and rate limits. Built an abstraction layer that normalizes incoming messages and handles channel-specific quirks (WhatsApp's QR auth, Telegram's bot tokens, Slack's OAuth).

**2. Stateful conversations across sessions**

Users expect the AI to "remember" previous conversations. Built a context window manager that:
- Stores conversation history per user
- Summarizes older messages to stay within token limits
- Maintains task/reminder state across days

**3. Template isolation**

Each template needs different tool access without cross-contamination. Solved with:
- Template-specific system prompts (loaded at runtime)
- Sandboxed tool execution (Docker containers per user)
- Permission manifests (templates declare which APIs they can access)

**4. Signup → working assistant in <60 seconds**

This was the hard part. Automated:
- Channel connection (QR codes for WhatsApp, OAuth for Slack, bot tokens for Telegram)
- Template selection and configuration
- Container provisioning
- Initial system prompt injection

Manual setup used to take 3-5 hours. Now it's fully automated.

### Open-source vs hosted

**OpenClaw will always be open-source and self-hostable.** Clawer is the "WordPress.com" version for non-technical users.

If you're technical and want full control: self-host OpenClaw (MIT license, free forever).

If you want "just works": use Clawer ($49/mo funds OpenClaw development).

### What's interesting (from an engineering perspective)

**1. Template-based agent architecture**

Instead of "one AI that does everything," we have 7 specialized agents. Each template has:
- Different system prompts (tuned for domain)
- Different tool access (e.g., "Fitness" has nutrition API, "E-commerce" has product research)
- Different memory structures (e.g., "Parent" tracks kids' ages/preferences, "Finance" tracks budgets)

This is closer to how companies use AI internally (specialized agents for different teams) but packaged for individual consumers.

**2. Voice notes as primary input**

WhatsApp voice → speech-to-text → LLM is **way** more natural than typing. Users send commands like:

- "Remind me to follow up with Sarah about the proposal Thursday morning"
- "Draft 3 LinkedIn post ideas about AI in marketing"

While walking, making coffee, driving (please don't). Zero friction.

**3. Pricing as a technical constraint**

$49/mo means I *have* to be efficient with API calls. This forced optimizations:
- Smart context pruning (summarize old messages instead of sending full history)
- Model routing (use Claude Haiku for simple tasks, Opus for complex reasoning)
- Caching (template prompts are static, cache them)

Competitors at $1,875/mo don't have this pressure. I think constraints breed better engineering.

### Limitations (being honest)

1. **No custom templates in v1** - You pick from 7 pre-built templates. Custom template builder is on the roadmap but not here yet.

2. **Voice notes require WhatsApp** - Telegram/Slack support text only (voice transcription API costs add up fast).

3. **200 message free tier** - This is tight if you're a power user. By design (need conversion pressure) but still a limitation.

4. **Single-user focus** - Not built for teams yet. Each account is one person + their AI.

5. **English-first** - Works in other languages but prompts/templates are optimized for English.

### Free tier available

Link: **https://clawer.ai**

200 messages/month, no credit card required. Test it, break it, tell me what's broken.

### Questions I can answer

- AI assistant architecture (how to build stateful agents)
- Open-source → SaaS business model
- Multi-channel messaging integration
- Template-based vs generic AI UX
- Unit economics for AI-heavy products

I'm here for a few hours. Fire away.

---

## Response Strategy (if HN gains traction)

### Common HN Questions & Prepared Answers

**Q: "Why not just use ChatGPT?"**
A: ChatGPT is great for one-off questions. This is for ongoing workflow automation (task tracking, reminders, contextual memory). Also, WhatsApp integration means zero app switching.

**Q: "How is this different from AutoGPT/AgentGPT/etc.?"**
A: Those are generic agent frameworks. Clawer is template-ized for specific use cases (Solopreneur, Parent, Fitness, etc.). Think "WordPress themes" vs "build your own CMS from scratch."

**Q: "Privacy concerns? Where is data stored?"**
A: Messages encrypted in transit (TLS). Stored in per-user databases (isolated containers). No training on user data. You can export/delete anytime. Self-hosting OpenClaw is always an option if you want full control.

**Q: "What's stopping OpenAI/Anthropic from building this?"**
A: Nothing, honestly. But they're focused on models, not end-user products. This is a "picks and shovels" play - I'm building on top of their APIs.

**Q: "API costs must be insane. How is $49/mo profitable?"**
A: Depends on usage. Average user sends ~300-500 messages/month. With smart caching and model routing (Haiku for simple, Opus for complex), COGS is $8-12/user. Margins work at scale.

**Q: "Show me the code"**
A: OpenClaw core is open-source: [link]. Clawer hosting layer is proprietary (for now), but the agent framework is public.

**Q: "What happens if you get acquired/shut down?"**
A: All users can export their data. OpenClaw is MIT-licensed forever. Worst case: everyone self-hosts.

**Q: "Isn't this just a fancy wrapper?"**
A: Yes. Most SaaS is. The value is in the UX (60-second setup vs 5-hour DIY), template specialization, and "it just works."

---

## If Post Doesn't Gain Traction (Day 1)

### Backup Plan: Re-post Day 9 with Different Angle

**Alternate Title:**
Show HN: 30 AI Automations Guide (built for personal assistant workflows)

**Alternate URL:**
https://clawer.ai/30-automations

**Strategy:**
Lead with value (free guide), mention Clawer in comments as "I built this to power these automations."

HN responds better to education than promotion.

---

## HN-Specific Discount Code (if momentum builds)

**If post reaches front page (100+ upvotes):**

Post follow-up comment:

> Thanks for the response, HN! Wasn't expecting this.
> 
> For the next 50 people who sign up: use code **HACKERNEWS** for 50% off first month ($24.50 instead of $49).
> 
> Also happy to give free Pro access to anyone who finds a legit security issue (DM me: keith@clawer.ai).

**Purpose:** Reward HN community, drive conversions, get early feedback from technical users.
