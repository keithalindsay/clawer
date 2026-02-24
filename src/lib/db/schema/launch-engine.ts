import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  boolean,
  pgEnum,
  numeric,
  bigint,
  date,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ══════════════════════════════════════════════════════════════════════════
// Enums
// ══════════════════════════════════════════════════════════════════════════

/**
 * Content type — the kind of content being created
 */
export const contentTypeEnum = pgEnum('content_type', [
  'tweet',
  'blog',
  'thread',
  'reddit',
  'linkedin',
  'newsletter',
  'email',
]);

/**
 * Content voice — which persona/account generates or posts
 */
export const contentVoiceEnum = pgEnum('content_voice', ['founder', 'brand']);

/**
 * Source type — what prompted this content to be created
 */
export const contentSourceTypeEnum = pgEnum('content_source_type', [
  'trending',
  'blog-promo',
  'build-in-public',
  'competitor',
  'community',
  'campaign',
  'manual',
]);

/**
 * Content lifecycle status
 * generating → gate-review → queued / failed-gate → approved → scheduled → published / killed
 */
export const contentStatusEnum = pgEnum('content_status', [
  'generating',
  'gate-review',
  'failed-gate',
  'queued',
  'approved',
  'scheduled',
  'published',
  'killed',
]);

/**
 * Campaign status
 */
export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
]);

// ══════════════════════════════════════════════════════════════════════════
// content_items
// ══════════════════════════════════════════════════════════════════════════

/**
 * Content items — tweets, blogs, threads, and all other generated content.
 *
 * Phase 0 scope: tweet + thread content types only.
 * The full lifecycle (generating → gate-review → queued → approved → scheduled → published)
 * is modelled here from day one so future phases require no schema changes.
 *
 * workspace_id maps to users.id (workspaces are not yet a first-class entity in Clawer).
 */
