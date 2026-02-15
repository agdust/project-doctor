# package-json-has-version

Checks that package.json has a `version` field.

## Why

The version field is required for npm packages and follows semantic versioning (semver). It allows users to depend on specific versions, enables npm to track updates, and is essential for publishing to npm.

## Examples

**Pass**: `"version": "1.0.0"`

**Fail**: No `version` field in package.json

## How to fix

Add a version field to your package.json:

```json
{
  "version": "0.1.0"
}
```

Use semantic versioning: MAJOR.MINOR.PATCH (e.g., `1.0.0`, `2.3.1`).
