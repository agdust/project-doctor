# tsconfig-valid-json

Verifies that `tsconfig.json` contains valid JSON syntax.

## Why

A malformed `tsconfig.json` will cause TypeScript compilation to fail and break IDE features like autocomplete and type checking.

## Examples

**Pass**: `tsconfig.json` parses without errors.

**Fail**: `tsconfig.json` has syntax errors (missing commas, trailing commas in strict mode, etc.).

## How to fix

Use a JSON validator or your IDE to identify and fix syntax errors in `tsconfig.json`.
