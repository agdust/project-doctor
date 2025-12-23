# tsconfig-has-outdir

Checks if `tsconfig.json` has an `outDir` configured for compiled output.

## Why

Without `outDir`, TypeScript emits compiled `.js` files alongside source `.ts` files, mixing source and output. This:

- Makes `.gitignore` harder to manage
- Can cause issues with bundlers
- Makes cleaning build artifacts difficult

## Examples

**Pass**: `compilerOptions.outDir` is set (e.g., `"dist"` or `"build"`).

**Fail**: No `outDir` configured.

## How to fix

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "outDir": "dist"
  }
}
```
