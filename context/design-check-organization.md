# Design Decision: Check Organization & Tagging

## Problem

Checks need logical organization for:
1. Developers finding/editing related checks
2. CLI users running subsets of checks
3. Clear applicability (when does this check apply?)

---

## Decision 1: Folder Structure by Domain

Group checks by the primary file or concern they inspect:

```
src/checks/
├── package-json/
│   ├── exists.ts
│   ├── valid.ts
│   ├── fields.ts          # has-name, has-version, has-description, etc.
│   ├── scripts.ts         # scripts-build, scripts-dev, scripts-test, etc.
│   └── deps.ts            # deps-no-duplicates, deps-sorted
├── tsconfig/
│   ├── exists.ts
│   ├── valid.ts
│   ├── strict.ts
│   └── paths.ts
├── gitignore/
│   ├── exists.ts
│   ├── patterns.ts        # has-node-modules, has-dist, has-env
│   ├── duplicates.ts
│   └── project-type.ts
├── git/
│   ├── repo.ts
│   ├── hooks.ts
│   ├── commits.ts         # conventional-commits
│   └── branches.ts
├── eslint/
│   ├── config.ts
│   ├── flat-config.ts
│   └── analysis.ts
├── prettier/
│   ├── config.ts
│   ├── ignore.ts
│   └── formatted.ts
├── editorconfig/
│   ├── exists.ts
│   └── content.ts
├── nvmrc/
│   ├── exists.ts
│   └── valid.ts
├── docs/
│   ├── readme.ts
│   ├── license.ts
│   ├── changelog.ts
│   └── contributing.ts
├── env/
│   ├── example.ts
│   └── vars.ts
├── testing/
│   ├── config.ts          # jest, vitest, playwright, cypress
│   ├── pass.ts
│   └── coverage.ts
├── deps/
│   ├── lockfile.ts
│   ├── audit.ts
│   ├── outdated.ts
│   └── knip.ts
├── security/
│   ├── secrets.ts
│   ├── eval.ts
│   └── signed.ts
├── files/
│   ├── size.ts
│   ├── console.ts
│   ├── todos.ts
│   └── whitespace.ts
├── docker/
│   ├── exists.ts
│   └── node-version.ts
├── ci/
│   ├── github-actions.ts
│   └── matches-local.ts
├── monorepo/
│   ├── workspace.ts
│   └── internal-deps.ts
├── api/
│   ├── endpoints.ts
│   └── types.ts
├── database/
│   └── migrations.ts
└── framework/
    └── svelte.ts
```

---

## Decision 2: Check Tagging System

Each check has a `tags` array with one or more of:

### Scope Tags (mutually exclusive)

| Tag | Meaning |
|-----|---------|
| `universal` | Applies to any project (git, license, readme) |
| `node` | Applies to any Node.js project |
| `typescript` | Applies only if TypeScript is used |
| `framework:svelte` | Applies only if Svelte is detected |

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
| `tool:vitest` | Only runs if Vitest is configured |
| `tool:jest` | Only runs if Jest is configured |

---

## Decision 3: Updated Type Definition

```typescript
export type CheckScope =
  | "universal"
  | "node"
  | "typescript"
  | `framework:${string}`;

export type CheckRequirement =
  | "required"
  | "recommended"
  | "opinionated";

export type CheckTool = `tool:${string}`;

export type CheckTag = CheckScope | CheckRequirement | CheckTool;

export type Check = {
  name: string;
  description: string;
  tags: CheckTag[];
  run: (projectPath: string) => Promise<CheckResult>;
};
```

---

## Decision 4: Example Tagged Checks

