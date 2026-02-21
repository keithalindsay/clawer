import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mocks (hoisted above imports) ───────────────────────────────────────────

vi.mock('@/lib/ssh', () => ({
  sshExec: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
    },
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { sshExec } from '@/lib/ssh';
import { db } from '@/lib/db';
import {
  provisionContainer,
  stopContainer,
  restartContainer,
  getContainerStatus,
} from '@/lib/provisioner';

// ─── Type helpers ─────────────────────────────────────────────────────────────

const mockSshExec = sshExec as ReturnType<typeof vi.fn>;
const mockFindFirst = db.query.users.findFirst as ReturnType<typeof vi.fn>;
const mockUpdate = db.update as ReturnType<typeof vi.fn>;

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Re-establishes the db.update().set().where() mock chain and returns
 * references so individual tests can make assertions on them.
 */
function setupDbUpdateChain() {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
  return { mockWhere, mockSet };
}

/** Build the sshExec mock sequence for a fresh (new) container provision. */
function setupNewContainerSshMocks({
  containerId = 'newcontainer123abc456def',
  hasNonceBug = false,
}: { containerId?: string; hasNonceBug?: boolean } = {}) {
  const envContent =
    'MINIMAX_API_KEY=minimax_test_key\n' +
    'OPENAI_API_KEY=openai_test_key\n' +
    'GEMINI_API_KEY=gemini_test_key\n';

  if (hasNonceBug) {
    mockSshExec
      // 1. containerExists → empty (doesn't exist)
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      // 2. getServerApiKeys — cat .env.local
      .mockResolvedValueOnce({ stdout: envContent, stderr: '' })
      // 3. mkdir -p userdata dirs
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      // 4. docker run -d → container ID
      .mockResolvedValueOnce({ stdout: `${containerId}\n`, stderr: '' })
      // 5. patchApiServerIfNeeded: grep finds connectNonce
      .mockResolvedValueOnce({ stdout: '/usr/local/bin/api-server.js', stderr: '' })
      // 6. docker run --rm to extract fixed api-server.js
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      // 7. docker cp api-server-fixed.js into container
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      // 8. docker exec chmod +x
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      // 9. rm /tmp/api-server-fixed.js
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      // 10. docker restart
      .mockResolvedValueOnce({ stdout: '', stderr: '' });
  } else {
    mockSshExec
      // 1. containerExists → empty (doesn't exist)
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      // 2. getServerApiKeys — cat .env.local
      .mockResolvedValueOnce({ stdout: envContent, stderr: '' })
      // 3. mkdir -p userdata dirs
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      // 4. docker run -d → container ID
      .mockResolvedValueOnce({ stdout: `${containerId}\n`, stderr: '' })
      // 5. patchApiServerIfNeeded: grep returns empty (no bug)
      .mockResolvedValueOnce({ stdout: '', stderr: '' })
      // 6. docker restart
      .mockResolvedValueOnce({ stdout: '', stderr: '' });
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('provisioner', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setupDbUpdateChain();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // provisionContainer()
  // ══════════════════════════════════════════════════════════════════════════

  describe('provisionContainer()', () => {
    // ── userId validation ──────────────────────────────────────────────────

    describe('userId validation', () => {
      it('throws for userId without user_ prefix', async () => {
        await expect(provisionContainer('invalid')).rejects.toThrow(
          'Invalid userId format',
        );
      });

      it('throws for userId with special characters', async () => {
        await expect(provisionContainer('user_!@#$%')).rejects.toThrow(
          'Invalid userId format',
        );
      });

      it('throws for empty string', async () => {
        await expect(provisionContainer('')).rejects.toThrow(
          'Invalid userId format',
        );
      });

      it('throws for userId with spaces', async () => {
        await expect(provisionContainer('user_ abc')).rejects.toThrow(
          'Invalid userId format',
        );
      });

      it('accepts a valid user_<alphanumeric> userId', async () => {
        // Set up minimal mocks so provisioning can attempt to run
        mockFindFirst.mockResolvedValue(null);
        mockSshExec.mockRejectedValue(new Error('SSH not available'));

        // Should NOT throw "Invalid userId format" — error here is SSH-related
        const result = await provisionContainer('user_abc123');
        expect(result.error).not.toBe('Invalid userId format');
      });
    });

    // ── existing container ─────────────────────────────────────────────────

    describe('when container already exists', () => {
      it('returns existing DB data without reprovisioning', async () => {
        mockSshExec
          .mockResolvedValueOnce({ stdout: 'clawer_user_user_abc123', stderr: '' }) // containerExists
          .mockResolvedValueOnce({ stdout: '', stderr: '' }); // docker start

        mockFindFirst.mockResolvedValue({
          containerPort: 4020,
          containerId: 'existing-container-id',
          gatewayToken: 'existinggatewaytoken1234567890abcdef',
        });

        const result = await provisionContainer('user_abc123');

        expect(result.success).toBe(true);
        expect(result.containerId).toBe('existing-container-id');
        expect(result.port).toBe(4020);
        expect(result.gatewayToken).toBe('existinggatewaytoken1234567890abcdef');
      });

      it('calls docker start on the existing container', async () => {
        mockSshExec
          .mockResolvedValueOnce({ stdout: 'clawer_user_user_abc123', stderr: '' })
          .mockResolvedValueOnce({ stdout: '', stderr: '' });

        mockFindFirst.mockResolvedValue({
          containerPort: 4010,
          containerId: 'cid',
          gatewayToken: 'tok',
        });

        await provisionContainer('user_abc123');

        expect(mockSshExec).toHaveBeenCalledWith(
          'docker start clawer_user_user_abc123',
        );
      });

      it('updates DB containerStatus to running for existing container', async () => {
        mockSshExec
          .mockResolvedValueOnce({ stdout: 'clawer_user_user_abc123', stderr: '' })
          .mockResolvedValueOnce({ stdout: '', stderr: '' });

        mockFindFirst.mockResolvedValue({
          containerPort: 4010,
          containerId: 'cid',
          gatewayToken: 'tok',
        });

        const { mockSet } = setupDbUpdateChain();

        await provisionContainer('user_abc123');

        expect(mockSet).toHaveBeenCalledWith(
          expect.objectContaining({ containerStatus: 'running' }),
        );
      });
    });

    // ── new container provisioning ─────────────────────────────────────────

    describe('new container provisioning', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('allocates BASE_PORT (4010) when no containers exist', async () => {
        mockFindFirst.mockResolvedValue(null); // allocatePort → no existing
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result.success).toBe(true);
        expect(result.port).toBe(4010);
      });

      it('allocates maxPort + 2 when containers already exist', async () => {
        mockFindFirst.mockResolvedValue({ containerPort: 4020 }); // allocatePort → max is 4020
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result.success).toBe(true);
        expect(result.port).toBe(4022);
      });

      it('generates a 64-character hex gateway token', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result.success).toBe(true);
        expect(result.gatewayToken).toMatch(/^[0-9a-f]{64}$/);
      });

      it('reads API keys from server .env.local via sshExec', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const catCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('cat /opt/clawer/.env.local'),
        );
        expect(catCall).toBeDefined();
      });

      it('creates container with --memory=2g flag', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const dockerRunCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
        );
        expect(dockerRunCall).toBeDefined();
        expect(dockerRunCall![0]).toContain('--memory=2g');
      });

      it('creates container with --cpus=1 flag', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const dockerRunCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
        );
        expect(dockerRunCall![0]).toContain('--cpus=1');
      });

      it('creates container with --security-opt=no-new-privileges', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const dockerRunCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
        );
        expect(dockerRunCall![0]).toContain('--security-opt=no-new-privileges');
      });

      it('creates container with --cap-drop=ALL security hardening', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const dockerRunCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
        );
        expect(dockerRunCall![0]).toContain('--cap-drop=ALL');
      });

      it('binds container port to 127.0.0.1 (not all interfaces)', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const dockerRunCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
        );
        // Port binding should include 127.0.0.1: prefix
        expect(dockerRunCall![0]).toMatch(/-p 127\.0\.0\.1:\d+:\d+/);
      });

      it('passes USER_ID env to docker run', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks({ containerId: 'cid123' });

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const dockerRunCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
        );
        expect(dockerRunCall![0]).toContain('-e USER_ID=user_abc123');
      });

      it('passes GATEWAY_TOKEN env to docker run', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const dockerRunCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
        );
        expect(dockerRunCall![0]).toMatch(/-e 'GATEWAY_TOKEN=[0-9a-f]{64}'/);
      });

      it('updates DB with containerId, containerPort, status=running, and gatewayToken', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks({ containerId: 'container-id-xyz' });

        const { mockSet } = setupDbUpdateChain();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        expect(mockSet).toHaveBeenCalledWith(
          expect.objectContaining({
            containerId: 'container-id-xyz',
            containerPort: 4010,
            containerStatus: 'running',
            gatewayToken: expect.stringMatching(/^[0-9a-f]{64}$/),
          }),
        );
      });

      it('returns { success: true, containerId, port, gatewayToken } on success', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks({ containerId: 'new-container-id' });

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result).toMatchObject({
          success: true,
          containerId: 'new-container-id',
          port: 4010,
          gatewayToken: expect.stringMatching(/^[0-9a-f]{64}$/),
        });
      });

      it('updates DB containerStatus to "error" when sshExec throws', async () => {
        mockFindFirst.mockResolvedValue(null);
        // containerExists → ok, then getServerApiKeys → SSH error
        mockSshExec
          .mockResolvedValueOnce({ stdout: '', stderr: '' }) // containerExists
          .mockRejectedValueOnce(new Error('SSH connection refused')); // cat .env.local

        const { mockSet } = setupDbUpdateChain();

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result.success).toBe(false);
        expect(mockSet).toHaveBeenCalledWith(
          expect.objectContaining({ containerStatus: 'error' }),
        );
      });

      it('returns { success: false, error: string } on any exception', async () => {
        mockFindFirst.mockResolvedValue(null);
        mockSshExec
          .mockResolvedValueOnce({ stdout: '', stderr: '' })
          .mockRejectedValueOnce(new Error('Network unreachable'));

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result.success).toBe(false);
        expect(typeof result.error).toBe('string');
        expect(result.error!.length).toBeGreaterThan(0);
      });
    });

    // ── patchApiServerIfNeeded ─────────────────────────────────────────────

    describe('patchApiServerIfNeeded()', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('calls sshExec with docker exec grep to check for connectNonce', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks({ containerId: 'c1' });

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const grepCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('docker exec') &&
            call[0].includes('connectNonce'),
        );
        expect(grepCall).toBeDefined();
      });

      it('skips patching when grep returns empty (no nonce bug)', async () => {
        mockFindFirst.mockResolvedValue(null);
        // grep returns empty → no nonce bug → no patching
        setupNewContainerSshMocks({ containerId: 'c2', hasNonceBug: false });

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        // docker cp should NOT have been called
        const dockerCpCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('docker cp'),
        );
        expect(dockerCpCall).toBeUndefined();
      });

      it('patches api-server.js when connectNonce is found', async () => {
        mockFindFirst.mockResolvedValue(null);
        // grep returns a file path → nonce bug present → patching runs
        setupNewContainerSshMocks({ containerId: 'c3', hasNonceBug: true });

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        // docker cp should have been called to copy the fixed api-server.js
        const dockerCpCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' && call[0].includes('docker cp'),
        );
        expect(dockerCpCall).toBeDefined();
      });

      it('runs chmod +x on the patched api-server.js', async () => {
        mockFindFirst.mockResolvedValue(null);
        setupNewContainerSshMocks({ containerId: 'c4', hasNonceBug: true });

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        await promise;

        const chmodCall = mockSshExec.mock.calls.find(
          (call) =>
            typeof call[0] === 'string' &&
            call[0].includes('chmod +x') &&
            call[0].includes('api-server.js'),
        );
        expect(chmodCall).toBeDefined();
      });

      it('continues provisioning even if patchApiServerIfNeeded throws', async () => {
        mockFindFirst.mockResolvedValue(null);

        const envContent =
          'MINIMAX_API_KEY=k\nOPENAI_API_KEY=k\nGEMINI_API_KEY=k\n';

        mockSshExec
          .mockResolvedValueOnce({ stdout: '', stderr: '' }) // containerExists
          .mockResolvedValueOnce({ stdout: envContent, stderr: '' }) // cat .env.local
          .mockResolvedValueOnce({ stdout: '', stderr: '' }) // mkdir
          .mockResolvedValueOnce({ stdout: 'container999\n', stderr: '' }) // docker run
          .mockRejectedValueOnce(new Error('exec failed')) // patch check throws
          .mockResolvedValueOnce({ stdout: '', stderr: '' }); // docker restart

        const promise = provisionContainer('user_abc123');
        await vi.runAllTimersAsync();
        const result = await promise;

        // Container provisioning should still succeed despite patch error
        expect(result.success).toBe(true);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // stopContainer()
  // ══════════════════════════════════════════════════════════════════════════

  describe('stopContainer()', () => {
    it('throws for invalid userId (no user_ prefix)', async () => {
      await expect(stopContainer('invalid')).rejects.toThrow(
        'Invalid userId format',
      );
    });

    it('throws for userId with special characters', async () => {
      await expect(stopContainer('user_!@#$')).rejects.toThrow(
        'Invalid userId format',
      );
    });

    it('calls sshExec with "docker stop clawer_user_{userId}"', async () => {
      mockSshExec.mockResolvedValue({ stdout: '', stderr: '' });

      await stopContainer('user_abc123');

      expect(mockSshExec).toHaveBeenCalledWith(
        'docker stop clawer_user_user_abc123',
      );
    });

    it('updates DB containerStatus to "stopped"', async () => {
      mockSshExec.mockResolvedValue({ stdout: '', stderr: '' });
      const { mockSet } = setupDbUpdateChain();

      await stopContainer('user_abc123');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ containerStatus: 'stopped' }),
      );
    });

    it('returns true on success', async () => {
      mockSshExec.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await stopContainer('user_abc123');

      expect(result).toBe(true);
    });

    it('returns false when sshExec throws', async () => {
      mockSshExec.mockRejectedValue(new Error('SSH timeout'));

      const result = await stopContainer('user_abc123');

      expect(result).toBe(false);
    });

    it('does not throw when sshExec fails (returns false gracefully)', async () => {
      mockSshExec.mockRejectedValue(new Error('connection reset'));

      await expect(stopContainer('user_abc123')).resolves.toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // restartContainer()
  // ══════════════════════════════════════════════════════════════════════════

  describe('restartContainer()', () => {
    it('throws for invalid userId format', async () => {
      await expect(restartContainer('invalid')).rejects.toThrow(
        'Invalid userId format',
      );
    });

    it('throws for userId with special characters', async () => {
      await expect(restartContainer('user_!@#')).rejects.toThrow(
        'Invalid userId format',
      );
    });

    it('calls sshExec with "docker restart clawer_user_{userId}"', async () => {
      mockSshExec.mockResolvedValue({ stdout: '', stderr: '' });

      await restartContainer('user_abc123');

      expect(mockSshExec).toHaveBeenCalledWith(
        'docker restart clawer_user_user_abc123',
      );
    });

    it('updates DB containerStatus to "running"', async () => {
      mockSshExec.mockResolvedValue({ stdout: '', stderr: '' });
      const { mockSet } = setupDbUpdateChain();

      await restartContainer('user_abc123');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ containerStatus: 'running' }),
      );
    });

    it('returns true on success', async () => {
      mockSshExec.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await restartContainer('user_abc123');

      expect(result).toBe(true);
    });

    it('returns false on SSH failure', async () => {
      mockSshExec.mockRejectedValue(new Error('SSH error'));

      const result = await restartContainer('user_abc123');

      expect(result).toBe(false);
    });

    it('does not throw when sshExec fails (returns false gracefully)', async () => {
      mockSshExec.mockRejectedValue(new Error('connection refused'));

      await expect(restartContainer('user_abc123')).resolves.toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getContainerStatus()
  // ══════════════════════════════════════════════════════════════════════════

  describe('getContainerStatus()', () => {
    it('throws for invalid userId (no user_ prefix)', async () => {
      await expect(getContainerStatus('invalid')).rejects.toThrow(
        'Invalid userId format',
      );
    });

    it('throws for userId with special characters', async () => {
      await expect(getContainerStatus('user_!@#')).rejects.toThrow(
        'Invalid userId format',
      );
    });

    it('queries docker ps with the correct container name', async () => {
      mockSshExec.mockResolvedValue({ stdout: 'running', stderr: '' });

      await getContainerStatus('user_xyz789');

      expect(mockSshExec).toHaveBeenCalledWith(
        expect.stringContaining('clawer_user_user_xyz789'),
      );
    });

    it('returns "running" when docker ps state is "running"', async () => {
      mockSshExec.mockResolvedValue({ stdout: 'running', stderr: '' });

      const status = await getContainerStatus('user_abc123');

      expect(status).toBe('running');
    });

    it('returns "stopped" when docker ps state is "exited"', async () => {
      mockSshExec.mockResolvedValue({ stdout: 'exited', stderr: '' });

      const status = await getContainerStatus('user_abc123');

      expect(status).toBe('stopped');
    });

    it('returns "stopped" when docker ps state is "stopped"', async () => {
      mockSshExec.mockResolvedValue({ stdout: 'stopped', stderr: '' });

      const status = await getContainerStatus('user_abc123');

      expect(status).toBe('stopped');
    });

    it('returns "not_found" when docker ps output is empty', async () => {
      mockSshExec.mockResolvedValue({ stdout: '', stderr: '' });

      const status = await getContainerStatus('user_abc123');

      expect(status).toBe('not_found');
    });

    it('returns "not_found" when docker ps output is only whitespace', async () => {
      mockSshExec.mockResolvedValue({ stdout: '   \n', stderr: '' });

      const status = await getContainerStatus('user_abc123');

      expect(status).toBe('not_found');
    });

    it('returns "error" on sshExec exception', async () => {
      mockSshExec.mockRejectedValue(new Error('SSH connection failed'));

      const status = await getContainerStatus('user_abc123');

      expect(status).toBe('error');
    });

    it('returns "error" for unknown docker state values', async () => {
      mockSshExec.mockResolvedValue({ stdout: 'restarting', stderr: '' });

      const status = await getContainerStatus('user_abc123');

      // Neither running nor exited/stopped → error
      expect(status).toBe('error');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // env-var configuration — staging overrides
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * These tests verify that module-level constants read from env vars are
   * picked up correctly. Since the constants are evaluated at module load time,
   * each test:
   *   1. Sets the env var
   *   2. Resets the module cache (vi.resetModules)
   *   3. Dynamically imports a fresh provisioner instance
   *   4. Asserts the new behaviour
   */
  describe('env-var configuration / staging overrides', () => {
    afterEach(() => {
      delete process.env.CONTAINER_PREFIX;
      delete process.env.PORT_RANGE_START;
      delete process.env.PORT_RANGE_END;
      delete process.env.USERDATA_PATH;
      delete process.env.DOCKER_NETWORK;
      delete process.env.CONTAINER_IMAGE;
      vi.resetModules();
    });

    /**
     * Load a fresh provisioner + its mocked dependencies after setting env vars.
     * vi.mock() factories still apply after resetModules — new vi.fn() instances
     * are created for each import cycle.
     */
    async function freshProvisioner(envVars: Record<string, string> = {}) {
      for (const [k, v] of Object.entries(envVars)) {
        process.env[k] = v;
      }
      vi.resetModules();

      // Import mocked deps first so mock factory runs for this cycle
      const sshMod = await import('@/lib/ssh') as unknown as { sshExec: ReturnType<typeof vi.fn> };
      const dbMod = await import('@/lib/db') as any;
      const provMod = await import('@/lib/provisioner') as any;

      const freshSsh = sshMod.sshExec;
      const freshDbUpdate = dbMod.db.update as ReturnType<typeof vi.fn>;
      const freshFindFirst = dbMod.db.query.users.findFirst as ReturnType<typeof vi.fn>;

      // Set up db.update().set().where() chain on the fresh mock
      freshDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
      });

      return {
        sshExec: freshSsh,
        findFirst: freshFindFirst,
        stopContainer: provMod.stopContainer,
        restartContainer: provMod.restartContainer,
        getContainerStatus: provMod.getContainerStatus,
        provisionContainer: provMod.provisionContainer,
      };
    }

    /** Set up the SSH mock sequence for a new container provision on a fresh sshExec mock. */
    function setupProvisionSshMocks(
      freshSsh: ReturnType<typeof vi.fn>,
      containerId = 'stg-container-abc',
    ) {
      const envContent =
        'MINIMAX_API_KEY=m\nOPENAI_API_KEY=o\nGEMINI_API_KEY=g\n';
      freshSsh
        .mockResolvedValueOnce({ stdout: '', stderr: '' })        // 1. containerExists → not found
        .mockResolvedValueOnce({ stdout: envContent, stderr: '' }) // 2. cat .env.local
        .mockResolvedValueOnce({ stdout: '', stderr: '' })        // 3. mkdir -p
        .mockResolvedValueOnce({ stdout: `${containerId}\n`, stderr: '' }) // 4. docker run
        .mockResolvedValueOnce({ stdout: '', stderr: '' })        // 5. patchCheck → no nonce
        .mockResolvedValueOnce({ stdout: '', stderr: '' });       // 6. docker restart
    }

    // ── CONTAINER_PREFIX ────────────────────────────────────────────────────

    it('stopContainer uses CONTAINER_PREFIX env var in docker stop command', async () => {
      const { sshExec, stopContainer: stop } = await freshProvisioner({
        CONTAINER_PREFIX: 'clawer_stg_',
      });
      sshExec.mockResolvedValue({ stdout: '', stderr: '' });

      await stop('user_abc123');

      expect(sshExec).toHaveBeenCalledWith('docker stop clawer_stg_user_abc123');
    });

    it('restartContainer uses CONTAINER_PREFIX env var in docker restart command', async () => {
      const { sshExec, restartContainer: restart } = await freshProvisioner({
        CONTAINER_PREFIX: 'clawer_stg_',
      });
      sshExec.mockResolvedValue({ stdout: '', stderr: '' });

      await restart('user_abc123');

      expect(sshExec).toHaveBeenCalledWith('docker restart clawer_stg_user_abc123');
    });

    it('getContainerStatus uses CONTAINER_PREFIX in docker ps filter', async () => {
      const { sshExec, getContainerStatus: status } = await freshProvisioner({
        CONTAINER_PREFIX: 'clawer_stg_',
      });
      sshExec.mockResolvedValue({ stdout: 'running', stderr: '' });

      await status('user_abc123');

      expect(sshExec).toHaveBeenCalledWith(
        expect.stringContaining('clawer_stg_user_abc123'),
      );
    });

    it('provisionContainer names container with staging prefix when CONTAINER_PREFIX is set', async () => {
      const { sshExec, findFirst, provisionContainer: provision } = await freshProvisioner({
        CONTAINER_PREFIX: 'clawer_stg_',
      });
      findFirst.mockResolvedValue(null);
      setupProvisionSshMocks(sshExec);

      vi.useFakeTimers();
      const promise = provision('user_abc123');
      await vi.runAllTimersAsync();
      await promise;
      vi.useRealTimers();

      // docker run should include the staging container name
      const dockerRunCall = sshExec.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
      );
      expect(dockerRunCall![0]).toContain('--name clawer_stg_user_abc123');
    });

    // ── PORT_RANGE_START ────────────────────────────────────────────────────

    it('allocates PORT_RANGE_START when no existing containers', async () => {
      const { sshExec, findFirst, provisionContainer: provision } = await freshProvisioner({
        PORT_RANGE_START: '5010',
        PORT_RANGE_END: '6000',
      });
      findFirst.mockResolvedValue(null); // allocatePort → no existing port
      setupProvisionSshMocks(sshExec);

      vi.useFakeTimers();
      const promise = provision('user_abc123');
      await vi.runAllTimersAsync();
      const result = await promise;
      vi.useRealTimers();

      expect(result.success).toBe(true);
      expect(result.port).toBe(5010);
    });

    it('allocates maxPort + 2 when existing container is at PORT_RANGE_START', async () => {
      const { sshExec, findFirst, provisionContainer: provision } = await freshProvisioner({
        PORT_RANGE_START: '5010',
        PORT_RANGE_END: '6000', // must be > 5012 so the +2 allocation isn't rejected
      });
      findFirst.mockResolvedValue({ containerPort: 5010 }); // allocatePort → max is 5010
      setupProvisionSshMocks(sshExec);

      vi.useFakeTimers();
      const promise = provision('user_abc123');
      await vi.runAllTimersAsync();
      const result = await promise;
      vi.useRealTimers();

      expect(result.success).toBe(true);
      expect(result.port).toBe(5012);
    });

    // ── DOCKER_NETWORK ──────────────────────────────────────────────────────

    it('adds --network flag to docker run when DOCKER_NETWORK is set', async () => {
      const { sshExec, findFirst, provisionContainer: provision } = await freshProvisioner({
        DOCKER_NETWORK: 'staging_net',
      });
      findFirst.mockResolvedValue(null);
      setupProvisionSshMocks(sshExec);

      vi.useFakeTimers();
      const promise = provision('user_abc123');
      await vi.runAllTimersAsync();
      await promise;
      vi.useRealTimers();

      const dockerRunCall = sshExec.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
      );
      expect(dockerRunCall![0]).toContain('--network staging_net');
    });

    it('omits --network flag from docker run when DOCKER_NETWORK is not set', async () => {
      const { sshExec, findFirst, provisionContainer: provision } = await freshProvisioner();
      findFirst.mockResolvedValue(null);
      setupProvisionSshMocks(sshExec);

      vi.useFakeTimers();
      const promise = provision('user_abc123');
      await vi.runAllTimersAsync();
      await promise;
      vi.useRealTimers();

      const dockerRunCall = sshExec.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
      );
      expect(dockerRunCall![0]).not.toContain('--network');
    });

    // ── USERDATA_PATH ───────────────────────────────────────────────────────

    it('uses USERDATA_PATH in volume mount and mkdir commands', async () => {
      const { sshExec, findFirst, provisionContainer: provision } = await freshProvisioner({
        USERDATA_PATH: '/data/staging',
      });
      findFirst.mockResolvedValue(null);
      setupProvisionSshMocks(sshExec);

      vi.useFakeTimers();
      const promise = provision('user_abc123');
      await vi.runAllTimersAsync();
      await promise;
      vi.useRealTimers();

      // mkdir should use the custom path
      const mkdirCall = sshExec.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].startsWith('mkdir -p'),
      );
      expect(mkdirCall![0]).toContain('/data/staging/');

      // docker run volume mount should use the custom path
      const dockerRunCall = sshExec.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
      );
      expect(dockerRunCall![0]).toContain('-v /data/staging/');
    });

    // ── CONTAINER_IMAGE ─────────────────────────────────────────────────────

    it('uses CONTAINER_IMAGE env var as the docker image in docker run', async () => {
      const { sshExec, findFirst, provisionContainer: provision } = await freshProvisioner({
        CONTAINER_IMAGE: 'clawer-staging:v9.9.9',
      });
      findFirst.mockResolvedValue(null);
      setupProvisionSshMocks(sshExec);

      vi.useFakeTimers();
      const promise = provision('user_abc123');
      await vi.runAllTimersAsync();
      await promise;
      vi.useRealTimers();

      const dockerRunCall = sshExec.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].startsWith('docker run -d'),
      );
      expect(dockerRunCall![0]).toContain('clawer-staging:v9.9.9');
    });

    // ── Regression: default env vars still work ─────────────────────────────

    it('regression: default container prefix (clawer_user_) when CONTAINER_PREFIX is unset', async () => {
      const { sshExec, stopContainer: stop } = await freshProvisioner();
      sshExec.mockResolvedValue({ stdout: '', stderr: '' });

      await stop('user_abc123');

      expect(sshExec).toHaveBeenCalledWith('docker stop clawer_user_user_abc123');
    });

    it('regression: default BASE_PORT (4010) when PORT_RANGE_START is unset', async () => {
      const { sshExec, findFirst, provisionContainer: provision } = await freshProvisioner();
      findFirst.mockResolvedValue(null);
      setupProvisionSshMocks(sshExec);

      vi.useFakeTimers();
      const promise = provision('user_abc123');
      await vi.runAllTimersAsync();
      const result = await promise;
      vi.useRealTimers();

      expect(result.port).toBe(4010);
    });
  });
});
