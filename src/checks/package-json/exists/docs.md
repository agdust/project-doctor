# package-json-exists

Verifies that a `package.json` file exists in the project root.

## Why

Every Node.js project requires a `package.json` file. It serves as the manifest that:

- Defines project metadata (name, version, description)
- Lists all dependencies and their versions
- Configures npm scripts for common tasks
- Enables package managers (npm, yarn, pnpm) to work correctly
- Provides entry points for the package when published

Without this file, Node.js tooling cannot function properly.

## Examples

**Pass**: Project has `package.json` at the root directory.

**Fail**: No `package.json` file found.

## How to fix

Run `npm init` or `npm init -y` to create a basic `package.json`.

## Related

- [package-json-valid](./package-json-valid.md)
- [package-json-has-name](./package-json-has-name.md)
