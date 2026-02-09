# Router Test Harness

**Purpose:** Validate Clawer's smart router configuration quickly and systematically.

## Quick Start

```bash
# Run full test suite
cd ~/projects/clawer
source ~/.nvm/nvm.sh && nvm use 20 >/dev/null
node_modules/.bin/tsx scripts/test-router.ts

# Test a specific query
node_modules/.bin/tsx scripts/test-router.ts --query "Build a todo app"

# Verbose mode (see signals for each test)
node_modules/.bin/tsx scripts/test-router.ts --verbose
```

## What It Tests

**Test coverage (22 queries):**
- **SIMPLE tier** (3 tests): Facts, definitions, translations
- **MEDIUM tier** (4 tests): Creative writing, summaries, comparisons
- **COMPLEX tier** (7 tests): Multi-step coding/building tasks
- **REASONING tier** (5 tests): Proofs, deep analysis, chain-of-thought
- **Edge cases** (3 tests): Single words, trivial code, code explanation

## Current Results (Feb 9, 2026)

- **Pass rate:** 72.7% (16/22 passed)
- **Avg confidence:** 64.7%
- **Tier distribution:** SIMPLE 9%, MEDIUM 36%, COMPLEX 36%, REASONING 18%

**Known issues:**
- "Define X" routing to MEDIUM instead of SIMPLE (acceptable)
- "Explain X" routing to COMPLEX instead of MEDIUM (minor over-routing, safe)
- "Build" (single word) routing to MEDIUM (edge case, acceptable)

**Key validation:** ✅ "Build a REST API..." correctly routes to COMPLEX (59.1% confidence)

## Adding Test Cases

Edit `scripts/test-router.ts` and add to `TEST_QUERIES`:

```typescript
{
  prompt: 'Your test query here',
  expectedTier: 'COMPLEX',
  category: 'complex-your-category',
}
```

## Router Config Tuning

Edit `src/lib/router/config.ts`:

1. **Threshold tuning:** `tokenCountThresholds`, `tierBoundaries`
2. **Keyword lists:** Add domain-specific terms to trigger tiers
3. **Dimension weights:** Adjust scoring importance (sum must = 1.0)

**After config changes:**
- Run tests: `node_modules/.bin/tsx scripts/test-router.ts`
- Check verbose output: `--verbose` to see signals
- Iterate until pass rate >80%

## Workflow: Router Tuning

```
1. Identify misbehaving query (from logs or user feedback)
2. Add to TEST_QUERIES with expected tier
3. Run tests → see actual tier
4. Check verbose signals to understand why
5. Adjust config.ts (keywords, weights, boundaries)
6. Re-run tests → verify improvement
7. Commit when pass rate >80%
```

## CI Integration (Future)

Add to GitHub Actions:

```yaml
- name: Test router classification
  run: |
    source ~/.nvm/nvm.sh && nvm use 20
    node_modules/.bin/tsx scripts/test-router.ts
```

Exit code: 0 = all passed, 1 = failures detected

---

**Built:** 2026-02-09 (nightly-improvement-builder)  
**Impact:** Reduces router config tuning from hours to minutes
