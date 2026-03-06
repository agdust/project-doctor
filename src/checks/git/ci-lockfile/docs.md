---
{ "sourceUrl": "https://github.com/lirantal/npm-security-best-practices" }
---

# git-ci-lockfile

Checks that CI workflows use deterministic package installation.

## Why

Using `npm install` in CI/production environments can lead to inconsistent installations when lockfiles and package.json are out of sync. This creates unpredictable builds and potential security issues.

Benefits of deterministic installation:
- Fails if lockfile is out of sync with package.json
- Removes node_modules before installing (clean state)
- Never writes to package.json or lockfile
- Faster than regular install (skips dependency resolution)

Always use deterministic commands in:
- CI/CD pipelines
- Production deployments
- Docker builds

## Examples

**Pass**: CI uses `npm ci`, `pnpm install --frozen-lockfile`, or equivalent.

**Fail**: CI uses `npm install` without lockfile enforcement.

**Skip**: No CI workflow files found.

## How to fix

Use the appropriate command for your package manager:

| Package Manager | Command |
|-----------------|---------|
| npm | `npm ci` |
| yarn | `yarn install --immutable` |
| pnpm | `pnpm install --frozen-lockfile` |
| bun | `bun install --frozen-lockfile` |
