# eslint-no-legacy-config

Warns when legacy `.eslintrc.*` files exist.

## Why

Legacy ESLint configuration (`.eslintrc.js`, `.eslintrc.json`, etc.):

- Is deprecated since ESLint v9
- Will be removed in future versions
- May cause confusion with flat config

## Examples

**Pass**: No legacy `.eslintrc.*` files exist.

**Warn**: Legacy configuration file found.

**Skip**: ESLint not installed.

## How to fix

1. Migrate configuration to `eslint.config.js`
2. Delete legacy files: `.eslintrc`, `.eslintrc.js`, `.eslintrc.json`, `.eslintrc.yml`

Migration guide: https://eslint.org/docs/latest/use/configure/migration-guide
