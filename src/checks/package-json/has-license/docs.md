# package-json-has-license

Checks that package.json has a `license` field specifying the project's license.

## Why

The license field tells users how they can legally use your package. Without it, the default copyright applies (all rights reserved), which may prevent others from using your code. npm requires this field for published packages.

## Examples

**Pass**: `"license": "MIT"`

**Fail**: No `license` field in package.json

## How to fix

Add a license field to your package.json:

```json
{
  "license": "MIT"
}
```

Common licenses: `MIT`, `Apache-2.0`, `GPL-3.0`, `ISC`, `BSD-3-Clause`. Use `UNLICENSED` for private packages.
