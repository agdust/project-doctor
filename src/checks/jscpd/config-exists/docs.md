---
{ "toolUrl": "https://github.com/kucherenko/jscpd" }
---

# jscpd-config-exists

Checks that jscpd (JavaScript Copy/Paste Detector) is configured.

## Why

jscpd automatically detects copy-pasted code across your project, helping you identify candidates for refactoring into shared functions or modules.

Duplicate code is a maintenance burden:

- Bug fixes in one place are missed in copies
- Changes require updates in multiple locations
- Codebase grows unnecessarily large
- Tests may not cover all duplicates


## Examples

**Pass**: `.jscpd.json` or `.jscpdrc` exists in project root.

**Fail**: No jscpd configuration found.

## How to fix

Install jscpd:

```bash
npm install -D jscpd
```

Create `.jscpd.json`:

```json
{
  "threshold": 0,
  "reporters": ["html", "console"],
  "ignore": ["**/node_modules/**", "**/dist/**", "**/*.min.js"],
  "format": ["javascript", "typescript", "jsx", "tsx"]
}
```

Add a script to package.json:

```json
{
  "scripts": {
    "cpd": "jscpd src"
  }
}
```

Run it:

```bash
npm run cpd
```
