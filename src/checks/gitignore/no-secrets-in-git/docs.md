# gitignore-no-secrets-in-git

Verifies that files containing secrets are properly ignored.

## Why

This check scans for common secret-containing files:

- `.env` / `.env.local` - environment variables
- `credentials.json` - API credentials
- `secrets.json` - application secrets
- `.npmrc` - may contain npm tokens

If these exist but aren't ignored, they risk being committed.

## Examples

**Pass**: All detected secret files are in `.gitignore`.

**Fail**: Secret files exist but aren't ignored.

## How to fix

Add the reported files to `.gitignore`:

```
.env
.env.local
credentials.json
secrets.json
.npmrc
```

If files were already committed, remove them from history using `git filter-branch` or BFG Repo-Cleaner, and rotate any exposed credentials.
