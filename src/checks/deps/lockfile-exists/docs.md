# lockfile-exists

Checks that a package lockfile exists.

## Why

Lockfiles ensure reproducible builds:

- Exact dependency versions are recorded
- Same versions install across machines
- Prevents "works on my machine" issues
- Security audits work correctly

## Supported Lockfiles

- `package-lock.json` (npm)
- `yarn.lock` (Yarn)
- `pnpm-lock.yaml` (pnpm)

## Examples

**Pass**: A lockfile exists.

**Fail**: No lockfile found.

## How to fix

Run your package manager's install command:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Commit the generated lockfile.
