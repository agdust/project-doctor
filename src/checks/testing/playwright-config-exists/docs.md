# playwright-config-exists

Checks that Playwright is configured.

## Why

Playwright provides cross-browser end-to-end testing:

- Chromium, Firefox, and WebKit support
- Auto-waiting and assertions
- Trace viewer for debugging
- Parallel test execution

## Examples

**Pass**: `playwright.config.ts` or `playwright.config.js` exists.

**Fail**: No Playwright configuration found.

## How to fix

Initialize Playwright:

```bash
npm init playwright@latest
```

Or create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```
