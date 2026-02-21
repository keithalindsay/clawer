/**
 * files.ts — Core file utilities for the File Viewer API
 *
 * Provides path resolution, security validation, and fs operations
 * for reading/listing/deleting files in user container workspaces.
 */

import fs from 'fs/promises';
import type { Stats } from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/users';
import { eq } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SupportedFileType = 'md' | 'txt' | 'json' | 'csv';
export type FileType = SupportedFileType | 'unsupported';

export interface FileEntry {
  name: string;
  path: string;        // relative to files/ root
  sizeBytes: number;
  modifiedAt: string;  // ISO 8601
  type: FileType;
}

export interface FolderEntry {
  name: string;
  path: string;        // relative to files/ root  (e.g. "research")
  files: FileEntry[];
}

export interface FileTree {
  containerReady: boolean;
  totalFiles: number;
  totalSizeBytes: number;
  truncated: boolean;
  folders: FolderEntry[];
  rootFiles: FileEntry[];
}

export interface FileContent {
  path: string;
  name: string;
  type: FileType;
  content: string | null;   // null for unsupported types
  sizeBytes: number;
  modifiedAt: string;
  truncated: boolean;
  truncatedAt?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_READ_BYTES = 512 * 1024;          // 512 KB
const MAX_FILES = 200;
const SUPPORTED_EXTENSIONS = new Set(['md', 'txt', 'json', 'csv']);

// ---------------------------------------------------------------------------
// Container path resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the user's files directory from the database.
 *
 * Pattern: /opt/clawer/userdata/clawer_user_{userId}/clawd/files/
 *
 * Container name is derived from userId (consistent with the provisioner).
 * We query the DB to verify the user exists before returning a path.
 */
export async function resolveUserFilesDir(userId: string): Promise<string> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Use actual container_id from DB (not constructed name — they can differ)
  const containerName = user.containerId || `clawer_user_${userId}`;
  return `/opt/clawer/userdata/${containerName}/clawd/files`;
}

/**
 * Returns the user's containerStatus so callers can include it in responses.
 */
export async function getUserContainerStatus(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return user?.containerStatus ?? null;
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

/**
 * Validates and resolves a relative path within baseDir.
 *
 * Three-layer security:
 *   1. Null-byte check — classic injection exploit
 *   2. path.resolve prefix check — collapses all ".." before comparing
 *   3. lstat symlink check — rejects symlinks that could escape the sandbox
 *
 * Returns the resolved absolute path on success.
 * Throws with code 'INVALID_PATH' on any security violation.
 */
export async function validatePath(baseDir: string, relativePath: string): Promise<string> {
  // Layer 1 — null byte injection
  if (relativePath.includes('\0')) {
    throw Object.assign(new Error('Invalid file path'), { code: 'INVALID_PATH' });
  }

  // Layer 1b — reject absolute paths supplied as relative
  if (path.isAbsolute(relativePath)) {
    throw Object.assign(new Error('Invalid file path'), { code: 'INVALID_PATH' });
  }

  // Layer 2 — path traversal via ".."
  const resolved = path.resolve(baseDir, relativePath);

  // Must be strictly inside baseDir (not baseDir itself, which is a directory)
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    throw Object.assign(new Error('Invalid file path'), { code: 'INVALID_PATH' });
  }

  // Layer 3 — symlink check (lstat does NOT follow symlinks)
  try {
    const stat = await fs.lstat(resolved);
    if (stat.isSymbolicLink()) {
      throw Object.assign(new Error('Invalid file path'), { code: 'INVALID_PATH' });
    }
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'INVALID_PATH') throw err; // re-throw our own
    if (error.code === 'ENOENT') {
      // File doesn't exist yet — that's OK for some operations; re-throw ENOENT
      throw err;
    }
    throw err;
  }

  return resolved;
}

// ---------------------------------------------------------------------------
// File type helpers
// ---------------------------------------------------------------------------

function getFileType(filename: string): FileType {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (SUPPORTED_EXTENSIONS.has(ext)) return ext as SupportedFileType;
  return 'unsupported';
}

function buildFileEntry(name: string, relativePath: string, stat: Stats): FileEntry {
  return {
    name,
    path: relativePath,
    sizeBytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    type: getFileType(name),
  };
}

// ---------------------------------------------------------------------------
// List files
// ---------------------------------------------------------------------------

/**
 * Walks the files/ directory one level deep.
 *
 * Structure returned:
 *   - folders[]: sub-directories with their files
 *   - rootFiles[]: files directly under files/
 *
 * Hard cap of MAX_FILES (200) total files; sets truncated=true if exceeded.
 */
