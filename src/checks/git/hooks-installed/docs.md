# git-hooks-installed

Checks for Git hooks management (Husky, Lefthook, or simple-git-hooks).

## Why

Git hooks automate quality checks before commits/pushes:

- Run linters on staged files (pre-commit)
- Validate commit messages (commit-msg)
- Run tests before push (pre-push)

Without hooks, these checks only run in CI, delaying feedback.

## Examples

**Pass**: `.husky/`, `lefthook.yml`, or `.simple-git-hooks.json` exists.

**Fail**: No git hooks manager detected.

## How to fix

Install Husky:

```bash
npm install -D husky
npx husky init
```

Or Lefthook:

```bash
npm install -D lefthook
npx lefthook install
```
