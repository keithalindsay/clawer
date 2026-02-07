-- Add Telegram bot token and username fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_bot_username TEXT;
