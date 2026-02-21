'use client';

import { useState, useEffect, useCallback } from 'react';

interface BriefingData {
  enabled: boolean;
  briefing: {
    content: string;
    createdAt: string;
  } | null;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function MorningBriefingCard() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchBriefing = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/briefing');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Non-fatal — hide card on error
      setData({ enabled: false, briefing: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  // Don't render while loading — avoids layout shift since this is conditional
  if (loading) {
    return (
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-orange-100 rounded w-2/5 mb-3" />
        <div className="h-3 bg-orange-100 rounded w-full mb-2" />
        <div className="h-3 bg-orange-100 rounded w-4/5" />
      </div>
    );
  }

  // Don't render if briefing is disabled or no data
  if (!data?.enabled) return null;

  const briefing = data.briefing;
  const today = new Date().toDateString();
  const briefingIsToday = briefing
    ? new Date(briefing.createdAt).toDateString() === today
    : false;

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-5" role="region" aria-label="Morning briefing">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-orange-900 flex items-center gap-1.5">
            ☀️ Morning Briefing
          </h2>
          <p className="text-xs text-orange-600 mt-0.5">{fmtDate(new Date().toISOString())}</p>
        </div>
        {briefing && briefingIsToday && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex-shrink-0">
            {fmt(briefing.createdAt)}
          </span>
        )}
      </div>

      {/* Content */}
      {briefing && briefingIsToday ? (
        <div>
          <p className={`text-sm text-gray-800 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
            {briefing.content}
          </p>
          {briefing.content.length > 200 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-2 text-xs text-orange-700 hover:text-orange-900 font-medium"
            >
              {expanded ? 'Show less ↑' : 'Read full briefing ↓'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-orange-700">
          No briefing yet today. Your agents are still gathering intel.
        </p>
      )}
    </div>
  );
}
