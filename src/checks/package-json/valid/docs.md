# package-json-valid

Verifies that `package.json` contains valid JSON syntax.

## Why

A malformed `package.json` will break all Node.js tooling:

- `npm install` will fail
- IDEs won't provide autocomplete for dependencies
- Build tools and bundlers won't work
- CI/CD pipelines will fail

Common causes of invalid JSON:
- Trailing commas
- Missing quotes around keys
- Single quotes instead of double quotes
- Comments (JSON doesn't support comments)

## Examples

**Pass**: `package.json` parses successfully as JSON.

**Fail**: Syntax error in `package.json`.

## How to fix

Use a JSON validator or your IDE's JSON formatting. Most editors highlight JSON syntax errors.

## Related

- [package-json-exists](./package-json-exists.md)
