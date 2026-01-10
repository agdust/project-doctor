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
 * }
 * ```
 */

/** Severity level: "off" to disable, "error" is default */
export type Severity = "off" | "error";

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
