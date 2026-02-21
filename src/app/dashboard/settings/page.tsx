"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TEAM_CONFIGS } from "@/lib/teams";

/* ── Morning Briefing types ─────────────────────────────────────── */

interface MorningBriefingData {
  enabled: boolean;
  time: string;
  channel: "whatsapp" | "telegram" | "web";
  timezone: string;
  includeSummary: boolean;
  includeWorking: boolean;
  includeReminders: boolean;
  includeNews: boolean;
}

const BRIEFING_CHANNELS: { value: MorningBriefingData["channel"]; label: string; emoji: string }[] = [
  { value: "whatsapp", label: "WhatsApp", emoji: "📱" },
  { value: "telegram", label: "Telegram", emoji: "✈️" },
  { value: "web",      label: "Web only",  emoji: "🌐" },
];

const BRIEFING_CONTENT_OPTIONS: { key: keyof MorningBriefingData; label: string }[] = [
  { key: "includeSummary",   label: "Quick summary of what you need to know today" },
  { key: "includeWorking",   label: "One thing you're working on" },
  { key: "includeReminders", label: "Reminders for upcoming events" },
  { key: "includeNews",      label: "Industry news relevant to you" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, "0");
  return { value: `${h}:00`, label: `${h}:00` };
});

/* ── MorningBriefingSection component ──────────────────────────── */

