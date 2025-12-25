#!/usr/bin/env node

import { parseArgs } from "node:util";
import { resolve } from "node:path";
import type { CheckTag } from "./types.js";
import { listChecks, listGroups } from "./registry.js";
import { runChecks } from "./utils/runner.js";
import { printResults } from "./utils/reporter.js";
import { runFixer } from "./utils/fixer.js";
import { runDepsChecker } from "./utils/deps-checker.js";
import { runOverview } from "./utils/overview.js";

function printHelp(): void {
  console.log(`
project-doctor - Project health checks and maintenance tools

Usage:
  project-doctor [path]
  project-doctor check [options] [path]
  project-doctor fix [options] [path]
  project-doctor deps [options] [path]

Commands:
  (default)    Show project health overview
  check        Run all checks and report details
  fix          Interactively fix issues that have auto-fixes
  deps         Check dependencies for newer versions

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

Config File:
  Create .project-doctorrc.json to set default options:
  {
    "excludeTags": ["opinionated"],
    "excludeChecks": ["changelog-exists"]
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
  project-doctor --list                Show all available checks

Groups:
  ${listGroups().join(", ")}

Tags:
  Scope:       universal, node, typescript
  Requirement: required, recommended, opinionated
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

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isCheckCommand = args[0] === "check";
  const isFixCommand = args[0] === "fix";
  const isDepsCommand = args[0] === "deps";

  if (isCheckCommand || isFixCommand || isDepsCommand) {
    args.shift();
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

  if (isFixCommand) {
    await runFixer({
      projectPath,
      autoFix: values.yes,
    });
    return;
  }

  if (isDepsCommand) {
    await runDepsChecker({
      projectPath,
      includeDev: !values["no-dev"],
    });
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
