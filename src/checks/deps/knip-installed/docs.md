# knip-installed

Checks that knip is installed for dead code detection.

## Why

Knip finds:

- Unused files
- Unused dependencies
- Unused exports
- Unlisted dependencies

This keeps your codebase clean and your bundle small.

## Examples

**Pass**: Knip is in devDependencies.

**Fail**: Knip not found in package.json.

## How to fix

Install knip:

```bash
npm install -D knip
```

Add a script:

```json
{
  "scripts": {
    "knip": "knip"
  }
}
```

Run it:

```bash
npm run knip
```
