# Design: Configuration System

## Goal

Allow users to customize check behavior per project using an ESLint-style configuration format.

---

## Config File Location

**File names (in order of precedence):**
1. `.project-doctor/config.json5` (preferred)
2. `.project-doctor/config.json`
3. `doctor` key in `package.json`

---

## Config Schema

```typescript
/**
 * Severity level:
 * - "off" - permanently disabled
 * - "error" - enabled (default)
 * - "skip-until-YYYY-MM-DD" - skipped until date, then becomes "error"
 */
type Severity = "off" | "error" | `skip-until-${string}`;

type Config = {
  // Disable specific checks by name
  checks?: Record<string, Severity>;

  // Disable checks by tag
  tags?: Record<string, Severity>;

  // Disable entire groups
  groups?: Record<string, Severity>;
};
```

---

## Examples

### Disable opinionated checks
```json5
{
  tags: { "opinionated": "off" }
}
```

### Disable specific checks
```json5
{
  checks: {
    "changelog-exists": "off",
    "contributing-exists": "off"
  }
}
```

### Disable entire groups
```json5
{
  groups: {
    "testing": "off",
    "bundle-size": "off"
  }
}
```

### Temporarily skip a check
```json5
{
  checks: {
    // Skipped until this date, then becomes "error"
    "tsconfig-strict-enabled": "skip-until-2025-06-01"
  }
}
```

**Note:** If the date is invalid or more than 3 years in the future, it's treated as "error".

---

## CLI + Config Merge Rules

1. **CLI overrides config**: `--exclude-tag opinionated` adds to config tags
2. **CLI group filter**: `--group package-json` filters to only that group
3. **`--no-config`**: Ignore config file entirely
4. **Config merging**: CLI options merge with file config (both apply)

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/config/types.ts` | Config and ResolvedConfig types |
| `src/config/constants.ts` | Config file names and paths |
| `src/config/loader.ts` | Find, parse, resolve, and update config |
| `src/context/global.ts` | Add config to GlobalContext |
| `src/utils/runner.ts` | Apply config filters |

---

## Helper Functions

```typescript
isCheckOff(config: ResolvedConfig, checkName: string): boolean
isTagOff(config: ResolvedConfig, tagName: string): boolean
isGroupOff(config: ResolvedConfig, groupName: string): boolean
updateConfig(projectPath: string, updates: Partial<Config>): Promise<void>
setCheckSeverity(projectPath: string, checkName: string, severity: Severity): Promise<void>
```

---

## Design Rationale

- **ESLint-style format**: Familiar to developers
- **JSON5 support**: Allows comments and trailing commas
- **Merged object approach**: Easier to manage than array exclusions
- **Severity levels**: "off" and "error" (warn may be added later)
- **Per-project config**: Each project has its own preferences
- **CLI overrides config**: Allows one-off runs without editing config
