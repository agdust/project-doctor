# package-json-type-module

Checks that package.json has `"type": "module"` to enable ES modules.

## Why

Setting `type: "module"` enables native ES module syntax (`import`/`export`) in `.js` files. This is the modern standard for JavaScript and aligns with browser behavior. Without it, Node.js treats `.js` files as CommonJS.

## Examples

**Pass**: `"type": "module"`

**Fail**: No `type` field or `"type": "commonjs"`

## How to fix

Add the type field to your package.json:

```json
{
  "type": "module"
}
```

Note: This changes how Node.js interprets `.js` files. Use `.cjs` extension for CommonJS files if needed.
