import type { Check, CheckResult } from "../types.ts";

const checkNvmrcExists: Check = {
  name: "nvmrc-exists",
  description: "Check if .nvmrc file exists in project root",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check if .nvmrc exists
    // - Validate node version format
    // - Optionally compare with package.json engines
    throw new Error("Not implemented");
  },
};

export const checks = [checkNvmrcExists];
