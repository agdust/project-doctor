# editorconfig-exists

Checks that an `.editorconfig` file exists.

## Why

EditorConfig ensures consistent coding styles across different editors:

- Indentation (tabs vs spaces)
- Line endings (LF vs CRLF)
- Final newlines
- Charset encoding

Most editors support EditorConfig natively or via plugins.

## Examples

**Pass**: `.editorconfig` file exists.

**Fail**: No `.editorconfig` file found.

## How to fix

Create `.editorconfig`:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```
