# Discord Integration - Quick Start for Keith

## 🚀 Deploy Now (5 minutes)

### Step 1: Deploy Code
```bash
cd ~/projects/clawer
./deploy-discord.sh
```

### Step 2: Add Kimi API Key
```bash
ssh root@YOUR_DOCKER_HOST
cd /opt/clawer
nano .env.local
```

Add this line:
```bash
MOONSHOT_API_KEY=sk-YOUR-MOONSHOT-API-KEY-HERE
```

Save (Ctrl+O, Enter, Ctrl+X)

### Step 3: Restart App
```bash
pm2 restart clawer
pm2 logs clawer --lines 20
```

### Step 4: Test It
1. Go to https://clawer.ai/discord
2. Should see setup instructions
3. Create a test bot following the steps
4. Connect and test

## 🧪 Quick Test Bot Setup

### Create Discord Bot (2 minutes)
1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it "Test Clawer"
3. Go to "Bot" section → Click "Add Bot"
4. Under "Privileged Gateway Intents" → Enable "Message Content Intent"
5. Click "Reset Token" → Copy the token

### Get Invite URL
1. Go to "OAuth2" → "URL Generator"
2. Check scopes: ✓ bot
3. Check permissions: ✓ Send Messages, ✓ Read Messages, ✓ Read Message History
4. Copy the generated URL
5. Open URL in browser → Select a test server → Authorize

### Connect on Clawer
1. Go to https://clawer.ai/discord (must be logged in + subscribed)
2. Paste bot token
3. Click "Connect Discord Bot"
4. Should see success message

### Test Messaging
1. Open Discord
2. Send DM to your bot: "Hello, who are you?"
3. Bot should respond with AI message
4. Or mention it in server: `@TestBot hello`

## 📋 What Was Built

- Discord bot client (manages connections)
- Message handler (routes to Kimi API)
- API endpoints (connect/disconnect/status)
- UI page with setup instructions
- Database schema for encrypted tokens
- Auto-reconnect on server restart

## 🔍 If Something Breaks

### Check Logs
```bash
ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --lines 50"
```

### Check API Key
```bash
ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && grep MOONSHOT .env.local"
```

### Restart App
```bash
ssh root@YOUR_DOCKER_HOST "pm2 restart clawer"
```

### Check Database
```bash
ssh root@YOUR_DOCKER_HOST
cd /opt/clawer
npm run db:push
```

## 📖 Full Documentation

- **Handoff Doc**: `DISCORD_HANDOFF.md` (complete technical details)
- **Setup Guide**: `DISCORD_SETUP.md` (user-facing instructions)
- **Deploy Script**: `deploy-discord.sh` (automated deployment)

## ✅ Success = When You Can...

1. ✅ Visit https://clawer.ai/discord (see setup page)
2. ✅ Create a Discord bot in 2 minutes
3. ✅ Connect it through the UI
4. ✅ Send DM to bot → Get AI response
5. ✅ Mention bot in channel → Get AI response

---

**That's it!** Run the deploy script, add the API key, test it. 🎉
