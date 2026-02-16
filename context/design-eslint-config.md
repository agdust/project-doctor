# Design: ESLint Config Builder

## Goal

Provide an opinionated but flexible tool to create and maintain ESLint configurations. Systematizes 500+ rules from multiple plugins into composable presets with full transparency.

---

## Core Requirements

### 1. Dual Interface: CLI + Interactive Wizard

| Mode | Use Case | Example |
|------|----------|---------|
| **One-shot CLI** | Scripts, CI, experienced users | `project-doctor eslint add-block typescript` |
| **Interactive Wizard** | First-time setup, exploration | `project-doctor eslint` |

**One-shot commands** must be:
- Fully non-interactive (no prompts)
- Accept all options via flags
- Suitable for automation
- Exit with appropriate codes (0 = success, 1 = error)

**Interactive wizard** must be:
- Beginner-friendly with clear explanations
- Show all relevant information before asking for decisions
- Provide sensible defaults

### 2. Respect Existing Configurations

- Detect and parse existing `eslint.config.js` files
- Show clear diff preview before modifications
- Never overwrite without explicit confirmation (or `--force` flag)
- Preserve user customizations when adding presets
- Warn about conflicts between existing rules and proposed changes

### 3. Full Transparency

Users should always understand:
- What rules are being added/changed/removed
- Why each rule exists (inline comments)
- Which preset each rule comes from

---

## CLI Commands

```bash
project-doctor eslint init [--presets <list>] [--dry-run] [--force]
project-doctor eslint add <preset>
project-doctor eslint show [--presets] [--rules]
project-doctor eslint diff [--presets <list>]
```

---

## Presets vs Blocks

| Concept | Description | Granularity |
|---------|-------------|-------------|
| **Preset** | High-level starting point | Broad (base, typescript, strict) |
| **Block** | Focused rule group | Narrow (security, performance, async) |

Presets are for initial setup. Blocks are for incremental enhancement.

---

## File Structure

| File | Purpose |
|------|---------|
| `src/eslint-config/types.ts` | Core types |
| `src/eslint-config/presets/presets.ts` | Preset definitions |
| `src/eslint-config/builder/builder.ts` | Combines presets → resolved rules |
| `src/eslint-config/generator/generator.ts` | Outputs eslint.config.js |
| `src/eslint-config/reader/reader.ts` | Parses existing config |
| `src/eslint-config/differ/` | Diff computation and display |
| `src/eslint-config/commands/*.ts` | CLI command handlers |

---

## Rule Database

Rule metadata lives in `src/eslint-db/`:
- 521 total rules from 3 plugins
- 187 tagged rules with categorization
- Tags: error-prevention, security, performance, style, type-safety
- Strictness levels: essential, recommended, strict, pedantic

---

## Design Rationale

- **Dual interface**: Accommodates both power users (scripts) and beginners (exploration)
- **Diff preview**: Prevents surprises, builds trust
- **Composable blocks**: Incremental adoption without full rewrite
- **Inline comments**: Self-documenting configs that explain the "why"
- **Respect existing**: Never destructive, always additive by default
