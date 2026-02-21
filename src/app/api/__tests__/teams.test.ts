/**
 * Tests for /api/teams/current endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TEAM_CONFIGS, getTeamConfig, getAgentFromTeam } from '@/lib/teams';

describe('Team Configs', () => {
  it('should have all 8 team templates', () => {
    const expectedTeams = [
      'lifeos',
      'solopreneur',
      'ecommerce',
      'content-creator',
      'mom',
      'fitness',
      'finance',
      'growth-ops',
    ];
    
    expectedTeams.forEach(teamName => {
      expect(TEAM_CONFIGS[teamName]).toBeDefined();
    });
    
    expect(Object.keys(TEAM_CONFIGS).length).toBe(8);
  });

  it('should have required fields for each team', () => {
    Object.entries(TEAM_CONFIGS).forEach(([key, team]) => {
      expect(team.name, `${key} should have name`).toBeTruthy();
      expect(team.members, `${key} should have members`).toBeInstanceOf(Array);
      expect(team.members.length, `${key} should have at least 1 member`).toBeGreaterThan(0);
    });
  });

  it('should have required fields for each team member', () => {
    Object.entries(TEAM_CONFIGS).forEach(([teamKey, team]) => {
      team.members.forEach((member, idx) => {
        expect(member.id, `${teamKey}.members[${idx}] should have id`).toBeTruthy();
        expect(member.name, `${teamKey}.members[${idx}] should have name`).toBeTruthy();
        expect(member.role, `${teamKey}.members[${idx}] should have role`).toBeTruthy();
        // Emoji is optional but recommended
      });
    });
  });

  it('should have unique agent IDs within each team', () => {
    Object.entries(TEAM_CONFIGS).forEach(([teamKey, team]) => {
      const ids = team.members.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size, `${teamKey} should have unique agent IDs`).toBe(ids.length);
    });
  });

  it('should get team config by name', () => {
    const lifeos = getTeamConfig('lifeos');
    expect(lifeos).toBeDefined();
    expect(lifeos?.name).toBe('Personal Assistant');
    expect(lifeos?.members.length).toBeGreaterThan(0);
  });

  it('should return null for invalid team name', () => {
    const invalid = getTeamConfig('nonexistent-team');
    expect(invalid).toBeNull();
  });

  it('should get agent from team', () => {
    const scout = getAgentFromTeam('lifeos', 'researcher');
    expect(scout).toBeDefined();
    expect(scout?.name).toBe('Scout');
    expect(scout?.role).toBe('Research & Knowledge Manager');
  });

  it('should return null for invalid agent ID', () => {
    const invalid = getAgentFromTeam('lifeos', 'nonexistent-agent');
    expect(invalid).toBeNull();
  });

  it('should return null for invalid team when getting agent', () => {
    const invalid = getAgentFromTeam('nonexistent-team', 'researcher');
    expect(invalid).toBeNull();
  });
});

describe('GET /api/teams/current', () => {
  it('should require authentication', async () => {
    // This test would mock the Clerk auth to return null userId
    // and verify that the endpoint returns 401
    // Implementation depends on your test setup
  });

  it('should return user team config', async () => {
    // This test would mock:
    // 1. Clerk auth returning a userId
    // 2. DB query returning user with teamTemplate='lifeos'
    // 3. Verify response contains lifeos team config
    // Implementation depends on your test setup
  });

  it('should return default team if user has no team template', async () => {
    // Test fallback to lifeos when teamTemplate is null
  });
});
