/**
 * Launch Engine — Quality Gate Engine
 * Rules-based content scoring against the brand bible.
 * LOCAL logic only — no AI calls. Fast, deterministic, cheap.
 *
 * Scores content on 4 dimensions (each 0-10):
 *   1. Voice Compliance  — vocabulary, banned phrases, tone signals
 *   2. Factual Accuracy  — unverified claims, unsourced numbers heuristic
 *   3. Engagement        — hook strength, CTA presence, shareability
 *   4. Guidelines        — competitor rules, legal bounds, messaging traps
 *
 * Composite score = average of all 4. Pass threshold default: 6.0
 */

import type { BrandConfig, ContentGuidelines } from './brand-config';
import type {
  BannedPhraseResult,
  ContentType,
  GateFlag,
  GuidelinesResult,
  QualityGateResult,
  QualityGateScore,
  Voice,
  VocabularyResult,
} from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_PASS_THRESHOLD = 6.0;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point. Score content across all 4 quality dimensions.
 *
 * @param content     Raw content string to evaluate
 * @param contentType Type of content (tweet, blog, thread, etc.)
 * @param voice       Which voice was used (founder | brand)
 * @param brandConfig Loaded brand configuration
 * @param passThreshold  Override pass threshold (default 6.0)
 */
export function scoreContent(
  content: string,
  contentType: ContentType,
  voice: Voice,
  brandConfig: BrandConfig,
  passThreshold: number = DEFAULT_PASS_THRESHOLD,
): QualityGateResult {
  const normalised = normaliseText(content);

  // ── Dimension 1: Voice Compliance ──────────────────────────────────────────
  const vocabResult = checkVocabulary(
    normalised,
    brandConfig.vocabulary.useList,
    brandConfig.vocabulary.avoidList,
  );
  const bannedResult = checkBannedPhrases(normalised, brandConfig.guidelines.bannedPhrases);

  const voiceScore = computeVoiceScore(vocabResult, bannedResult, normalised, voice);
  const voiceFlags: GateFlag[] = [
    ...vocabResult.flags,
    ...bannedResult.flags,
    ...checkToneSignals(normalised),
  ];

  // ── Dimension 2: Factual Accuracy ─────────────────────────────────────────
  const { score: accuracyScore, flags: accuracyFlags } = checkFactualAccuracy(
    normalised,
    contentType,
  );

  // ── Dimension 3: Engagement Potential ────────────────────────────────────
  const engagementScore = estimateEngagement(normalised, contentType);
  const engagementFlags = buildEngagementFlags(normalised, contentType, engagementScore);

  // ── Dimension 4: Guidelines Compliance ───────────────────────────────────
  const guidelinesResult = checkGuidelines(normalised, brandConfig.guidelines);
  const guidelinesFlags = guidelinesResult.flags;

  // ── Composite ─────────────────────────────────────────────────────────────
  const scores: QualityGateScore = {
    voice: voiceScore,
    accuracy: accuracyScore,
    engagement: engagementScore,
    guidelines: guidelinesResult.score,
  };

  const compositeScore = roundTo1(
    (scores.voice + scores.accuracy + scores.engagement + scores.guidelines) / 4,
  );

  const allFlags = [
    ...voiceFlags.map((f) => ({ ...f, dimension: 'voice' as const })),
    ...accuracyFlags.map((f) => ({ ...f, dimension: 'accuracy' as const })),
    ...engagementFlags.map((f) => ({ ...f, dimension: 'engagement' as const })),
    ...guidelinesFlags.map((f) => ({ ...f, dimension: 'guidelines' as const })),
  ];

  return {
    compositeScore,
    scores,
    flags: allFlags,
    passed: compositeScore >= passThreshold,
    passThreshold,
    rationale: {
      voice: buildVoiceRationale(voiceScore, vocabResult, bannedResult),
      accuracy: buildAccuracyRationale(accuracyScore, accuracyFlags),
      engagement: buildEngagementRationale(engagementScore, normalised, contentType),
      guidelines: buildGuidelinesRationale(guidelinesResult),
    },
    reviewedAt: new Date(),
  };
}

