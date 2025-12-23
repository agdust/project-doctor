# env-example-exists

Checks that an `.env.example` file exists.

## Why

An `.env.example` file:

- Documents required environment variables
- Helps new developers set up quickly
- Can be committed to git (unlike `.env`)
- Serves as configuration documentation

## Examples

**Pass**: `.env.example` file exists.

**Fail**: No `.env.example` found.

## How to fix

Create `.env.example` with placeholder values:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/db
API_KEY=your-api-key-here
NODE_ENV=development
```

Copy to `.env` for local development:

```bash
cp .env.example .env
```
