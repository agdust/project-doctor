/**
 * App Context Types
 *
 * Shared state across all screens in the project-doctor app.
 */

import type {
  CheckResult,
  CheckTag,
  FixResult,
  GlobalContext,
  ManualCheck,
  ManualCheckState,
} from "../types.js";
import type { SnapshotEntry } from "../utils/snapshot.js";
import type { BoundFixOption } from "../utils/check-loader.js";

/** An option for fixing an issue */
export type FixOptionRunnable = BoundFixOption;

/** A check that has an available fix */
export interface FixableIssue {
  name: string;
  description: string;
  group: string;
  tags: CheckTag[];
  result: CheckResult;
  fixDescription: string;
  why: string | null;
  sourceUrl: string | null;
  toolUrl: string | null;
  /** For simple fixes - single action */
  runFix?: () => Promise<FixResult> | FixResult;
  /** For fixes with options - multiple choices */
  fixOptions?: FixOptionRunnable[];
}

/** A failed check (may or may not have auto-fix) */
export interface FailedCheck {
  name: string;
  description: string;
  group: string;
  tags: CheckTag[];
  message: string;
  why: string | null;
  sourceUrl: string | null;
  toolUrl: string | null;
  fixDescription: string | null;
  /** For simple fixes - single action */
  runFix?: () => Promise<FixResult> | FixResult;
  /** For fixes with options - multiple choices */
  fixOptions?: FixOptionRunnable[];
}

/** Display state for manual checks (accounts for config severity) */
export type ManualCheckDisplayState = "done" | "not-done" | "muted" | "disabled";

/** A manual check with its current state */
export interface ManualCheckItem {
  check: ManualCheck;
  state: ManualCheckState;
  displayState: ManualCheckDisplayState;
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

  /** Manual check items with their states */
  manualCheckItems: ManualCheckItem[];

  /** Selected manual check index (for checklist screen) */
  selectedManualCheckIndex: number;

  /** Selected tag (for tag detail screen) */
  selectedTag: string;

  /** Session stats */
  stats: {
    fixed: number;
    skipped: number;
    muted: number;
    disabled: number;
  };

  /** Whether initial scan is complete */
  scanned: boolean;

  /** History entries (loaded on demand for history screen) */
  historyEntries: SnapshotEntry[];
}
