// Launch Engine shared types

export type ContentPillar = 'security' | 'ease' | 'ai-teams' | 'use-cases' | 'education';
export type ContentVoice = 'founder' | 'brand';
export type ContentStatus = 'queued' | 'approved' | 'scheduled' | 'published' | 'killed';
export type SourceType =
  | 'trending-topic'
  | 'blog-promotion'
  | 'build-in-public'
  | 'competitor-reaction'
  | 'community-engagement'
  | 'content-pillar'
  | 'campaign';

export interface GateScores {
  voice: number;
  accuracy: number;
  engagement: number;
  guidelines: number;
}

export interface GateFlag {
  type: string;
  detail: string;
  severity: 'warning' | 'error';
}

export interface TweetDraft {
  id: string;
  voice: ContentVoice;
  pillar: ContentPillar;
  sourceType: SourceType;
  sourceRef?: { label: string; url?: string };
  body: string;
  charCount: number;
  status: ContentStatus;
  gateScore: number;
  gateScores: GateScores;
  gateFlags: GateFlag[];
  scheduledAt?: string;
  createdAt: string;
}

export interface QueueStats {
  totalDrafts: number;
  approved: number;
  scheduledToday: number;
  pillarBalance: Record<ContentPillar, number>; // percentage 0-100
}

export interface WeekStats {
  contentPublished: number;
  engagementRate: number;
  signups: number;
  topPerformer: { text: string; engagement: number };
  pillarBalance: Record<ContentPillar, number>;
  insight: string;
}

export interface TodaySummary {
  draftsAwaitingReview: number;
  scheduledToday: number;
  scheduledItems: string[];
  yesterdayReach: number;
  yesterdayEngagement: number;
  activeCampaign?: { name: string; day: number; totalDays: number };
}
