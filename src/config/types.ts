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
 *   // Group names also work as tags:
 *   tags: { "eslint": "off" },
 *   // Temporarily mute until a date (reverts to "error" after)
 *   checks: { "some-check": "mute-until-2025-06-01" },
 * }
 * ```
 */

import type { ManualCheckState } from "../types.js";

/**
 * Manual check config entry: a state ("done"/"not-done") or a severity override ("off"/"mute-until-*").
 * When a manual check is disabled or muted, the severity replaces the state in config.
 */
export type ManualCheckEntry = ManualCheckState | Severity;

/**
 * Severity level:
 * - "off" - permanently disabled
 * - "error" - enabled (default)
 * - "mute-until-YYYY-MM-DD" - muted until date, then becomes "error"
 */
export type Severity = "off" | "error" | `mute-until-${string}`;

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
  /** Per-tag configuration (group names also work as tags) */
  tags?: Record<string, Severity>;
  /** User confirmed ESLint config overwriting */
  eslintOverwriteConfirmed?: boolean;
  /** User confirmed running without git protection */
  noGitConfirmed?: boolean;
  /** Manual check entries (state or severity override) */
  manualChecks?: Record<string, ManualCheckEntry>;
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
  eslintOverwriteConfirmed: boolean;
  noGitConfirmed: boolean;
  manualChecks: Record<string, ManualCheckEntry>;
}
