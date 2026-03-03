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

/** Per-check options (e.g. exceptions list) */
export type CheckOptions = Record<string, unknown>;

/** A check config entry: plain severity or [severity, options] tuple */
export type CheckEntry = Severity | [Severity, CheckOptions];

/** Project type - determines which check groups are enabled */
export type ProjectType = "js" | "generic";

/** User config (partial, from file) */
export interface Config {
  /** Project type - "js" for JavaScript/Node projects, "generic" for non-JS projects */
  projectType?: ProjectType;
  /** Per-check configuration (severity or [severity, options] tuple) */
  checks?: Record<string, CheckEntry>;
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
  checks: Record<string, CheckEntry>;
  tags: Record<string, Severity>;
  groups: Record<string, Severity>;
  eslintOverwriteConfirmed: boolean;
  noGitConfirmed: boolean;
  manualChecks: Record<string, ManualCheckState>;
}
