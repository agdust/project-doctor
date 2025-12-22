# Design Decision: Configuration System

## Goal

Move configuration from CLI flags to a config file. Users set preferences once per project instead of repeating CLI flags.

---

## Config File Location

**File names (in order of precedence):**
1. `.projector-doctorrc.json` - JSON config
2. `doctor` key in `package.json`

**Note:** TS/JS configs may be added later if needed.

---

## Config Schema

```typescript
type Config = {
  // What to run
  checks?: {
    // Groups to include (empty = all)
    groups?: string[];

    // Tag filtering
    include?: string[];   // e.g., ["required", "recommended"]
    exclude?: string[];   // e.g., ["opinionated"]

    // Disable specific checks by name
    disable?: string[];   // e.g., ["contributing-exists", "changelog-exists"]
  };

  // Per-group options
  options?: {
    "package-json"?: {
      requiredScripts?: string[];  // default: ["build", "dev", "test", "lint", "format"]
    };

    docs?: {
      requiredFiles?: string[];    // default: ["README.md"]
      optionalFiles?: string[];    // default: ["LICENSE", "CHANGELOG.md", "CONTRIBUTING.md"]
    };

    testing?: {
      frameworks?: ("jest" | "vitest" | "playwright" | "cypress")[];
    };

    env?: {
      exampleFile?: string;        // default: ".env.example"
    };

    gitignore?: {
      requiredPatterns?: string[]; // additional patterns to require
    };
  };

  // Severity overrides
  severity?: {
    // Change check severity: "fail" | "warn" | "skip"
    [checkName: string]: "fail" | "warn" | "skip";
  };
};
```

---

## Example Configs

### Minimal (disable opinionated checks)
```json
{
  "checks": {
    "exclude": ["opinionated"]
  }
}
```

### Strict (only required checks)
```json
{
  "checks": {
    "include": ["required"]
  }
}
```

### Custom project
```json
{
  "checks": {
    "disable": ["changelog-exists", "contributing-exists"]
  },
  "options": {
    "package-json": {
      "requiredScripts": ["build", "dev", "test"]
    },
    "testing": {
      "frameworks": ["vitest"]
    }
  },
  "severity": {
    "license-exists": "warn"
  }
}
```

---

## CLI + Config Merge Rules

1. **Additive for groups**: `--group` adds to config groups
2. **Additive for tags**: `--tag` adds to config includes
3. **Additive for excludes**: `--exclude-tag` adds to config excludes
4. **Override path**: CLI path always wins
5. **`--no-config`**: Ignore config file entirely

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/config/types.ts` | Config and ResolvedConfig types |
| `src/config/loader.ts` | Find, parse, and resolve config |
| `src/context/global.ts` | Add config to GlobalContext |
| `src/utils/runner.ts` | Apply disable list and severity overrides |
| `src/cli.ts` | Merge CLI flags with config |

---

## Rationale

- **Per-project config**: Each project has its own preferences
- **JSON-only**: No compilation complexity, easy to validate
- **CLI overrides config**: Allows one-off runs without editing config
- **Severity overrides**: Downgrade failures to warnings for known issues
