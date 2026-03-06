/**
 * Severity helpers and config defaults
 *
 * Runtime functions for working with severity values and mute-until dates.
 */

import type { Severity, CheckEntry, CheckOptions, ResolvedConfig } from "./types.js";
import { parseISODate, toDateString } from "../utils/dates.js";

/** Extract the severity from a CheckEntry */
export function extractSeverity(entry: CheckEntry | undefined): Severity | undefined {
  if (entry === undefined) {
    return undefined;
  }
  if (Array.isArray(entry)) {
    return entry[0];
  }
  return entry;
}

/** Extract per-check options from a CheckEntry (undefined if plain severity) */
export function extractCheckOptions(entry: CheckEntry | undefined): CheckOptions | undefined {
  if (Array.isArray(entry)) {
    return entry[1];
  }
  return undefined;
}

/** Check if a severity value is a mute-until pattern */
export function isMuteUntil(value: string): value is `mute-until-${string}` {
  return value.startsWith("mute-until-");
}

/** Parse mute-until date, returns null if invalid or expired */
export function parseMuteUntil(value: string): Date | null {
  if (!isMuteUntil(value)) {
    return null;
  }

  const dateStr = value.slice("mute-until-".length);
  return parseISODate(dateStr);
}

/** Maximum allowed mute duration: 3 years */
const MAX_MUTE_YEARS = 3;

/**
 * Check if mute-until is still active (date not passed)
 * Returns false (treats as "error") if:
 * - Date is invalid
 * - Date is more than 3 years in the future
 * - Date has already passed
 */
export function isMuteUntilActive(value: string): boolean {
  const date = parseMuteUntil(value);
  if (!date) {
    return false;
  }

  const now = new Date();

  // Check if date is too far in the future (more than 3 years)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + MAX_MUTE_YEARS);
  if (date > maxDate) {
    return false;
  }

  return now <= date;
}

/** Create a mute-until value for a given date */
export function createMuteUntil(date: Date): Severity {
  return `mute-until-${toDateString(date)}`;
}

export const DEFAULT_CONFIG: ResolvedConfig = {
  projectType: "js", // Default to js, will be auto-detected if not set
  projectTypeSource: "detected",
  projectTypeDetectedFrom: undefined,
  checks: {},
  tags: {},
  eslintOverwriteConfirmed: false,
  noGitConfirmed: false,
  manualChecks: {},
};
