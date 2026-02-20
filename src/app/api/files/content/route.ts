/**
 * GET    /api/files/content?path=<relative>            — Read file content (512 KB preview)
 * GET    /api/files/content?path=<relative>&download=true — Stream full file as attachment
 * DELETE /api/files/content?path=<relative>            — Permanently delete file
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import path from 'path';
import { apiSuccess, apiError, apiErrors } from '@/lib/api/response';
import {
  resolveUserFilesDir,
  validatePath,
  readFile,
  deleteFile,
} from '@/lib/files';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts and validates the `path` query parameter.
 * Returns the raw string or null if missing/empty.
 */
function getPathParam(req: NextRequest): string | null {
  const raw = req.nextUrl.searchParams.get('path');
  return raw && raw.trim() ? raw.trim() : null;
}

/**
 * Resolves baseDir for the authenticated user; returns error response on failure.
 */
async function resolveBase(userId: string): Promise<{ baseDir: string } | NextResponse> {
  try {
    const baseDir = await resolveUserFilesDir(userId);
    return { baseDir };
  } catch (err) {
    const error = err as Error;
    if (error.message === 'USER_NOT_FOUND') return apiErrors.notFound('User');
    throw err;
  }
}

// ---------------------------------------------------------------------------
// GET — read file content or stream download
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const relativePath = getPathParam(req);
    if (!relativePath) {
      return apiError('MISSING_PATH', 'Query parameter `path` is required', 400);
    }

    const baseResult = await resolveBase(userId);
    if (baseResult instanceof NextResponse) return baseResult;
    const { baseDir } = baseResult;

    const download = req.nextUrl.searchParams.get('download') === 'true';

    if (download) {
      // --- Streaming download of the full file ---
      let resolvedPath: string;
      try {
        resolvedPath = await validatePath(baseDir, relativePath);
      } catch (err) {
        const error = err as NodeJS.ErrnoException;
        if (error.code === 'INVALID_PATH') {
          return apiError('INVALID_PATH', 'Invalid file path', 400);
        }
        if (error.code === 'ENOENT') {
          return apiErrors.notFound('File');
        }
        throw err;
      }

      // Verify file exists and is a regular file
      let stat: Awaited<ReturnType<typeof fs.stat>>;
      try {
        stat = await fs.lstat(resolvedPath);
      } catch {
        return apiErrors.notFound('File');
      }

      if (!stat.isFile()) {
        return apiError('NOT_A_FILE', 'Target is not a file', 400);
      }

      const filename = path.basename(resolvedPath);
      const readStream = createReadStream(resolvedPath);

      // Convert Node.js Readable to Web ReadableStream
      const webStream = Readable.toWeb(readStream) as ReadableStream;

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Content-Length': String(stat.size),
        },
      });
    }

    // --- Read file with 512 KB truncation ---
    let content;
    try {
      content = await readFile(baseDir, relativePath);
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'INVALID_PATH') {
        return apiError('INVALID_PATH', 'Invalid file path', 400);
      }
      if (error.code === 'ENOENT') {
        return apiErrors.notFound('File');
      }
      throw err;
    }

    return apiSuccess(content);
  } catch (error) {
    console.error('[files/content GET]', error);
    return apiErrors.internalError();
  }
}

// ---------------------------------------------------------------------------
// DELETE — permanent file deletion
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return apiErrors.unauthorized();

    const relativePath = getPathParam(req);
    if (!relativePath) {
      return apiError('MISSING_PATH', 'Query parameter `path` is required', 400);
    }

    const baseResult = await resolveBase(userId);
    if (baseResult instanceof NextResponse) return baseResult;
    const { baseDir } = baseResult;

    try {
      await deleteFile(baseDir, relativePath);
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'INVALID_PATH') {
        return apiError('INVALID_PATH', 'Invalid file path', 400);
      }
      if (error.code === 'ENOENT') {
        return apiErrors.notFound('File');
      }
      if (error.code === 'NOT_A_FILE') {
        return apiError('NOT_A_FILE', 'Target is not a file', 400);
      }
      throw err;
    }

    return apiSuccess({ deleted: relativePath });
  } catch (error) {
    console.error('[files/content DELETE]', error);
    return apiErrors.internalError();
  }
}
