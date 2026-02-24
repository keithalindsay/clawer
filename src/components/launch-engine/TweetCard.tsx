'use client';

import { useState, useRef, useEffect } from 'react';
import type { TweetDraft, ContentPillar, ContentVoice } from './types';

// ────────────────────────────────────────────────────────────
// Display metadata helpers
// ────────────────────────────────────────────────────────────

const VOICE_META: Record<ContentVoice, { label: string; icon: string; classes: string }> = {
  founder: {
    label: '@Vavier',
    icon: '🎭',
    classes: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  brand: {
    label: '@teamclawer',
    icon: '🏢',
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

const PILLAR_META: Record<ContentPillar, { label: string; icon: string; classes: string }> = {
  security: { label: 'Security', icon: '🔐', classes: 'bg-red-100 text-red-700 border-red-200' },
  ease: { label: 'Ease & Speed', icon: '⚡', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'ai-teams': { label: 'AI Teams', icon: '🤖', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  'use-cases': { label: 'Use Cases', icon: '💡', classes: 'bg-green-100 text-green-700 border-green-200' },
  education: { label: 'Education', icon: '📚', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const SOURCE_LABELS: Record<string, string> = {
  'trending-topic': 'trending-topic',
  'blog-promotion': 'blog-promo',
  'build-in-public': 'build-in-public',
  'competitor-reaction': 'competitor',
  'community-engagement': 'community',
  'content-pillar': 'content-pillar',
  campaign: 'campaign',
};

const CHAR_LIMIT = 280;

function charCountClass(count: number): string {
  if (count > CHAR_LIMIT) return 'text-red-600 font-semibold';
  if (count > 250) return 'text-yellow-600';
  return 'text-gray-400';
}

function scoreColor(score: number): string {
  if (score >= 8.5) return 'text-green-700 bg-green-50 border-green-200';
  if (score >= 7.0) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {children}
    </span>
  );
}

function ScoreBreakdown({ draft }: { draft: TweetDraft }) {
  const [open, setOpen] = useState(false);
  const dims: Array<{ key: keyof typeof draft.gateScores; label: string }> = [
    { key: 'voice', label: 'Voice' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'engagement', label: 'Engagement' },
    { key: 'guidelines', label: 'Guidelines' },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`px-2 py-0.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${scoreColor(
          draft.gateScore,
        )}`}
        title="Click to see score breakdown"
      >
        Score: {draft.gateScore.toFixed(1)}
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-20 w-52 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Quality Gate Scores</p>
          <div className="space-y-1.5">
            {dims.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20">{label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                  <div
                    className="h-full rounded-full bg-orange-400"
                    style={{ width: `${(draft.gateScores[key] / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-4">{draft.gateScores[key]}</span>
              </div>
            ))}
          </div>
          {draft.gateFlags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              {draft.gateFlags.map((flag, i) => (
                <p key={i} className="text-xs text-yellow-700">
                  ⚠️ {flag.detail}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Kill confirmation
// ────────────────────────────────────────────────────────────

function KillConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
      <span className="text-sm text-red-700 flex-1">Kill this draft?</span>
      <button
        type="button"
        onClick={onConfirm}
        className="text-xs px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Kill it
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Schedule picker
// ────────────────────────────────────────────────────────────

function ScheduleDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (datetime: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(() => {
    const d = new Date(Date.now() + 3600 * 1000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  return (
    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center gap-3">
      <span className="text-sm text-blue-700">Schedule at:</span>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-xs border border-blue-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <button
        type="button"
        onClick={() => onConfirm(value)}
        className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Schedule
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main TweetCard
// ────────────────────────────────────────────────────────────

interface TweetCardProps {
  draft: TweetDraft;
  onApprove: (id: string) => void;
  onKill: (id: string) => void;
  onSchedule: (id: string, datetime: string) => void;
  onSaveEdit: (id: string, newBody: string) => void;
}

export function TweetCard({ draft, onApprove, onKill, onSchedule, onSaveEdit }: TweetCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(draft.body);
  const [confirmKill, setConfirmKill] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const voiceMeta = VOICE_META[draft.voice];
  const pillarMeta = PILLAR_META[draft.pillar];
  const currentCharCount = editMode ? editText.length : draft.charCount;

  useEffect(() => {
    if (editMode && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [editMode]);

  const handleSave = async () => {
    if (editText.trim() === draft.body) {
      setEditMode(false);
      return;
    }
    setSaving(true);
    try {
      await onSaveEdit(draft.id, editText.trim());
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(draft.body);
    setEditMode(false);
  };

  const statusBadge = () => {
    if (draft.status === 'approved') {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
          ✅ Approved
        </span>
      );
    }
    if (draft.status === 'scheduled') {
      const when = draft.scheduledAt
        ? new Date(draft.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : '';
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-medium">
          📅 {when}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start gap-2 flex-wrap">
        {/* Voice badge */}
        <Badge className={voiceMeta.classes}>
          <span>{voiceMeta.icon}</span>
          <span>{voiceMeta.label}</span>
        </Badge>

        {/* Source type */}
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-mono">
          {SOURCE_LABELS[draft.sourceType] ?? draft.sourceType}
        </span>

        {/* Pillar */}
        <Badge className={pillarMeta.classes}>
          <span>{pillarMeta.icon}</span>
          <span>{pillarMeta.label}</span>
        </Badge>

        {/* Status (approved / scheduled) */}
        {statusBadge()}

        {/* Score — right-aligned */}
        <div className="ml-auto">
          <ScoreBreakdown draft={draft} />
        </div>
      </div>

      {/* Body / Edit */}
      {editMode ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            maxLength={CHAR_LIMIT + 20}
            className="w-full text-sm text-gray-800 border border-orange-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${charCountClass(currentCharCount)}`}>
              {currentCharCount}/{CHAR_LIMIT}
              {currentCharCount > CHAR_LIMIT && ' — over limit!'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || currentCharCount > CHAR_LIMIT}
                className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{draft.body}</p>
      )}

      {/* Source reference */}
      {draft.sourceRef && !editMode && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <span>📊 Source:</span>
          {draft.sourceRef.url ? (
            <a
              href={draft.sourceRef.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {draft.sourceRef.label}
            </a>
          ) : (
            <span>{draft.sourceRef.label}</span>
          )}
        </p>
      )}

      {/* Char count (when not editing) */}
      {!editMode && (
        <p className={`text-xs ${charCountClass(draft.charCount)}`}>
          {draft.charCount}/{CHAR_LIMIT} chars
        </p>
      )}

      {/* Action buttons */}
      {!editMode && (
        <div className="flex flex-wrap gap-2 pt-1">
          <ActionButton
            label="✏️ Edit"
            onClick={() => {
              setEditText(draft.body);
              setEditMode(true);
              setConfirmKill(false);
              setSchedulingMode(false);
            }}
            variant="neutral"
          />
          <ActionButton
            label="✅ Approve"
            onClick={() => onApprove(draft.id)}
            variant="success"
            disabled={draft.status === 'approved'}
          />
          <ActionButton
            label="📅 Schedule"
            onClick={() => {
              setSchedulingMode((p) => !p);
              setConfirmKill(false);
            }}
            variant="primary"
          />
          <ActionButton
            label="🗑️ Kill"
            onClick={() => {
              setConfirmKill((p) => !p);
              setSchedulingMode(false);
            }}
            variant="danger"
          />
        </div>
      )}

      {/* Kill confirmation */}
      {confirmKill && !editMode && (
        <KillConfirmDialog
          onConfirm={() => {
            setConfirmKill(false);
            onKill(draft.id);
          }}
          onCancel={() => setConfirmKill(false)}
        />
      )}

      {/* Schedule dialog */}
      {schedulingMode && !editMode && (
        <ScheduleDialog
          onConfirm={(dt) => {
            setSchedulingMode(false);
            onSchedule(draft.id, dt);
          }}
          onCancel={() => setSchedulingMode(false)}
        />
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  variant,
  disabled,
}: {
  label: string;
  onClick: () => void;
  variant: 'neutral' | 'success' | 'primary' | 'danger';
  disabled?: boolean;
}) {
  const variantClasses: Record<string, string> = {
    neutral: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    success: 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100',
    primary: 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100',
    danger: 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-3 py-1.5 border rounded-md transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]}`}
    >
      {label}
    </button>
  );
}
