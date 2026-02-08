# Discord Integration Setup

## 1. Environment Variables

Add to `.env` or `.env.local`:

```bash
# Discord bot token encryption key (32 bytes / 64 hex chars)
DISCORD_ENCRYPTION_KEY=b81459f1ea5290bfb02e5f943723790cae56ab2e0cd5dcc8aa4a95fb8dd30222
```

## 2. Database Migration

Run the database migration to create the `discord_connections` table:

```bash
npm run db:generate
npm run db:push
```

## 3. Server Startup

The Discord bots will automatically reconnect on server restart. Add this to your server startup (e.g., in `src/app/layout.tsx` or a startup script):

```typescript
import { reconnectDiscordBots } from '@/lib/discord/startup';

// Call on server startup
if (typeof window === 'undefined') {
  reconnectDiscordBots().catch(console.error);
}
```

## 4. User Setup Instructions (BYOB Mode)

Users need to:

1. **Create Discord Application**
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Name it (e.g., "My Clawer Bot")

2. **Create Bot**
   - Go to "Bot" section
   - Click "Add Bot"
   - Enable "Message Content Intent" under Privileged Gateway Intents

3. **Get Bot Token**
   - Click "Reset Token" to generate a new token
   - Copy the token (save it somewhere safe)

4. **Invite Bot to Server**
   - Go to "OAuth2" → "URL Generator"
   - Select scopes: `bot`
   - Select permissions:
     - Read Messages/View Channels
     - Send Messages
     - Read Message History
   - Copy generated URL and open it to invite bot to a server

5. **Connect on Clawer**
   - Go to https://clawer.ai/discord
   - Paste bot token
   - Click "Connect Discord Bot"

## 5. How It Works

- User provides their own Discord bot token (BYOB = Bring Your Own Bot)
- Bot token is encrypted using AES-256-GCM and stored in database
- Bot connects and listens for:
  - Direct messages
  - Mentions in server channels
- Messages are routed to Kimi API (same backend as web chat)
- Responses are sent back to Discord

## 6. Testing

1. Connect a bot through the UI
2. Send a DM to your bot on Discord
3. Or mention your bot in a server: `@YourBot hello`
4. Bot should respond with AI-powered message

## 7. Security Notes

- Bot tokens are encrypted at rest (AES-256-GCM)
- Encryption key should be kept secure (use environment variables)
- Each user has their own bot (no shared bot = better privacy)
- Users can disconnect anytime (stops bot and marks inactive)

## 8. Production Deployment

On VPS (YOUR_DOCKER_HOST):

1. Add `DISCORD_ENCRYPTION_KEY` to production `.env`
2. Run database migration
3. Deploy and restart Next.js app
4. Bots will auto-reconnect on startup

## 9. Future Enhancements

- **Conversation history**: Store message context in database
- **Multi-turn conversations**: Remember previous messages
- **Bot personality selection**: Let users choose bot persona
- **Slash commands**: Add Discord slash commands for quick actions
- **Hosted mode**: Offer official Clawer bot (users just click "Add to Discord")
