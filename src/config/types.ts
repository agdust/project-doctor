/**
 * Configuration Types
 *
 * ESLint-style configuration for project-doctor.
 *
 * @example
 * ```json5
 * {
 *   checks: { "changelog-exists": "off" },
 *   tags: { "opinionated": "off" },
 *   groups: { "eslint": "off" },
 *   // Temporarily skip until a date (reverts to "error" after)
 *   checks: { "some-check": "skip-until-2025-06-01" },
 * }
 * ```
 */

import type { ManualCheckState } from "../types.js";

/**
 * Severity level:
 * - "off" - permanently disabled
 * - "error" - enabled (default)
 * - "skip-until-YYYY-MM-DD" - skipped until date, then becomes "error"
 */
export type Severity = "off" | "error" | `skip-until-${string}`;

/** Check if a severity value is a skip-until pattern */
export function isSkipUntil(value: string): value is `skip-until-${string}` {
  return value.startsWith("skip-until-");
}

/** Parse skip-until date, returns null if invalid or expired */
export function parseSkipUntil(value: string): Date | null {
  if (!isSkipUntil(value)) return null;

  const dateStr = value.slice("skip-until-".length);
  // Validate ISO date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  // Parse and validate the date components
  const [year, month, day] = dateStr.split("-").map(Number);
  // Use UTC to ensure consistent behavior across timezones
  // End of day in UTC (23:59:59.999)
  const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  // Check if the date is valid (e.g., reject "2025-02-30")
  if (
    isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Maximum allowed skip duration: 3 years */
const MAX_SKIP_YEARS = 3;

/**
 * Check if skip-until is still active (date not passed)
 * Returns false (treats as "error") if:
 * - Date is invalid
 * - Date is more than 3 years in the future
 * - Date has already passed
 */
export function isSkipUntilActive(value: string): boolean {
  const date = parseSkipUntil(value);
  if (!date) return false;

  const now = new Date();

  // Check if date is too far in the future (more than 3 years)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + MAX_SKIP_YEARS);
  if (date > maxDate) return false;

  return now <= date;
}

/** Create a skip-until value for a given date */
export function createSkipUntil(date: Date): Severity {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `skip-until-${year}-${month}-${day}`;
}

/** Project type - determines which check groups are enabled */
export type ProjectType = "js" | "generic";

/** User config (partial, from file) */
export interface Config {
  /** Project type - "js" for JavaScript/Node projects, "generic" for non-JS projects */
  projectType?: ProjectType;
  /** Per-check configuration */
  checks?: Record<string, Severity>;
  /** Per-tag configuration */
  tags?: Record<string, Severity>;
  /** Per-group configuration */
  groups?: Record<string, Severity>;
  /** User confirmed ESLint config overwriting */
  eslintOverwriteConfirmed?: boolean;
  /** User confirmed running without git protection */
  noGitConfirmed?: boolean;
  /** Manual check states (done/not-done) */
  manualChecks?: Record<string, ManualCheckState>;
}

/** How project type was determined */
export type ProjectTypeSource = "config" | "detected";

/** Resolved config (complete, with defaults) */
export interface ResolvedConfig {
  /** Project type - determines which check groups are enabled */
  projectType: ProjectType;
  /** How the project type was determined */
  projectTypeSource: ProjectTypeSource;
  /** If detected, which file triggered detection (or "fallback") */
  projectTypeDetectedFrom?: string;
  checks: Record<string, Severity>;
  tags: Record<string, Severity>;
  groups: Record<string, Severity>;
  eslintOverwriteConfirmed: boolean;
  noGitConfirmed: boolean;
  manualChecks: Record<string, ManualCheckState>;
}

export const DEFAULT_CONFIG: ResolvedConfig = {
  projectType: "js", // Default to js, will be auto-detected if not set
  projectTypeSource: "detected",
  projectTypeDetectedFrom: undefined,
  checks: {},
  tags: {},
  groups: {},
  eslintOverwriteConfirmed: false,
  noGitConfirmed: false,
  manualChecks: {},
};
