"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types (mirrors SanitizedConfig from the API route)
// ---------------------------------------------------------------------------

interface ConfigData {
  models: {
    primary: string;
    fallback: string;
    heartbeat: string;
    subagent: string;
    embeddings: string;
  };
  channels: {
    whatsapp: { configured: boolean };
    telegram: { configured: boolean };
    slack: { configured: boolean };
  };
  memory: {
    memorySearch: boolean;
    embeddings: { provider: string; model: string };
  };
  security: {
    dmScope: string;
    containerIsolation: true;
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="grid grid-cols-2 gap-y-3 text-sm">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="contents">
          <div className="h-4 bg-gray-100 rounded animate-pulse w-28" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-32" />
        </div>
      ))}
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 flex-shrink-0 ${
        active ? "bg-green-500" : "bg-gray-300"
      }`}
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ConfigOverview() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/config");
        if (!res.ok) throw new Error("Failed to load config");
        const data: ConfigData = await res.json();
        setConfig(data);
      } catch {
        setError("Could not load configuration");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Card 1: AI Models ──────────────────────────────────────────────────

  const modelsCard = (
    <div className="border border-gray-200 rounded-xl p-6 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 AI Models</h3>

      {loading ? (
        <SkeletonRow />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <span className="text-gray-500">Primary Model</span>
          <span className="text-gray-900 font-medium">{config!.models.primary}</span>

          <span className="text-gray-500">Fallback Model</span>
          <span className="text-gray-900 font-medium">{config!.models.fallback}</span>

          <span className="text-gray-500">Sub-Agent Model</span>
          <span className="text-gray-900 font-medium">{config!.models.subagent}</span>

          <span className="text-gray-500">Heartbeat Model</span>
          <span className="text-gray-900 font-medium">{config!.models.heartbeat}</span>

          <span className="text-gray-500">Embeddings</span>
          <span className="text-gray-900 font-medium">{config!.models.embeddings}</span>
        </div>
      )}
    </div>
  );

  // ── Card 2: Connected Channels ─────────────────────────────────────────

  const channelsCard = (
    <div className="border border-gray-200 rounded-xl p-6 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📡 Channels</h3>

      {loading ? (
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="contents">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-28" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <span className="text-gray-500">WhatsApp</span>
          <span className="flex items-center text-gray-900 font-medium">
            <StatusDot active={config!.channels.whatsapp.configured} />
            {config!.channels.whatsapp.configured ? "Configured" : "Not connected"}
          </span>

          <span className="text-gray-500">Telegram</span>
          <span className="flex items-center text-gray-900 font-medium">
            <StatusDot active={config!.channels.telegram.configured} />
            {config!.channels.telegram.configured ? "Configured" : "Not connected"}
          </span>

          <span className="text-gray-500">Slack</span>
          <span className="flex items-center text-gray-900 font-medium">
            <StatusDot active={config!.channels.slack.configured} />
            {config!.channels.slack.configured ? "Configured" : "Not connected"}
          </span>
        </div>
      )}
    </div>
  );

  // ── Card 3: Memory & Context ───────────────────────────────────────────

  const memoryCard = (
    <div className="border border-gray-200 rounded-xl p-6 bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">💾 Memory</h3>

      {loading ? (
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="contents">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-32" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <span className="text-gray-500">Memory Search</span>
          <span className="flex items-center text-gray-900 font-medium">
            <StatusDot active={config!.memory.memorySearch} />
            {config!.memory.memorySearch ? "Enabled" : "Disabled"}
          </span>

          <span className="text-gray-500">Embedding Model</span>
          <span className="text-gray-900 font-medium">{config!.memory.embeddings.model}</span>

          <span className="text-gray-500">Container</span>
          <span className="text-gray-900 font-medium">Dedicated (isolated)</span>
        </div>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {modelsCard}
      {channelsCard}
      {memoryCard}
    </div>
  );
}
