# package-json-has-name

Verifies that `package.json` has a `name` field.

## Why

The `name` field is required for:

- Publishing to npm registry
- Installing the package locally with `npm link`
- Referencing the package in error messages and logs
- Identifying the package in lockfiles

## Examples

**Pass**: `"name": "my-project"`

**Fail**: Missing `name` field.

## How to fix

Add a `name` field to your `package.json`:

```json
{
  "name": "my-project"
}
```

Names must be lowercase, can contain hyphens and underscores, and must be URL-safe.

## Related

- [package-json-has-version](./package-json-has-version.md)
