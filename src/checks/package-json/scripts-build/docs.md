# package-json-scripts-build

Checks that package.json has a `build` script defined in the scripts section.

## Why

A `build` script provides a standard command for compiling, transpiling, or bundling your project. This is essential for TypeScript projects, projects using bundlers, or any project that needs a compilation step before distribution.

## Examples

**Pass**: `"scripts": { "build": "tsc" }`

**Fail**: No `build` script in package.json

## How to fix

Add a build script to your package.json:

```json
{
  "scripts": {
    "build": "tsc"
  }
}
```

Common build commands: `tsc`, `vite build`, `esbuild src/index.ts --outdir=dist`, `rollup -c`.
