# package-json-dev-deps-in-dependencies

Checks for packages that are typically dev-only but are listed in `dependencies` instead of `devDependencies`.

## Why

Packages like linters, test frameworks, bundlers, and type definitions are only needed during development or build. Putting them in `dependencies`:

- Bloats production `node_modules` for library consumers
- Increases install time in production deployments
- Signals incorrect understanding of the package's role
- May pull in unnecessary transitive dependencies

## Examples

**Pass**: All dev-only packages are in `devDependencies`.

**Fail**: `typescript`, `eslint`, or `@types/*` packages found in `dependencies`.

**Skip**: No `package.json` found.

## How to fix

Move the package to `devDependencies`:

```bash
npm uninstall typescript
npm install -D typescript
```

If a package is intentionally in `dependencies` (e.g., a CLI tool that bundles ESLint), add an exception in your config:

```json5
// .project-doctor/config.json5
{
  checks: {
    "package-json-dev-deps-in-dependencies": ["error", { "exceptions": ["eslint"] }]
  }
}
```
