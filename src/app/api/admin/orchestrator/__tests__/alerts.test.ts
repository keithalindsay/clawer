/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET, POST } from '../alerts/route';
import { db } from '@/lib/db';
import { orchestratorAlerts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

// Mock admin check
jest.mock('@/lib/admin', () => ({
  isAdmin: jest.fn(),
}));

const { auth } = require('@clerk/nextjs/server');
const { isAdmin } = require('@/lib/admin');

describe('GET /api/admin/orchestrator/alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    auth.mockResolvedValue({ userId: null });
    
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 if not admin', async () => {
    auth.mockResolvedValue({ userId: 'user_123' });
    isAdmin.mockResolvedValue(false);
    
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return all alerts for admin', async () => {
    auth.mockResolvedValue({ userId: 'admin_123' });
    isAdmin.mockResolvedValue(true);
    
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('alerts');
    expect(Array.isArray(data.alerts)).toBe(true);
  });
});

describe('POST /api/admin/orchestrator/alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    auth.mockResolvedValue({ userId: null });
    
    const mockRequest = new Request('http://localhost/api/admin/orchestrator/alerts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Alert',
        checkScript: 'echo test',
        schedule: '*/5 * * * *',
      }),
    });
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if missing required fields', async () => {
    auth.mockResolvedValue({ userId: 'admin_123' });
    isAdmin.mockResolvedValue(true);
    
    const mockRequest = new Request('http://localhost/api/admin/orchestrator/alerts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Alert',
        // Missing checkScript and schedule
      }),
    });
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('Missing required fields');
  });

  it('should create a new alert when all fields provided', async () => {
    auth.mockResolvedValue({ userId: 'admin_123' });
    isAdmin.mockResolvedValue(true);
    
    const mockRequest = new Request('http://localhost/api/admin/orchestrator/alerts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Alert',
        description: 'Test description',
        checkScript: 'echo "test"',
        schedule: '*/5 * * * *',
        action: 'notify',
        severity: 'warning',
        enabled: true,
      }),
    });
    
    const response = await POST(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.alertId).toBeDefined();
    expect(data.message).toContain('created');
    
    // Cleanup: delete the test alert
    if (data.alertId) {
      await db
        .delete(orchestratorAlerts)
        .where(eq(orchestratorAlerts.id, data.alertId));
    }
  });

  it('should update an existing alert when id provided', async () => {
    auth.mockResolvedValue({ userId: 'admin_123' });
    isAdmin.mockResolvedValue(true);
    
    // First create an alert
    const createRequest = new Request('http://localhost/api/admin/orchestrator/alerts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Alert',
        checkScript: 'echo "test"',
        schedule: '*/5 * * * *',
      }),
    });
    
    const createResponse = await POST(createRequest);
    const createData = await createResponse.json();
    const alertId = createData.alertId;
    
    // Now update it
    const updateRequest = new Request('http://localhost/api/admin/orchestrator/alerts', {
      method: 'POST',
      body: JSON.stringify({
        id: alertId,
        name: 'Updated Alert Name',
        checkScript: 'echo "updated"',
        schedule: '*/10 * * * *',
      }),
    });
    
    const updateResponse = await POST(updateRequest);
    const updateData = await updateResponse.json();
    
    expect(updateResponse.status).toBe(200);
    expect(updateData.success).toBe(true);
    expect(updateData.message).toContain('updated');
    
    // Cleanup
    await db
      .delete(orchestratorAlerts)
      .where(eq(orchestratorAlerts.id, alertId));
  });
});
