/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET as getAlerts } from '../alerts/route';
import { GET as getPermissions } from '../permissions/route';
import { POST as respondPermission } from '../permissions/[requestId]/respond/route';
import { db } from '@/lib/db';
import { userAlerts, permissionRequests, orchestratorAlerts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

const { auth } = require('@clerk/nextjs/server');

describe('GET /api/dashboard/alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    auth.mockResolvedValue({ userId: null });
    
    const response = await getAlerts();
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return user alerts with definitions', async () => {
    auth.mockResolvedValue({ userId: 'user_test_123' });
    
    const response = await getAlerts();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('alerts');
    expect(Array.isArray(data.alerts)).toBe(true);
  });
});

describe('GET /api/dashboard/permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    auth.mockResolvedValue({ userId: null });
    
    const mockRequest = new Request('http://localhost/api/dashboard/permissions');
    const response = await getPermissions(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return pending permission requests by default', async () => {
    const testUserId = 'user_test_perms_' + nanoid(6);
    auth.mockResolvedValue({ userId: testUserId });
    
    // Create a test permission request
    const requestId = nanoid();
    await db.insert(permissionRequests).values({
      id: requestId,
      userId: testUserId,
      actionType: 'test_action',
      description: 'Test permission',
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });
    
    const mockRequest = new Request('http://localhost/api/dashboard/permissions');
    const response = await getPermissions(mockRequest);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('requests');
    expect(Array.isArray(data.requests)).toBe(true);
    
    const userRequest = data.requests.find((r: any) => r.id === requestId);
    expect(userRequest).toBeDefined();
    expect(userRequest.status).toBe('pending');
    
    // Cleanup
    await db.delete(permissionRequests).where(eq(permissionRequests.id, requestId));
  });
});

describe('POST /api/dashboard/permissions/[requestId]/respond', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    auth.mockResolvedValue({ userId: null });
    
    const mockRequest = new Request('http://localhost/api/dashboard/permissions/test123/respond', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
    
    const response = await respondPermission(mockRequest, { params: { requestId: 'test123' } });
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid action', async () => {
    auth.mockResolvedValue({ userId: 'user_123' });
    
    const mockRequest = new Request('http://localhost/api/dashboard/permissions/test123/respond', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid' }),
    });
    
    const response = await respondPermission(mockRequest, { params: { requestId: 'test123' } });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid action');
  });

  it('should approve a pending permission request', async () => {
    const testUserId = 'user_test_approve_' + nanoid(6);
    auth.mockResolvedValue({ userId: testUserId });
    
    // Create a test permission request
    const requestId = nanoid();
    await db.insert(permissionRequests).values({
      id: requestId,
      userId: testUserId,
      actionType: 'test_action',
      description: 'Test approval',
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    
    const mockRequest = new Request(`http://localhost/api/dashboard/permissions/${requestId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
    
    const response = await respondPermission(mockRequest, { params: { requestId } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('approved');
    
    // Verify in database
    const [updated] = await db
      .select()
      .from(permissionRequests)
      .where(eq(permissionRequests.id, requestId))
      .limit(1);
    
    expect(updated.status).toBe('approved');
    expect(updated.respondedAt).toBeDefined();
    
    // Cleanup
    await db.delete(permissionRequests).where(eq(permissionRequests.id, requestId));
  });

  it('should deny a pending permission request', async () => {
    const testUserId = 'user_test_deny_' + nanoid(6);
    auth.mockResolvedValue({ userId: testUserId });
    
    // Create a test permission request
    const requestId = nanoid();
    await db.insert(permissionRequests).values({
      id: requestId,
      userId: testUserId,
      actionType: 'test_action',
      description: 'Test denial',
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    
    const mockRequest = new Request(`http://localhost/api/dashboard/permissions/${requestId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action: 'deny' }),
    });
    
    const response = await respondPermission(mockRequest, { params: { requestId } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe('denied');
    
    // Cleanup
    await db.delete(permissionRequests).where(eq(permissionRequests.id, requestId));
  });

  it('should return 404 for non-existent request', async () => {
    auth.mockResolvedValue({ userId: 'user_123' });
    
    const mockRequest = new Request('http://localhost/api/dashboard/permissions/nonexistent123/respond', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    });
    
    const response = await respondPermission(mockRequest, { params: { requestId: 'nonexistent123' } });
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.error).toContain('not found');
  });
});
