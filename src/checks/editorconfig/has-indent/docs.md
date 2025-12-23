# editorconfig-has-indent

Checks that `.editorconfig` defines indentation settings.

## Why

Inconsistent indentation:

- Makes code harder to read
- Causes unnecessary git diffs
- Creates merge conflicts
- Looks unprofessional

EditorConfig ensures everyone uses the same indentation.

## Examples

**Pass**: `.editorconfig` has `indent_style` and/or `indent_size`.

**Fail**: No indentation settings found.

**Skip**: No `.editorconfig` file.

## How to fix

Add indentation settings to `.editorconfig`:

```ini
[*]
indent_style = space
indent_size = 2
```

Or for tabs:

```ini
[*]
indent_style = tab
```
