import type { Check, CheckResult } from "../types.ts";

const checkPackageJsonExists: Check = {
  name: "package-json-exists",
  description: "Check if package.json exists",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    throw new Error("Not implemented");
  },
};

const checkPackageJsonFields: Check = {
  name: "package-json-fields",
  description: "Check for recommended package.json fields",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for name, version, description
    // - Check for license
    // - Check for engines field
    // - Check for type: "module" for ESM projects
    throw new Error("Not implemented");
  },
};

const checkPackageJsonScripts: Check = {
  name: "package-json-scripts",
  description: "Check for common npm scripts",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for build, dev, test, lint scripts
    // - Warn about missing common scripts
    throw new Error("Not implemented");
  },
};

const checkDependencyVersions: Check = {
  name: "package-json-deps",
  description: "Check for outdated or problematic dependencies",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Run npm outdated --json
    // - Report major version updates available
    // - Check for known vulnerable packages
    throw new Error("Not implemented");
  },
};

const checkLockfileSync: Check = {
  name: "package-json-lockfile",
  description: "Check if lockfile is in sync with package.json",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Detect lockfile type (package-lock.json, yarn.lock, pnpm-lock.yaml)
    // - Run appropriate sync check command
    throw new Error("Not implemented");
  },
};

export const checks = [
  checkPackageJsonExists,
  checkPackageJsonFields,
  checkPackageJsonScripts,
  checkDependencyVersions,
  checkLockfileSync,
];
