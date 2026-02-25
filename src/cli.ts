
/**
 * CLI Entry Point
 *
 * This file handles argument parsing and routes to appropriate command handlers.
 * The actual command implementations are in src/cli/ and src/commands/.
 */

import { parseArgs } from "node:util";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CheckTag } from "./types.js";
import { listChecks } from "./registry.js";
import { runChecks } from "./utils/runner.js";
import { printResults } from "./utils/reporter.js";
import { runOverview } from "./utils/overview.js";
import { runSnapshot, runHistory } from "./utils/snapshot.js";
import { runInit } from "./utils/init.js";
import { runProjectDoctorApp } from "./app/index.js";
import { printCheckResultsAsJson } from "./commands/check.js";
import { bold, dim, red, yellow } from "./utils/colors.js";
import { safeJsonParse } from "./utils/safe-json.js";
import {
  printHelp,
  handleConfigCommand,
  handleDisableCommand,
  handleEnableCommand,
  handleMuteCommand,
  handleUnmuteCommand,
  handleListCommand,
  handleInfoCommand,
  handleFixCommand,
  handleEslintCommand,
} from "./cli/index.js";

// Read version from package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, "..", "package.json");

const IS_DEV = process.env.NODE_ENV !== "production" && !__dirname.includes("node_modules");
let VERSION = "0.0.0";
try {
  const content = readFileSync(packageJsonPath, "utf8");
  const packageJson = safeJsonParse<{ version?: string }>(content);
  if (packageJson?.version) {
    VERSION = packageJson.version;
  } else {
    console.error(yellow("Warning: Could not read version from package.json"));
  }
} catch {
  // Fallback version if package.json is missing (expected during development with tsx)
  if (process.env.NODE_ENV === "production") {
    console.error(yellow("Warning: package.json not found, using fallback version"));
  }
}

function printVersion(): void {
  console.log(`project-doctor v${VERSION}`);
}

function printCheckList(): void {
  console.log("\nAvailable checks:\n");
  const checks = listChecks();
  let currentGroup = "";

  for (const check of checks) {
    if (check.group !== currentGroup) {
      currentGroup = check.group;
      console.log(`\n${bold(`[${currentGroup}]`)}`);
    }
    const tags = check.tags.map((t) => dim(t)).join(" ");
    console.log(`  ${check.name}`);
    console.log(`    ${check.description}`);
    console.log(`    ${tags}`);
  }
  console.log("");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Commands that need special handling before parseArgs
  const specialCommands = [
    "check",
    "fix",
    "overview",
    "snapshot",
    "history",
    "init",
    ...(IS_DEV ? ["eslint"] : []), // eslint is dev-only
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

  // eslint command is dev-only (not exposed in production)
  if (command === "eslint") {
    if (!IS_DEV) {
      console.error(red("Error: Unknown command 'eslint'"));
      console.error("Run 'project-doctor --help' for usage.");
      process.exit(2);
    }
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

  const projectPath = path.resolve(positionals[0] ?? process.cwd());

  if (command === "overview") {
    await runOverview(projectPath);
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
    const { results, config } = await runChecks({
      projectPath,
      skipConfig: values["no-config"],
      groups: values.group,
      includeTags: values.tag as CheckTag[] | undefined,
      excludeTags: values["exclude-tag"] as CheckTag[] | undefined,
    });

    if (values.format === "json") {
      printCheckResultsAsJson(results, config);
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

// Global error handlers
process.on("unhandledRejection", (reason) => {
  console.error(red("Unhandled Promise Rejection:"), reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(red("Uncaught Exception:"), error);
  process.exit(1);
});

main().catch((error: unknown) => {
  console.error(red("Fatal error:"), error instanceof Error ? error.message : String(error));
  process.exit(1);
});
