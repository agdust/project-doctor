# gitignore-exists

Verifies that a `.gitignore` file exists in the project root.

## Why

A `.gitignore` file tells Git which files and directories to exclude from version control. Without it, you risk committing:

- Build artifacts and compiled code
- Dependency folders (node_modules)
- Environment files with secrets
- IDE and OS-specific files

## Examples

**Pass**: Project has `.gitignore` at root.

**Fail**: No `.gitignore` file found.

## How to fix

Create a `.gitignore` file. GitHub provides templates at https://github.com/github/gitignore or use `npx gitignore node` for Node.js projects.
