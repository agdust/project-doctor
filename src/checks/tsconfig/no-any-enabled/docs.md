# tsconfig-no-any-enabled

Checks if `noImplicitAny` is enabled (directly or via `strict`).

## Why

When TypeScript can't infer a type, it defaults to `any`. This silently disables type checking for those values, defeating the purpose of using TypeScript.

With `noImplicitAny`, you must explicitly declare types when inference fails, ensuring full type coverage.

## Examples

**Pass**: `strict: true` or `noImplicitAny: true`.

**Fail**: Neither option is enabled.

## How to fix

Either enable strict mode:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Or enable `noImplicitAny` individually:

```json
{
  "compilerOptions": {
    "noImplicitAny": true
  }
}
```