export const contentItems = pgTable('content_items', {
  /** Unique content item ID */
  id: uuid('id').primaryKey().defaultRandom(),

  /**
   * Workspace owner (maps to users.id until multi-workspace is introduced).
   */
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /** Optional campaign this item belongs to */
  campaignId: uuid('campaign_id'), // FK added via Drizzle relation; skipping inline .references() to avoid circular dep

  /** Content type */
  contentType: contentTypeEnum('content_type').notNull(),

  /** Which voice generated this content */
  voice: contentVoiceEnum('voice'),

  /** Content pillar (maps to brand_config.content_pillars) */
  contentPillar: text('content_pillar'),

  /** What sourced / inspired this content */
  sourceType: contentSourceTypeEnum('source_type'),

  /**
   * Source reference — URL, tweet ID, or brief that inspired this item.
   * Example: { type: "tweet", url: "https://x.com/...", id: "1234567" }
   */
  sourceRef: jsonb('source_ref'),

  // ── Content ──────────────────────────────────────────────────────────

  /** Title (for blogs and threads) */
  title: text('title'),

  /** Markdown body */
  bodyMd: text('body_md'),

  /**
   * Platform-specific formatted versions.
   * Example: { x: "280-char version", linkedin: "long-form version" }
   */
  bodyPlatform: jsonb('body_platform'),

  /** Attached images/videos — array of URLs */
  mediaUrls: jsonb('media_urls'),

  // ── Lifecycle ─────────────────────────────────────────────────────────

  /** Current lifecycle status */
  status: contentStatusEnum('status').notNull().default('generating'),

  /** When this item is scheduled to be published */
  scheduledAt: timestamp('scheduled_at'),

  /** When this item was actually published */
  publishedAt: timestamp('published_at'),

  /** URL of the published content (tweet URL, blog URL, etc.) */
  publishedUrl: text('published_url'),

  // ── Quality Gate ──────────────────────────────────────────────────────

  /** Composite quality gate score (0.0 – 10.0) */
  gateScore: numeric('gate_score', { precision: 3, scale: 1 }),

  /**
   * Per-dimension scores from the quality gate.
   * Example: { voice: 8, accuracy: 7, engagement: 9, guidelines: 8 }
   */
  gateScores: jsonb('gate_scores'),

  /**
   * Flags raised by the quality gate.
   * Example: [{ type: "banned-phrase", detail: "seamless", severity: "warning" }]
   */
  gateFlags: jsonb('gate_flags'),

  /** Whether the content passed the quality gate */
  gatePassed: boolean('gate_passed'),

  /** When the quality gate review completed */
  gateReviewedAt: timestamp('gate_reviewed_at'),

  // ── Metadata ──────────────────────────────────────────────────────────

  /** Word count of the body */
  wordCount: integer('word_count'),

  /** Character count of the body */
  charCount: integer('char_count'),

  /** SEO keywords (for blog content) — array of strings */
  seoKeywords: jsonb('seo_keywords'),

  /** Target platform/account (e.g., "@Vavier", "@teamclawer", "clawer.ai/blog") */
  targetChannel: text('target_channel'),

  /** When this record was created */
  createdAt: timestamp('created_at').notNull().defaultNow(),

  /** When this record was last updated */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;

// ══════════════════════════════════════════════════════════════════════════
// thread_items
// ══════════════════════════════════════════════════════════════════════════

/**
 * Thread items — ordered individual tweets within a tweet thread.
 *
 * A thread is a single content_item record (contentType = 'thread').
 * Each constituent tweet is a thread_item with an ordinal position.
 */
export const threadItems = pgTable('thread_items', {
  /** Unique thread item ID */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Parent thread (content_items row with contentType = 'thread') */
  contentId: uuid('content_id')
    .notNull()
    .references(() => contentItems.id, { onDelete: 'cascade' }),

  /** 1-based position within the thread */
  position: integer('position').notNull(),

  /** Text of this tweet (max 280 chars) */
  body: text('body').notNull(),

  /** Character count */
  charCount: integer('char_count'),

  /** Optional media attachment for this tweet */
  mediaUrl: text('media_url'),

  /** When this record was created */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ThreadItem = typeof threadItems.$inferSelect;
export type NewThreadItem = typeof threadItems.$inferInsert;

// ══════════════════════════════════════════════════════════════════════════
// campaigns
// ══════════════════════════════════════════════════════════════════════════

/**
 * Campaigns — groups of related content assets sharing a brief, goal, and schedule.
 *
 * Phase 0: table created but not actively used in the UI.
 * Phase 2 (Campaign Manager) wires content_items to campaigns and adds drip scheduling.
 */
export const campaigns = pgTable('campaigns', {
  /** Unique campaign ID */
  id: uuid('id').primaryKey().defaultRandom(),

  /**
   * Workspace owner.
   */
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /** Campaign display name */
  name: text('name').notNull(),

  /** Full campaign brief text */
  brief: text('brief'),

  /** Campaign goal statement */
  goal: text('goal'),

  /** Target persona key (maps to brand_config.personas) */
  targetPersona: text('target_persona'),

  /**
   * Which content pillars this campaign targets.
   * Example: ["security", "use-cases"]
   */
  contentPillars: jsonb('content_pillars'),

  /** Campaign template name (e.g., "Security Week", "Product Launch") */
  template: text('template'),

  /** Current campaign status */
  status: campaignStatusEnum('status').notNull().default('draft'),

  /** Campaign start date (inclusive) */
  startDate: date('start_date'),

  /** Campaign end date (inclusive) */
  endDate: date('end_date'),

  // ── Aggregated performance (updated on analytics sync) ────────────────

  /** Total impressions across all campaign content */
  totalReach: bigint('total_reach', { mode: 'number' }).default(0),

  /** Average engagement rate across all campaign content */
  totalEngagement: numeric('total_engagement', { precision: 5, scale: 2 }).default('0'),

  /** Total signups attributed to this campaign */
  totalSignups: integer('total_signups').default(0),

  /** When this record was created */
  createdAt: timestamp('created_at').notNull().defaultNow(),

  /** When this record was last updated */
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

// ══════════════════════════════════════════════════════════════════════════
// content_metrics
// ══════════════════════════════════════════════════════════════════════════

/**
 * Content engagement metrics — per content item, per platform snapshot.
 *
 * Multiple rows per content_item are expected (one per analytics fetch).
 * The most recent row represents current metrics; historical rows allow
 * trend analysis.
 *
 * Phase 3 (Analytics Loop) adds the fetch scheduler; this table is ready.
 */
export const contentMetrics = pgTable('content_metrics', {
  /** Unique metrics row ID */
  id: uuid('id').primaryKey().defaultRandom(),

  /** Content item these metrics belong to */
  contentId: uuid('content_id')
    .notNull()
    .references(() => contentItems.id, { onDelete: 'cascade' }),

  /** Platform these metrics were pulled from (e.g., "x", "reddit", "blog") */
  platform: text('platform').notNull(),

  // ── Social metrics ────────────────────────────────────────────────────

  /** Total impressions / reach */
  impressions: bigint('impressions', { mode: 'number' }).default(0),

  /** Likes / hearts / upvotes */
  likes: integer('likes').default(0),

  /** Retweets / shares / crossposts */
  retweets: integer('retweets').default(0),

  /** Replies / comments */
  replies: integer('replies').default(0),

  /** Link clicks */
  clicks: integer('clicks').default(0),

  /** Generic shares (LinkedIn, email, etc.) */
  shares: integer('shares').default(0),

  // ── Blog / long-form metrics ──────────────────────────────────────────

  /** Page views */
  pageViews: integer('page_views').default(0),

  /** Average time on page in seconds */
  timeOnPage: integer('time_on_page'),

  /** Bounce rate as a percentage (0.00 – 100.00) */
  bounceRate: numeric('bounce_rate', { precision: 5, scale: 2 }),

  /** Scroll depth as a percentage (0.00 – 100.00) */
  scrollDepth: numeric('scroll_depth', { precision: 5, scale: 2 }),

  // ── Attribution ───────────────────────────────────────────────────────

  /** Signups attributed to this content item */
  signups: integer('signups').default(0),

  /** When this metrics snapshot was fetched from the platform */
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),

  /** When this record was created */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ContentMetrics = typeof contentMetrics.$inferSelect;
export type NewContentMetrics = typeof contentMetrics.$inferInsert;
