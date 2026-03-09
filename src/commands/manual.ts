/**
 * Manual command - Manage manual checks
 *
 * Usage:
 *   project-doctor manual [options] [path]              List manual checks
 *   project-doctor manual done <name> [path]            Mark as done
 *   project-doctor manual undone <name> [path]          Mark as not done
 *   project-doctor manual info <name> [options] [path]  Show check details
 *
 * List Options:
 *   --status <status>   Filter: all (default), done, not-done, muted, disabled
 *   --format <format>   Output: table (default), json, names
 */

import { loadAndResolveConfig, setManualCheckState, setManualCheckSeverity } from "../config/loader.js";
import { createMuteUntil } from "../config/severity.js";
import { parseISODate, toDateString } from "../utils/dates.js";
import { manualChecks } from "../registry.js";
import {
  getValidManualCheckNames,
  findManualCheck,
  getManualCheckDisplayState,
  extractManualCheckState,
} from "../utils/checks.js";
import { bold, dim, green, yellow, red } from "../utils/colors.js";
import { blank } from "../cli-framework/renderer.js";
import type { ManualCheckDisplayState } from "../app/types.js";

export interface ManualListOptions {
  status?: "all" | "done" | "not-done" | "muted" | "disabled";
  format?: "table" | "json" | "names";
}

export interface ManualInfoOptions {
  format?: "text" | "json";
}

interface ManualCheckListInfo {
  name: string;
  description: string;
  tags: string[];
  state: string;
  displayState: ManualCheckDisplayState;
}

function formatDisplayState(displayState: ManualCheckDisplayState): string {
  switch (displayState) {
    case "done": {
      return green("done");
    }
    case "not-done": {
      return red("not done");
    }
    case "muted": {
      return yellow("muted");
    }
    case "disabled": {
      return dim("disabled");
    }
  }
}

/**
 * List all manual checks with their current state.
 */
export async function runManualList(
  projectPath: string,
  options: ManualListOptions,
): Promise<void> {
  const config = await loadAndResolveConfig(projectPath);

  let checks: ManualCheckListInfo[] = manualChecks.map((check) => {
    const state = extractManualCheckState(config.manualChecks[check.name]);
    const displayState = getManualCheckDisplayState(check, config);
    return {
      name: check.name,
      description: check.description,
      tags: check.tags,
      state,
      displayState,
    };
  });

  // Apply status filter
  if (options.status && options.status !== "all") {
    const filterStatus = options.status;
    checks = checks.filter((c) => {
      if (filterStatus === "not-done") {
        return c.displayState === "not-done";
      }
      return c.displayState === filterStatus;
    });
  }

  // Output based on format
  const format = options.format ?? "table";

  if (format === "json") {
    console.log(JSON.stringify(checks, null, 2));
    return;
  }

  if (format === "names") {
    for (const check of checks) {
      console.log(check.name);
    }
    return;
  }

  // Table format
  if (checks.length === 0) {
    console.log("No manual checks found matching the criteria.");
    return;
  }

  const nameWidth = Math.max(10, ...checks.map((c) => c.name.length));

  blank();
  console.log(
    `${bold("Check Name".padEnd(nameWidth))}  ` +
      `${bold("Status".padEnd(12))}  ` +
      bold("Description"),
  );
  console.log("─".repeat(nameWidth + 60));

  for (const check of checks) {
    const statusStr = formatDisplayState(check.displayState);
    console.log(
      `${check.name.padEnd(nameWidth)}  ` +
        `${statusStr.padEnd(12 + (statusStr.length - check.displayState.length))}  ` +
        check.description,
    );
  }

  blank();
  console.log(`Total: ${checks.length} manual checks`);
}

/**
 * Mark a manual check as done.
 */
export async function runManualDone(projectPath: string, checkName: string): Promise<void> {
  const validNames = getValidManualCheckNames();

  if (!validNames.has(checkName)) {
    console.error(red(`Error: Unknown manual check "${checkName}".`));
    console.error('Run "project-doctor manual" to see available manual checks.');
    process.exit(2);
  }

  await setManualCheckState(projectPath, checkName, "done");
  console.log(`Marked manual check as done: ${checkName}`);
}

/**
 * Mark a manual check as not done.
 */
export async function runManualUndone(projectPath: string, checkName: string): Promise<void> {
  const validNames = getValidManualCheckNames();

  if (!validNames.has(checkName)) {
    console.error(red(`Error: Unknown manual check "${checkName}".`));
    console.error('Run "project-doctor manual" to see available manual checks.');
    process.exit(2);
  }

  await setManualCheckState(projectPath, checkName, "not-done");
  console.log(`Marked manual check as not done: ${checkName}`);
}

