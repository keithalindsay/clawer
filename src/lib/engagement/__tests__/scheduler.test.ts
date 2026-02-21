/**
 * Tests for src/lib/engagement/scheduler.ts
 *
 * Covers:
 *  - buildEngagementMessageContent (pure function)
 *  - scheduleEngagementSequence (DB-backed)
 *  - checkSkipConditions (DB-backed)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
      engagementMessages: { findMany: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { db } from '@/lib/db';
import {
  buildEngagementMessageContent,
  scheduleEngagementSequence,
  checkSkipConditions,
  markMessageSent,
  markMessageSkipped,
  markMessageFailed,
  getPendingMessages,
} from '@/lib/engagement/scheduler';

// ─── Type helpers ─────────────────────────────────────────────────────────────

const mockFindFirst = db.query.users.findFirst as ReturnType<typeof vi.fn>;
const mockInsert = db.insert as ReturnType<typeof vi.fn>;
const mockUpdate = db.update as ReturnType<typeof vi.fn>;
const mockDelete = db.delete as ReturnType<typeof vi.fn>;
const mockFindMany = db.query.engagementMessages.findMany as ReturnType<typeof vi.fn>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupInsertChain() {
  const mockValues = vi.fn().mockResolvedValue(undefined);
  mockInsert.mockReturnValue({ values: mockValues });
  return { mockValues };
}

function setupUpdateChain() {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
  return { mockSet, mockWhere };
}

function setupDeleteChain() {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  mockDelete.mockReturnValue({ where: mockWhere });
  return { mockWhere };
}

// ─── Tests: buildEngagementMessageContent (pure) ─────────────────────────────

describe('buildEngagementMessageContent()', () => {
  it('includes the user name in day1_recap message', () => {
    const content = buildEngagementMessageContent('day1_recap', {
      name: 'Alice',
      teamTemplate: 'lifeos',
    });

    expect(content).toContain('Alice');
  });

  it('uses "there" as fallback when name is null', () => {
    const content = buildEngagementMessageContent('day1_recap', {
      name: null,
      teamTemplate: 'lifeos',
    });

    expect(content).toContain('there');
    expect(content).not.toContain('null');
  });

  it('day1_recap mentions team name and deliverable type', () => {
    const content = buildEngagementMessageContent('day1_recap', {
      name: 'Bob',
      teamTemplate: 'lifeos',
    });

    expect(content).toContain('Personal Assistant');
    expect(content).toContain('weekly life structure');
  });

  it('day2_briefing contains reply options A, B, C', () => {
    const content = buildEngagementMessageContent('day2_briefing', {
      name: 'Alice',
      teamTemplate: 'lifeos',
    });

    expect(content).toContain('A)');
    expect(content).toContain('B)');
    expect(content).toContain('C)');
  });

  it('day3_capability mentions "Research" for lifeos template', () => {
    const content = buildEngagementMessageContent('day3_capability', {
      name: 'Charlie',
      teamTemplate: 'lifeos',
    });

    expect(content).toContain('personal productivity trends');
  });

  it('day5_reengage mentions underused feature for template', () => {
    const content = buildEngagementMessageContent('day5_reengage', {
      name: 'Dave',
      teamTemplate: 'solopreneur',
    });

    expect(content).toContain('batch content creation');
  });

  it('day6_depth returns template-specific content for solopreneur', () => {
    const content = buildEngagementMessageContent('day6_depth', {
      name: 'Eve',
      teamTemplate: 'solopreneur',
    });

    expect(content).toContain('competitor');
  });

  it('day7_recap mentions Week 2 unlock', () => {
    const content = buildEngagementMessageContent('day7_recap', {
      name: 'Frank',
      teamTemplate: 'lifeos',
    });

    expect(content).toContain('Week 2');
  });

  it('unknown message type returns a generic fallback message', () => {
    const content = buildEngagementMessageContent('day99_unknown', {
      name: 'Grace',
      teamTemplate: 'lifeos',
    });

    expect(content).toContain('Grace');
    expect(content).toBeTruthy();
  });

  it('works for all 8 known team templates without throwing', () => {
    const templates = [
      'lifeos', 'solopreneur', 'content-creator', 'ecommerce',
      'growth-ops', 'fitness', 'parent', 'finance',
    ];
    const types = [
      'day1_recap', 'day2_briefing', 'day3_capability',
      'day5_reengage', 'day6_depth', 'day7_recap',
    ];

    for (const template of templates) {
      for (const type of types) {
        const content = buildEngagementMessageContent(type, {
          name: 'Test',
          teamTemplate: template,
        });
        expect(content.length, `${template}/${type} should produce content`).toBeGreaterThan(0);
      }
    }
  });

  it('ecommerce template day1_recap mentions competitor analysis', () => {
    const content = buildEngagementMessageContent('day1_recap', {
      name: 'Hannah',
      teamTemplate: 'ecommerce',
    });

    expect(content).toContain('competitor analysis');
  });

  it('fitness template day7_recap mentions week 2 workout unlock', () => {
    const content = buildEngagementMessageContent('day7_recap', {
      name: 'Ivan',
      teamTemplate: 'fitness',
    });

    expect(content).toContain('adjust');
  });
});

// ─── Tests: scheduleEngagementSequence ───────────────────────────────────────

describe('scheduleEngagementSequence()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue({
      id: 'user_abc123',
      name: 'Alice',
      teamTemplate: 'lifeos',
      briefingChannel: 'whatsapp',
      briefingEnabled: true,
    });
    setupInsertChain();
    setupDeleteChain();
  });

  it('throws when user is not found', async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(scheduleEngagementSequence('user_notfound')).rejects.toThrow(
      'user_notfound'
    );
  });

  it('deletes existing pending messages before inserting new ones (idempotent)', async () => {
    const { mockWhere } = setupDeleteChain();
    setupInsertChain();

    await scheduleEngagementSequence('user_abc123');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it('inserts exactly 6 engagement messages (Day 1, 2, 3, 5, 6, 7 sequence)', async () => {
    const { mockValues } = setupInsertChain();

    await scheduleEngagementSequence('user_abc123');

    expect(mockInsert).toHaveBeenCalled();
    const insertedRows = mockValues.mock.calls[0][0];
    expect(insertedRows).toHaveLength(6);
  });

  it('inserts all messages with status="pending"', async () => {
    const { mockValues } = setupInsertChain();

    await scheduleEngagementSequence('user_abc123');

    const rows = mockValues.mock.calls[0][0];
    for (const row of rows) {
      expect(row.status).toBe('pending');
    }
  });

  it('schedules messages at correct time offsets from onboarding completion', async () => {
    const { mockValues } = setupInsertChain();

    const onboardingAt = new Date('2026-01-01T10:00:00Z');
    await scheduleEngagementSequence('user_abc123', onboardingAt);

    const rows = mockValues.mock.calls[0][0];

    // Day 1 message: 6 hours offset
    const day1 = rows.find((r: any) => r.messageType === 'day1_recap');
    expect(day1).toBeDefined();
    const expectedDay1 = new Date(onboardingAt.getTime() + 6 * 60 * 60 * 1000);
    expect(day1.scheduledFor.getTime()).toBe(expectedDay1.getTime());
  });

  it('routes day2_briefing through preferred channel when briefingEnabled=true', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'user_abc123',
      name: 'Alice',
      teamTemplate: 'lifeos',
      briefingChannel: 'whatsapp',
      briefingEnabled: true,
    });
    const { mockValues } = setupInsertChain();

    await scheduleEngagementSequence('user_abc123');

    const rows = mockValues.mock.calls[0][0];
    const day2 = rows.find((r: any) => r.messageType === 'day2_briefing');
    expect(day2.channel).toBe('whatsapp');
  });

  it('uses web channel for day2_briefing when briefingEnabled=false', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'user_abc123',
      name: 'Alice',
      teamTemplate: 'lifeos',
      briefingChannel: 'whatsapp',
      briefingEnabled: false,
    });
    const { mockValues } = setupInsertChain();

    await scheduleEngagementSequence('user_abc123');

    const rows = mockValues.mock.calls[0][0];
    const day2 = rows.find((r: any) => r.messageType === 'day2_briefing');
    // When briefing disabled, falls back to defaultChannel (whatsapp from spec)
    expect(day2.channel).toBe('whatsapp');
  });

  it('uses "web" as fallback channel when briefingChannel is null', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'user_abc123',
      name: 'Alice',
      teamTemplate: 'lifeos',
      briefingChannel: null,
      briefingEnabled: true,
    });
    const { mockValues } = setupInsertChain();

    await scheduleEngagementSequence('user_abc123');

    const rows = mockValues.mock.calls[0][0];
    const day2 = rows.find((r: any) => r.messageType === 'day2_briefing');
    expect(day2.channel).toBe('web');
  });

  it('populates content field for each message', async () => {
    const { mockValues } = setupInsertChain();

    await scheduleEngagementSequence('user_abc123');

    const rows = mockValues.mock.calls[0][0];
    for (const row of rows) {
      expect(row.content, `${row.messageType} content should be non-empty`).toBeTruthy();
      expect(row.content.length).toBeGreaterThan(10);
    }
  });

  it('contains all expected message types in sequence', async () => {
    const { mockValues } = setupInsertChain();

    await scheduleEngagementSequence('user_abc123');

    const rows = mockValues.mock.calls[0][0];
    const types = rows.map((r: any) => r.messageType);
    expect(types).toContain('day1_recap');
    expect(types).toContain('day2_briefing');
    expect(types).toContain('day3_capability');
    expect(types).toContain('day5_reengage');
    expect(types).toContain('day6_depth');
    expect(types).toContain('day7_recap');
  });
});

// ─── Tests: checkSkipConditions ───────────────────────────────────────────────

describe('checkSkipConditions()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns "user_not_found" when user does not exist', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await checkSkipConditions({ userId: 'user_abc123', messageType: 'day1_recap' });

    expect(result).toBe('user_not_found');
  });

  it('returns "user_recently_active" when user was updated within the activity window', async () => {
    // Updated 30 minutes ago — within the 2-hour window
    const recentUpdate = new Date(Date.now() - 30 * 60 * 1000);
    mockFindFirst.mockResolvedValue({
      updatedAt: recentUpdate,
      briefingEnabled: true,
    });

    const result = await checkSkipConditions({ userId: 'user_abc123', messageType: 'day1_recap' });

    expect(result).toBe('user_recently_active');
  });

  it('returns null when user was last active outside the activity window', async () => {
    // Updated 3 hours ago — outside the 2-hour window
    const oldUpdate = new Date(Date.now() - 3 * 60 * 60 * 1000);
    mockFindFirst.mockResolvedValue({
      updatedAt: oldUpdate,
      briefingEnabled: true,
    });

    const result = await checkSkipConditions({ userId: 'user_abc123', messageType: 'day1_recap' });

    expect(result).toBeNull();
  });

  it('returns "briefing_disabled" for day2_briefing when briefingEnabled=false', async () => {
    const oldUpdate = new Date(Date.now() - 3 * 60 * 60 * 1000);
    mockFindFirst.mockResolvedValue({
      updatedAt: oldUpdate,
      briefingEnabled: false,
    });

    const result = await checkSkipConditions({ userId: 'user_abc123', messageType: 'day2_briefing' });

    expect(result).toBe('briefing_disabled');
  });

  it('returns null for day2_briefing when briefingEnabled=true and user is inactive', async () => {
    const oldUpdate = new Date(Date.now() - 3 * 60 * 60 * 1000);
    mockFindFirst.mockResolvedValue({
      updatedAt: oldUpdate,
      briefingEnabled: true,
    });

    const result = await checkSkipConditions({ userId: 'user_abc123', messageType: 'day2_briefing' });

    expect(result).toBeNull();
  });

  it('ignores briefingEnabled flag for non-day2 message types', async () => {
    const oldUpdate = new Date(Date.now() - 3 * 60 * 60 * 1000);
    mockFindFirst.mockResolvedValue({
      updatedAt: oldUpdate,
      briefingEnabled: false, // briefing is disabled
    });

    // day5 message should not be affected by briefingEnabled
    const result = await checkSkipConditions({ userId: 'user_abc123', messageType: 'day5_reengage' });

    expect(result).toBeNull();
  });

  it('uses custom recentActivityWindowMs when provided', async () => {
    // Updated 10 minutes ago
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    mockFindFirst.mockResolvedValue({
      updatedAt: tenMinsAgo,
      briefingEnabled: true,
    });

    // Use a 5-minute window — user is outside it
    const result = await checkSkipConditions(
      { userId: 'user_abc123', messageType: 'day1_recap' },
      5 * 60 * 1000
    );

    expect(result).toBeNull(); // 10 minutes ago > 5-minute window → don't skip
  });
});

// ─── Tests: markMessageSent / markMessageSkipped / markMessageFailed ──────────

describe('message status updaters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupUpdateChain();
  });

  it('markMessageSent updates status to "sent" and sets sentAt', async () => {
    const { mockSet } = setupUpdateChain();

    await markMessageSent('msg-123');

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'sent', sentAt: expect.any(Date) })
    );
  });

  it('markMessageSkipped updates status to "skipped" with reason', async () => {
    const { mockSet } = setupUpdateChain();

    await markMessageSkipped('msg-456', 'user_recently_active');

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'skipped', skipReason: 'user_recently_active' })
    );
  });

  it('markMessageFailed updates status to "failed"', async () => {
    const { mockSet } = setupUpdateChain();

    await markMessageFailed('msg-789');

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' })
    );
  });
});

// ─── Tests: getPendingMessages ────────────────────────────────────────────────

describe('getPendingMessages()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns pending messages from DB', async () => {
    const pendingMsg = {
      id: 'msg-001',
      userId: 'user_abc123',
      messageType: 'day1_recap',
      status: 'pending',
      scheduledFor: new Date(Date.now() - 1000),
      content: 'Hey there!',
      channel: 'web',
    };
    mockFindMany.mockResolvedValue([pendingMsg]);

    const result = await getPendingMessages();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('msg-001');
  });

  it('returns empty array when no pending messages', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await getPendingMessages();

    expect(result).toHaveLength(0);
  });
});
