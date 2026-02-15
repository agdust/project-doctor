# package-json-scripts-lint

Checks that package.json has a `lint` script defined in the scripts section.

## Why

A `lint` script provides a standard command for running static analysis on your code. This catches bugs, enforces coding standards, and ensures code quality. It's essential for CI/CD pipelines.

## Examples

**Pass**: `"scripts": { "lint": "eslint src" }`

**Fail**: No `lint` script in package.json

## How to fix

Add a lint script to your package.json:

```json
{
  "scripts": {
    "lint": "eslint src"
  }
}
```

Common lint commands: `eslint src`, `biome lint .`, `oxlint`.
