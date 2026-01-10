# Design Decision: Configuration System

## Goal

Allow users to customize check behavior per project using an ESLint-style configuration format.

---

## Config File Location

**File names (in order of precedence):**
1. `.project-doctor/config.json5` - JSON5 config (preferred)
2. `.project-doctor/config.json` - JSON config (legacy)
3. `doctor` key in `package.json`

---

## Config Schema

```typescript
type Severity = "off" | "error";

type Config = {
  // Disable specific checks by name
  checks?: Record<string, Severity>;

  // Disable checks by tag
  tags?: Record<string, Severity>;

  // Disable entire groups
  groups?: Record<string, Severity>;

  // Internal: user confirmed ESLint config overwrite
  eslintOverwriteConfirmed?: boolean;
};
```

---

## Example Configs

### Disable opinionated checks
```json5
{
  tags: { "opinionated": "off" },
}
```

### Disable specific checks
```json5
{
  checks: {
    "changelog-exists": "off",
    "contributing-exists": "off",
  },
}
```

### Disable entire groups
```json5
{
  groups: {
    "testing": "off",
    "bundle-size": "off",
  },
}
```

### Combination
```json5
{
  checks: { "changelog-exists": "off" },
  tags: { "opinionated": "off" },
  groups: { "eslint": "off" },
}
```

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
| `src/utils/runner.ts` | Apply config filters (isCheckOff, isTagOff, isGroupOff) |
| `src/cli.ts` | Merge CLI flags with config |

---

## Helper Functions

```typescript
// Check if a check is disabled
isCheckOff(config: ResolvedConfig, checkName: string): boolean

// Check if a tag is disabled
isTagOff(config: ResolvedConfig, tagName: string): boolean

// Check if a group is disabled
isGroupOff(config: ResolvedConfig, groupName: string): boolean

// Update config file with new values
updateConfig(projectPath: string, updates: Partial<Config>): Promise<void>

// Set check severity
setCheckSeverity(projectPath: string, checkName: string, severity: Severity): Promise<void>
```

---

## Rationale

- **ESLint-style format**: Familiar to developers, consistent pattern
- **JSON5 support**: Allows comments, trailing commas
- **Merged object approach**: Easier to manage than array exclusions
- **Severity levels**: Only "off" and "error" for now (warn may be added later)
- **Per-project config**: Each project has its own preferences
- **CLI overrides config**: Allows one-off runs without editing config
