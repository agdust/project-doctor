import type { Check, CheckResult } from "../types.ts";

const checkPrettierConfig: Check = {
  name: "prettier-config",
  description: "Check if Prettier configuration exists",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for .prettierrc, .prettierrc.json, .prettierrc.js, prettier.config.js
    // - Check for prettier key in package.json
    // - Validate config format
    throw new Error("Not implemented");
  },
};

const checkPrettierIgnore: Check = {
  name: "prettier-ignore",
  description: "Check if .prettierignore exists",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for .prettierignore
    // - Warn if missing but project has build artifacts
    throw new Error("Not implemented");
  },
};

const checkPrettierInstalled: Check = {
  name: "prettier-installed",
  description: "Check if Prettier is installed as dev dependency",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check package.json devDependencies for prettier
    // - Optionally check if npm script exists
    throw new Error("Not implemented");
  },
};

export const checks = [
  checkPrettierConfig,
  checkPrettierIgnore,
  checkPrettierInstalled,
];
