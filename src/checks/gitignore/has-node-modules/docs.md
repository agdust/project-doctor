# gitignore-has-node-modules

Checks that `node_modules` is listed in `.gitignore`.

## Why

The `node_modules` directory contains all installed npm packages and can be:

- Extremely large (hundreds of MB)
- Easily regenerated from package.json/lockfile
- Platform-specific (native modules differ between OS)

Committing it wastes repository space and causes merge conflicts.

## Examples

**Pass**: `.gitignore` contains `node_modules` or `node_modules/`.

**Fail**: `node_modules` is not in `.gitignore`.

## How to fix

Add to `.gitignore`:

```
node_modules
```
