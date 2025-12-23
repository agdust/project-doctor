# tsconfig-exists

Verifies that a `tsconfig.json` file exists in the project root.

## Why

TypeScript projects require a `tsconfig.json` to configure the compiler. Without it, TypeScript cannot properly compile your code and IDEs won't provide accurate type checking.

## Examples

**Pass**: Project has `tsconfig.json` at root.

**Fail**: No `tsconfig.json` file found.

## How to fix

Run `npx tsc --init` to generate a default `tsconfig.json`, or create one manually.
