/**
 * Info command - Show detailed information about a check
 *
 * Usage:
 *   project-doctor info <check-name> [options] [path]
 *
 * Options:
 *   --format <format>   Output format: text (default), json
 */

import { loadAndResolveConfig } from "../config/loader.js";
import {
  getCheckInfo,
  loadWhyFromDocs,
  type CheckInfo,
} from "../utils/checks.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[90m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";

type CheckInfoOutput = CheckInfo & {
  why?: string;
};

export type InfoOptions = {
  format?: "text" | "json";
};

export async function runInfo(
  projectPath: string,
  checkName: string,
  options: InfoOptions
): Promise<void> {
  const config = await loadAndResolveConfig(projectPath);
  const info = getCheckInfo(checkName, config);

  if (!info) {
    console.error(`\x1b[31mError: Unknown check "${checkName}".\x1b[0m`);
    console.error(`Run "project-doctor list" to see available checks.`);
    process.exit(2);
  }

  // Load why content
  const why = await loadWhyFromDocs(info.group, info.name);

  const output: CheckInfoOutput = {
    ...info,
    why: why ?? undefined,
  };

  if (options.format === "json") {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Text format
  console.log();
  console.log(`${BOLD}Check:${RESET} ${output.name}`);
  console.log(`${BOLD}Group:${RESET} ${output.group}`);
  console.log(`${BOLD}Description:${RESET} ${output.description}`);
  console.log();
  console.log(`${BOLD}Tags:${RESET} ${output.tags.join(", ")}`);
  console.log();

  const statusColor = output.status === "enabled" ? GREEN : output.status === "muted" ? YELLOW : DIM;
  let statusStr = `${statusColor}${output.status}${RESET}`;
  if (output.mutedUntil) {
    statusStr += ` (until ${output.mutedUntil})`;
  }
  console.log(`${BOLD}Status:${RESET} ${statusStr}`);
  console.log(`${BOLD}Has Fix:${RESET} ${output.fixable ? `${GREEN}yes${RESET}` : "no"}`);

  if (output.fixDescription) {
    console.log();
    console.log(`${BOLD}Fix Description:${RESET}`);
    console.log(`  ${output.fixDescription}`);
  }

  if (output.fixOptions && output.fixOptions.length > 0) {
    console.log();
    console.log(`${BOLD}Fix Options:${RESET}`);
    for (const opt of output.fixOptions) {
      console.log(`  ${DIM}[${opt.id}]${RESET} ${opt.label}`);
      if (opt.description) {
        console.log(`    ${DIM}${opt.description}${RESET}`);
      }
    }
  }

  if (output.why) {
    console.log();
    console.log(`${BOLD}Why This Matters:${RESET}`);
    console.log("─".repeat(60));
    console.log(output.why);
  }

  console.log();
}
