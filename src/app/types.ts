/**
 * App Context Types
 *
 * Shared state across all screens in the project-doctor app.
 */

import type { CheckResult, CheckTag, FixResult, GlobalContext } from "../types.js";

/** A check that has an available fix */
export type FixableIssue = {
  name: string;
  group: string;
  tags: CheckTag[];
  result: CheckResult;
  fixDescription: string;
  why: string | null;
  runFix: () => Promise<FixResult>;
};

/** Summary stats for display */
export type HealthStats = {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
};

/** Failed checks count by category */
export type FailedByCategory = {
  required: number;
  recommended: number;
  opinionated: number;
};

/** App context - shared mutable state */
export type AppContext = {
  /** Project path being checked */
  projectPath: string;

  /** Project name (from package.json or folder name) */
  projectName: string;

  /** Global context with file cache */
  global: GlobalContext;

  /** All check results */
  allResults: CheckResult[];

  /** Failed checks count by category (all, not just fixable) */
  failedByCategory: FailedByCategory;

  /** Fixable issues (sorted by priority) */
  issues: FixableIssue[];

  /** Current issue index (for detail screen) */
  currentIssueIndex: number;

  /** Session stats */
  stats: {
    fixed: number;
    skipped: number;
    muted: number;
    disabled: number;
  };

  /** Whether initial scan is complete */
  scanned: boolean;
};
