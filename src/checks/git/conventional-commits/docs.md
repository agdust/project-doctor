# conventional-commits

Checks for Conventional Commits tooling (commitlint).

## Why

Conventional Commits provide:

- Standardized commit message format
- Automated changelog generation
- Semantic versioning automation
- Easier history navigation

Format: `type(scope): description`

## Examples

**Pass**: `commitlint.config.js` or `.commitlintrc.json` exists.

**Fail**: No commitlint configuration found.

## How to fix

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
echo "export default { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
```

Add to Husky:

```bash
npx husky add .husky/commit-msg 'npx commitlint --edit $1'
```
