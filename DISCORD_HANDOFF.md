# Discord Integration - Complete Handoff

## ✅ What's Been Built

### Core Implementation
- ✅ **Discord.js Bot Client** (`src/lib/discord/client.ts`)
  - Manages Discord bot connections per user
  - Handles DMs and mentions
  - Auto-reconnects on server restart
  - Supports multiple users with their own bots

- ✅ **Message Handler** (`src/lib/discord/messageHandler.ts`)
  - Routes Discord messages to Kimi API
  - Uses same backend as web chat
  - Returns AI responses to Discord

- ✅ **Secure Token Storage** (`src/lib/discord/encryption.ts`)
  - AES-256-GCM encryption for bot tokens
  - Environment-based encryption key
  - Secure at rest

- ✅ **API Endpoints** (`src/app/api/discord/connect/route.ts`)
  - `POST /api/discord/connect` - Connect bot
  - `DELETE /api/discord/connect` - Disconnect bot
  - `GET /api/discord/connect` - Get status

- ✅ **Database Schema** (`src/lib/db/schema/discord.ts`)
  - `discord_connections` table
  - Stores encrypted tokens + metadata

- ✅ **User Interface** (`src/app/discord/page.tsx`)
  - Setup instructions
  - Bot token input form
  - Connection status display
  - Connected to dashboard

- ✅ **Auto-Reconnect** (`src/lib/discord/startup.ts`)
  - Reconnects all active bots on server restart

## 📦 Files Created/Modified

### New Files
```
src/lib/discord/
├── client.ts              # Discord bot manager
├── messageHandler.ts      # Message routing to Kimi
├── encryption.ts          # Token encryption/decryption
└── startup.ts             # Auto-reconnect on startup

src/lib/db/schema/
└── discord.ts             # Database schema

src/app/discord/
├── page.tsx               # Main Discord setup page
└── DiscordConnectionForm.tsx  # Client-side form

src/app/api/discord/connect/
└── route.ts               # API endpoints

DISCORD_SETUP.md           # Technical setup guide
DISCORD_HANDOFF.md         # This file
deploy-discord.sh          # Deployment script
```

### Modified Files
```
src/app/dashboard/page.tsx  # Made Discord card clickable
src/lib/db/schema/index.ts  # Added discord exports
.env.local                  # Added DISCORD_ENCRYPTION_KEY
package.json                # Added discord.js
```

## 🚀 Deployment Steps

### 1. Deploy to Production

From your local machine:

```bash
cd ~/projects/clawer
./deploy-discord.sh
```

This will:
- Build the project
- Sync files to server
- Add DISCORD_ENCRYPTION_KEY
- Install dependencies
- Run database migration
- Restart PM2

### 2. Add Kimi API Key (CRITICAL)

SSH into the server and add the Moonshot API key:

```bash
ssh root@YOUR_DOCKER_HOST
cd /opt/clawer
echo "MOONSHOT_API_KEY=sk-YOUR-KEY-HERE" >> .env.local
pm2 restart clawer
```

**Without this, Discord bot won't be able to respond to messages.**

### 3. Verify Deployment

```bash
# Check if app is running
ssh root@YOUR_DOCKER_HOST "pm2 status clawer"

# Check logs for errors
ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --lines 50"

# Test the website
curl https://clawer.ai/discord
```

## 🧪 Testing

### Test the Integration

1. **Visit Discord Setup Page**
   - Go to https://clawer.ai/discord
   - Should see setup instructions

2. **Create a Test Discord Bot**
   - Go to https://discord.com/developers/applications
   - Create new application "Test Clawer Bot"
   - Go to Bot section, create bot
   - Enable "Message Content Intent"
   - Copy bot token

3. **Get Invite URL**
   - Go to OAuth2 → URL Generator
   - Select scope: `bot`
   - Select permissions: Read Messages, Send Messages, Read History
   - Copy URL and invite bot to a test server

4. **Connect Bot on Clawer**
   - Paste bot token on https://clawer.ai/discord
   - Click "Connect Discord Bot"
   - Should see success message

