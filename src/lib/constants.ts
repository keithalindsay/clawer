export const FREE_TIER_PORT = parseInt(process.env.FREE_TIER_PORT || '4000', 10);
export const FREE_TIER_TOKEN = process.env.FREE_TIER_TOKEN || 'free_tier_shared_2026_clawer';
export const FREE_MESSAGE_LIMIT = 200;
export const FREE_DAILY_LIMIT = 10;

/** Maximum message length in characters (32KB) */
export const MAX_MESSAGE_LENGTH = 32_768;
