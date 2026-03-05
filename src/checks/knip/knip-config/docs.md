# knip-config

Checks that knip has a configuration file.

## Why

While knip works without config, a config file:

- Documents project structure
- Ignores false positives
- Configures entry points
- Handles monorepo setups

## Examples

**Pass**: `knip.json` or `knip.ts` exists.

**Fail**: No knip configuration found.

**Skip**: Knip not installed.

## How to fix

Create `knip.json`:

```json
{
  "entry": ["src/index.ts"],
  "ignore": ["**/*.test.ts"]
}
```

Or for monorepos, `knip.ts`:

```typescript
export default {
  workspaces: {
    "packages/*": {
      entry: ["src/index.ts"]
    }
  }
};
```
