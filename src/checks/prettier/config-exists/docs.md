# prettierrc-exists

Checks that a Prettier configuration file exists.

## Why

While Prettier works with defaults, a config file:

- Documents your formatting choices
- Ensures consistent formatting across editors/CI
- Allows customization (tabs vs spaces, line width, etc.)

## Examples

**Pass**: `.prettierrc`, `.prettierrc.json`, `prettier.config.js`, or similar exists.

**Fail**: No Prettier configuration found.

**Skip**: Prettier not installed.

## How to fix

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 100
}
```
