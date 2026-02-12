/**
 * SSH execution helper for production server management
 * 
 * Single source of truth for running commands on the production server.
 * Used by provisioner, admin container routes, and admin stats.
 */

import { spawn } from 'child_process';

const PRODUCTION_SERVER = process.env.PRODUCTION_SERVER || 'root@YOUR_DOCKER_HOST';

/**
 * Execute a command on the production server via SSH.
 * 
 * @param command - Shell command to execute remotely
 * @param timeoutMs - Maximum execution time (default: 30s)
 * @returns stdout and stderr from the remote command
 * @throws Error if SSH connection fails or command exits non-zero
 */
export async function sshExec(
  command: string,
  timeoutMs: number = 30_000
): Promise<{ stdout: string; stderr: string }> {
  console.log(`[SSH] ${command.substring(0, 120)}${command.length > 120 ? '...' : ''}`);
  
  return new Promise((resolve, reject) => {
    const proc = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=accept-new',  // Trust on first use, reject changes
      '-o', 'ConnectTimeout=10',
      '-o', 'ServerAliveInterval=15',
      PRODUCTION_SERVER,
      command,
    ]);
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    
    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
      reject(new Error(`SSH command timed out after ${timeoutMs}ms: ${command.substring(0, 80)}`));
    }, timeoutMs);
    
    proc.stdout.on('data', (d: Buffer) => { stdout += d; });
    proc.stderr.on('data', (d: Buffer) => { stderr += d; });
    
    proc.on('close', (code: number | null) => {
      clearTimeout(timeout);
      if (timedOut) return; // Already rejected
      
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        console.error(`[SSH] Command failed (exit ${code}): ${command.substring(0, 80)}`, stderr);
        reject(new Error(`SSH execution failed (exit ${code}): ${stderr || 'Unknown error'}`));
      }
    });
    
    proc.on('error', (error: Error) => {
      clearTimeout(timeout);
      if (timedOut) return;
      console.error(`[SSH] Process error: ${command.substring(0, 80)}`, error);
      reject(new Error(`SSH process failed: ${error.message}`));
    });
  });
}

/**
 * Get the configured production server address
 */
export function getProductionServer(): string {
  return PRODUCTION_SERVER;
}
