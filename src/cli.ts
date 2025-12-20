#!/usr/bin/env node

import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { getAllChecks, getChecksByGroup, listChecks, listGroups } from "./registry.ts";
import { runChecks } from "./utils/runner.ts";
import { printResults } from "./utils/reporter.ts";

type CliOptions = {
  help: boolean;
  version: boolean;
  list: boolean;
  group: string | undefined;
  filter: string | undefined;
  exclude: string | undefined;
  parallel: boolean;
  stopOnFail: boolean;
  format: string;
  path: string;
};

function printHelp(): void {
  console.log(`
projector-doctor - Project health checks and maintenance tools

Usage:
  projector-doctor [options] [path]

Options:
  -h, --help          Show this help message
  -v, --version       Show version
  -l, --list          List all available checks
  -g, --group <name>  Run checks from specific group only
  -f, --filter <pat>  Only run checks matching pattern
  -e, --exclude <pat> Exclude checks matching pattern
  -p, --parallel      Run checks in parallel (default: sequential)
  -s, --stop-on-fail  Stop on first failure
  --format <type>     Output format: text, json, markdown (default: text)

Examples:
  projector-doctor                    Run all checks in current directory
  projector-doctor ./my-project       Run checks in specific directory
  projector-doctor -g gitignore       Run only gitignore checks
  projector-doctor -f "*.installed"   Run only checks ending with -installed
  projector-doctor --list             Show all available checks

Groups:
  ${listGroups().join(", ")}
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
      console.log(`\n[${currentGroup}]`);
    }
    console.log(`  ${check.name}`);
    console.log(`    ${check.description}`);
  }
  console.log("");
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
      list: { type: "boolean", short: "l", default: false },
      group: { type: "string", short: "g" },
      filter: { type: "string", short: "f" },
      exclude: { type: "string", short: "e" },
      parallel: { type: "boolean", short: "p", default: false },
      "stop-on-fail": { type: "boolean", short: "s", default: false },
      format: { type: "string", default: "text" },
    },
    allowPositionals: true,
  });

  const options: CliOptions = {
    help: values.help ?? false,
    version: values.version ?? false,
    list: values.list ?? false,
    group: values.group,
    filter: values.filter,
    exclude: values.exclude,
    parallel: values.parallel ?? false,
    stopOnFail: values["stop-on-fail"] ?? false,
    format: values.format ?? "text",
    path: positionals[0] ?? process.cwd(),
  };

  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    printVersion();
    return;
  }

  if (options.list) {
    printCheckList();
    return;
  }

  const projectPath = resolve(options.path);
  const checks = options.group
    ? getChecksByGroup(options.group)
    : getAllChecks();

  if (checks.length === 0) {
    console.error(`No checks found${options.group ? ` for group: ${options.group}` : ""}`);
    process.exit(1);
  }

  console.log(`\nRunning ${checks.length} checks on: ${projectPath}\n`);

  const results = await runChecks(checks, {
    projectPath,
    parallel: options.parallel,
    stopOnFail: options.stopOnFail,
    filter: options.filter?.split(","),
    exclude: options.exclude?.split(","),
  });

  printResults(results);

  const hasFailed = results.some((r) => r.status === "fail");
  process.exit(hasFailed ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
