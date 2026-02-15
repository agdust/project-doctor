# package-json-has-main-or-exports

Checks that package.json defines an entry point via `main` or `exports` field.

## Why

The entry point tells Node.js and bundlers which file to load when your package is imported. Without it, consumers cannot `require()` or `import` your package. The modern `exports` field provides more control over what's exposed.

## Examples

**Pass**: `"main": "./dist/index.js"` or `"exports": { ".": "./dist/index.js" }`

**Fail**: Neither `main` nor `exports` field present

## How to fix

Add a main or exports field to your package.json:

```json
{
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

Use `exports` for dual ESM/CJS support or conditional exports.
