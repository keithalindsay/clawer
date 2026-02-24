/**
 * Launch Engine — X/Twitter Integration Service
 *
 * Posts tweets and threads via the `bird` CLI tool (cookie-auth, no API key required).
 * bird binary: ~/.bun/bin/bird
 * Requires Node 22+ for sqlite/node:sqlite support with Firefox cookies.
 *
 * Account mapping:
 *   'founder' → @Vavier  (uses bird's default config or FOUNDER_CT0/FOUNDER_AUTH_TOKEN env)
 *   'brand'   → @teamclawer (uses BRAND_CT0/BRAND_AUTH_TOKEN env)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema/launch-engine';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);

// ─── Constants ─────────────────────────────────────────────────────────────

const BIRD_BIN = process.env.BIRD_BIN ?? '/home/keith/.bun/bin/bird';
const NVM_INIT = 'source /home/keith/.nvm/nvm.sh && nvm use 22 >/dev/null 2>&1';

/** Max characters allowed per tweet */
const TWEET_MAX_CHARS = 280;

/** Delay between thread tweets (ms) to avoid rate-limit issues */
const THREAD_DELAY_MS = 1500;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TweetResult {
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}

export interface ThreadResult {
  success: boolean;
  /** Tweet IDs in posting order */
  tweetIds: string[];
  /** URLs in posting order */
  tweetUrls: string[];
  /** First tweet's URL — the canonical thread URL */
  threadUrl?: string;
  error?: string;
}

export interface TweetMetrics {
  tweetId: string;
  /** Display text of the tweet */
  text?: string;
  /** Like count */
  likes: number;
  /** Retweet count */
  retweets: number;
  /** Reply count */
  replies: number;
  /** View / impression count (if available) */
  impressions?: number;
  fetchedAt: Date;
}

// ─── Internal helpers ──────────────────────────────────────────────────────

/**
 * Build the bird CLI invocation for a given account.
 * Uses environment-variable credentials when available so we can support
 * multiple accounts without switching Firefox profiles.
 *
 * Env vars:
 *   FOUNDER_AUTH_TOKEN / FOUNDER_CT0  — for the founder (@Vavier) account
 *   BRAND_AUTH_TOKEN   / BRAND_CT0    — for the brand (@teamclawer) account
 *
 * Falls back to bird's default config (~/.config/bird/config.json5) when
 * env vars are absent (bird auto-loads the config file).
 */
function buildBirdBase(account: 'founder' | 'brand'): string {
  const parts: string[] = [`${NVM_INIT} && node ${BIRD_BIN}`];

  if (account === 'founder') {
    const authToken = process.env.FOUNDER_AUTH_TOKEN;
    const ct0 = process.env.FOUNDER_CT0;
    if (authToken && ct0) {
      parts.push(`--auth-token "${authToken}" --ct0 "${ct0}"`);
    }
    // Otherwise fall through to bird's config file (already set up for @Vavier)
  } else {
    // brand account — must be explicitly configured
    const authToken = process.env.BRAND_AUTH_TOKEN;
    const ct0 = process.env.BRAND_CT0;
    if (authToken && ct0) {
      parts.push(`--auth-token "${authToken}" --ct0 "${ct0}"`);
    } else {
      // Try a named Firefox profile if env vars not set
      const profile = process.env.BRAND_FIREFOX_PROFILE ?? 'brand';
      parts.push(`--cookie-source firefox --firefox-profile "${profile}"`);
    }
  }

  parts.push('--plain --no-color');
  return parts.join(' ');
}

/** Parse tweet ID from bird output (URL form or bare ID) */
function parseTweetId(output: string): string | undefined {
  // bird --plain outputs something like:
  //   Tweet posted — https://x.com/Vavier/status/1234567890123456789
  // or just the URL on its own line
  const urlMatch = output.match(/https:\/\/(?:x|twitter)\.com\/\S+\/status\/(\d+)/i);
  if (urlMatch) return urlMatch[1];

  // Bare numeric ID on its own line
  const idMatch = output.trim().match(/^(\d{15,20})$/m);
  if (idMatch) return idMatch[1];

  return undefined;
}

/** Build the canonical X.com URL for a tweet */
function tweetUrl(tweetId: string, account: 'founder' | 'brand'): string {
  const handle = account === 'founder' ? 'Vavier' : 'teamclawer';
  return `https://x.com/${handle}/status/${tweetId}`;
}

