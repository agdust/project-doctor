# gitignore-has-dist

Checks that build output directories are ignored.

## Why

Compiled/built output (dist, build, out) should not be committed because:

- It can be regenerated from source
- Creates unnecessary diff noise
- May contain platform-specific code
- Increases repository size

Exception: Libraries may commit dist for npm publishing.

## Examples

**Pass**: `.gitignore` contains `dist`, `build`, or `out`.

**Warn**: No common build output directory is ignored.

## How to fix

Add to `.gitignore`:

```
dist
build
out
```