export async function listFiles(baseDir: string): Promise<FileTree> {
  // Ensure the files/ directory exists
  try {
    await fs.access(baseDir);
  } catch {
    // Directory doesn't exist yet — return empty tree
    return {
      containerReady: true,
      totalFiles: 0,
      totalSizeBytes: 0,
      truncated: false,
      folders: [],
      rootFiles: [],
    };
  }

  const topEntries = await fs.readdir(baseDir, { withFileTypes: true });

  const folders: FolderEntry[] = [];
  const rootFiles: FileEntry[] = [];
  let totalFiles = 0;
  let totalSizeBytes = 0;
  let truncated = false;

  for (const entry of topEntries) {
    if (totalFiles >= MAX_FILES) {
      truncated = true;
      break;
    }

    const entryPath = path.join(baseDir, entry.name);

    if (entry.isSymbolicLink()) {
      // Skip symlinks entirely
      continue;
    }

    if (entry.isDirectory()) {
      // Walk one level deep
      const subEntries = await fs.readdir(entryPath, { withFileTypes: true });
      const folderFiles: FileEntry[] = [];

      for (const subEntry of subEntries) {
        if (totalFiles >= MAX_FILES) {
          truncated = true;
          break;
        }
        if (!subEntry.isFile()) continue;          // skip nested dirs and symlinks
        if (subEntry.isSymbolicLink()) continue;

        const subPath = path.join(entryPath, subEntry.name);
        try {
          const stat = await fs.lstat(subPath);
          if (stat.isSymbolicLink()) continue;     // double-check after lstat
          const relPath = `${entry.name}/${subEntry.name}`;
          const fileEntry = buildFileEntry(subEntry.name, relPath, stat);
          folderFiles.push(fileEntry);
          totalFiles++;
          totalSizeBytes += stat.size;
        } catch {
          // Skip unreadable files
        }
      }

      folders.push({
        name: entry.name,
        path: entry.name,
        files: folderFiles,
      });
    } else if (entry.isFile()) {
      try {
        const stat = await fs.lstat(entryPath);
        if (stat.isSymbolicLink()) continue;
        const fileEntry = buildFileEntry(entry.name, entry.name, stat);
        rootFiles.push(fileEntry);
        totalFiles++;
        totalSizeBytes += stat.size;
      } catch {
        // Skip unreadable files
      }
    }
  }

  return {
    containerReady: true,
    totalFiles,
    totalSizeBytes,
    truncated,
    folders,
    rootFiles,
  };
}

// ---------------------------------------------------------------------------
// Read file
// ---------------------------------------------------------------------------

/**
 * Reads a file's content, truncating at 512 KB.
 *
 * For unsupported file types, content is null (no attempt to decode binary).
 * Caller must have already validated the path via validatePath().
 */
export async function readFile(baseDir: string, relativePath: string): Promise<FileContent> {
  const resolved = await validatePath(baseDir, relativePath);
  const name = path.basename(resolved);
  const type = getFileType(name);

  const stat = await fs.stat(resolved);
  const sizeBytes = stat.size;
  const modifiedAt = stat.mtime.toISOString();

  if (type === 'unsupported') {
    return {
      path: relativePath,
      name,
      type,
      content: null,
      sizeBytes,
      modifiedAt,
      truncated: false,
    };
  }

  if (sizeBytes > MAX_READ_BYTES) {
    // Read only the first MAX_READ_BYTES
    const fd = await fs.open(resolved, 'r');
    try {
      const buf = Buffer.alloc(MAX_READ_BYTES);
      const { bytesRead } = await fd.read(buf, 0, MAX_READ_BYTES, 0);
      const content = buf.subarray(0, bytesRead).toString('utf-8');
      return {
        path: relativePath,
        name,
        type,
        content,
        sizeBytes,
        modifiedAt,
        truncated: true,
        truncatedAt: MAX_READ_BYTES,
      };
    } finally {
      await fd.close();
    }
  }

  const content = await fs.readFile(resolved, 'utf-8');
  return {
    path: relativePath,
    name,
    type,
    content,
    sizeBytes,
    modifiedAt,
    truncated: false,
  };
}

// ---------------------------------------------------------------------------
// Delete file
// ---------------------------------------------------------------------------

/**
 * Permanently deletes a file. No trash/undo.
 * Caller must have already validated the path via validatePath().
 */
export async function deleteFile(baseDir: string, relativePath: string): Promise<void> {
  const resolved = await validatePath(baseDir, relativePath);

  // Ensure it's a file, not a directory
  const stat = await fs.lstat(resolved);
  if (!stat.isFile()) {
    throw Object.assign(new Error('Target is not a file'), { code: 'NOT_A_FILE' });
  }

  await fs.unlink(resolved);
}
