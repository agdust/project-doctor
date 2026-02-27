/**
 * project-doctor - Project health checks, setup and migration helpers
 *
 * This module exports the public API for programmatic use.
 * For CLI usage, run `npx project-doctor` or install globally.
 */

// Public API — barrel re-exports are intentional here
/* eslint-disable no-barrel-files/no-barrel-files */

// Core types
export type {
  Check,
  CheckGroup,
  CheckResult,
  CheckResultBase,
  CheckStatus,
  CheckTag,
  CheckScope,
  CheckRequirement,
  CheckEffort,
  CheckTool,
  Fix,
  FixResult,
  FixOption,
  SimpleFix,
  FixWithOptions,
  GlobalContext,
  FileCache,
  DetectedTools,
  GroupContextLoader,
} from "./types.js";

// Registry - access to all checks
export { listChecks, listGroups, checkGroups, getAllChecks, getChecksByGroup } from "./registry.js";

// Runner - execute checks programmatically
export { runChecks, runAllChecks, type RunnerOptions, type RunnerResult } from "./utils/runner.js";

// Context creation
export { createGlobalContext } from "./context/global.js";

// Configuration
export type { Config, ResolvedConfig, Severity, ProjectType } from "./config/types.js";
export { loadConfig, loadAndResolveConfig, updateConfig } from "./config/loader.js";
