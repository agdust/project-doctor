# Design: Check Organization & Tagging

## Problem

Checks need logical organization for:
1. Developers finding/editing related checks
2. CLI users running subsets of checks
3. Clear applicability (when does this check apply?)

---

## Folder Structure

Group checks by the primary file or concern they inspect:

```
src/checks/
├── package-json/     # package.json checks
├── tsconfig/         # TypeScript configuration
├── gitignore/        # .gitignore patterns
├── git/              # Git repository checks
├── eslint/           # ESLint configuration
├── prettier/         # Prettier configuration
├── editorconfig/     # EditorConfig
├── npm/              # npm configuration
├── npm-security/     # npm security best practices
├── docs/             # README, LICENSE, CHANGELOG
├── env/              # Environment files
├── testing/          # Test configuration
├── deps/             # Dependency checks
├── docker/           # Dockerfile checks
└── jscpd/            # Code duplication
```

---

## Tagging System

Each check has a `tags` array combining:

### Scope Tags (mutually exclusive)

| Tag | Meaning |
|-----|---------|
| `universal` | Applies to any project |
| `node` | Applies to Node.js projects |
| `typescript` | Applies only if TypeScript is used |

### Requirement Tags

| Tag | Meaning |
|-----|---------|
| `required` | Should pass in all healthy projects |
| `recommended` | Best practice, but not critical |
| `opinionated` | Team preference, may disable |

### Tool Tags

| Tag | Meaning |
|-----|---------|
| `tool:eslint` | Only runs if ESLint is configured |
| `tool:prettier` | Only runs if Prettier is configured |
| `tool:knip` | Only runs if knip is installed |
| `tool:docker` | Only runs if Dockerfile exists |

### Effort Tags

| Tag | Meaning |
|-----|---------|
| `effort:low` | Has auto-fix OR trivial manual fix |
| `effort:medium` | Requires understanding context |
| `effort:high` | Complex refactoring or architectural decisions |

### Category Tags

| Tag | Meaning |
|-----|---------|
| `security` | Security-related check |
| `source:*` | Attribution (e.g., `source:lirantal-npm-security`) |

---

## Type Definition

```typescript
export type CheckScope = "universal" | "node" | "typescript";
export type CheckRequirement = "required" | "recommended" | "opinionated";
export type CheckTool = `tool:${string}`;
export type CheckEffort = "effort:low" | "effort:medium" | "effort:high";
export type CheckSource = `source:${string}`;
export type CheckCategory = "security";

export type CheckTag =
  | CheckScope
  | CheckRequirement
  | CheckTool
  | CheckEffort
  | CheckSource
  | CheckCategory;

export type Check<GroupCtx = unknown> = {
  name: string;
  description: string;
  tags: CheckTag[];
  run: (global: GlobalContext, group: GroupCtx) => Promise<CheckResult>;
  fix?: {
    description: string;
    run: (global: GlobalContext, group: GroupCtx) => Promise<FixResult>;
  };
};
```

---

## Fix Prioritization

Effort tags enable smart fix ordering:

| Priority | Tags | Description |
|----------|------|-------------|
| 0 | required + effort:low | Critical + quick to fix |
| 1 | required + effort:medium | Critical + moderate effort |
| 2 | required + effort:high | Critical + significant effort |
| 3 | recommended + effort:low | Important + quick to fix |
| 4 | recommended + effort:medium | Important + moderate effort |
| 5 | recommended + effort:high | Important + significant effort |
| 6 | opinionated + effort:low | Style + quick to fix |
| 7 | opinionated + effort:medium | Style + moderate effort |
| 8 | opinionated + effort:high | Style + significant effort |

**Formula:** `importance * 3 + effort`
- importance: required=0, recommended=1, opinionated=2
- effort: low=0, medium=1, high=2

---

## Context System (DRY)

Avoid repeated file reads. Checks receive pre-loaded context.

### Global Context

Available to all checks:

```typescript
type GlobalContext = {
  projectPath: string;
  detected: {
    packageManager: "npm" | "yarn" | "pnpm" | null;
    hasTypeScript: boolean;
    hasEslint: boolean;
    hasPrettier: boolean;
    hasDocker: boolean;
    isMonorepo: boolean;
  };
  files: FileCache;
  config: ResolvedConfig;
};
```

### Group Context

Each check group defines shared context loaded once:

```typescript
// src/checks/package-json/context.ts
export type PackageJsonContext = {
  raw: string | null;
  parsed: PackageJson | null;
  parseError: string | null;
};

export async function loadContext(global: GlobalContext): Promise<PackageJsonContext> {
  const raw = await global.files.readText("package.json");
  if (!raw) return { raw: null, parsed: null, parseError: null };

  try {
    return { raw, parsed: JSON.parse(raw), parseError: null };
  } catch (e) {
    return { raw, parsed: null, parseError: e.message };
  }
}
```

### Runner Flow

```
1. Load GlobalContext (detect tools, init file cache)
2. For each check group:
   a. Load GroupContext once
   b. Run all checks with (global, group)
3. Return results
```

---

## CLI Filtering

Tags enable powerful filtering:

```bash
# Run only required checks
project-doctor check --tag required

# Run all Node.js checks except opinionated
project-doctor check --tag node --exclude-tag opinionated

# Run only ESLint-related checks
project-doctor check --tag tool:eslint

# Combine multiple tags (AND logic)
project-doctor check --tag node --tag required
```

---

## Design Rationale

1. **Folder by domain** - Easier to find and maintain related checks
2. **Tags over categories** - More flexible filtering than rigid categories
3. **Auto-skip** - Don't run irrelevant checks, less noise
4. **Opinionated tag** - Users can easily exclude team preferences
5. **Context system** - No repeated file reads, centralized parsing
