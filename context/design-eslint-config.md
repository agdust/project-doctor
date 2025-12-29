# Design Decision: ESLint Config Builder

## Goal

Provide an opinionated but flexible tool to create and maintain ESLint configurations. Systematizes 500+ rules from multiple plugins into composable presets with full transparency.

---

## Core Requirements

### 1. Dual Interface: CLI One-Shot + Interactive Wizard

**CRITICAL**: Every operation MUST be accessible in two ways:

| Mode | Use Case | Example |
|------|----------|---------|
| **One-shot CLI** | Scripts, CI, experienced users | `project-doctor eslint add-block typescript` |
| **Interactive Wizard** | First-time setup, exploration | `project-doctor eslint` (launches wizard) |

**One-shot commands** must be:
- Fully non-interactive (no prompts)
- Accept all options via flags
- Suitable for automation and scripting
- Exit with appropriate codes (0 = success, 1 = error)

**Interactive wizard** must be:
- Beginner-friendly with clear explanations
- Show all relevant information before asking for decisions
- Provide sensible defaults
- Allow backing out / cancellation at any step

### 2. Respect Existing Configurations

The tool MUST:
- Detect and parse existing `eslint.config.js` / `.eslintrc.*` files
- Show clear diff preview before any modifications
- Never overwrite without explicit confirmation (or `--force` flag)
- Preserve user customizations when adding presets
- Warn about conflicts between existing rules and proposed changes

### 3. Full Transparency

Users should always understand:
- What rules are being added/changed/removed
- Why each rule exists (inline comments)
- Which preset each rule comes from
- What the rule actually does

---

## CLI Commands

### Current Implementation

```bash
project-doctor eslint init [--wizard] [--presets <list>] [--dry-run] [--force]
project-doctor eslint add <preset>
project-doctor eslint show [--presets] [--rules]
project-doctor eslint diff [--presets <list>]
```

### Planned Commands

```bash
# Block management (composable rule groups)
project-doctor eslint add-block <block-name>     # Add a rule block
project-doctor eslint remove-block <block-name>  # Remove a rule block
project-doctor eslint list-blocks                # Show available blocks

# Analysis
project-doctor eslint analyze                    # Analyze current config vs recommendations
project-doctor eslint lint-check                 # Verify config is valid

# Migration
project-doctor eslint migrate                    # Migrate from legacy .eslintrc to flat config

# Main wizard entry point
project-doctor eslint                            # Launch interactive wizard (no subcommand)
```

---

## Interactive Wizard Flow

When user runs `project-doctor eslint` without subcommand:

```
┌─────────────────────────────────────────────────────────────┐
│  ESLint Configuration Builder                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Detected: eslint.config.js exists (47 rules configured)   │
│                                                             │
│  What would you like to do?                                 │
│                                                             │
│  > Analyze current config vs recommendations                │
│    Add a rule block (e.g., security, performance)          │
│    Create new config from scratch                          │
│    Show diff: current vs recommended                       │
│    View available presets and blocks                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The wizard should:
1. Always show current state first (existing config detection)
2. Offer contextually relevant options
3. Explain each choice before user commits
4. Show preview/diff before applying changes

---

## Presets vs Blocks

| Concept | Description | Granularity |
|---------|-------------|-------------|
| **Preset** | High-level starting point | Broad (base, typescript, strict) |
| **Block** | Focused rule group | Narrow (security, performance, async) |

Presets are for initial setup. Blocks are for incremental enhancement.

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/eslint-config/types.ts` | Core types |
| `src/eslint-config/presets/presets.ts` | Preset definitions |
| `src/eslint-config/builder/builder.ts` | Combines presets → resolved rules |
| `src/eslint-config/generator/generator.ts` | Outputs eslint.config.js |
| `src/eslint-config/reader/reader.ts` | Parses existing config |
| `src/eslint-config/differ/` | Diff computation and display |
| `src/eslint-config/wizard/wizard.ts` | Interactive prompts |
| `src/eslint-config/commands/*.ts` | CLI command handlers |

---

## Database

Rule metadata lives in `src/eslint-db/`:
- 521 total rules from 3 plugins
- 187 tagged rules with categorization
- Tags: error-prevention, security, performance, style, type-safety
- Strictness levels: essential, recommended, strict, pedantic

---

## Rationale

- **Dual interface**: Accommodates both power users (scripts) and beginners (exploration)
- **Diff preview**: Prevents surprises, builds trust
- **Composable blocks**: Incremental adoption without full rewrite
- **Inline comments**: Self-documenting configs that explain the "why"
- **Respect existing**: Never destructive, always additive by default
