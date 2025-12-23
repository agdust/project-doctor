# readme-has-install-section

Checks that README.md has an installation section.

## Why

Users need to know how to install your project:

- Prerequisites and dependencies
- Installation commands
- Configuration steps
- Platform-specific instructions

## Examples

**Pass**: README.md has `## Installation` or `## Getting Started` section.

**Fail**: No installation section found.

**Skip**: No README.md file.

## How to fix

Add an installation section:

```markdown
## Installation

```bash
npm install your-package
```

Or clone and install:

```bash
git clone https://github.com/you/repo.git
cd repo
npm install
```
```
