'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileInfo {
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
  type: string;
}

export interface Folder {
  name: string;
  path: string;
  files: FileInfo[];
}

interface FolderTreeProps {
  folders: Folder[];
  rootFiles: FileInfo[];
  selectedPath: string | null;
  totalFiles: number;
  totalSizeBytes: number;
  onSelectFile: (file: FileInfo) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileTypeIcon(type: string): string {
  switch (type) {
    case 'md':   return '📄';
    case 'csv':  return '📊';
    case 'json': return '📋';
    case 'txt':  return '📝';
    default:     return '📁';
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── FileItem ─────────────────────────────────────────────────────────────────

function FileItem({
  file,
  isSelected,
  onClick,
}: {
  file: FileInfo;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
        ${isSelected
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
      title={file.path}
    >
      <span className="flex-shrink-0 text-base">{fileTypeIcon(file.type)}</span>
      <span className="truncate flex-1">{file.name}</span>
      <span className="flex-shrink-0 text-xs text-gray-400 font-normal">
        {formatSize(file.sizeBytes)}
      </span>
    </button>
  );
}

// ─── FolderItem ───────────────────────────────────────────────────────────────

function FolderItem({
  folder,
  selectedPath,
  onSelectFile,
}: {
  folder: Folder;
  selectedPath: string | null;
  onSelectFile: (file: FileInfo) => void;
}) {
  // Auto-expand if a file in this folder is selected
  const hasSelected = folder.files.some((f) => f.path === selectedPath);
  const [open, setOpen] = useState(hasSelected || folder.files.length > 0);

  return (
    <div>
      {/* Folder header */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {/* Caret icon */}
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* Folder emoji */}
        <span className="flex-shrink-0">
          {open ? '📂' : '📁'}
        </span>

        {/* Folder name */}
        <span className="truncate flex-1 text-left">{folder.name}</span>

        {/* File count badge */}
        <span className="flex-shrink-0 text-xs text-gray-400 font-normal">
          {folder.files.length}
        </span>
      </button>

      {/* Files */}
      {open && (
        <div className="ml-3 border-l border-gray-200 pl-2 space-y-0.5 mt-0.5 mb-1">
          {folder.files.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-gray-400 italic">Empty folder</p>
          ) : (
            folder.files.map((file) => (
              <FileItem
                key={file.path}
                file={file}
                isSelected={selectedPath === file.path}
                onClick={() => onSelectFile(file)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── FolderTree ───────────────────────────────────────────────────────────────

export function FolderTree({
  folders,
  rootFiles,
  selectedPath,
  totalFiles,
  totalSizeBytes,
  onSelectFile,
}: FolderTreeProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Label */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Files</h2>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Root-level files */}
        {rootFiles.map((file) => (
          <FileItem
            key={file.path}
            file={file}
            isSelected={selectedPath === file.path}
            onClick={() => onSelectFile(file)}
          />
        ))}

        {/* Folders */}
        {folders.map((folder) => (
          <FolderItem
            key={folder.path}
            folder={folder}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
          />
        ))}

        {/* Empty tree message */}
        {folders.length === 0 && rootFiles.length === 0 && (
          <p className="px-3 py-4 text-sm text-gray-400 text-center">
            No files yet
          </p>
        )}
      </div>

      {/* Footer stats */}
      <div className="border-t border-gray-200 px-4 py-2.5">
        <p className="text-xs text-gray-400">
          {totalFiles} file{totalFiles !== 1 ? 's' : ''} · {formatSize(totalSizeBytes)}
        </p>
      </div>
    </div>
  );
}
