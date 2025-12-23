# editorconfig-has-root

Checks that `.editorconfig` has `root = true`.

## Why

EditorConfig searches upward through directories for config files. Without `root = true`:

- Parent directory configs may override your settings
- Behavior becomes unpredictable
- Different team members may get different results

## Examples

**Pass**: `.editorconfig` contains `root = true`.

**Fail**: `root = true` not found.

**Skip**: No `.editorconfig` file.

## How to fix

Add at the top of `.editorconfig`:

```ini
root = true
```