/** Escape double-quotes in tweet text for safe shell embedding */
function shellEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

/** Millisecond sleep */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Post a single tweet via bird CLI.
 *
 * @param text    - Tweet text (will be formatted/truncated if needed)
 * @param account - 'founder' (@Vavier) or 'brand' (@teamclawer)
 */
export async function postTweet(
  text: string,
  account: 'founder' | 'brand' = 'founder',
): Promise<TweetResult> {
  const formatted = formatForX(text);
  if (!formatted) {
    return { success: false, error: 'Tweet text is empty after formatting' };
  }

  const base = buildBirdBase(account);
  const cmd = `${base} tweet "${shellEscape(formatted)}"`;

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      shell: '/bin/bash',
      timeout: 30_000,
    });

    const output = stdout + (stderr ?? '');
    const id = parseTweetId(output);

    if (!id) {
      console.error('[x-service] postTweet: could not parse tweet ID from output:', output);
      return { success: false, error: `bird output did not contain tweet ID. Output: ${output.slice(0, 300)}` };
    }

    const url = tweetUrl(id, account);
    console.log(`[x-service] postTweet ✅  ${url}`);
    return { success: true, tweetId: id, tweetUrl: url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[x-service] postTweet error:', message);
    return { success: false, error: message };
  }
}

/**
 * Post a tweet thread via bird CLI.
 *
 * Posts the first tweet, then chains each subsequent tweet as a reply to the
 * previous one to form a native Twitter thread.
 *
 * @param tweets  - Ordered array of tweet texts
 * @param account - 'founder' (@Vavier) or 'brand' (@teamclawer)
 */
export async function postThread(
  tweets: string[],
  account: 'founder' | 'brand' = 'founder',
): Promise<ThreadResult> {
  if (!tweets.length) {
    return { success: false, tweetIds: [], tweetUrls: [], error: 'No tweets provided' };
  }

  const tweetIds: string[] = [];
  const tweetUrls: string[] = [];

  // Post first tweet
  const first = await postTweet(tweets[0], account);
  if (!first.success || !first.tweetId) {
    return {
      success: false,
      tweetIds: [],
      tweetUrls: [],
      error: first.error ?? 'Failed to post first tweet',
    };
  }
  tweetIds.push(first.tweetId);
  tweetUrls.push(first.tweetUrl!);

  // Reply to previous tweet for each remaining tweet
  const base = buildBirdBase(account);

  for (let i = 1; i < tweets.length; i++) {
    await sleep(THREAD_DELAY_MS);

    const formatted = formatForX(tweets[i]);
    if (!formatted) {
      console.warn(`[x-service] postThread: tweet[${i}] empty after formatting — skipping`);
      continue;
    }

    const prevId = tweetIds[tweetIds.length - 1];
    const cmd = `${base} reply ${prevId} "${shellEscape(formatted)}"`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        shell: '/bin/bash',
        timeout: 30_000,
      });

      const output = stdout + (stderr ?? '');
      const id = parseTweetId(output);

      if (!id) {
        console.error(`[x-service] postThread: could not parse tweet ID for tweet[${i}]:`, output);
        // Partial failure — return what we have so far
        return {
          success: false,
          tweetIds,
          tweetUrls,
          threadUrl: tweetUrls[0],
          error: `Thread partially posted (${i}/${tweets.length}). Failed at tweet ${i + 1}: bird output missing ID`,
        };
      }

      const url = tweetUrl(id, account);
      tweetIds.push(id);
      tweetUrls.push(url);
      console.log(`[x-service] postThread tweet[${i}] ✅  ${url}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[x-service] postThread error at tweet[${i}]:`, message);
      return {
        success: false,
        tweetIds,
        tweetUrls,
        threadUrl: tweetUrls[0],
        error: `Thread partially posted (${i}/${tweets.length}). Error at tweet ${i + 1}: ${message}`,
      };
    }
  }

  return {
    success: true,
    tweetIds,
    tweetUrls,
    threadUrl: tweetUrls[0],
  };
}

/**
 * Store a scheduled tweet in the DB.
 * Actual posting is handled by the scheduler cron (see scheduler.ts).
 *
 * @param contentId   - UUID of the content_item to schedule
 * @param scheduledAt - When to post
 */
