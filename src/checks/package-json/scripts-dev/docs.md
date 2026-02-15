# package-json-scripts-dev

Checks that package.json has a `dev` script defined in the scripts section.

## Why

A `dev` script provides a standard command for starting the development server or watch mode. This enables hot reloading, fast iteration, and a consistent development experience across the team.

## Examples

**Pass**: `"scripts": { "dev": "vite" }`

**Fail**: No `dev` script in package.json

## How to fix

Add a dev script to your package.json:

```json
{
  "scripts": {
    "dev": "vite"
  }
}
```

Common dev commands: `vite`, `next dev`, `tsc --watch`, `nodemon src/index.ts`.
