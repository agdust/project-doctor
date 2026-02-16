#!/usr/bin/env node

import { parseArgs } from "node:util";
import { resolve } from "node:path";
import type { CheckTag } from "./types.js";
import { listChecks, listGroups } from "./registry.js";
import { runChecks } from "./utils/runner.js";
import { printResults } from "./utils/reporter.js";
// import { runAutoFix } from "./utils/fixer.js";
import { runDepsChecker } from "./utils/deps-checker.js";
import { runOverview } from "./utils/overview.js";
import { runSnapshot, runHistory } from "./utils/snapshot.js";
import { runInit } from "./utils/init.js";
import { runEslintInit } from "./eslint-config/commands/init.js";
import { runEslintShow } from "./eslint-config/commands/show.js";
import { runEslintAdd } from "./eslint-config/commands/add.js";
import { runEslintDiff } from "./eslint-config/commands/diff.js";
import { runMainWizard } from "./eslint-config/commands/main.js";
import { runProjectDoctorApp } from "./app/index.js";
import { runConfigShow, runConfigSetProjectType, runConfigShowJson } from "./commands/config.js";
import { runDisableCheck, runDisableTag, runDisableGroup } from "./commands/disable.js";
import { runEnableCheck, runEnableTag, runEnableGroup } from "./commands/enable.js";
import { runMute, runUnmute } from "./commands/mute.js";
import { runList } from "./commands/list.js";
import { runInfo } from "./commands/info.js";
import { printCheckResultsAsJson } from "./commands/check.js";
import { runFixList, runFixAll, runFixOne } from "./commands/fix.js";
import { RESET, BOLD, DIM, RED } from "./utils/colors.js";

