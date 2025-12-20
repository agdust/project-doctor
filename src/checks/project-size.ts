import type { Check, CheckResult } from "../types.ts";

const checkTotalProjectSize: Check = {
  name: "project-size-total",
  description: "Check total project size excluding node_modules",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Calculate total size of project files
    // - Exclude node_modules, .git, dist, build
    // - Warn if project exceeds threshold (e.g., 50MB)
    throw new Error("Not implemented");
  },
};

const checkLargeFiles: Check = {
  name: "project-size-large-files",
  description: "Detect unusually large files in source",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Scan source directories
    // - Flag files over threshold (e.g., 500KB)
    // - Report binary files that shouldn't be in source
    throw new Error("Not implemented");
  },
};

const checkNodeModulesSize: Check = {
  name: "project-size-node-modules",
  description: "Check node_modules size for bloat",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Calculate node_modules size
    // - Compare to project size ratio
    // - Suggest running npm dedupe if excessive
    throw new Error("Not implemented");
  },
};

const checkBundleSize: Check = {
  name: "project-size-bundle",
  description: "Check built bundle sizes",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Look for dist/build folders
    // - Analyze JS/CSS bundle sizes
    // - Warn about large bundles
    throw new Error("Not implemented");
  },
};

export const checks = [
  checkTotalProjectSize,
  checkLargeFiles,
  checkNodeModulesSize,
  checkBundleSize,
];
