# nvmrc-valid-format

Checks that `.nvmrc` contains a valid Node version format.

## Why

Invalid version formats cause nvm/fnm to fail or behave unexpectedly.

## Valid Formats

- `20` - Major version only
- `20.10` - Major.minor
- `20.10.0` - Full semver
- `v20` - With v prefix
- `lts/iron` - LTS codename

## Examples

**Pass**: `.nvmrc` contains a recognized version format.

**Fail**: Unrecognized format (e.g., `latest`, `stable`, typos).

**Skip**: No `.nvmrc` file.

## How to fix

Use a standard version format:

```
20
```

Or LTS codename:

```
lts/iron
```
