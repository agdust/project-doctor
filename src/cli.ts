#!/usr/bin/env node

import { parseArgs } from "node:util";
import { resolve } from "node:path";
import type { CheckTag } from "./types.ts";
import { listChecks, listGroups } from "./registry.ts";
import { runChecks } from "./utils/runner.ts";
import { printResults } from "./utils/reporter.ts";

function printHelp(): void {
  console.log(`
projector-doctor - Project health checks and maintenance tools

Usage:
  projector-doctor [options] [path]

Options:
  -h, --help              Show this help message
  -v, --version           Show version
  -l, --list              List all available checks
  -g, --group <name>      Run checks from specific group only
  -t, --tag <tag>         Only run checks with this tag (can repeat)
  -e, --exclude-tag <tag> Exclude checks with this tag (can repeat)

Examples:
  projector-doctor                       Run all checks in current directory
  projector-doctor ./my-project          Run checks in specific directory
  projector-doctor -g package-json       Run only package-json checks
  projector-doctor -t required           Run only required checks
  projector-doctor -e opinionated        Exclude opinionated checks
  projector-doctor --list                Show all available checks

Groups:
  ${listGroups().join(", ")}

Tags:
  Scope:       universal, node, typescript, framework:svelte
  Requirement: required, recommended, opinionated
  Tool:        tool:eslint, tool:prettier, tool:knip, etc.
`);
}

function printVersion(): void {
  console.log("projector-doctor v0.1.0");
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
  const { values, positionals } = parseArgs({
    options: {
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
      list: { type: "boolean", short: "l", default: false },
      group: { type: "string", short: "g", multiple: true },
      tag: { type: "string", short: "t", multiple: true },
      "exclude-tag": { type: "string", short: "e", multiple: true },
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

  console.log(`\nRunning checks on: ${projectPath}\n`);

  const results = await runChecks({
    projectPath,
    groups: values.group,
    includeTags: values.tag as CheckTag[] | undefined,
    excludeTags: values["exclude-tag"] as CheckTag[] | undefined,
  });

  printResults(results);

  const hasFailed = results.some((r) => r.status === "fail");
  process.exit(hasFailed ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
