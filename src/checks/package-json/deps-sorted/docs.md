# package-json-deps-sorted

Checks if dependencies and devDependencies are sorted alphabetically.

## Why

Sorted dependencies:

- Make diffs cleaner (fewer merge conflicts)
- Easier to scan and find packages
- Consistent across team members
- Many tools auto-sort anyway

## Examples

**Pass**: Dependencies are in alphabetical order.

**Fail**: `dependencies` or `devDependencies` are not sorted.

**Skip**: No `package.json` found.

## How to fix

Sort manually, or use a tool:

```bash
npx sort-package-json
```

Or configure your editor to sort on save.
