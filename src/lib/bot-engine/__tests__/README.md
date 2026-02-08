# Bot Engine Tests

This directory contains comprehensive tests for the clawer.ai bot engine.

## 🎯 Test Files

### `security.test.ts` (14 tests)
Security utilities and validation tests:
- Input sanitization (prompt injection detection)
- Output filtering (PII/credential masking)
- Confirmation flow (user action validation)

**Run standalone:**
```bash
npm test -- src/lib/bot-engine/__tests__/security.test.ts
```

### `executor.test.ts` (11 tests)
Main bot execution engine tests:
- Rate limiting (tier-based, window reset)
- Tool execution orchestration
- Input validation
- Usage logging

**Note:** Includes real Ollama calls - may be slow (~60s)

### `tool-sandbox.test.ts` (15 tests)
Tool sandbox validation and execution:
- Argument validation (types, required fields)
- Tool permissions (allowlist, unknown tools)
- Timeout handling (30s limit)
- Error handling
- Mock tool execution

### `bots.test.ts` (API tests)
See `src/app/api/__tests__/` for API route tests.

## 🚀 Quick Start

```bash
# Run all bot-engine tests
npm test -- src/lib/bot-engine/__tests__/

# Run specific test file
npm test -- src/lib/bot-engine/__tests__/security.test.ts

# Run with coverage
npm run test:coverage
```

## 📝 Writing New Tests

Follow the existing pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup
  });

  describe('Behavior Group', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await myFunction(input);
      
      // Assert
      expect(result.success).toBe(true);
    });
  });
});
```

## 🔍 Coverage Goals

Aim for:
- **Critical security functions:** 100% coverage
- **Public APIs:** 100% coverage
- **Error handling:** All error paths tested
- **Edge cases:** Empty, null, invalid inputs

## 🐛 Known Issues

- Executor tests make real Ollama calls (slow)
- Consider mocking Ollama for CI/CD speed
- Timeout set to 60s to accommodate slow model responses

## 📚 Related Docs

- `FINAL_TEST_SUMMARY.md` - Full test suite documentation
- `TEST_RESULTS.md` - Detailed test breakdown
- `vitest.config.ts` - Test runner configuration
