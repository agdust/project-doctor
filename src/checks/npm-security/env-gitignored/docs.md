# npm-security-env-gitignored

Checks that .env files are properly ignored in .gitignore.

## Why

Storing secrets in `.env` files is common, but these files must never be committed to version control. Malicious packages can read environment variables and scan the filesystem for configuration files containing secrets.

Best practices:
- Always add `.env` and `.env.*` to your `.gitignore`
- Use reference-based secrets with just-in-time authentication
- Commit a `.env.example` file with placeholder values for documentation

Source: [npm Security Best Practices](https://github.com/lirantal/npm-security-best-practices)

## Examples

**Pass**: `.gitignore` contains `.env` or `.env*` pattern.

**Fail**: No .env pattern in `.gitignore`.

## How to fix

Add to your `.gitignore`:

```
.env
.env.*
.env.local
```
