# gitignore-has-env

Checks that `.env` files are ignored to prevent secret leakage.

## Why

Environment files often contain:

- API keys and tokens
- Database credentials
- Service passwords
- Other sensitive configuration

Committing these exposes secrets in your repository history permanently.

## Examples

**Pass**: `.gitignore` contains `.env`, `.env.local`, or similar patterns.

**Fail**: No `.env` pattern found in `.gitignore`.

## How to fix

Add to `.gitignore`:

```
.env
.env.local
.env*.local
```

Use `.env.example` (without real values) to document required variables.
