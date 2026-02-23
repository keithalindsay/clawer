'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  content: string;
  source: string;
  timestamp?: string;
  score?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MemorySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch('/api/dashboard/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Search failed');
        setResults([]);
      } else {
        setResults(data.results || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search memory');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setSearched(false);
  };

  return (
    <div className="space-y-4">
      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your agent's memory... (e.g., 'What did I say about vacation?')"
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={loading}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              🔍 Search
            </>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          ⚠ {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">No results found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Your agent couldn't find anything matching "{query}". Try different keywords or phrases.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Found <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for "{query}"
                </p>
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear results
                </button>
              </div>

              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-200 hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                          {result.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <span>📄 {result.source}</span>
                          {result.timestamp && (
                            <>
                              <span>·</span>
                              <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                            </>
                          )}
                          {result.score !== undefined && (
                            <>
                              <span>·</span>
                              <span>Match: {Math.round(result.score * 100)}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Help text */}
      {!searched && (
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
          <p className="text-sm text-blue-800 leading-relaxed">
            💡 <strong>Tip:</strong> Semantic search understands meaning, not just keywords. 
            Try natural questions like "What are my hobbies?" or "When did I mention work deadlines?"
          </p>
        </div>
      )}
    </div>
  );
}
