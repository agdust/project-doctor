# package-json-scripts-test

Checks that package.json has a `test` script defined in the scripts section.

## Why

A `test` script provides a standard command for running your project's test suite. This is essential for CI/CD pipelines and ensures all contributors use the same testing workflow via `npm test`.

## Examples

**Pass**: `"scripts": { "test": "vitest" }`

**Fail**: No `test` script in package.json

## How to fix

Add a test script to your package.json:

```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

Common test commands: `vitest`, `jest`, `mocha`, `node --test`.
