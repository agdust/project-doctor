# eslint-config-exists

Checks that an ESLint configuration file exists.

## Why

ESLint enforces code quality and consistency. Without a config file, ESLint:

- Won't know which rules to apply
- Can't be customized for your project
- May use inconsistent defaults

## Examples

**Pass**: `eslint.config.js`, `eslint.config.mjs`, or legacy `.eslintrc.*` exists.

**Fail**: No ESLint configuration found.

**Skip**: ESLint not installed.

## How to fix

Create `eslint.config.js`:

```javascript
import js from "@eslint/js";

export default [js.configs.recommended];
```
