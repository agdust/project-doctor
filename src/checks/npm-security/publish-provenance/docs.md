# npm-security-publish-provenance

Checks that npm publish includes provenance attestation.

## Why

Provenance attestations provide cryptographic proof of where and how a package was built. This helps users verify that the package they're installing actually came from the claimed source repository and CI system.

Requirements:
- npm CLI 9.5.0 or later
- Supported CI/CD platform (GitHub Actions, GitLab CI, etc.)
- Package published to the public npm registry

Users can verify provenance on npmjs.com by checking the "Provenance" badge.

Source: [npm Security Best Practices](https://github.com/lirantal/npm-security-best-practices)

## Examples

**Pass**: Publish script or CI workflow uses `--provenance` flag.

**Fail**: npm publish without `--provenance` flag.

**Skip**: No publish script or CI workflow found.

## How to fix

In GitHub Actions, add `id-token: write` permission and use `--provenance`:

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - run: npm publish --provenance
```

Or in package.json scripts:

```json
{
  "scripts": {
    "publish": "npm publish --provenance"
  }
}
```
