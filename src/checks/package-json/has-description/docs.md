# package-json-has-description

Checks that package.json has a `description` field.

## Why

The description field provides a brief summary of what your package does. It appears on npm, in search results, and helps users quickly understand the purpose of your project.

## Examples

**Pass**: `"description": "A CLI tool for running health checks on Node.js projects"`

**Fail**: No `description` field in package.json

## How to fix

Add a description field to your package.json:

```json
{
  "description": "Brief description of what your package does"
}
```

Keep it concise (one sentence) and descriptive.
