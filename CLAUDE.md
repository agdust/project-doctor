# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

project-doctor is a CLI tool for running health checks on Node.js projects. It detects project configuration issues and enforces best practices.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Watch mode compilation
npm run check        # Run CLI directly with tsx
npm test             # Run tests
```

## Architecture

```
src/
├── cli.ts              # CLI entry point
├── registry.ts         # Check group registration
├── types.ts            # Core types (Check, CheckResult, GlobalContext, etc.)
├── config/
│   ├── types.ts        # Config schema and defaults
│   ├── constants.ts    # Config file paths
│   └── loader.ts       # Find, parse, and update config
├── context/
│   ├── global.ts       # GlobalContext creation (includes config)
│   ├── detect.ts       # Tool/framework detection
│   └── file-cache.ts   # Cached file reads
├── checks/             # Domain-organized checks (55+ checks)
│   ├── package-json/   # 16 checks
│   ├── tsconfig/       # 6 checks
│   ├── gitignore/      # 7 checks
│   ├── git/            # 1 check
│   ├── eslint/         # 3 checks
│   ├── prettier/       # 2 checks
│   ├── editorconfig/   # 3 checks
│   ├── npm/            # 6 checks
│   ├── docs/           # 6 checks
│   ├── deps/           # 3 checks
│   ├── env/            # 2 checks
│   ├── testing/        # 4 checks
│   └── bundle-size/    # 3 checks
├── cli-framework/      # Reusable multi-screen CLI framework
│   ├── types.ts        # Screen, Option, AppState types
│   ├── app.ts          # App class, navigation, lifecycle
│   ├── renderer.ts     # Console output helpers
│   └── index.ts        # Public exports
├── app/                # Project Doctor app screens
│   ├── types.ts        # AppContext, FixableIssue types
│   ├── loader.ts       # Scans project, creates context
│   ├── index.ts        # Main app entry
│   └── screens/        # Individual screens
│       ├── home.ts
│       ├── issues.ts
│       ├── issue-detail.ts
│       ├── why.ts
│       ├── summary.ts
│       └── scanning.ts
├── utils/
│   ├── runner.ts       # Check execution with filtering
│   ├── reporter.ts     # Result formatting
│   ├── fixer.ts        # Auto-fix with priority sorting
│   └── fix-chains.ts   # Fix dependency ordering
```

## Key Concepts

### Context System (DRY)

Avoids repeated file reads:
- **GlobalContext**: Project path, detected tools, file cache, config
- **GroupContext**: Per-domain parsed data (e.g., parsed package.json)

Each check group has a `context.ts` that loads data once for all checks in the group.

### Check Definition

```typescript
const check: Check<PackageJsonContext> = {
  name: "package-json-has-name",
  description: "Check if package.json has name field",
  tags: ["node", "required", "effort:low"],
  run: async (global, group) => {
    if (!group.parsed?.name) return fail(name, "Missing name field");
    return pass(name, `Name: ${group.parsed.name}`);
  },
  fix: {  // Optional auto-fix
    description: "Add name field",
    run: async (global, group) => { ... },
  },
};
```

### Tags

- **Scope**: `universal`, `node`, `typescript`
- **Requirement**: `required`, `recommended`, `opinionated`
- **Effort**: `effort:low`, `effort:medium`, `effort:high`
- **Tool**: `tool:eslint`, `tool:prettier`, `tool:knip`, etc.

### Fix Prioritization

Fixes are sorted by importance × 3 + effort for an easier fixing curve:
1. required + effort:low (priority 0)
2. required + effort:medium (priority 1)
3. required + effort:high (priority 2)
4. recommended + effort:low (priority 3)
5. ... and so on

### Configuration (ESLint-style)

Projects can create `.project-doctor/config.json5`:

```json5
{
  // Disable specific checks
  checks: { "changelog-exists": "off" },

  // Disable checks by tag (group names like "eslint" also work as tags)
  tags: { "opinionated": "off" },

  // Temporarily mute until a date (reverts to "error" after)
  checks: { "tsconfig-strict-enabled": "mute-until-2025-06-01" },
}
```

Severity values:
- `"off"` - permanently disabled
- `"error"` - enabled (default)
- `"mute-until-YYYY-MM-DD"` - muted until date, then becomes "error"

### Adding Checks

1. Find or create domain folder in `src/checks/`
2. Create `check.ts` with Check definition including effort tag
3. Export from the group's `index.ts`
4. Register in `src/registry.ts` if new domain

## Design Documents

- `context/checks-proposal.md` - Full check list by implementation cost
- `context/design-check-organization.md` - Architecture and tagging system
- `context/design-config.md` - ESLint-style configuration system
- `context/design-cli-framework.md` - Multi-screen CLI framework

## CLI Framework (`src/cli-framework/`)

Reusable multi-screen CLI app framework:

Key concepts:
- **Screen**: UI state with render() and getOptions()
- **ActionOption**: Does something (fix, mute, disable)
- **NavigationOption**: Opens another screen
- **Screen Stack**: Browser-like history for back navigation
- **ESC**: Go back to previous screen
- **Ctrl+C**: Graceful exit with summary

## Current State

**Implemented:**
- Multi-screen CLI app with 6 screens
- 55+ checks across 13 groups
- Effort-based fix prioritization
- ESLint-style configuration
- Auto-fix with dependency chains

**Future:**
- Config screen (edit checks/tags/groups in app)