export async function scheduleTweet(contentId: string, scheduledAt: Date): Promise<void> {
  await db
    .update(contentItems)
    .set({
      status: 'scheduled',
      scheduledAt,
      updatedAt: new Date(),
    })
    .where(eq(contentItems.id, contentId));

  console.log(`[x-service] scheduleTweet: content ${contentId} scheduled for ${scheduledAt.toISOString()}`);
}

/**
 * Fetch engagement metrics for a posted tweet via bird CLI.
 *
 * Uses `bird read <id> --json` and maps the response to TweetMetrics.
 * Note: bird reads using the configured account's cookies, so metrics are
 * available regardless of which account posted the tweet.
 *
 * @param tweetId - Numeric tweet ID string
 */
export async function getPostedTweetMetrics(tweetId: string): Promise<TweetMetrics> {
  // Read using founder cookies (read-only — doesn't matter which account)
  const base = buildBirdBase('founder');
  const cmd = `${base} read ${tweetId} --json`;

  try {
    const { stdout } = await execAsync(cmd, {
      shell: '/bin/bash',
      timeout: 15_000,
    });

    // bird --json outputs a JSON object
    const data = JSON.parse(stdout.trim()) as {
      text?: string;
      public_metrics?: {
        like_count?: number;
        retweet_count?: number;
        reply_count?: number;
        impression_count?: number;
        quote_count?: number;
        view_count?: number;
      };
    };

    const m = data.public_metrics ?? {};

    return {
      tweetId,
      text: data.text,
      likes: m.like_count ?? 0,
      retweets: (m.retweet_count ?? 0) + (m.quote_count ?? 0),
      replies: m.reply_count ?? 0,
      impressions: m.impression_count ?? m.view_count,
      fetchedAt: new Date(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[x-service] getPostedTweetMetrics error:', message);
    // Return zeroed metrics rather than throwing so callers can continue
    return {
      tweetId,
      likes: 0,
      retweets: 0,
      replies: 0,
      fetchedAt: new Date(),
    };
  }
}

/**
 * Format content for X/Twitter.
 *
 * Rules:
 *   - Strip leading/trailing whitespace
 *   - If <= 280 chars: return as-is
 *   - If > 280 chars: truncate to 277 chars + "…" (3-char ellipsis)
 *
 * For multi-tweet content (threads), split BEFORE calling this — each tweet
 * in the array is formatted individually by postThread().
 *
 * @param content - Raw content string
 * @returns Formatted string, guaranteed to be <= 280 chars
 */
export function formatForX(content: string): string {
  const trimmed = content.trim();

  if (trimmed.length === 0) return '';
  if (trimmed.length <= TWEET_MAX_CHARS) return trimmed;

  // Hard-truncate to 277 chars + ellipsis
  return trimmed.slice(0, TWEET_MAX_CHARS - 3) + '…';
}

/**
 * Split a long piece of content into tweet-sized chunks for a thread.
 *
 * Splits on sentence boundaries where possible. Each chunk is ≤ 280 chars.
 * Prepends "N/" numbering if the thread is > 1 tweet.
 *
 * @param content - Full content text
 * @returns Array of tweet strings, each ≤ 280 chars
 */
export function splitIntoThread(content: string): string[] {
  const sentences = content.match(/[^.!?\n]+[.!?\n]*/g) ?? [content];
  const tweets: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence.trim()}` : sentence.trim();
    if (candidate.length <= TWEET_MAX_CHARS) {
      current = candidate;
    } else {
      if (current) tweets.push(current.trim());
      // If a single sentence exceeds limit, truncate it
      current = sentence.trim().slice(0, TWEET_MAX_CHARS);
    }
  }
  if (current.trim()) tweets.push(current.trim());

  // Add "N/" thread numbering when there are multiple tweets
  if (tweets.length > 1) {
    return tweets.map((t, i) => {
      const prefix = `${i + 1}/${tweets.length} `;
      // Re-truncate if numbering pushes over limit
      if (prefix.length + t.length > TWEET_MAX_CHARS) {
        return prefix + t.slice(0, TWEET_MAX_CHARS - prefix.length - 3) + '…';
      }
      return prefix + t;
    });
  }

  return tweets;
}
