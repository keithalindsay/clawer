> ⚠️ **OUTDATED** - See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/RUNBOOK.md](docs/RUNBOOK.md) for current documentation
> 
> This document is preserved for historical reference only.

# 🚀 Quick Test - Telegram Integration

## 1-Minute Test

### Step 1: Create Bot (30 seconds)
1. Open Telegram
2. Search: `@BotFather`
3. Send: `/newbot`
4. Name: `My Test Bot`
5. Username: `mytestbot123_bot` (must be unique)
6. **Copy the token** (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Connect (15 seconds)
1. Go to: https://clawer.ai/dashboard
2. Click the **Telegram** card (✈️)
3. Paste your bot token
4. Click **Connect Bot**
5. ✅ Should show "Connected" with bot username

### Step 3: Test (15 seconds)
1. In Telegram, search for your bot username
2. Send: `Hello!`
3. **Expected:** Bot responds with AI-generated text
4. ✅ Working!

---

## If It Doesn't Work

### Bot doesn't respond?
```bash
# Check server logs
ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --lines 50"
```

### Can't connect bot?
- Check token is correct (should start with numbers)
- Make sure you're logged into clawer.ai
- Check browser console for errors

### Bot polling error?
- Token might be invalid
- Bot already used by another service
- Disconnect and reconnect

---

## Expected Behavior

✅ **Connect:** Modal closes, card shows "Connected @botusername"  
✅ **Message:** Bot responds within 2-3 seconds  
✅ **Disconnect:** Card returns to "Click to setup" state  

---

## Server Info

- **URL:** https://clawer.ai
- **Server:** YOUR_DOCKER_HOST
- **PM2 Process:** `clawer`
- **Port:** 3000 (behind nginx)

---

## Quick Debug Commands

```bash
# Check if app is running
ssh root@YOUR_DOCKER_HOST "pm2 status"

# View logs
ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --lines 30 --nostream"

# Restart app
ssh root@YOUR_DOCKER_HOST "pm2 restart clawer"

# Check database
ssh root@YOUR_DOCKER_HOST "cd /opt/clawer && psql -U clawer -d clawer -c 'SELECT id, email, telegram_bot_username FROM users;'"
```

---

## API Testing (cURL)

### Check Status (requires auth token)
```bash
curl https://clawer.ai/api/telegram/status \
  -H "Cookie: __session=<your-clerk-session>"
```

---

**Ready to test? Go!** 🚀
