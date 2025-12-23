# nvmrc-modern-version

Checks that `.nvmrc` specifies a modern, supported Node.js version.

## Why

Using outdated Node versions:

- Misses security patches
- Lacks modern JavaScript features
- May have dependency compatibility issues
- Won't receive bug fixes

## LTS Versions

| Version | Codename | EOL |
|---------|----------|-----|
| 18 | Hydrogen | 2025-04-30 |
| 20 | Iron | 2026-04-30 |
| 22 | Jod | 2027-04-30 |

## Examples

**Pass**: Node 18+ (supported LTS versions).

**Warn**: Odd-numbered version (not LTS, shorter support).

**Fail**: Node 16 or older (EOL).

**Skip**: No `.nvmrc` or unparseable version.

## How to fix

Update `.nvmrc` to a current LTS version:

```
22
```

Or use the LTS codename:

```
lts/jod
```
