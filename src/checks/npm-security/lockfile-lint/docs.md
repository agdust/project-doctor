# npm-security-lockfile-lint

Checks that lockfile-lint is configured to prevent lockfile injection attacks.

## Why

Lockfile injection is an attack where malicious actors modify lockfiles (package-lock.json, yarn.lock) in pull requests to inject compromised packages from untrusted sources.

The `lockfile-lint` tool validates your lockfile against security policies:
- Ensures packages come from trusted registries only
- Enforces HTTPS for all package URLs
- Validates package names match expected patterns
- Verifies integrity hashes are present

Note: pnpm is architecturally resistant to this vulnerability.

Source: [npm Security Best Practices](https://github.com/lirantal/npm-security-best-practices)

## Examples

**Pass**: lockfile-lint is installed and has a script configured.

**Fail**: lockfile-lint not in devDependencies or no script to run it.

## How to fix

Install lockfile-lint:

```bash
npm install --save-dev lockfile-lint
```

Add a script to package.json:

```json
{
  "scripts": {
    "lint:lockfile": "lockfile-lint --path package-lock.json --type npm --allowed-hosts npm yarn --validate-https"
  }
}
```
