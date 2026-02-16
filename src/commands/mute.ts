/**
 * Mute command - Temporarily mute checks
 *
 * Usage:
 *   project-doctor mute <check-name> [options] [path]
 *   project-doctor unmute <check-name> [path]
 *
 * Options:
 *   --weeks <n>       Mute for n weeks (default: 2)
 *   --months <n>      Mute for n months
 *   --until <date>    Mute until specific date (YYYY-MM-DD)
 */

import { setCheckSeverity } from "../config/loader.js";
import { createSkipUntil } from "../config/types.js";
import { getValidCheckNames } from "../utils/checks.js";
import { RED, RESET } from "../utils/colors.js";

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

function parseDate(dateStr: string): Date | null {
  // Validate ISO date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }

  const date = new Date(dateStr + "T23:59:59");
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export interface MuteOptions {
  weeks?: number;
  months?: number;
  until?: string;
}

/**
 * Temporarily mute a check until a specified date.
 *
 * The check will be skipped until the mute expires, then
 * automatically becomes active again.
 *
 * @param projectPath - Absolute path to the project directory
 * @param checkName - Name of the check to mute
 * @param options - Duration options (weeks, months, or until date)
 */
export async function runMute(
  projectPath: string,
  checkName: string,
  options: MuteOptions,
): Promise<void> {
  const validChecks = getValidCheckNames();

  if (!validChecks.has(checkName)) {
    console.error(`${RED}Error: Unknown check "${checkName}".${RESET}`);
    console.error('Run "project-doctor list" to see available checks.');
    process.exit(2);
  }

  let muteUntil: Date;
  const now = new Date();

  if (options.until) {
    const parsed = parseDate(options.until);
    if (!parsed) {
      console.error(`${RED}Error: Invalid date format "${options.until}". Use YYYY-MM-DD.${RESET}`);
      process.exit(2);
    }

    if (parsed <= now) {
      console.error(`${RED}Error: Date must be in the future.${RESET}`);
      process.exit(2);
    }

    muteUntil = parsed;
  } else if (options.months) {
    if (options.months <= 0) {
      console.error(`${RED}Error: Months must be a positive number.${RESET}`);
      process.exit(2);
    }
    muteUntil = addMonths(now, options.months);
  } else {
    // Default: 2 weeks
    const weeks = options.weeks ?? 2;
    if (weeks <= 0) {
      console.error(`${RED}Error: Weeks must be a positive number.${RESET}`);
      process.exit(2);
    }
    muteUntil = addWeeks(now, weeks);
  }

  const severity = createSkipUntil(muteUntil);
  await setCheckSeverity(projectPath, checkName, severity);

  const dateStr = muteUntil.toISOString().split("T")[0];
  console.log(`Muted check "${checkName}" until ${dateStr}`);
}

/**
 * Remove mute from a check, making it active immediately.
 *
 * @param projectPath - Absolute path to the project directory
 * @param checkName - Name of the check to unmute
 */
export async function runUnmute(projectPath: string, checkName: string): Promise<void> {
  const validChecks = getValidCheckNames();

  if (!validChecks.has(checkName)) {
    console.error(`${RED}Error: Unknown check "${checkName}".${RESET}`);
    console.error('Run "project-doctor list" to see available checks.');
    process.exit(2);
  }

  // Setting to "error" effectively removes any mute/skip-until configuration
  await setCheckSeverity(projectPath, checkName, "error");
  console.log(`Unmuted check: ${checkName}`);
}
