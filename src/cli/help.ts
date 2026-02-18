/**
 * CLI Help Text
 */

import { listGroups } from "../registry.js";

export function printHelp(): void {
  console.log(`
project-doctor - Project health checks and maintenance tools

Usage:
  project-doctor [path]
  project-doctor check [options] [path]
  project-doctor fix [path]
  project-doctor fix all [options] [path]
  project-doctor fix <check-name> [options] [path]
  project-doctor config [path]
  project-doctor config set project-type <js|generic> [path]
  project-doctor disable <check|tag|group> <name> [path]
  project-doctor enable <check|tag|group> <name> [path]
  project-doctor mute <check-name> [options] [path]
  project-doctor unmute <check-name> [path]
  project-doctor list [options] [path]
  project-doctor info <check-name> [options] [path]
  project-doctor overview [path]
  project-doctor snapshot [path]
  project-doctor history [path]
  project-doctor init [path]

Commands:
  (default)    Interactive wizard to fix issues
  check        Run all checks and report details
  fix          List fixable issues
  fix all      Fix all issues automatically
  fix <name>   Fix a specific check
  config       Show or set configuration
  disable      Disable a check, tag, or group permanently
  enable       Re-enable a disabled check, tag, or group
  mute         Temporarily mute a check
  unmute       Remove mute from a check
  list         List all available checks
  info         Show detailed info about a check
  overview     Show project health summary
  snapshot     Save current status to history
  history      View progress over time
  init         Create .project-doctor/config.json5

Check Options:
  -f, --full-report       Show all checks (default: only failures)
  -g, --group <name>      Run checks from specific group only
  -t, --tag <tag>         Only run checks with this tag (can repeat)
  -e, --exclude-tag <tag> Exclude checks with this tag (can repeat)
  --no-config             Ignore .project-doctor/config.json5
  --format <format>       Output format: text (default), json

Fix Options (for 'fix all'):
  --group <name>          Fix only checks in this group (repeatable)
  --tag <tag>             Fix only checks with this tag (repeatable)
  --pick <option-id>      Select which fix option to apply

Mute Options:
  --weeks <n>             Mute for n weeks (default: 2)
  --months <n>            Mute for n months
  --until <YYYY-MM-DD>    Mute until specific date

List Options:
  -g, --group <name>      Filter by group (repeatable)
  -t, --tag <tag>         Filter by tag (repeatable)
  --status <status>       Filter: all, enabled, disabled, muted
  --format <format>       Output: table (default), json, names

Info Options:
  --format <format>       Output format: text (default), json

General Options:
  -h, --help              Show this help message
  -v, --version           Show version
  -l, --list              List all available checks (legacy, use 'list' command)

Examples:
  project-doctor                           Launch interactive wizard
  project-doctor check --format json       Run checks with JSON output
  project-doctor fix                       List fixable issues
  project-doctor fix all                   Auto-fix all issues
  project-doctor fix <check-name>          Fix a specific check
  project-doctor fix all --tag effort:low  Fix only low-effort issues
  project-doctor config                    Show current configuration
  project-doctor config set project-type js
  project-doctor disable check changelog-exists
  project-doctor disable tag opinionated
  project-doctor enable check changelog-exists
  project-doctor mute tsconfig-strict --weeks 2
  project-doctor unmute tsconfig-strict
  project-doctor list --format json
  project-doctor list --status disabled
  project-doctor info tsconfig-strict-enabled

Groups:
  ${listGroups().join(", ")}

Tags:
  Scope:       universal, node, typescript
  Requirement: required, recommended, opinionated
  Effort:      effort:low, effort:medium, effort:high
  Tool:        tool:eslint, tool:prettier, tool:knip, etc.
`);
}

export function printEslintHelp(): void {
  console.log(`
project-doctor eslint - ESLint configuration builder

Usage:
  project-doctor eslint [path]                    Interactive wizard
  project-doctor eslint init [options] [path]
  project-doctor eslint add <preset> [path]
  project-doctor eslint show [options] [path]
  project-doctor eslint diff [options] [path]

Commands:
  (no command)   Launch interactive wizard
  init           Generate new ESLint flat config
  add            Add a preset to existing config
  show           Show available presets and current config
  diff           Show diff between current and proposed config

Init Options:
  -w, --wizard     Interactive wizard mode
  --presets <list> Comma-separated preset list (e.g. base,typescript,strict)
  --dry-run        Show changes without applying
  --force          Overwrite existing config without prompting

Show Options:
  --presets        List available presets
  --rules          Show rule database statistics

Presets:
  base         Essential error prevention (JS)
  typescript   TypeScript-specific rules
  strict       Stricter than recommended
  style        Stylistic rules (@stylistic)
  security     Security-focused rules
  performance  Performance-focused rules

Examples:
  project-doctor eslint init --wizard
  project-doctor eslint init --presets base,typescript
  project-doctor eslint add strict
  project-doctor eslint show --presets
  project-doctor eslint show --rules
  project-doctor eslint diff
`);
}

export function printFixHelp(): void {
  console.log(`
project-doctor fix - Fix issues

Usage:
  project-doctor fix [path]                    List fixable issues
  project-doctor fix all [options] [path]      Fix all issues
  project-doctor fix <check-name> [path]       Fix specific check

Options for 'fix all':
  --group <name>          Fix only checks in this group (repeatable)
  --tag <tag>             Fix only checks with this tag (repeatable)
  --pick <option-id>      Select which fix option to apply

Options for 'fix <check-name>':
  --pick <option-id>      Select which fix option to apply

Examples:
  project-doctor fix                       List all fixable issues
  project-doctor fix all                   Fix all issues
  project-doctor fix all --tag effort:low  Fix only low-effort issues
  project-doctor fix changelog-exists      Fix specific check
`);
}
