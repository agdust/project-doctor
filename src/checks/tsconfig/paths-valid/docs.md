# tsconfig-paths-valid

Checks that path aliases have a corresponding `baseUrl` configured.

## Why

TypeScript `paths` option lets you create import aliases (e.g., `@/components`). However, `paths` are resolved relative to `baseUrl`. Without `baseUrl`, path aliases won't resolve correctly.

## Examples

**Pass**: Either no `paths` configured, or `paths` with `baseUrl`.

**Fail**: `paths` configured without `baseUrl`.

## How to fix

Add `baseUrl` alongside `paths`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```
