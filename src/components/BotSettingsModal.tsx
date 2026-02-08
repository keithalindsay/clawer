"use client";

import { useState, useEffect } from "react";

interface BotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: BotSettingsData) => void;
  initialSettings?: BotSettingsData;
}

export interface BotSettingsData {
  botName: string;
  botAvatar: string;
  personality: string;
  customInstructions: string;
  communicationStyle: string;
  responseLength: string;
}

const AVATAR_OPTIONS = ["🤖", "🧠", "✨", "🦊", "🐱", "🦉", "🌟", "💫", "🔮", "🎯", "💡", "🚀"];

const PERSONALITY_PRESETS = [
  { label: "Friendly & Casual", value: "friendly, casual, and approachable" },
  { label: "Professional", value: "professional, concise, and business-focused" },
  { label: "Witty & Fun", value: "witty, playful, with a good sense of humor" },
  { label: "Direct & Efficient", value: "direct, efficient, no-nonsense" },
  { label: "Warm & Supportive", value: "warm, encouraging, and supportive" },
  { label: "Custom", value: "" },
];

const STYLE_OPTIONS = [
  { value: "casual", label: "Casual", description: "Relaxed, conversational tone" },
  { value: "balanced", label: "Balanced", description: "Professional but approachable" },
  { value: "formal", label: "Formal", description: "Business-appropriate language" },
];

const LENGTH_OPTIONS = [
  { value: "brief", label: "Brief", description: "Short, to-the-point responses" },
  { value: "balanced", label: "Balanced", description: "Medium-length, well-rounded" },
  { value: "detailed", label: "Detailed", description: "Comprehensive, thorough" },
];

export function BotSettingsModal({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}: BotSettingsModalProps) {
  const [settings, setSettings] = useState<BotSettingsData>({
    botName: "Assistant",
    botAvatar: "🤖",
    personality: "helpful and friendly",
    customInstructions: "",
    communicationStyle: "balanced",
    responseLength: "balanced",
  });
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
      // Find matching preset
      const preset = PERSONALITY_PRESETS.find(p => p.value === initialSettings.personality);
      setSelectedPreset(preset ? preset.label : "Custom");
    }
  }, [initialSettings]);

  const handlePresetChange = (preset: typeof PERSONALITY_PRESETS[0]) => {
    setSelectedPreset(preset.label);
    if (preset.value) {
      setSettings(s => ({ ...s, personality: preset.value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(settings);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Bot Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name & Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name & Avatar
            </label>
            <div className="flex gap-3">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSettings(s => ({ ...s, botAvatar: emoji }))}
                    className={`w-10 h-10 text-xl rounded-lg transition-all ${
                      settings.botAvatar === emoji
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
                value={settings.botName}
                onChange={(e) => setSettings(s => ({ ...s, botName: e.target.value }))}
                placeholder="Bot name"
                maxLength={50}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personality
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PERSONALITY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                    selectedPreset === preset.label
                      ? "bg-blue-100 text-blue-700 ring-1 ring-blue-500"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <textarea
              value={settings.personality}
              onChange={(e) => {
                setSettings(s => ({ ...s, personality: e.target.value }));
                setSelectedPreset("Custom");
              }}
              placeholder="Describe the personality..."
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
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings(s => ({ ...s, communicationStyle: option.value }))}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    settings.communicationStyle === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
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
              {LENGTH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings(s => ({ ...s, responseLength: option.value }))}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    settings.responseLength === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
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
              value={settings.customInstructions}
              onChange={(e) => setSettings(s => ({ ...s, customInstructions: e.target.value }))}
              placeholder="Add context about yourself or specific instructions...
Examples:
• I work in finance at a hedge fund
• Always respond in bullet points
• I prefer metric units"
              maxLength={2000}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              {settings.customInstructions.length}/2000 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !settings.botName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
