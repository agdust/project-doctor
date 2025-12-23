# package-json-deps-no-duplicates

Checks that no package appears in both `dependencies` and `devDependencies`.

## Why

Having a package in both locations:

- Creates confusion about its purpose
- May cause version conflicts
- Indicates a mistake during installation
- Wastes space in production bundles

## Examples

**Pass**: Each package appears in only one section.

**Fail**: Same package found in both `dependencies` and `devDependencies`.

**Skip**: No `package.json` found.

## How to fix

Remove the duplicate from one section:

```bash
# If it's a dev tool (testing, linting, etc.)
npm uninstall package-name
npm install -D package-name

# If it's a production dependency
npm uninstall package-name
npm install package-name
```
