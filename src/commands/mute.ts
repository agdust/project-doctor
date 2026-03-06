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
import { createMuteUntil } from "../config/severity.js";
import { getValidCheckNames, getValidManualCheckNames } from "../utils/checks.js";
import { red } from "../utils/colors.js";
import { parseISODate, toDateString } from "../utils/dates.js";

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
  return parseISODate(dateStr);
}

export interface MuteOptions {
  weeks?: number;
  months?: number;
  until?: string;
}

/**
 * Temporarily mute a check until a specified date.
 *
 * The check will be muted until the date expires, then
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
  const validManualChecks = getValidManualCheckNames();

  if (!validChecks.has(checkName) && !validManualChecks.has(checkName)) {
    console.error(red(`Error: Unknown check "${checkName}".`));
    console.error('Run "project-doctor list" or "project-doctor manual" to see available checks.');
    process.exit(2);
  }

  let muteUntil: Date;
  const now = new Date();

  if (options.until !== undefined) {
    const parsed = parseDate(options.until);
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
    // Default: 2 weeks
    const weeks = options.weeks ?? 2;
    if (!Number.isFinite(weeks) || weeks <= 0) {
      console.error(red("Error: Weeks must be a positive number."));
      process.exit(2);
    }
    muteUntil = addWeeks(now, weeks);
  } else {
    if (!Number.isFinite(options.months) || options.months <= 0) {
      console.error(red("Error: Months must be a positive number."));
      process.exit(2);
    }
    muteUntil = addMonths(now, options.months);
  }

  const severity = createMuteUntil(muteUntil);
  await setCheckSeverity(projectPath, checkName, severity);

  console.log(`Muted check "${checkName}" until ${toDateString(muteUntil)}`);
}

/**
 * Remove mute from a check, making it active immediately.
 *
 * @param projectPath - Absolute path to the project directory
 * @param checkName - Name of the check to unmute
 */
export async function runUnmute(projectPath: string, checkName: string): Promise<void> {
  const validChecks = getValidCheckNames();
  const validManualChecks = getValidManualCheckNames();

  if (!validChecks.has(checkName) && !validManualChecks.has(checkName)) {
    console.error(red(`Error: Unknown check "${checkName}".`));
    console.error('Run "project-doctor list" or "project-doctor manual" to see available checks.');
    process.exit(2);
  }

  // Setting to "error" effectively removes any mute-until configuration
  await setCheckSeverity(projectPath, checkName, "error");
  console.log(`Unmuted check: ${checkName}`);
}
