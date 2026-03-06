---
{ "toolUrl": "https://prettier.io/docs/en/" }
---

# prettier-ignore-exists

Checks that a `.prettierignore` file exists.

## Why

Without `.prettierignore`, Prettier may format files it shouldn't:

- Generated code
- Build output
- Vendored dependencies
- Lock files

This wastes time and can cause issues.

## Examples

**Pass**: `.prettierignore` file exists.

**Warn**: No `.prettierignore` file found.

**Skip**: Prettier not installed.

## How to fix

Create `.prettierignore`:

```
dist
build
node_modules
package-lock.json
*.min.js
```
