# tsconfig-strict-enabled

Checks if TypeScript strict mode is enabled in `tsconfig.json`.

## Why

Strict mode enables a set of type-checking options that catch more potential bugs at compile time:

- `strictNullChecks` - prevents null/undefined errors
- `strictFunctionTypes` - ensures function parameter types are checked correctly
- `strictBindCallApply` - validates bind, call, and apply methods
- `noImplicitAny` - requires explicit types where inference isn't possible
- `noImplicitThis` - catches `this` usage issues

## Examples

**Pass**: `compilerOptions.strict` is `true`.

**Fail**: `strict` is not set or is `false`.

## How to fix

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```
