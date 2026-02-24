/**
 * Launch Engine — Core TypeScript Types
 * All shared types for content pipeline, quality gate, campaigns, and metrics.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ContentStatus =
  | 'generating'
  | 'gate-review'
  | 'failed-gate'
  | 'queued'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'killed';

export type ContentType =
  | 'tweet'
  | 'blog'
  | 'thread'
  | 'reddit'
  | 'linkedin'
  | 'newsletter'
  | 'email';

export type Voice = 'founder' | 'brand';

export type SourceType =
  | 'trending'
  | 'blog-promo'
  | 'build-in-public'
  | 'competitor'
  | 'community'
  | 'campaign'
  | 'manual';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type ContentDecisionAction = 'approved' | 'edited' | 'killed' | 'promoted' | 'rescheduled';

export type DistributionStatus = 'pending' | 'posting' | 'posted' | 'failed' | 'retrying';

export type GateFlagType =
  | 'off-brand-language'
  | 'unverified-claim'
  | 'competitor-violation'
  | 'banned-phrase'
  | 'legal-risk'
  | 'hype-language'
  | 'vocabulary-violation'
  | 'engagement-low'
  | 'guidelines-violation';

export type GateFlagSeverity = 'error' | 'warning' | 'info';

// ─── Content Items ────────────────────────────────────────────────────────────

export interface SourceRef {
  url?: string;
  tweetId?: string;
  briefText?: string;
  [key: string]: unknown;
}

export interface ContentItem {
  id: string;
  workspaceId: string;
  campaignId?: string;
  contentType: ContentType;
  voice: Voice;
  contentPillar?: string;
  sourceType: SourceType;
  sourceRef?: SourceRef;

  // Content
  title?: string;
  bodyMd: string;
  bodyPlatform?: Record<string, string>; // platform-specific formatted versions
  mediaUrls?: string[];

  // Lifecycle
  status: ContentStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  publishedUrl?: string;

  // Quality Gate
  gateScore?: number;
  gateScores?: QualityGateScore;
  gateFlags?: GateFlag[];
  gatePassed?: boolean;
  gateReviewedAt?: Date;

  // Metadata
  wordCount?: number;
  charCount?: number;
  seoKeywords?: string[];
  targetChannel?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadItem {
  id: string;
  contentId: string; // parent thread
  position: number;
  body: string;
  charCount: number;
  mediaUrl?: string;
  createdAt: Date;
}

// ─── Campaigns ────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  brief?: string;
  goal?: string;
  targetPersona?: string;
  contentPillars?: string[];
  template?: string;

  status: CampaignStatus;
  startDate?: Date;
  endDate?: Date;

  // Performance (aggregated)
  totalReach: number;
  totalEngagement: number;
  totalSignups: number;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface ContentMetrics {
  id: string;
  contentId: string;
  platform: string;

  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  clicks: number;
  shares: number;

  // Blog-specific
  pageViews?: number;
  timeOnPage?: number; // seconds
  bounceRate?: number;
  scrollDepth?: number; // percentage

  // Attribution
  signups: number;

  fetchedAt: Date;
  createdAt: Date;
}

// ─── Quality Gate ─────────────────────────────────────────────────────────────

export interface GateFlag {
  type: GateFlagType;
  detail: string;
  severity: GateFlagSeverity;
  /** The exact text that triggered the flag, if applicable */
  match?: string;
  /** The dimension that generated this flag */
  dimension?: 'voice' | 'accuracy' | 'engagement' | 'guidelines';
}

export interface QualityGateScore {
  /** 0-10: Matches tone, uses preferred vocabulary, avoids banned phrases */
  voice: number;
  /** 0-10: Claims are sourced, numbers are cited, no hallucinated stats */
  accuracy: number;
  /** 0-10: Hook strength, CTA presence, shareability, format fit */
  engagement: number;
  /** 0-10: Competitor rules, legal bounds, content guidelines */
  guidelines: number;
}

export interface QualityGateResult {
  /** Composite score: average of all 4 dimensions */
  compositeScore: number;
  scores: QualityGateScore;
  flags: GateFlag[];
  /** true if compositeScore >= passThreshold */
  passed: boolean;
  passThreshold: number;
  /** Brief rationale per dimension */
  rationale: {
    voice: string;
    accuracy: string;
    engagement: string;
    guidelines: string;
  };
  reviewedAt: Date;
}

// ─── Vocabulary Check ────────────────────────────────────────────────────────

export interface VocabularyResult {
  score: number; // 0-10
  usedPreferred: string[];
  usedAvoid: string[];
  flags: GateFlag[];
}

export interface BannedPhraseResult {
  clean: boolean;
  found: string[];
  flags: GateFlag[];
}

// ─── Guidelines Check ────────────────────────────────────────────────────────

export interface GuidelinesResult {
  score: number; // 0-10
  flags: GateFlag[];
  competitorViolations: string[];
  legalViolations: string[];
  messagingTrapViolations: string[];
}