function printHelp(): void {
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
  project-doctor deps [options] [path]
  project-doctor overview [path]
  project-doctor snapshot [path]
  project-doctor history [path]
  project-doctor init [path]
  project-doctor eslint <subcommand> [options] [path]

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
  deps         Check dependencies for newer versions
  snapshot     Save current status to history
  history      View progress over time
  init         Create .project-doctor/config.json5
  eslint       ESLint configuration builder

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

Deps Options:
  --no-dev                Exclude devDependencies from check
  --no-cache              Bypass cache, always fetch fresh data

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

function printVersion(): void {
  console.log("project-doctor v0.1.0");
}

function printCheckList(): void {
  console.log("\nAvailable checks:\n");
  const checks = listChecks();
  let currentGroup = "";

  for (const check of checks) {
    if (check.group !== currentGroup) {
      currentGroup = check.group;
      console.log(`\n${BOLD}[${currentGroup}]${RESET}`);
    }
    const tags = check.tags.map((t) => `${DIM}${t}${RESET}`).join(" ");
    console.log(`  ${check.name}`);
    console.log(`    ${check.description}`);
    console.log(`    ${tags}`);
  }
  console.log("");
}

function printEslintHelp(): void {
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

/** Parse path from args, defaulting to cwd */
function getProjectPath(args: string[]): string {
  const pathArg = args.find((a) => !a.startsWith("-"));
  return resolve(pathArg ?? process.cwd());
}

/** Check if first non-flag arg looks like a path */
function isPath(arg: string | undefined): boolean {
  return (
    !!arg &&
    !arg.startsWith("-") &&
    (arg.startsWith("/") ||
      arg.startsWith("./") ||
      arg.startsWith("..") ||
      arg.includes("/") ||
      arg === ".")
  );
}

async function handleConfigCommand(args: string[]): Promise<void> {
  // project-doctor config [path]
  // project-doctor config set project-type <js|generic> [path]

  const firstArg = args[0];
  if (firstArg === "set") {
    const settingName = args[1];
    const settingValue = args[2];

    if (settingName === "project-type") {
      if (!settingValue) {
        console.error("${RED}Error: Missing project type. Use 'js' or 'generic'.${RESET}");
        process.exit(2);
      }
      const projectPath = getProjectPath(args.slice(3));
      await runConfigSetProjectType(projectPath, settingValue);
      return;
    }

    console.error(
      `${RED}Error: Unknown config setting "${settingName}". Use 'project-type'.${RESET}`,
    );
    process.exit(2);
  }

  // Check for --format json
  const formatIdx = args.indexOf("--format");
  let format = "text";
  if (formatIdx !== -1 && args[formatIdx + 1]) {
    format = args[formatIdx + 1];
    args.splice(formatIdx, 2);
  }

  const projectPath = getProjectPath(args);

  if (format === "json") {
    await runConfigShowJson(projectPath);
  } else {
    await runConfigShow(projectPath);
  }
}

type ConfigTargetType = "check" | "tag" | "group";

function parseConfigTargetArgs(args: string[]): {
  type: ConfigTargetType;
  name: string;
  projectPath: string;
} {
  const type = args[0];
  if (!type || !["check", "tag", "group"].includes(type)) {
    console.error(`${RED}Error: Missing or invalid type. Use 'check', 'tag', or 'group'.${RESET}`);
    process.exit(2);
  }
  args.shift();

  const name = args[0];
  if (!name || name.startsWith("-")) {
    console.error(`${RED}Error: Missing ${type} name.${RESET}`);
    process.exit(2);
  }
  args.shift();

  return { type: type as ConfigTargetType, name, projectPath: getProjectPath(args) };
}

async function handleDisableCommand(args: string[]): Promise<void> {
  const { type, name, projectPath } = parseConfigTargetArgs(args);

  switch (type) {
    case "check":
      await runDisableCheck(projectPath, name);
      break;
    case "tag":
      await runDisableTag(projectPath, name);
      break;
    case "group":
      await runDisableGroup(projectPath, name);
      break;
  }
}

async function handleEnableCommand(args: string[]): Promise<void> {
  const { type, name, projectPath } = parseConfigTargetArgs(args);

  switch (type) {
    case "check":
      await runEnableCheck(projectPath, name);
      break;
    case "tag":
      await runEnableTag(projectPath, name);
      break;
    case "group":
      await runEnableGroup(projectPath, name);
      break;
  }
}

async function handleMuteCommand(args: string[]): Promise<void> {
  // project-doctor mute <check-name> [options] [path]

  const checkName = args[0];
  if (!checkName || checkName.startsWith("-")) {
    console.error("${RED}Error: Missing check name.${RESET}");
    process.exit(2);
  }
  args.shift();

  const { values, positionals } = parseArgs({
    args,
    options: {
      weeks: { type: "string" },
      months: { type: "string" },
      until: { type: "string" },
    },
    allowPositionals: true,
  });

  const projectPath = getProjectPath(positionals);

  await runMute(projectPath, checkName, {
    weeks: values.weeks ? parseInt(values.weeks, 10) : undefined,
    months: values.months ? parseInt(values.months, 10) : undefined,
    until: values.until,
  });
}

async function handleUnmuteCommand(args: string[]): Promise<void> {
  // project-doctor unmute <check-name> [path]

  const checkName = args[0];
  if (!checkName || checkName.startsWith("-")) {
    console.error("${RED}Error: Missing check name.${RESET}");
    process.exit(2);
  }
  args.shift();

  const projectPath = getProjectPath(args);
  await runUnmute(projectPath, checkName);
}

async function handleListCommand(args: string[]): Promise<void> {
  // project-doctor list [options] [path]

  const { values, positionals } = parseArgs({
    args,
    options: {
      group: { type: "string", short: "g", multiple: true },
      tag: { type: "string", short: "t", multiple: true },
      status: { type: "string" },
      format: { type: "string" },
    },
    allowPositionals: true,
  });

  const projectPath = getProjectPath(positionals);

  await runList(projectPath, {
    groups: values.group,
    tags: values.tag,
    status: values.status as "all" | "enabled" | "disabled" | "muted" | undefined,
    format: values.format as "table" | "json" | "names" | undefined,
  });
}

async function handleInfoCommand(args: string[]): Promise<void> {
  // project-doctor info <check-name> [options] [path]

  const checkName = args[0];
  if (!checkName || checkName.startsWith("-")) {
    console.error("${RED}Error: Missing check name.${RESET}");
    process.exit(2);
  }
  args.shift();

  const { values, positionals } = parseArgs({
    args,
    options: {
      format: { type: "string" },
    },
    allowPositionals: true,
  });

  const projectPath = getProjectPath(positionals);

  await runInfo(projectPath, checkName, {
    format: values.format as "text" | "json" | undefined,
  });
}

async function handleFixCommand(args: string[]): Promise<void> {
  // project-doctor fix [path]                    List fixable issues
  // project-doctor fix all [options] [path]      Fix all issues
  // project-doctor fix <check-name> [path]       Fix specific check

  const firstArg = args[0];

  // Handle help
  if (firstArg === "--help" || firstArg === "-h") {
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
    return;
  }

  // If no arg or first arg is a path, list fixable issues
  if (!firstArg || isPath(firstArg)) {
    const projectPath = getProjectPath(args);
    await runFixList(projectPath, {});
    return;
  }

  // Handle "fix all" command
  if (firstArg === "all") {
    args.shift(); // remove "all"

    const { values, positionals } = parseArgs({
      args,
      options: {
        group: { type: "string", short: "g", multiple: true },
        tag: { type: "string", short: "t", multiple: true },
        pick: { type: "string" },
      },
      allowPositionals: true,
    });

    const projectPath = getProjectPath(positionals);
    const exitCode = await runFixAll(projectPath, {
      groups: values.group,
      tags: values.tag,
      pick: values.pick,
    });
    process.exit(exitCode);
  }

  // Otherwise, first arg is a check name
  const checkName = firstArg;
  args.shift();

  const { values, positionals } = parseArgs({
    args,
    options: {
      pick: { type: "string" },
    },
    allowPositionals: true,
  });

  const projectPath = getProjectPath(positionals);
  const exitCode = await runFixOne(projectPath, checkName, {
    pick: values.pick,
  });
  process.exit(exitCode);
}

async function handleEslintCommand(args: string[]): Promise<void> {
  const firstArg = args[0];

  // Determine subcommand and project path
  let subcommand: string | undefined;
  let projectPath: string;

  if (isPath(firstArg)) {
    // First arg is a path, no subcommand - launch wizard
    subcommand = undefined;
    projectPath = resolve(firstArg);
  } else {
    subcommand = firstArg;
    args.shift(); // remove subcommand
    projectPath = resolve(args.find((a) => !a.startsWith("-")) ?? process.cwd());
  }

  const hasWizard = args.includes("--wizard") || args.includes("-w");
  const hasDryRun = args.includes("--dry-run");
  const hasForce = args.includes("--force");
  const hasPresetsFlag = args.includes("--presets");
  const hasRulesFlag = args.includes("--rules");

  const presetsArg = args.find((a, i) => args[i - 1] === "--presets");

  switch (subcommand) {
    case "init":
      await runEslintInit(projectPath, {
        wizard: hasWizard,
        presets: presetsArg,
        dryRun: hasDryRun,
        force: hasForce,
      });
      return;
    case "add":
      await runEslintAdd(projectPath, args[0] ?? "");
      return;
    case "show":
      await runEslintShow(projectPath, {
        presets: hasPresetsFlag,
        rules: hasRulesFlag,
      });
      return;
    case "diff":
      await runEslintDiff(projectPath, { presets: presetsArg });
      return;
    case "help":
    case "-h":
    case "--help":
      printEslintHelp();
      return;
    case undefined:
    case "":
      // No subcommand - launch interactive wizard
      await runMainWizard(projectPath);
      return;
    default:
      console.log(`${RED}Unknown eslint subcommand: ${subcommand}${RESET}`);
      console.log();
      printEslintHelp();
      return;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Commands that need special handling before parseArgs
  const specialCommands = [
    "check",
    "fix",
    "deps",
    "overview",
    "snapshot",
    "history",
    "init",
    "eslint",
    "config",
    "disable",
    "enable",
    "mute",
    "unmute",
    "list",
    "info",
  ];

  if (command && specialCommands.includes(command)) {
    args.shift(); // remove command
  }

  // Handle special commands
  if (command === "eslint") {
    await handleEslintCommand(args);
    return;
  }

  if (command === "config") {
    await handleConfigCommand(args);
    return;
  }

  if (command === "disable") {
    await handleDisableCommand(args);
    return;
  }

  if (command === "enable") {
    await handleEnableCommand(args);
    return;
  }

  if (command === "mute") {
    await handleMuteCommand(args);
    return;
  }

  if (command === "unmute") {
    await handleUnmuteCommand(args);
    return;
  }

  if (command === "list") {
    await handleListCommand(args);
    return;
  }

  if (command === "info") {
    await handleInfoCommand(args);
    return;
  }

  if (command === "fix") {
    await handleFixCommand(args);
    return;
  }

  // Parse remaining args
  const { values, positionals } = parseArgs({
    args,
    options: {
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
      list: { type: "boolean", short: "l", default: false },
      "full-report": { type: "boolean", short: "f", default: false },
      group: { type: "string", short: "g", multiple: true },
      tag: { type: "string", short: "t", multiple: true },
      "exclude-tag": { type: "string", short: "e", multiple: true },
      "no-config": { type: "boolean", default: false },
      "no-dev": { type: "boolean", default: false },
      "no-cache": { type: "boolean", default: false },
      format: { type: "string" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    return;
  }

  if (values.version) {
    printVersion();
    return;
  }

  if (values.list) {
    printCheckList();
    return;
  }

  const projectPath = resolve(positionals[0] ?? process.cwd());

  if (command === "overview") {
    await runOverview(projectPath);
    return;
  }

  if (command === "deps") {
    await runDepsChecker({
      projectPath,
      includeDev: !values["no-dev"],
      noCache: values["no-cache"],
    });
    return;
  }

  if (command === "snapshot") {
    await runSnapshot(projectPath);
    return;
  }

  if (command === "history") {
    await runHistory(projectPath);
    return;
  }

  if (command === "init") {
    await runInit(projectPath);
    return;
  }

  if (command === "check") {
    const results = await runChecks({
      projectPath,
      skipConfig: values["no-config"],
      groups: values.group,
      includeTags: values.tag as CheckTag[] | undefined,
      excludeTags: values["exclude-tag"] as CheckTag[] | undefined,
    });

    if (values.format === "json") {
      printCheckResultsAsJson(results);
    } else {
      console.log(`\nRunning checks on: ${projectPath}\n`);
      printResults(results, { fullReport: values["full-report"] });
    }

    const hasFailed = results.some((r) => r.status === "fail");
    process.exit(hasFailed ? 1 : 0);
  }

  // Default: launch interactive wizard
  await runProjectDoctorApp(projectPath);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
