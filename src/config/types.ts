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

  const date = new Date(dateStr + "T23:59:59");
  if (isNaN(date.getTime())) return null;

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

/** User config (partial, from file) */
export type Config = {
  /** Per-check configuration */
  checks?: Record<string, Severity>;
  /** Per-tag configuration */
  tags?: Record<string, Severity>;
  /** Per-group configuration */
  groups?: Record<string, Severity>;
  /** User confirmed ESLint config overwriting */
  eslintOverwriteConfirmed?: boolean;
};

/** Resolved config (complete, with defaults) */
export type ResolvedConfig = {
  checks: Record<string, Severity>;
  tags: Record<string, Severity>;
  groups: Record<string, Severity>;
  eslintOverwriteConfirmed: boolean;
};

export const DEFAULT_CONFIG: ResolvedConfig = {
  checks: {},
  tags: {},
  groups: {},
  eslintOverwriteConfirmed: false,
};
