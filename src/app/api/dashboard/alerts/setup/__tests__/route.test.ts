import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

// Mock dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('@/lib/db');

describe('Security Setup API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/dashboard/alerts/setup/status', () => {
    it('should return unauthorized if not logged in', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return configuration status for user', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any);
      
      const mockAlerts = [
        { id: '1', userId: 'user_123', alertId: 'ssh_bruteforce', enabled: true, permissionLevel: 'auto' },
        { id: '2', userId: 'user_123', alertId: 'disk_space', enabled: true, permissionLevel: 'notify' },
        { id: '3', userId: 'user_123', alertId: 'config_audit', enabled: true, permissionLevel: 'notify' },
        { id: '4', userId: 'user_123', alertId: 'container_health', enabled: true, permissionLevel: 'auto' },
        { id: '5', userId: 'user_123', alertId: 'unauthorized_access', enabled: true, permissionLevel: 'auto' },
      ];

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockAlerts),
        }),
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.configured).toBe(true);
      expect(data.alertCount).toBe(5);
      expect(data.alerts).toHaveLength(5);
    });

    it('should return not configured if user has fewer than 5 alerts', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any);
      
      const mockAlerts = [
        { id: '1', userId: 'user_123', alertId: 'ssh_bruteforce', enabled: true, permissionLevel: 'auto' },
      ];

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockAlerts),
        }),
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.configured).toBe(false);
      expect(data.alertCount).toBe(1);
    });
  });

  describe('POST /api/dashboard/alerts/setup', () => {
    it('should return unauthorized if not logged in', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should create user alert entries for all default alerts', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any);

      const mockDefaultAlerts = [
        { id: 'ssh_bruteforce', name: 'SSH Brute Force', enabled: true },
        { id: 'disk_space', name: 'Disk Space', enabled: true },
        { id: 'config_audit', name: 'Config Audit', enabled: true },
        { id: 'container_health', name: 'Container Health', enabled: true },
        { id: 'unauthorized_access', name: 'Unauthorized Access', enabled: true },
      ];

      // Mock select for orchestrator alerts
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockDefaultAlerts),
          }),
        }),
      } as any);

      // Mock select for existing user alerts (none)
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      // Mock insert
      const mockInsert = vi.fn().mockResolvedValue({});
      vi.mocked(db.insert).mockReturnValueOnce({
        values: mockInsert,
      } as any);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alertsEnabled).toBe(5);
      expect(data.newAlertsCreated).toBe(5);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should not duplicate alerts if user already has them', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any);

      const mockDefaultAlerts = [
        { id: 'ssh_bruteforce', name: 'SSH Brute Force', enabled: true },
        { id: 'disk_space', name: 'Disk Space', enabled: true },
      ];

      const existingAlerts = [
        { id: '1', userId: 'user_123', alertId: 'ssh_bruteforce', enabled: true },
      ];

      // Mock selects
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockDefaultAlerts),
          }),
        }),
      } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(existingAlerts),
        }),
      } as any);

      // Mock insert
      const mockInsert = vi.fn().mockResolvedValue({});
      vi.mocked(db.insert).mockReturnValueOnce({
        values: mockInsert,
      } as any);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.alertsEnabled).toBe(2);
      expect(data.newAlertsCreated).toBe(1); // Only disk_space is new
    });

    it('should return error if no default alerts exist', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as any);

      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('No default alerts found');
    });
  });
});
