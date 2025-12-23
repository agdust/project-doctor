# git-repo-exists

Verifies that the project is a Git repository.

## Why

Git provides:

- Version control and history
- Collaboration through branches and merges
- Integration with CI/CD and deployment platforms
- Backup through remote repositories

## Examples

**Pass**: `.git` directory exists (project is initialized with Git).

**Fail**: No `.git` directory found.

## How to fix

Initialize a Git repository:

```bash
git init
```
