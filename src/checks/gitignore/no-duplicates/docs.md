# gitignore-no-duplicates

Checks for duplicate patterns in `.gitignore`.

## Why

Duplicate entries in `.gitignore`:

- Indicate copy-paste errors
- Make the file harder to maintain
- May suggest the file needs cleanup

## Examples

**Pass**: All patterns in `.gitignore` are unique.

**Warn**: Same pattern appears multiple times.

## How to fix

Remove duplicate lines from `.gitignore`. Consider organizing patterns into sections with comments.
