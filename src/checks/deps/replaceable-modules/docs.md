---
{
  "sourceUrl": "https://github.com/nicolo-ribaudo/module-replacements",
  "toolUrl": "https://github.com/es-tooling/eslint-plugin-depend"
}
---

# deps-replaceable-modules

Checks for dependencies that have modern, lighter, or native replacements available.

## Why

Many popular npm packages have been superseded by native APIs, smaller alternatives, or better-maintained successors. Keeping outdated dependencies increases bundle size, attack surface, and maintenance burden.

This check scans all three curated manifests from `module-replacements`:

- **native** — packages replaceable by built-in Node.js or browser APIs
- **preferred** — packages with well-documented modern alternatives
- **micro-utilities** — trivial packages replaceable by a one-liner

## Examples

**Pass**: No installed dependencies appear in any replacement manifest.

**Fail**: One or more dependencies have known replacements (e.g. `chalk` → `picocolors`, `underscore` → native methods).

## How to fix

Review each flagged dependency and migrate to its suggested replacement.

For ongoing protection, install [eslint-plugin-depend](https://github.com/es-tooling/eslint-plugin-depend) which uses the same replacement data to warn on imports at lint time:

```bash
npm install --save-dev eslint-plugin-depend
```