```typescript
// src/checks/package-json/exists.ts
const check: Check = {
  name: "package-json-exists",
  description: "Check if package.json exists",
  tags: ["node", "required"],
  run: async (projectPath) => { ... }
};

// src/checks/eslint/flat-config.ts
const check: Check = {
  name: "eslint-flat-config",
  description: "Check if using ESLint flat config format",
  tags: ["node", "recommended", "tool:eslint"],
  run: async (projectPath) => { ... }
};

// src/checks/framework/svelte.ts
const svelteRunes: Check = {
  name: "svelte-5-runes",
  description: "Check if using Svelte 5 runes syntax",
  tags: ["framework:svelte", "opinionated"],
  run: async (projectPath) => { ... }
};

// src/checks/git/commits.ts
const conventionalCommits: Check = {
  name: "conventional-commits",
  description: "Check if commits follow conventional format",
  tags: ["universal", "opinionated"],
  run: async (projectPath) => { ... }
};
```

---

## Decision 5: CLI Filtering

Tags enable powerful filtering:

```bash
# Run only required checks
projector-doctor --tag required

# Run all Node.js checks except opinionated
projector-doctor --tag node --exclude-tag opinionated

# Run only if ESLint is present
projector-doctor --tag tool:eslint

# Run Svelte framework checks
projector-doctor --tag framework:svelte

# Combine multiple tags (AND logic)
projector-doctor --tag node --tag required
```

---

## Decision 6: Auto-Detection

Before running checks, detect project characteristics:

```typescript
type ProjectContext = {
  hasPackageJson: boolean;
  hasTypeScript: boolean;
  hasSvelte: boolean;
  hasEslint: boolean;
  hasPrettier: boolean;
  hasDocker: boolean;
  // ... etc
};
```

Checks with tool/framework tags are automatically skipped if the tool/framework is not detected, unless `--force` is used.

---

---

## Decision 7: Context System (DRY)

Avoid repeated file reads. Checks receive pre-loaded context.

### Global Context

Available to all checks:

```typescript
type GlobalContext = {
  projectPath: string;

  // Detected once, shared everywhere
  detected: {
    packageManager: "npm" | "yarn" | "pnpm" | null;
    hasTypeScript: boolean;
    hasSvelte: boolean;
    hasEslint: boolean;
    hasPrettier: boolean;
    hasDocker: boolean;
    isMonorepo: boolean;
  };

  // Cached file reads (lazy-loaded on first access)
  files: FileCache;
};

type FileCache = {
  readText(path: string): Promise<string | null>;
  readJson<T>(path: string): Promise<T | null>;
  exists(path: string): Promise<boolean>;
};
```

### Group Context

Each check group (folder) can define shared context loaded once:

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

### Check Signature

Checks receive both contexts:

```typescript
type Check<GroupCtx = unknown> = {
  name: string;
  description: string;
  tags: CheckTag[];
  run: (global: GlobalContext, group: GroupCtx) => Promise<CheckResult>;
};

// src/checks/package-json/fields.ts
import type { PackageJsonContext } from "./context.ts";

const hasName: Check<PackageJsonContext> = {
  name: "package-json-has-name",
  description: "Check if package.json has name field",
  tags: ["node", "required"],
  run: async (_global, { parsed }) => {
    if (!parsed) return { name: "package-json-has-name", status: "skip", message: "No package.json" };
    if (!parsed.name) return { name: "package-json-has-name", status: "fail", message: "Missing name field" };
    return { name: "package-json-has-name", status: "pass", message: `Name: ${parsed.name}` };
  },
};
```

### Runner Flow

```
1. Load GlobalContext (detect tools, init file cache)
2. For each check group to run:
   a. Load GroupContext once
   b. Run all checks in group with (global, group)
3. Return results
```

### Benefits

- **No repeated reads**: package.json read once, shared by 10+ checks
- **Lazy loading**: Files only read if a check from that group runs
- **Centralized parsing**: Parse errors handled once per file
- **Testable**: Mock contexts for unit tests

---

## Rationale

1. **Folder by domain** - Easier to find and maintain related checks
2. **Tags over categories** - More flexible filtering than rigid categories
3. **Auto-skip** - Don't run irrelevant checks, less noise
4. **Opinionated tag** - Users can easily exclude team preferences
5. **Context system** - No repeated file reads, centralized parsing