// ─── Dimension 1: Voice Compliance ───────────────────────────────────────────

/**
 * Check vocabulary usage — preferred terms hit, avoid terms flagged.
 */
export function checkVocabulary(
  content: string,
  useList: string[],
  avoidList: string[],
): VocabularyResult {
  const lower = content.toLowerCase();
  const flags: GateFlag[] = [];

  const usedPreferred = useList.filter((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );

  const usedAvoid = avoidList.filter((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );

  for (const phrase of usedAvoid) {
    flags.push({
      type: 'vocabulary-violation',
      detail: `Avoid using "${phrase}" — prefer on-brand vocabulary`,
      severity: 'warning',
      match: phrase,
    });
  }

  // Score: start at 10, penalise avoid hits, reward preferred hits
  // -1.5 per avoid term, +0.3 per preferred hit (capped)
  const avoidPenalty = Math.min(usedAvoid.length * 1.5, 8);
  const preferredBonus = Math.min(usedPreferred.length * 0.3, 2);
  const score = clamp(10 - avoidPenalty + preferredBonus, 0, 10);

  return {
    score: roundTo1(score),
    usedPreferred,
    usedAvoid,
    flags,
  };
}

/**
 * Check for exact banned phrases.
 */
export function checkBannedPhrases(content: string, bannedPhrases: string[]): BannedPhraseResult {
  const lower = content.toLowerCase();
  const flags: GateFlag[] = [];

  const found = bannedPhrases.filter((phrase) =>
    lower.includes(phrase.toLowerCase()),
  );

  for (const phrase of found) {
    flags.push({
      type: 'banned-phrase',
      detail: `Banned phrase detected: "${phrase}"`,
      severity: 'error',
      match: phrase,
    });
  }

  return {
    clean: found.length === 0,
    found,
    flags,
  };
}

/**
 * Compute final voice score from vocabulary + banned phrase results.
 */
function computeVoiceScore(
  vocabResult: VocabularyResult,
  bannedResult: BannedPhraseResult,
  content: string,
  voice: Voice,
): number {
  // Start from vocabulary score
  let score = vocabResult.score;

  // Banned phrases are severe: -2 per banned phrase
  const bannedPenalty = Math.min(bannedResult.found.length * 2, 8);
  score -= bannedPenalty;

  // Tone bonus: founder voice gets credit for first-person, personal signals
  if (voice === 'founder') {
    const founderSignals = [/\bi\b/i, /\bi've\b/i, /\bmy\b/i, /\bwe\b/i, /hot take/i, /tbh/i, /ngl/i];
    const signalHits = founderSignals.filter((r) => r.test(content)).length;
    score += Math.min(signalHits * 0.2, 0.6);
  }

  // Hype language detection (separate from banned phrases — covers patterns)
  const hypeHits = detectHypeLanguage(content);
  score -= Math.min(hypeHits * 0.5, 2);

  return clamp(roundTo1(score), 0, 10);
}

/**
 * Detect additional hype language patterns not in the banned list.
 */
function detectHypeLanguage(content: string): number {
  const hypePatterns = [
    /\bexciting\b/i,
    /\bamazing\b/i,
    /\bincredible\b/i,
    /\blandmark\b/i,
    /\bbreakthrough\b/i,
    /\bgroundbreaking\b/i,
    /\bunprecedented\b/i,
    /\bblockbuster\b/i,
    /\bbest ever\b/i,
    /\bworld.?class\b/i,
    /\!{2,}/,          // Multiple exclamation marks
  ];
  return hypePatterns.filter((p) => p.test(content)).length;
}

/**
 * Check tone signals — flags corporate passive voice, overly formal patterns.
 */
function checkToneSignals(content: string): GateFlag[] {
  const flags: GateFlag[] = [];
  const patterns: Array<{ pattern: RegExp; detail: string }> = [
    {
      pattern: /\bwill be (provisioned|instantiated|deployed)\b/i,
      detail: 'Corporate passive voice detected — use active voice (e.g., "Hit deploy. Your agents go live.")',
    },
    {
      pattern: /\bin this (article|post|blog) (we will|we'll|I will|I'll)\b/i,
      detail: 'Weak opener — never start with "In this article we will...". Lead with the problem or a hook.',
    },
    {
      pattern: /\bwe are (pleased|delighted|proud|excited) to\b/i,
      detail: 'Corporate announcement language — use direct declarative instead.',
    },
    {
      pattern: /\bplease note that\b/i,
      detail: 'Corporate filler phrase — cut it.',
    },
    {
      pattern: /\bour (solution|platform|product) (offers|provides|enables)\b/i,
      detail: 'Feature-first framing — lead with the pain point instead.',
    },
  ];

  for (const { pattern, detail } of patterns) {
    if (pattern.test(content)) {
      flags.push({ type: 'off-brand-language', detail, severity: 'warning' });
    }
  }

  return flags;
}

// ─── Dimension 2: Factual Accuracy ───────────────────────────────────────────

interface AccuracyResult {
  score: number;
  flags: GateFlag[];
}

/**
 * Heuristic accuracy check.
 * - Numbers/stats without obvious citation markers get flagged
 * - Superlative claims without evidence get flagged
 * - Known safe patterns (CVE-YYYY-NNNNN, $X/month, X seconds) are exempt
 */
function checkFactualAccuracy(content: string, contentType: ContentType): AccuracyResult {
  const flags: GateFlag[] = [];
  let penalty = 0;

  // Numbers in content
  const numberMatches = content.match(/\b\d[\d,]*(\.\d+)?(%|k|K|M|B|x)?\b/g) ?? [];
  const citationPatterns = [
    /\bCVE-\d{4}-\d+\b/i,             // CVE references — self-verifying
    /\$\d+\s*\/?\s*(month|mo|year|yr)/i, // Pricing — can be verified against site
    /\b\d+\s*(second|sec|minute|min|hour|day|week)s?\b/i, // Time durations — generally OK
    /\b\d{1,3}%\s*(uptime|availability)/i, // SLA claims — should be verified
  ];

  for (const num of numberMatches) {
    const surrounding = extractSurrounding(content, num, 80);
    const hasCitation =
      citationPatterns.some((p) => p.test(surrounding)) ||
      /\(source|according to|via|ref:|https?:\/\//i.test(surrounding);

    // Check if it's a "safe" standalone number (single-digit, year reference, etc.)
    const isSafe =
      /^\d$/.test(num) ||                              // single digit
      /^(19|20)\d{2}$/.test(num) ||                   // year
      /\b(top|number|#)\s*\d+\b/i.test(surrounding); // list position

    if (!hasCitation && !isSafe && parseInt(num.replace(/,/g, '')) > 9) {
      flags.push({
        type: 'unverified-claim',
        detail: `Unverified number "${num}" — add source or citation`,
        severity: 'warning',
        match: num,
      });
      penalty += 0.5;
    }
  }

  // Superlative claims without evidence
  const superlativePatterns = [
    /\b(first|only|#1|number one|the most|the best|the fastest|the cheapest)\b/i,
  ];

  for (const pattern of superlativePatterns) {
    if (pattern.test(content)) {
      const match = content.match(pattern)?.[0];
      const surrounding = match ? extractSurrounding(content, match, 100) : '';
      const hasContext =
        /\bin (the world|our category|managed openclaw|openclaw hosting)\b/i.test(surrounding) ||
        /\baccording to\b/i.test(surrounding) ||
        /\bwe measured\b/i.test(surrounding);

      if (!hasContext) {
        flags.push({
          type: 'unverified-claim',
          detail: `Superlative claim "${match}" used without supporting evidence`,
          severity: 'warning',
          match: match ?? undefined,
        });
        penalty += 0.8;
      }
    }
  }

  // Tweets get a lower baseline penalty (less space for citations — expected)
  if (contentType === 'tweet' || contentType === 'thread') {
    penalty *= 0.5;
  }

  const score = clamp(roundTo1(10 - Math.min(penalty, 6)), 0, 10);
  return { score, flags };
}

// ─── Dimension 3: Engagement Potential ───────────────────────────────────────

const HOOK_PATTERNS = [
  /^\d[\d,]*(k|K|M|%)?\+?\s+/,           // Starts with a number ("42,000 instances...")
  /^hot take[:\s]/i,                       // Hot take
  /^(the|a|an) (truth|reality|secret|problem|question|reason)/i,
  /\?$/m,                                  // Ends a sentence with a question
  /^(if you|have you|did you|do you)/i,    // Reader-address openers
  /^(spent|built|shipped|launched|discovered)/i, // Action-first openers
  /^(not (a|an)|this is not)/i,           // Subverts expectation
  /^(why|how|what|when)\s/i,              // Question openers
  /^"[^"]{10,}"/,                         // Starts with a quote
];

const CTA_PATTERNS = [
  /\bhttps?:\/\/\S+/,                     // Link in content
  /\[link\]/i,                            // Link placeholder
  /→/,                                    // Arrow CTA common in our format
  /\bsignup\b|\bsign up\b/i,
  /\btry\s+(it|clawer|free)\b/i,
  /\bdeploy\b/i,
  /\bcheck\s+(your|the|if)\b/i,
  /\blearn more\b/i,
  /\bthread\s*↓\b/i,                      // Thread indicator
];

const SHAREABILITY_SIGNALS = [
  /\b(tip|trick|shortcut|hack|cheatsheet|checklist)\b/i,
  /\b(save this|bookmark|share)\b/i,
  /\b(vs\.?|versus|compared to|comparison)\b/i,
  /\b(everyone|nobody|most people|you're not alone)\b/i,
  /\bhere'?s? (how|what|why)\b/i,
  /\b(the (real|honest|actual|truth))\b/i,
  /\btldr\b/i,
];

/**
 * Estimate engagement potential for given content and type.
 * Returns 0-10.
 */
export function estimateEngagement(content: string, contentType: ContentType): number {
  const lower = content.toLowerCase();
  let score = 5.0; // baseline

  // ── Hook strength ──────────────────────────────────────────────────────────
  // Check first 200 chars (the hook zone)
  const hookZone = content.slice(0, 200);
  const hookHits = HOOK_PATTERNS.filter((p) => p.test(hookZone)).length;
  score += Math.min(hookHits * 1.0, 2.5);

  // ── CTA presence ──────────────────────────────────────────────────────────
  const ctaHits = CTA_PATTERNS.filter((p) => p.test(content)).length;
  if (ctaHits > 0) {
    score += Math.min(ctaHits * 0.5, 1.5);
  } else {
    // No CTA — small penalty (especially for brand voice, less for founder voice)
    score -= 0.5;
  }

  // ── Shareability signals ──────────────────────────────────────────────────
  const shareHits = SHAREABILITY_SIGNALS.filter((p) => p.test(lower)).length;
  score += Math.min(shareHits * 0.4, 1.2);

  // ── Specificity bonus (numbers give credibility) ──────────────────────────
  const hasNumbers = /\b\d[\d,]*\b/.test(content);
  if (hasNumbers) score += 0.3;

  // ── Content-type specific adjustments ────────────────────────────────────
  if (contentType === 'tweet') {
    // Tweets: penalise if too long (>280 chars)
    if (content.length > 280) score -= 1.0;
    // Tweets: bonus for very tight writing (<200 chars with hook)
    if (content.length < 200 && hookHits > 0) score += 0.3;
  }

  if (contentType === 'blog') {
    // Blogs: check for subheadings and structure signals
    const hasSubheadings = /^#{2,}/m.test(content);
    if (hasSubheadings) score += 0.5;
    const hasCodeBlock = /```/.test(content);
    if (hasCodeBlock) score += 0.3;
  }

  if (contentType === 'thread') {
    // Threads: bonus if it looks like a numbered thread
    const hasTweetNumbers = /^\d+\//m.test(content) || /tweet \d+/i.test(content);
    if (hasTweetNumbers) score += 0.4;
  }

  // ── Penalties ──────────────────────────────────────────────────────────────
  // Bland opener patterns
  if (/^(we are|we're|clawer is|our )/i.test(content)) {
    score -= 0.8;
  }

  // Passive, corporate, feature-first opener
  if (/^(introducing|announcing|today we|this week we)/i.test(content)) {
    score -= 0.5;
  }

  return clamp(roundTo1(score), 0, 10);
}

function buildEngagementFlags(
  content: string,
  contentType: ContentType,
  score: number,
): GateFlag[] {
  const flags: GateFlag[] = [];

  if (score < 5) {
    flags.push({
      type: 'engagement-low',
      detail: `Low engagement score (${score}/10) — consider stronger hook or CTA`,
      severity: 'warning',
    });
  }

  const hasCTA = CTA_PATTERNS.some((p) => p.test(content));
  if (!hasCTA && contentType !== 'tweet') {
    flags.push({
      type: 'engagement-low',
      detail: 'No CTA detected — add a link, action prompt, or directional arrow',
      severity: 'info',
    });
  }

  const hookZone = content.slice(0, 200);
  const hasHook = HOOK_PATTERNS.some((p) => p.test(hookZone));
  if (!hasHook) {
    flags.push({
      type: 'engagement-low',
      detail: 'Weak opener — lead with a number, bold claim, or question to improve hook strength',
      severity: 'info',
    });
  }

  return flags;
}

// ─── Dimension 4: Guidelines Compliance ──────────────────────────────────────

/**
 * Check content against the full content guidelines.
 */
export function checkGuidelines(
  content: string,
  guidelines: ContentGuidelines,
): GuidelinesResult {
  const lower = content.toLowerCase();
  const flags: GateFlag[] = [];
  const competitorViolations: string[] = [];
  const legalViolations: string[] = [];
  const messagingTrapViolations: string[] = [];
  let penalty = 0;

  // ── Competitor rules ──────────────────────────────────────────────────────
  const competitorForbiddenPatterns: Array<{ pattern: RegExp; detail: string }> = [
    {
      pattern: /\bdon't waste your time self.host/i,
      detail: 'Negative framing of self-hosting — use respectful comparison instead',
    },
    {
      pattern: /\bself.hosting is (dangerous|irresponsible|broken)/i,
      detail: 'Disparaging self-hosting without evidence',
    },
    {
      pattern: /chatgpt is (just a|only a|a dumb)\b/i,
      detail: "Don't mock competing AI products — compare categories, not companies",
    },
    {
      pattern: /\b(claude|gpt|openai|anthropic)\s+(can't|cannot|is (useless|broken|trash))\b/i,
      detail: "Don't dismiss competitor AI models — compare what agents can *do*",
    },
  ];

  for (const { pattern, detail } of competitorForbiddenPatterns) {
    if (pattern.test(content)) {
      const match = content.match(pattern)?.[0] ?? '';
      flags.push({
        type: 'competitor-violation',
        detail,
        severity: 'error',
        match,
      });
      competitorViolations.push(match);
      penalty += 2;
    }
  }

  // ── Legal boundary violations ─────────────────────────────────────────────
  for (const claim of guidelines.legalBoundaries.forbiddenClaims) {
    if (lower.includes(claim.toLowerCase())) {
      flags.push({
        type: 'legal-risk',
        detail: `Legal risk: "${claim}" — this claim requires verification or should be removed`,
        severity: 'error',
        match: claim,
      });
      legalViolations.push(claim);
      penalty += 2;
    }
  }

  // ── Messaging traps ───────────────────────────────────────────────────────
  for (const trap of guidelines.legalBoundaries.messagingTraps) {
    if (lower.includes(trap.avoid.toLowerCase())) {
      flags.push({
        type: 'guidelines-violation',
        detail: `Messaging trap "${trap.avoid}" — use instead: "${trap.useInstead}"`,
        severity: 'warning',
        match: trap.avoid,
      });
      messagingTrapViolations.push(trap.avoid);
      penalty += 0.8;
    }
  }

  // ── "do not say" list check ───────────────────────────────────────────────
  for (const phrase of guidelines.doNotSay) {
    if (lower.includes(phrase.toLowerCase())) {
      // Only flag if not already caught by banned phrases or legal checks
      const alreadyFlagged = flags.some((f) => f.match?.toLowerCase() === phrase.toLowerCase());
      if (!alreadyFlagged) {
        flags.push({
          type: 'guidelines-violation',
          detail: `Avoid: "${phrase}" — see content guidelines`,
          severity: 'warning',
          match: phrase,
        });
        penalty += 0.5;
      }
    }
  }

  const score = clamp(roundTo1(10 - Math.min(penalty, 8)), 0, 10);

  return {
    score,
    flags,
    competitorViolations,
    legalViolations,
    messagingTrapViolations,
  };
}

// ─── Rationale Builders ───────────────────────────────────────────────────────

function buildVoiceRationale(
  score: number,
  vocab: VocabularyResult,
  banned: BannedPhraseResult,
): string {
  const parts: string[] = [];

  if (banned.found.length > 0) {
    parts.push(`Banned phrases found: ${banned.found.join(', ')}.`);
  }
  if (vocab.usedAvoid.length > 0) {
    parts.push(`Vocabulary to avoid: ${vocab.usedAvoid.slice(0, 3).join(', ')}.`);
  }
  if (vocab.usedPreferred.length > 0) {
    parts.push(`Good vocabulary hits: ${vocab.usedPreferred.slice(0, 3).join(', ')}.`);
  }
  if (parts.length === 0) {
    parts.push(score >= 8 ? 'Voice is on-brand.' : 'Minor tone issues detected.');
  }

  return parts.join(' ') + ` Score: ${score}/10.`;
}

function buildAccuracyRationale(score: number, flags: GateFlag[]): string {
  const unverified = flags.filter((f) => f.type === 'unverified-claim');
  if (unverified.length === 0) {
    return `No unverified claims detected. Score: ${score}/10.`;
  }
  const matches = unverified
    .map((f) => f.match)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
  return `${unverified.length} unverified claim(s): ${matches}. Add sources or remove. Score: ${score}/10.`;
}

function buildEngagementRationale(
  score: number,
  content: string,
  contentType: ContentType,
): string {
  const hookZone = content.slice(0, 200);
  const hasHook = HOOK_PATTERNS.some((p) => p.test(hookZone));
  const hasCTA = CTA_PATTERNS.some((p) => p.test(content));

  const parts: string[] = [];
  if (!hasHook) parts.push('Weak hook — opener lacks urgency or specificity.');
  if (!hasCTA) parts.push('No CTA detected.');
  if (parts.length === 0) {
    parts.push(score >= 7 ? 'Good hook and CTA present.' : 'Moderate engagement signals.');
  }

  return parts.join(' ') + ` Score: ${score}/10.`;
}

function buildGuidelinesRationale(result: GuidelinesResult): string {
  const parts: string[] = [];

  if (result.competitorViolations.length > 0) {
    parts.push(`Competitor rule violation(s): ${result.competitorViolations.join(', ')}.`);
  }
  if (result.legalViolations.length > 0) {
    parts.push(`Legal boundary violation(s): ${result.legalViolations.join(', ')}.`);
  }
  if (result.messagingTrapViolations.length > 0) {
    parts.push(`Messaging trap(s): ${result.messagingTrapViolations.join(', ')}.`);
  }
  if (parts.length === 0) {
    parts.push(result.score >= 8 ? 'Guidelines clean.' : 'Minor guidelines notes detected.');
  }

  return parts.join(' ') + ` Score: ${result.score}/10.`;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Normalise whitespace but preserve structure */
function normaliseText(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim();
}

/** Extract surrounding text around a match for context */
function extractSurrounding(content: string, match: string, radius: number): string {
  const idx = content.indexOf(match);
  if (idx === -1) return content.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + match.length + radius);
  return content.slice(start, end);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundTo1(value: number): number {
  return Math.round(value * 10) / 10;
}
