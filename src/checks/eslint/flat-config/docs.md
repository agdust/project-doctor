---
{ "toolUrl": "https://eslint.org/docs/latest/" }
---

# eslint-flat-config

Checks for ESLint flat config format (v9+).

## Why

Flat config (`eslint.config.js`) is the new ESLint configuration format:

- Simpler, explicit configuration
- Native ES modules support
- Better TypeScript integration
- Legacy `.eslintrc.*` is deprecated

## Examples

**Pass**: `eslint.config.js`, `eslint.config.mjs`, or `eslint.config.ts` exists.

**Fail**: Only legacy `.eslintrc.*` configuration found.

**Skip**: ESLint not installed.

## How to fix

Migrate to flat config:

```javascript
// eslint.config.js
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    rules: {
      // your rules
    },
  },
];
```

See: https://eslint.org/docs/latest/use/configure/migration-guide