function MorningBriefingSection() {
  const [briefing, setBriefing] = useState<MorningBriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/briefing/settings");
        const json = await res.json();
        if (json.success) {
          setBriefing(json.data as MorningBriefingData);
        } else {
          setError("Could not load briefing settings");
        }
      } catch {
        setError("Could not load briefing settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = useCallback(async () => {
    if (!briefing) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/briefing/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: briefing.enabled,
          time: briefing.time,
          channel: briefing.channel,
          timezone: briefing.timezone,
          includeSummary: briefing.includeSummary,
          includeWorking: briefing.includeWorking,
          includeReminders: briefing.includeReminders,
          includeNews: briefing.includeNews,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError("Failed to save briefing settings");
      }
    } catch {
      setError("Failed to save briefing settings");
    } finally {
      setSaving(false);
    }
  }, [briefing]);

  const update = <K extends keyof MorningBriefingData>(
    key: K,
    value: MorningBriefingData[K]
  ) => {
    setBriefing((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (loading) {
    return (
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Morning Briefing</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-100 rounded w-2/3" />
          <div className="h-5 bg-gray-100 rounded w-1/2" />
          <div className="h-5 bg-gray-100 rounded w-3/4" />
        </div>
      </section>
    );
  }

  if (!briefing) {
    return (
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Morning Briefing</h2>
        <p className="text-sm text-red-600">{error || "Could not load settings"}</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Morning Briefing</h2>

      {/* Enable toggle */}
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <div>
          <p className="font-medium text-gray-900">Receive daily morning briefing</p>
          <p className="text-sm text-gray-500">Your agent sends you a personalised update each morning</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={briefing.enabled}
          onClick={() => update("enabled", !briefing.enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
            briefing.enabled ? "bg-orange-500" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              briefing.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {briefing.enabled && (
        <div className="space-y-6 mt-6">
          {/* Time picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              What time?{" "}
              <span className="text-gray-400 font-normal">(your local time)</span>
            </label>
            <select
              value={briefing.time}
              onChange={(e) => update("time", e.target.value)}
              className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              {HOUR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value="07:30">07:30 (default)</option>
            </select>
          </div>

          {/* Channel selector */}
          <div className="space-y-3">
            <span className="block text-sm font-medium text-gray-700">
              Preferred channel
            </span>
            <div className="flex flex-wrap gap-3">
              {BRIEFING_CHANNELS.map((ch) => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => update("channel", ch.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    briefing.channel === ch.value
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span>{ch.emoji}</span>
                  <span>{ch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content preferences */}
          <div className="space-y-3">
            <span className="block text-sm font-medium text-gray-700">
              What should I always include?
            </span>
            <div className="space-y-2">
              {BRIEFING_CONTENT_OPTIONS.map((item) => {
                const checked = briefing[item.key] as boolean;
                return (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        update(item.key as keyof MorningBriefingData, e.target.checked as MorningBriefingData[keyof MorningBriefingData])
                      }
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save Briefing Settings"}
            </button>
            {saved && (
              <span className="text-sm text-green-600">✓ Saved</span>
            )}
            {error && (
              <span className="text-sm text-red-600">{error}</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Constants ─────────────────────────────────────────────────── */

const AVATAR_OPTIONS = ["🤖", "🧠", "✨", "🦊", "🐱", "🦉", "🌟", "💫", "🔮", "🎯", "💡", "🚀"];

const STYLE_OPTIONS = [
  { value: "casual", label: "Casual", desc: "Relaxed, conversational tone" },
  { value: "balanced", label: "Balanced", desc: "Professional but approachable" },
  { value: "formal", label: "Formal", desc: "Business-appropriate language" },
];

const LENGTH_OPTIONS = [
  { value: "brief", label: "Concise", desc: "Short, to-the-point responses" },
  { value: "balanced", label: "Balanced", desc: "Medium-length, well-rounded" },
  { value: "detailed", label: "Detailed", desc: "Comprehensive, thorough" },
];

const PLATFORMS = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "📱",
    href: "/dashboard/whatsapp",
    desc: "Chat from your phone",
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: "✈️",
    href: "/dashboard/telegram",
    desc: "Chat from anywhere",
  },
  {
    key: "slack",
    label: "Slack",
    icon: "💼",
    href: "/dashboard/slack",
    desc: "For work teams",
  },
];

/* ── Types ─────────────────────────────────────────────────────── */

interface SettingsData {
  profile: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  botPersonality: {
    botName: string;
    botAvatar: string;
    personality: string;
    communicationStyle: string;
    responseLength: string;
    customInstructions: string;
  };
  notifications: {
    emailNotifications: boolean;
    weeklyDigest: boolean;
    usageAlerts: boolean;
    whatsappNotifications: boolean;
  };
  connectedPlatforms: {
    whatsapp: boolean;
    telegram: boolean;
    slack: boolean;
  };
}

/* ── Toggle component ──────────────────────────────────────────── */

function Toggle({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/* ── Team Template Section ──────────────────────────────────────── */

function TeamTemplateSection() {
  const [currentTeam, setCurrentTeam] = useState<string>("lifeos");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();
        if (data.teamTemplate) {
          setCurrentTeam(data.teamTemplate);
        }
      } catch {
        // ignore
      } finally {
        setLoadingTeam(false);
      }
    })();
  }, []);

  const handleChange = async () => {
    if (!selectedTeam || selectedTeam === currentTeam) return;
    setChanging(true);
    try {
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamTemplate: selectedTeam }),
      });
      if (res.ok) {
        setCurrentTeam(selectedTeam);
        setShowConfirm(false);
        setSelectedTeam(null);
        // Reload to reflect changes
        window.location.href = "/dashboard";
      }
    } catch {
      // ignore
    } finally {
      setChanging(false);
    }
  };

  const templates = Object.entries(TEAM_CONFIGS);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">AI Team Template</h2>
      <p className="text-sm text-gray-500 mb-4">
        Current team: <span className="font-medium text-gray-900">{TEAM_CONFIGS[currentTeam]?.name || currentTeam}</span>
      </p>
      {loadingTeam ? (
        <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(([key, config]) => {
            const isCurrent = key === currentTeam;
            const isSelected = key === selectedTeam;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!isCurrent) {
                    setSelectedTeam(key);
                    setShowConfirm(true);
                  }
                }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isCurrent
                    ? "border-blue-500 bg-blue-50"
                    : isSelected
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{config.members[0]?.emoji || "🤖"}</span>
                  <span className="font-medium text-gray-900 text-sm">{config.name}</span>
                  {isCurrent && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Current</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{config.description}</p>
                <p className="text-xs text-gray-400 mt-1">{config.members.length} members</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Switch to {TEAM_CONFIGS[selectedTeam]?.name}?
            </h3>
            {/* Team members preview */}
            <div className="mb-4 space-y-2">
              {TEAM_CONFIGS[selectedTeam]?.members.map((member) => (
                <div key={member.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50">
                  <span className="text-lg flex-shrink-0 mt-0.5">{member.emoji || '🤖'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{member.name}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{member.role}</span>
                    </div>
                    {member.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{member.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                ⚠️ <strong>Warning:</strong> Changing your team template will replace your current team members.
                Your conversation history will be preserved, but you&apos;ll be chatting with a new team.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setSelectedTeam(null); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChange}
                disabled={changing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {changing ? "Switching…" : "Switch Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* ── Fetch ─────────────────────────────────────────────────── */

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/settings");
        const json = await res.json();
        if (json.success) {
          setSettings(json.data);
        } else {
          setError("Failed to load settings");
        }
      } catch {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Save ──────────────────────────────────────────────────── */

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { name: settings.profile.name },
          botPersonality: settings.botPersonality,
          notifications: settings.notifications,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError("Failed to save settings");
      }
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }, [settings]);

  /* ── Helpers ───────────────────────────────────────────────── */

  const update = <K extends keyof SettingsData>(
    section: K,
    key: keyof SettingsData[K],
    value: unknown
  ) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: { ...prev[section], [key]: value },
      };
    });
  };

  /* ── Loading / error states ────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              🦞 Clawer.ai
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 h-48" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">{error || "Unable to load settings"}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            🦞 Clawer.ai
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and AI preferences</p>
        </div>

        {/* ── Profile ──────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="shrink-0">
              {settings.profile.avatarUrl ? (
                <img
                  src={settings.profile.avatarUrl}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                  {settings.profile.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={settings.profile.name}
                  onChange={(e) => update("profile", "name", e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Managed by Clerk — update in your Clerk account</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI Personality ───────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Personality</h2>
          <div className="space-y-5">
            {/* Name & Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Name &amp; Avatar
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg flex-wrap">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => update("botPersonality", "botAvatar", emoji)}
                      className={`w-10 h-10 text-xl rounded-lg transition-all ${
                        settings.botPersonality.botAvatar === emoji
                          ? "bg-blue-100 ring-2 ring-blue-500"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={settings.botPersonality.botName}
                  onChange={(e) => update("botPersonality", "botName", e.target.value)}
                  placeholder="Bot name"
                  maxLength={50}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Personality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personality Description
              </label>
              <textarea
                value={settings.botPersonality.personality}
                onChange={(e) => update("botPersonality", "personality", e.target.value)}
                placeholder='e.g. "friendly, casual, with a good sense of humor"'
                maxLength={500}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Communication Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Communication Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("botPersonality", "communicationStyle", opt.value)}
                    className={`p-3 text-left rounded-xl border-2 transition-all ${
                      settings.botPersonality.communicationStyle === opt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Response Length */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Length
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LENGTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update("botPersonality", "responseLength", opt.value)}
                    className={`p-3 text-left rounded-xl border-2 transition-all ${
                      settings.botPersonality.responseLength === opt.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Instructions
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={settings.botPersonality.customInstructions}
                onChange={(e) => update("botPersonality", "customInstructions", e.target.value)}
                placeholder={`Add context about yourself or specific instructions...\nExamples:\n• I work in finance at a hedge fund\n• Always respond in bullet points\n• I prefer metric units`}
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                {settings.botPersonality.customInstructions.length}/2000 characters
              </p>
            </div>
          </div>
        </section>

        {/* ── Notifications ────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h2>
          <div className="divide-y divide-gray-100">
            <Toggle
              label="Email notifications"
              description="Receive updates and alerts via email"
              enabled={settings.notifications.emailNotifications}
              onToggle={() =>
                update("notifications", "emailNotifications", !settings.notifications.emailNotifications)
              }
            />
            <Toggle
              label="Weekly digest"
              description="Get a weekly summary of your AI team's activity"
              enabled={settings.notifications.weeklyDigest}
              onToggle={() =>
                update("notifications", "weeklyDigest", !settings.notifications.weeklyDigest)
              }
            />
            <Toggle
              label="Usage alerts"
              description="Get notified when approaching your message limit"
              enabled={settings.notifications.usageAlerts}
              onToggle={() =>
                update("notifications", "usageAlerts", !settings.notifications.usageAlerts)
              }
            />
            <Toggle
              label="WhatsApp notifications"
              description="Receive alerts through WhatsApp"
              enabled={settings.notifications.whatsappNotifications}
              onToggle={() =>
                update(
                  "notifications",
                  "whatsappNotifications",
                  !settings.notifications.whatsappNotifications
                )
              }
            />
          </div>
        </section>

        {/* ── Connected Platforms ───────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Platforms</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {PLATFORMS.map((p) => {
              const connected = settings.connectedPlatforms[p.key as keyof typeof settings.connectedPlatforms];
              return (
                <Link
                  key={p.key}
                  href={p.href}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    connected
                      ? "border-green-300 bg-green-50 hover:bg-green-100"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <div className="text-2xl mb-2">{p.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{p.label}</h4>
                  <p className="text-xs text-gray-600 mb-2">{p.desc}</p>
                  {connected ? (
                    <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      ✓ Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                      Click to setup
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Morning Briefing ──────────────────────────────────── */}
        <MorningBriefingSection />

        {/* ── AI Team Template ──────────────────────────────────── */}
        <TeamTemplateSection />

        {/* ── Danger Zone ──────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
          >
            Delete Account
          </button>
        </section>

        {/* ── Save bar ─────────────────────────────────────────── */}
        <div className="sticky bottom-4 flex justify-end gap-3">
          {error && (
            <span className="self-center text-sm text-red-600 mr-auto bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </span>
          )}
          {saved && (
            <span className="self-center text-sm text-green-600 mr-auto bg-green-50 px-3 py-2 rounded-lg">
              ✓ Settings saved
            </span>
          )}
          <Link
            href="/dashboard"
            className="px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors bg-white border border-gray-300 rounded-lg font-medium"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </main>

      {/* ── Delete confirmation modal ──────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete your account, all conversations, bot settings, and
              connected platform data. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // TODO: wire up actual account deletion
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
