# nvmrc-exists

Checks that an `.nvmrc` file exists.

## Why

An `.nvmrc` file specifies the Node.js version for your project:

- Ensures all developers use the same Node version
- Prevents "works on my machine" issues
- Integrates with nvm, fnm, and other version managers
- Documents Node requirements

## Examples

**Pass**: `.nvmrc` file exists.

**Fail**: No `.nvmrc` file found.

## How to fix

Create `.nvmrc` with your Node version:

```
20
```

Or use the current version:

```bash
node -v > .nvmrc
```
