/**
 * CLI Help Text
 */

import { listGroups } from "../registry.js";

export function printHelp(): void {
  console.log(`
project-doctor - Project health checks and maintenance tools

Usage:
  project-doctor [path]
  project-doctor init [path]

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

  project-doctor manual [options] [path]
  project-doctor manual done <name> [path]
  project-doctor manual undone <name> [path]
  project-doctor manual info <name> [options] [path]

  project-doctor overview [path]
  project-doctor snapshot [path]
  project-doctor history [path]


Commands:
  (default)    Interactive wizard to fix issues
  init         Create .project-doctor/config.json5
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
  manual       List manual checks (human-verified)
  manual done  Mark a manual check as done
  manual undone Mark a manual check as not done
  manual info  Show detailed info about a manual check
  overview     Show project health summary
  snapshot     Save current status to history
  history      View progress over time

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

Manual Options (for 'manual'):
  --status <status>       Filter: all (default), done, not-done, muted, disabled
  --format <format>       Output: table (default), json, names

Manual Info Options (for 'manual info'):
  --format <format>       Output format: text (default), json

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
  project-doctor manual                      List manual checks
  project-doctor manual --format json        JSON output for manual checks
  project-doctor manual done publish-provenance
  project-doctor manual undone publish-provenance
  project-doctor manual info publish-provenance

Groups:
  ${listGroups().join(", ")}

Tags:
  Scope:       universal, node, typescript
  Requirement: required, recommended, opinionated
  Effort:      effort:low, effort:medium, effort:high
  Tool:        tool:eslint, tool:prettier, tool:knip, etc.
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
