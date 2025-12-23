# env-example-not-empty

Checks that `.env.example` contains variable definitions.

## Why

An empty `.env.example`:

- Doesn't document anything
- Misleads developers about requirements
- Suggests missing configuration

## Examples

**Pass**: `.env.example` has at least one variable.

**Fail**: `.env.example` exists but is empty.

**Skip**: No `.env.example` file.

## How to fix

Add your environment variables to `.env.example`:

```env
# Database
DATABASE_URL=postgres://localhost:5432/myapp

# API Keys
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=SG.xxx

# App Config
PORT=3000
NODE_ENV=development
```

Use comments to group and explain variables.