/**
 * Show detailed information about a manual check.
 */
export async function runManualInfo(
  projectPath: string,
  checkName: string,
  options: ManualInfoOptions,
): Promise<void> {
  const check = findManualCheck(checkName);

  if (!check) {
    console.error(red(`Error: Unknown manual check "${checkName}".`));
    console.error('Run "project-doctor manual" to see available manual checks.');
    process.exit(2);
  }

  const config = await loadAndResolveConfig(projectPath);
  const state = extractManualCheckState(config.manualChecks[check.name]);
  const displayState = getManualCheckDisplayState(check, config);

  const output = {
    name: check.name,
    description: check.description,
    details: check.details,
    tags: check.tags,
    state,
    displayState,
    why: check.why ?? undefined,
  };

  if (options.format === "json") {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Text format
  blank();
  console.log(`${bold("Check:")} ${output.name}`);
  console.log(`${bold("Description:")} ${output.description}`);
  blank();
  console.log(`${bold("Tags:")} ${output.tags.join(", ")}`);
  blank();
  console.log(`${bold("Status:")} ${formatDisplayState(displayState)}`);
  console.log(`${bold("State:")} ${state}`);

  if (output.details !== undefined) {
    blank();
    console.log(bold("Details:"));
    console.log("─".repeat(60));
    console.log(output.details);
  }

  if (output.why !== undefined) {
    blank();
    console.log(bold("Why This Matters:"));
    console.log("─".repeat(60));
    console.log(output.why);
  }

  blank();
}

// ============================================================================
// Mute / Unmute / Disable / Enable
// ============================================================================

export interface ManualMuteOptions {
  weeks?: number;
  months?: number;
  until?: string;
}

function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Temporarily mute a manual check until a specified date.
 */
export async function runManualMute(
  projectPath: string,
  checkName: string,
  options: ManualMuteOptions,
): Promise<void> {
  const validNames = getValidManualCheckNames();

  if (!validNames.has(checkName)) {
    console.error(red(`Error: Unknown manual check "${checkName}".`));
    console.error('Run "project-doctor manual" to see available manual checks.');
    process.exit(2);
  }

  let muteUntil: Date;
  const now = new Date();

  if (options.until !== undefined) {
    const parsed = parseISODate(options.until);
    if (!parsed) {
      console.error(red(`Error: Invalid date format "${options.until}". Use YYYY-MM-DD.`));
      process.exit(2);
    }
    if (parsed <= now) {
      console.error(red("Error: Date must be in the future."));
      process.exit(2);
    }
    muteUntil = parsed;
  } else if (options.months === undefined) {
    const weeks = options.weeks ?? 2;
    muteUntil = addWeeks(now, weeks);
  } else {
    muteUntil = addMonths(now, options.months);
  }

  const severity = createMuteUntil(muteUntil);
  await setManualCheckSeverity(projectPath, checkName, severity);
  console.log(`Muted manual check "${checkName}" until ${toDateString(muteUntil)}`);
}

/**
 * Remove mute from a manual check, making it active immediately.
 */
export async function runManualUnmute(projectPath: string, checkName: string): Promise<void> {
  const validNames = getValidManualCheckNames();

  if (!validNames.has(checkName)) {
    console.error(red(`Error: Unknown manual check "${checkName}".`));
    console.error('Run "project-doctor manual" to see available manual checks.');
    process.exit(2);
  }

  await setManualCheckSeverity(projectPath, checkName, "error");
  console.log(`Unmuted manual check: ${checkName}`);
}

/**
 * Permanently disable a manual check.
 */
export async function runManualDisable(projectPath: string, checkName: string): Promise<void> {
  const validNames = getValidManualCheckNames();

  if (!validNames.has(checkName)) {
    console.error(red(`Error: Unknown manual check "${checkName}".`));
    console.error('Run "project-doctor manual" to see available manual checks.');
    process.exit(2);
  }

  await setManualCheckSeverity(projectPath, checkName, "off");
  console.log(`Disabled manual check: ${checkName}`);
}

/**
 * Re-enable a disabled manual check.
 */
export async function runManualEnable(projectPath: string, checkName: string): Promise<void> {
  const validNames = getValidManualCheckNames();

  if (!validNames.has(checkName)) {
    console.error(red(`Error: Unknown manual check "${checkName}".`));
    console.error('Run "project-doctor manual" to see available manual checks.');
    process.exit(2);
  }

  await setManualCheckSeverity(projectPath, checkName, "error");
  console.log(`Enabled manual check: ${checkName}`);
}
