# gitignore-lockfile-not-ignored

Checks that lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml) are NOT ignored by git.

## Why

Lockfiles ensure reproducible builds by pinning exact dependency versions. Without them:

- Different developers may get different dependency versions
- CI/CD builds may differ from local builds
- Security vulnerabilities can be introduced silently through version drift

Lockfiles should always be committed to version control.

## Examples

**Pass**: Lockfiles are not listed in `.gitignore`.

**Fail**: `.gitignore` contains `package-lock.json`, `yarn.lock`, `*.lock`, or similar patterns.

## How to fix

Remove lockfile patterns from `.gitignore`:

```diff
node_modules
dist
-.env
-package-lock.json
+.env
```

## Related

For additional lockfile security, consider using [lockfile-lint](https://github.com/lirantal/lockfile-lint) to detect tampering and injection attacks in lockfiles.
