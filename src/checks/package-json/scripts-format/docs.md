# package-json-scripts-format

Checks that package.json has a `format` script defined in the scripts section.

## Why

A `format` script provides a standard command for automatically formatting code. This ensures consistent code style across the project and makes it easy for contributors to format their changes before committing.

## Examples

**Pass**: `"scripts": { "format": "prettier --write ." }`

**Fail**: No `format` script in package.json

## How to fix

Add a format script to your package.json:

```json
{
  "scripts": {
    "format": "prettier --write ."
  }
}
```

Common format commands: `prettier --write .`, `biome format --write .`.
