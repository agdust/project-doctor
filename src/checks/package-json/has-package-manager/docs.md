# package-json-has-package-manager

Checks that package.json specifies the `packageManager` field.

## Why

The `packageManager` field declares which package manager (and version) a project uses. This prevents contributors from accidentally using the wrong package manager, and enables Corepack to automatically use the correct version. Without it, new contributors may install with npm when the project uses pnpm, causing lock file conflicts and missing dependencies.

## Examples

**Pass**: `"packageManager": "pnpm@9.15.4"`

**Fail**: No `packageManager` field

## How to fix

Add a packageManager field to your package.json:

```json
{
  "packageManager": "npm@10.8.0"
}
```

Use your package manager's exact version. You can find it with `npm --version`, `yarn --version`, or `pnpm --version`.
