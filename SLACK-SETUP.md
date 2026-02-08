# Slack Integration Setup Instructions

## 🎉 Status: LIVE and deployed!

The Slack integration is now live on https://clawer.ai

## What Was Built

### 1. Backend Integration (`/src/lib/slack/`)
- **client.ts**: Slack Bolt SDK wrapper for managing bot instances
- Bot token validation
- Message sending and conversation history

### 2. API Routes (`/src/app/api/slack/`)
- **connect**: Store/delete user bot tokens (BYOB mode)
- **events**: Webhook endpoint for Slack messages → Kimi AI routing

### 3. User Interface (`/src/app/dashboard/slack/`)
- Complete setup page with step-by-step instructions
- Connection status display
- One-click disconnect

### 4. Database Changes
Added to `users` table:
- `slack_bot_token` (text)
- `slack_team_id` (text)

## How It Works (BYOB Mode)

1. User creates their own Slack app at https://api.slack.com/apps
2. They install it to their workspace and get the bot token (xoxb-...)
3. They paste that token in the Clawer dashboard
4. We validate it and store it
5. They configure Event Subscriptions in Slack to point to: `https://clawer.ai/api/slack/events`
6. When someone DMs the bot, Slack sends events to our webhook
7. We look up the user by their `slack_team_id`
8. Route the message to Kimi API
9. Send the AI response back to Slack

## User Setup Steps

### For Users:

1. Go to https://clawer.ai/dashboard (must be subscribed)
2. Click the Slack card
3. Follow the step-by-step instructions:
   - Create Slack app
   - Add bot scopes: `chat:write`, `im:history`, `im:read`, `im:write`
   - Install to workspace
   - Copy bot token
   - Enable Event Subscriptions
   - Set Request URL: `https://clawer.ai/api/slack/events`
   - Subscribe to bot event: `message.im`
   - Paste bot token into Clawer

### For You (Keith):

The integration is **fully operational**. Users can connect their Slack bots right now.

## Testing the Integration

1. Create a test Slack workspace (or use existing)
2. Follow the setup instructions at `/dashboard/slack`
3. DM your Slack bot: "Summarize the benefits of AI"
4. You should get a Kimi-powered response

## Security Notes

- Bot tokens are stored in plaintext (consider encrypting in production)
- Each user brings their own bot (BYOB) - no shared bot token
- Slack validates webhooks via URL verification challenge (handled)

## Dashboard Updates

The Slack card on `/dashboard` now shows:
- "Click to setup" badge (instead of "Coming soon")
- Links to `/dashboard/slack` for subscribed users

## Files Modified/Created

**Created:**
- `src/lib/slack/client.ts`
- `src/app/api/slack/connect/route.ts`
- `src/app/api/slack/events/route.ts`
- `src/app/dashboard/slack/page.tsx`

**Modified:**
- `src/lib/db/schema/users.ts` (added Slack fields)
- `src/app/dashboard/page.tsx` (made Slack card clickable)

**Database Migration:**
```sql
ALTER TABLE users 
  ADD COLUMN slack_bot_token text,
  ADD COLUMN slack_team_id text;
```

**Dependencies Added:**
```bash
npm install @slack/bolt @slack/web-api
```

## Known Limitations

- **BYOB only**: Users must create their own Slack app (no OAuth flow yet)
- **DMs only**: Bot responds to direct messages (can be expanded to mentions)
- **No conversation memory**: Each message is independent (can add later)
- **No typing indicators**: Could add "is typing..." animation

## Future Enhancements

1. **OAuth Flow**: Add "Add to Slack" button for one-click setup
2. **Conversation Memory**: Store message history for context-aware responses
3. **Channel Support**: Respond to @mentions in channels (requires additional scopes)
4. **Rich Formatting**: Use Slack blocks for better message formatting
5. **Slash Commands**: Add `/clawer` command support
6. **Multi-Bot**: Allow users to connect multiple Slack workspaces

## Troubleshooting

**Bot not responding?**
- Check that Event Subscriptions are enabled in Slack app settings
- Verify Request URL shows a green checkmark
- Make sure `message.im` bot event is subscribed
- Check PM2 logs: `ssh root@YOUR_DOCKER_HOST "pm2 logs clawer --lines 50"`

**"Invalid bot token" error?**
- Make sure user copied the Bot User OAuth Token (starts with `xoxb-`)
- NOT the signing secret or app token

**Slack webhook timing out?**
- We process messages async to avoid Slack's 3-second timeout
- Check server logs for actual errors

## Deployment Notes

Built and deployed on server at:
```bash
ssh root@YOUR_DOCKER_HOST
cd /opt/clawer
pm2 restart clawer
```

Webhook endpoint: https://clawer.ai/api/slack/events

## Summary

✅ Slack bot integration is live  
✅ Users can connect their workspace today  
✅ Messages routed to Kimi AI  
✅ Responses sent back to Slack  
✅ Full setup instructions in dashboard  
✅ Database migrations applied  

**The feature is complete and ready for users!**
