# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

projector-doctor is a CLI tool for running health checks on Node.js projects. It detects project configuration issues and enforces best practices.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Watch mode compilation
npm run check        # Run CLI directly with tsx
```

## Architecture

```
src/
├── cli.ts              # CLI entry point
├── registry.ts         # Check group registration
├── types.ts            # Core types (Check, CheckResult, GlobalContext, etc.)
├── config/
│   ├── types.ts        # Config schema and defaults
│   └── loader.ts       # Find and parse config file
├── context/
│   ├── global.ts       # GlobalContext creation (includes config)
│   ├── detect.ts       # Tool/framework detection
│   └── file-cache.ts   # Cached file reads
├── checks/             # Domain-organized checks
│   ├── package-json/
│   │   ├── context.ts  # Group context loader
│   │   └── checks.ts   # Check implementations
│   ├── tsconfig/
│   ├── gitignore/
│   ├── git/
│   ├── eslint/
│   ├── prettier/
│   ├── editorconfig/
│   ├── nvmrc/
│   ├── docs/
│   ├── deps/
│   ├── env/
│   ├── testing/
│   └── framework/
└── utils/
    ├── runner.ts       # Check execution with filtering
    └── reporter.ts     # Result formatting
```

## Key Concepts

### Context System (DRY)

Avoids repeated file reads:
- **GlobalContext**: Project path, detected tools, file cache
- **GroupContext**: Per-domain parsed data (e.g., parsed package.json)

Each check group has a `context.ts` that loads data once for all checks in the group.

### Check Definition

```typescript
const check: Check<PackageJsonContext> = {
  name: "package-json-has-name",
  description: "Check if package.json has name field",
  tags: ["node", "required"],
  run: async (global, group) => {
    if (!group.parsed?.name) return { name, status: "fail", message: "..." };
    return { name, status: "pass", message: "..." };
  },
};
```

### Tags

- **Scope**: `universal`, `node`, `typescript`, `framework:svelte`
- **Requirement**: `required`, `recommended`, `opinionated`
- **Tool**: `tool:eslint`, `tool:prettier`, `tool:knip`

### Adding Checks

1. Find or create domain folder in `src/checks/`
2. Add check to `checks.ts` with appropriate tags
3. Export from the `checks` array
4. Register in `src/registry.ts` if new domain

### Configuration

Projects can create `.projector-doctorrc.json`:

```json
{
  "checks": {
    "exclude": ["opinionated"],
    "disable": ["changelog-exists"]
  },
  "severity": {
    "license-exists": "warn"
  }
}
```

Config is loaded in `GlobalContext` and applied by the runner.

## Design Documents

- `context/checks-proposal.md` - Full check list by implementation cost
- `context/design-check-organization.md` - Architecture decisions
- `context/design-config.md` - Configuration system design
