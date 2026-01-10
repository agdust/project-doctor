#!/usr/bin/env node

import { parseArgs } from "node:util";
import { resolve } from "node:path";
import type { CheckTag } from "./types.js";
import { listChecks, listGroups } from "./registry.js";
import { runChecks } from "./utils/runner.js";
import { printResults } from "./utils/reporter.js";
import { runAutoFix } from "./utils/fixer.js";
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

function printHelp(): void {
  console.log(`
project-doctor - Project health checks and maintenance tools

Usage:
  project-doctor [path]
  project-doctor app [path]
  project-doctor check [options] [path]
  project-doctor fix [options] [path]
  project-doctor deps [options] [path]
  project-doctor snapshot [path]
  project-doctor history [path]
  project-doctor init [path]
  project-doctor eslint <subcommand> [options] [path]

Commands:
  (default)    Show project health overview
  app          Interactive multi-screen app
  check        Run all checks and report details
  fix          Fix issues (interactive, or auto with -y)
  deps         Check dependencies for newer versions
  snapshot     Save current status to history
  history      View progress over time
  init         Create .project-doctor/config.json5
  eslint       ESLint configuration builder

Options:
  -h, --help              Show this help message
  -v, --version           Show version
  -l, --list              List all available checks
  -f, --full-report       Show all checks (default: only failures)
  -g, --group <name>      Run checks from specific group only
  -t, --tag <tag>         Only run checks with this tag (can repeat)
  -e, --exclude-tag <tag> Exclude checks with this tag (can repeat)
  --no-config             Ignore .project-doctorrc.json config file

Fix Options:
  -y, --yes               Auto-apply all fixes without prompting

Deps Options:
  --no-dev                Exclude devDependencies from check
  --no-cache              Bypass cache, always fetch fresh data

Config File:
  Create .project-doctor/config.json5 to set default options:
  {
    excludeTags: ["opinionated"],
    excludeChecks: ["changelog-exists"],
  }

Examples:
  project-doctor                       Show project health overview
  project-doctor ./my-project          Show overview for specific directory
  project-doctor check                 Run all checks with details
  project-doctor check -g package-json Run only package-json checks
  project-doctor check -t required     Run only required checks
  project-doctor fix                   Interactively fix issues
  project-doctor fix -y                Auto-fix all issues
  project-doctor deps                  Check for outdated dependencies
  project-doctor snapshot              Save snapshot to .project-doctor/
  project-doctor history               View health history
  project-doctor --list                Show all available checks

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
      console.log(`\n\x1b[1m[${currentGroup}]\x1b[0m`);
    }
    const tags = check.tags.map((t) => `\x1b[90m${t}\x1b[0m`).join(" ");
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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isAppCommand = args[0] === "app";
  const isCheckCommand = args[0] === "check";
  const isFixCommand = args[0] === "fix";
  const isDepsCommand = args[0] === "deps";
  const isSnapshotCommand = args[0] === "snapshot";
  const isHistoryCommand = args[0] === "history";
  const isInitCommand = args[0] === "init";
  const isEslintCommand = args[0] === "eslint";

  if (isAppCommand || isCheckCommand || isFixCommand || isDepsCommand || isSnapshotCommand || isHistoryCommand || isInitCommand) {
    args.shift();
  }

  // Handle eslint subcommand separately
  if (isEslintCommand) {
    args.shift(); // remove "eslint"
    const firstArg = args[0];

    // Check if first arg is a path (not a subcommand)
    const isPath =
      firstArg &&
      !firstArg.startsWith("-") &&
      (firstArg.startsWith("/") ||
        firstArg.startsWith("./") ||
        firstArg.startsWith("..") ||
        firstArg.includes("/") ||
        firstArg === ".");

    // Determine subcommand and project path
    let subcommand: string | undefined;
    let projectPath: string;

    if (isPath) {
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
        console.log(`\x1b[31mUnknown eslint subcommand: ${subcommand}\x1b[0m`);
        console.log();
        printEslintHelp();
        return;
    }
  }

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
      yes: { type: "boolean", short: "y", default: false },
      "no-dev": { type: "boolean", default: false },
      "no-cache": { type: "boolean", default: false },
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

  if (isAppCommand) {
    await runProjectDoctorApp(projectPath);
    return;
  }

  if (isFixCommand) {
    if (values.yes) {
      // Auto-fix mode: run all fixes without prompts
      await runAutoFix({ projectPath });
    } else {
      // Interactive mode: use the app
      await runProjectDoctorApp(projectPath);
    }
    return;
  }

  if (isDepsCommand) {
    await runDepsChecker({
      projectPath,
      includeDev: !values["no-dev"],
      noCache: values["no-cache"],
    });
    return;
  }

  if (isSnapshotCommand) {
    await runSnapshot(projectPath);
    return;
  }

  if (isHistoryCommand) {
    await runHistory(projectPath);
    return;
  }

  if (isInitCommand) {
    await runInit(projectPath);
    return;
  }

  if (isCheckCommand) {
    console.log(`\nRunning checks on: ${projectPath}\n`);

    const results = await runChecks({
      projectPath,
      skipConfig: values["no-config"],
      groups: values.group,
      includeTags: values.tag as CheckTag[] | undefined,
      excludeTags: values["exclude-tag"] as CheckTag[] | undefined,
    });

    printResults(results, { fullReport: values["full-report"] });

    const hasFailed = results.some((r) => r.status === "fail");
    process.exit(hasFailed ? 1 : 0);
  }

  // Default: show overview
  await runOverview(projectPath);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
