# deps-disabled-post-install-scripts

Checks that npm is configured to disable post-install scripts.

## Why

Post-install scripts are a common attack vector for supply chain attacks. Malicious packages can execute arbitrary code on your machine during `npm install`.

Recent attacks like Shai-Hulud, the Nx attack, and the infamous event-stream incident all exploited postinstall scripts to exfiltrate data or execute malicious code.

By setting `ignore-scripts=true` in your `.npmrc`, npm will skip all lifecycle scripts during installation. You can then selectively allow scripts for trusted packages using tools like `@lavamoat/allow-scripts`.

Note: pnpm 10.0+ and Bun disable postinstall scripts by default.

Source: [npm Security Best Practices](https://github.com/lirantal/npm-security-best-practices)

## Examples

**Pass**: `.npmrc` contains `ignore-scripts=true`.

**Fail**: `.npmrc` missing or doesn't have `ignore-scripts=true`.

## How to fix

Add to your `.npmrc`:

```
ignore-scripts=true
```

Or set globally:

```bash
npm config set ignore-scripts true
```
