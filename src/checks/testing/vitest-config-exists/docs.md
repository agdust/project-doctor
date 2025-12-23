# vitest-config-exists

Checks that Vitest is configured.

## Why

Vitest is a fast, Vite-native test runner. Benefits:

- Native ESM and TypeScript support
- Watch mode with hot reloading
- Jest-compatible API
- Built-in coverage with c8/istanbul

## Examples

**Pass**: `vitest.config.ts` or `vitest.config.js` exists.

**Fail**: No Vitest configuration found.

## How to fix

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8'
    }
  }
});
```

Or use Vite's config with test section.
