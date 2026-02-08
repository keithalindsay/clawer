"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Setting {
  key: string;
  value: any;
  description: string;
  sensitive: boolean;
  updatedAt: string | null;
}

const SETTING_GROUPS = {
  "API Keys": [
    "llm_api_key_openai",
    "llm_api_key_anthropic",
    "llm_api_key_google",
    "llm_api_key_xai",
    "llm_api_key_deepseek",
  ],
  "Default Models": [
    "llm_provider",
    "llm_model",
    "llm_base_url",
  ],
  "Support Agent": [
    "support_agent_enabled",
    "support_agent_model",
    "support_agent_max_diagnoses_hour",
  ],
  "Container Defaults": [
    "default_container_model",
    "default_container_provider",
  ],
  "Feature Flags": [
    "feature_model_selection",
    "feature_whatsapp",
    "feature_telegram",
    "feature_slack",
  ],
};

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google (Gemini)" },
  { value: "openrouter", label: "OpenRouter" },
];

const MODEL_OPTIONS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai" },
  { value: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", provider: "anthropic" },
  { value: "claude-opus-4-5", label: "Claude Opus 4.5", provider: "anthropic" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "google" },
  { value: "gemini-3-flash", label: "Gemini 3 Flash", provider: "google" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        if (res.status === 403) {
          setError("Admin access required");
          return;
        }
        throw new Error("Failed to load settings");
      }
      const data = await res.json();
      setSettings(data.settings);
      
      // Initialize edit values
      const values: Record<string, any> = {};
      for (const s of data.settings) {
        values[s.key] = s.value;
      }
      setEditValues(values);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to save setting");
      }
      
      // Update local state
      setSettings(prev =>
        prev.map(s =>
          s.key === key
            ? { ...s, value: s.sensitive ? "••••••••" : value, updatedAt: new Date().toISOString() }
            : s
        )
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const getSetting = (key: string): Setting | undefined => {
    return settings.find(s => s.key === key);
  };

  const renderSettingInput = (key: string) => {
    const setting = getSetting(key);
    const value = editValues[key];
    const isSaving = saving === key;

    // Boolean settings (feature flags)
    if (key.startsWith("feature_") || key === "support_agent_enabled") {
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const newValue = !value;
              setEditValues(prev => ({ ...prev, [key]: newValue }));
              saveSetting(key, newValue);
            }}
            disabled={isSaving}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              value ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                value ? "left-7" : "left-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">
            {value ? "Enabled" : "Disabled"}
          </span>
        </div>
      );
    }

    // Provider dropdown
    if (key === "llm_provider" || key === "default_container_provider") {
      return (
        <div className="flex gap-2">
          <select
            value={value || ""}
            onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select provider...</option>
            {PROVIDER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => saveSetting(key, editValues[key])}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "..." : "Save"}
          </button>
        </div>
      );
    }

    // Model dropdown
    if (key.includes("model") && !key.includes("selection")) {
      return (
        <div className="flex gap-2">
          <select
            value={value || ""}
            onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select model...</option>
            {MODEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => saveSetting(key, editValues[key])}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "..." : "Save"}
          </button>
        </div>
      );
    }

    // Number input
    if (key.includes("max_")) {
      return (
        <div className="flex gap-2">
          <input
            type="number"
            value={value || ""}
            onChange={(e) => setEditValues(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => saveSetting(key, editValues[key])}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "..." : "Save"}
          </button>
        </div>
      );
    }

    // Sensitive input (API keys)
    if (setting?.sensitive) {
      return (
        <div className="flex gap-2">
          <input
            type="password"
            value={editValues[key] === "••••••••" ? "" : (editValues[key] || "")}
            onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder="Enter new value..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => saveSetting(key, editValues[key])}
            disabled={isSaving || !editValues[key] || editValues[key] === "••••••••"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "..." : "Save"}
          </button>
        </div>
      );
    }

    // Default text input
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => saveSetting(key, editValues[key])}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? "..." : "Save"}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error === "Admin access required") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
          <p className="text-gray-500 mb-6">You don't have permission to view this page.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600">
              ← Admin
            </Link>
            <h1 className="text-xl font-bold text-gray-900">System Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && error !== "Admin access required" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {Object.entries(SETTING_GROUPS).map(([groupName, keys]) => (
          <div key={groupName} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{groupName}</h2>
            <div className="space-y-4">
              {keys.map(key => {
                const setting = getSetting(key);
                return (
                  <div key={key} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <label className="font-medium text-gray-700">
                          {formatKeyName(key)}
                        </label>
                        {setting?.description && (
                          <p className="text-sm text-gray-500">{setting.description}</p>
                        )}
                      </div>
                      {setting?.updatedAt && (
                        <span className="text-xs text-gray-400">
                          Updated {new Date(setting.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {renderSettingInput(key)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

function formatKeyName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace("Llm", "LLM")
    .replace("Api", "API");
}
