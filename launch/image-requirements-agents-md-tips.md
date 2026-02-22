# Image Requirements for /blog/openclaw-agents-md-tips

## Hero Image
**Filename:** `~/projects/clawer/public/blog/openclaw-agents-md-tips-hero.png`

**Prompt:**
"Abstract technical illustration of a configuration file (AGENTS.md) with glowing rules and connections, transforming chaotic AI agent behavior into organized, efficient workflows. Dark mode aesthetic with purple and blue gradients, clean lines, modern tech style. Config file shown as structured text with highlighted sections connecting to successful AI assistant behaviors."

**Alt text (already in post):**
"OpenClaw AGENTS.md configuration file improving AI assistant behavior with rules and memory management"

**Usage:** Referenced in blog post at line ~153

## Optional Second Image (if desired)
**Filename:** `~/projects/clawer/public/blog/openclaw-agents-md-tips-group-chat.png`

**Prompt:**
"Split-screen comparison showing WhatsApp group chat — left side: AI agent responding to every message (spam, chaos), right side: AI agent responding only when mentioned (clean, useful). Modern chat interface, clear before/after visual."

**Alt text:**
"Before and after comparison of OpenClaw agent group chat behavior with proper AGENTS.md rules"

## Generation Command (once API key is available)
```bash
cd ~/clawd && uv run ~/clawd/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "<prompt above>" \
  --filename ~/projects/clawer/public/blog/openclaw-agents-md-tips-hero.png
```

**Note:** Nano Banana requires GEMINI_API_KEY environment variable or --api-key flag.
