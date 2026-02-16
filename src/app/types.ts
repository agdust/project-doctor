/**
 * App Context Types
 *
 * Shared state across all screens in the project-doctor app.
 */

import type { CheckResult, CheckTag, FixResult, GlobalContext } from "../types.js";

/** An option for fixing an issue */
export interface FixOptionRunnable {
  id: string;
  label: string;
  description?: string;
  runFix: () => Promise<FixResult>;
}

/** A check that has an available fix */
export interface FixableIssue {
  name: string;
  group: string;
  tags: CheckTag[];
  result: CheckResult;
  fixDescription: string;
  why: string | null;
  /** For simple fixes - single action */
  runFix?: () => Promise<FixResult>;
  /** For fixes with options - multiple choices */
  fixOptions?: FixOptionRunnable[];
}

/** Summary stats for display */
export interface HealthStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

/** A failed check (may or may not have auto-fix) */
export interface FailedCheck {
  name: string;
  group: string;
  tags: CheckTag[];
  message: string;
  why: string | null;
  fixDescription: string | null;
  /** For simple fixes - single action */
  runFix?: () => Promise<FixResult>;
  /** For fixes with options - multiple choices */
  fixOptions?: FixOptionRunnable[];
}

/** Failed checks count by category */
export interface FailedByCategory {
  required: number;
  recommended: number;
  opinionated: number;
}

/** App context - shared mutable state */
export interface AppContext {
  /** Project path being checked */
  projectPath: string;

  /** Project name (from package.json or folder name) */
  projectName: string;

  /** Global context with file cache */
  global: GlobalContext;

  /** All check results */
  allResults: CheckResult[];

  /** All failed checks (fixable and non-fixable) */
  failedChecks: FailedCheck[];

  /** Failed checks count by category */
  failedByCategory: FailedByCategory;

  /** Fixable issues only (sorted by priority) */
  issues: FixableIssue[];

  /** Current issue index (for detail screen) */
  currentIssueIndex: number;

  /** Selected check index in overview (for overview-detail screen) */
  selectedOverviewIndex: number;

  /** Session stats */
  stats: {
    fixed: number;
    skipped: number;
    muted: number;
    disabled: number;
  };

  /** Whether initial scan is complete */
  scanned: boolean;
}
