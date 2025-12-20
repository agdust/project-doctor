import type { Check, CheckResult } from "../types.ts";

const checkEslintConfig: Check = {
  name: "eslint-config",
  description: "Check if ESLint configuration exists",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for eslint.config.js (flat config)
    // - Check for legacy .eslintrc.* files
    // - Suggest migration to flat config if using legacy
    throw new Error("Not implemented");
  },
};

const checkEslintIgnore: Check = {
  name: "eslint-ignore",
  description: "Check if .eslintignore exists or ignores in config",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for .eslintignore
    // - Check for ignores in flat config
    throw new Error("Not implemented");
  },
};

const runEslintAnalysis: Check = {
  name: "eslint-analysis",
  description: "Run ESLint and report issues",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Run eslint with --format json
    // - Parse and summarize results
    // - Report error and warning counts
    throw new Error("Not implemented");
  },
};

export const checks = [checkEslintConfig, checkEslintIgnore, runEslintAnalysis];
