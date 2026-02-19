#!/usr/bin/env node
/**
 * SearXNG → Brave Search API Proxy
 * 
 * Accepts Brave Search API format requests and routes to SearXNG,
 * returning Brave-compatible JSON responses.
 * 
 * This allows OpenClaw containers to use local SearXNG for web_search
 * without modification.
 */

const http = require('http');

const PORT = process.env.PROXY_PORT || 8889;
const SEARXNG_URL = process.env.SEARXNG_URL || 'http://localhost:8888';

async function searchSearXNG(query, count = 10) {
  const url = `${SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`SearXNG error: ${res.status}`);
  }
  
  return res.json();
}

function transformToBraveFormat(searxngResults, query) {
  // Transform SearXNG results to Brave Search API format
  const webResults = (searxngResults.results || []).map((r, idx) => ({
    title: r.title || '',
    url: r.url || '',
    description: r.content || '',
    is_source_local: false,
    is_source_both: false,
    language: 'en',
    family_friendly: true,
    type: 'search_result',
    subtype: 'generic',
    age: r.publishedDate || null,
    meta_url: {
      scheme: r.url?.startsWith('https') ? 'https' : 'http',
      netloc: new URL(r.url || 'http://example.com').hostname,
      hostname: new URL(r.url || 'http://example.com').hostname,
      favicon: '',
      path: new URL(r.url || 'http://example.com').pathname,
    },
    thumbnail: r.thumbnail ? { src: r.thumbnail } : null,
  }));

  return {
    query: {
      original: query,
      show_strict_warning: false,
      is_navigational: false,
      is_news_breaking: false,
      spellcheck_off: false,
      country: 'us',
      bad_results: false,
      should_fallback: false,
      postal_code: '',
      city: '',
      header_country: '',
      more_results_available: true,
      state: '',
    },
    mixed: {
      type: 'mixed',
      main: webResults.slice(0, 10).map((_, i) => ({
        type: 'web',
        index: i,
        all: false,
      })),
      top: [],
      side: [],
    },
    type: 'search',
    web: {
      type: 'search',
      results: webResults,
      family_friendly: true,
    },
  };
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Subscription-Token, Accept');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // Handle Brave Search API endpoint
  if (url.pathname === '/res/v1/web/search' && req.method === 'GET') {
    const query = url.searchParams.get('q');
    const count = parseInt(url.searchParams.get('count') || '10', 10);
    
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing query parameter' }));
      return;
    }
    
    console.log(`[proxy] Search: "${query}" (count=${count})`);
    
    try {
      const searxngResults = await searchSearXNG(query, count);
      const braveResponse = transformToBraveFormat(searxngResults, query);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(braveResponse));
    } catch (err) {
      console.error('[proxy] Error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  
  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', searxng: SEARXNG_URL }));
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] SearXNG→Brave proxy listening on port ${PORT}`);
  console.log(`[proxy] SearXNG backend: ${SEARXNG_URL}`);
});
