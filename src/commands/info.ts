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
import { getCheckInfo, loadWhyFromDocs, type CheckInfo } from "../utils/checks.js";
import { bold, dim, green, yellow, red } from "../utils/colors.js";

type CheckInfoOutput = CheckInfo & {
  why?: string;
};

export interface InfoOptions {
  format?: "text" | "json";
}

/**
 * Display detailed information about a specific check.
 *
 * Shows check description, tags, status, fix options,
 * and "why this matters" documentation.
 *
 * @param projectPath - Absolute path to the project directory
 * @param checkName - Name of the check to show info for
 * @param options - Output format options
 */
export async function runInfo(
  projectPath: string,
  checkName: string,
  options: InfoOptions,
): Promise<void> {
  const config = await loadAndResolveConfig(projectPath);
  const info = getCheckInfo(checkName, config);

  if (!info) {
    console.error(red(`Error: Unknown check "${checkName}".`));
    console.error('Run "project-doctor list" to see available checks.');
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
  console.log(`${bold("Check:")} ${output.name}`);
  console.log(`${bold("Group:")} ${output.group}`);
  console.log(`${bold("Description:")} ${output.description}`);
  console.log();
  console.log(`${bold("Tags:")} ${output.tags.join(", ")}`);
  console.log();

  let statusColor = dim;
  if (output.status === "enabled") {
    statusColor = green;
  } else if (output.status === "muted") {
    statusColor = yellow;
  }
  let statusStr = statusColor(output.status);
  if (output.mutedUntil !== undefined) {
    statusStr += ` (until ${output.mutedUntil})`;
  }
  console.log(`${bold("Status:")} ${statusStr}`);
  console.log(`${bold("Has Fix:")} ${output.fixable ? green("yes") : "no"}`);

  if (output.fixDescription !== undefined) {
    console.log();
    console.log(bold("Fix Description:"));
    console.log(`  ${output.fixDescription}`);
  }

  if (output.fixOptions && output.fixOptions.length > 0) {
    console.log();
    console.log(bold("Fix Options:"));
    for (const opt of output.fixOptions) {
      console.log(`  ${dim(`[${opt.id}]`)} ${opt.label}`);
      if (opt.description !== undefined) {
        console.log(`    ${dim(opt.description)}`);
      }
    }
  }

  if (output.why !== undefined) {
    console.log();
    console.log(bold("Why This Matters:"));
    console.log("─".repeat(60));
    console.log(output.why);
  }

  console.log();
}