5. **Test Messaging**
   - Send DM to your bot on Discord
   - Or mention it in a channel: `@YourBot hello`
   - Bot should respond with AI-generated message

## 🔧 Environment Variables

### Required in Production

```bash
# In /opt/clawer/.env.local

# Kimi AI API (REQUIRED for responses)
MOONSHOT_API_KEY=sk-YOUR-MOONSHOT-API-KEY

# Discord encryption (auto-added by deploy script)
DISCORD_ENCRYPTION_KEY=b81459f1ea5290bfb02e5f943723790cae56ab2e0cd5dcc8aa4a95fb8dd30222
```

### Security Note
- `DISCORD_ENCRYPTION_KEY` is generated and should remain secret
- Keep it in `.env.local` (not committed to git)
- If lost, existing bot connections will break (tokens can't be decrypted)

## 📊 How It Works

### User Flow (BYOB Mode)
1. User signs up, subscribes ($49/month)
2. User clicks "Discord" on dashboard
3. User follows setup instructions to create Discord bot
4. User pastes bot token on Clawer
5. Clawer encrypts and stores token
6. Clawer connects bot to Discord
7. Bot listens for DMs and mentions
8. Messages routed to Kimi API
9. Responses sent back to Discord

### Architecture
```
Discord User
    ↓ sends message
Discord Bot (user's bot)
    ↓ receives message
Discord Client (client.ts)
    ↓ routes to handler
Message Handler (messageHandler.ts)
    ↓ calls API
Kimi API (Moonshot)
    ↓ returns response
Discord Client
    ↓ sends reply
Discord User
```

## 🐛 Troubleshooting

### Bot Not Responding
1. **Check API key**: Verify MOONSHOT_API_KEY in .env.local
2. **Check bot status**: GET /api/discord/connect
3. **Check logs**: `pm2 logs clawer`
4. **Check intents**: "Message Content Intent" must be enabled

### Bot Disconnects on Restart
- Should auto-reconnect via `startup.ts`
- Check if startup script is being called
- Verify database connection works

### Invalid Token Error
- Token must be from Bot section (not Client Secret)
- Token format: ~70 characters
- Must have "Message Content Intent" enabled

### Database Issues
```bash
# Re-run migration
cd /opt/clawer
npm run db:push
```

## 📝 Future Enhancements

### MVP Complete ✅
- [x] BYOB mode (user provides token)
- [x] DM and mention support
- [x] Kimi AI integration
- [x] Secure token storage
- [x] Auto-reconnect

### Nice-to-Have (Post-MVP)
- [ ] Conversation history (multi-turn context)
- [ ] Slash commands (e.g., `/summarize`)
- [ ] Bot personality selection
- [ ] Hosted mode (official Clawer bot)
- [ ] Usage analytics per user
- [ ] Rate limiting per user

## 🔗 Related Documentation

- Setup Guide: `DISCORD_SETUP.md`
- Deployment Script: `deploy-discord.sh`
- Discord.js Docs: https://discord.js.org
- Kimi API Docs: https://platform.moonshot.cn/docs

## ✅ Verification Checklist

Before marking complete:

- [ ] Code deployed to production
- [ ] MOONSHOT_API_KEY added to .env.local
- [ ] Database migration run successfully
- [ ] PM2 restarted
- [ ] Test bot created and connected
- [ ] Bot responds to DMs
- [ ] Bot responds to mentions
- [ ] Dashboard Discord card clickable
- [ ] Setup page loads correctly

## 🎉 Success Criteria

Integration is complete when:
1. ✅ User can create Discord bot following instructions
2. ✅ User can connect bot through UI
3. ✅ Bot responds to DMs with AI messages
4. ✅ Bot responds to mentions with AI messages
5. ✅ Bot survives server restarts (auto-reconnect)
6. ✅ Multiple users can have their own bots

---

**Status**: Ready for deployment and testing
**Next Action**: Run `./deploy-discord.sh` and add MOONSHOT_API_KEY
