# package-json-has-engines

Checks that package.json specifies the required Node.js version in the `engines` field.

## Why

Specifying `engines.node` ensures that users and CI systems know which Node.js versions are supported. This prevents cryptic errors from running on incompatible Node versions and helps package managers warn users about version mismatches.

## Examples

**Pass**: `"engines": { "node": ">=20.0.0" }`

**Fail**: No `engines` field or missing `engines.node`

## How to fix

Add an engines field to your package.json:

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

Use `>=` for minimum version, or specify exact ranges like `">=18.0.0 <22.0.0"`.
