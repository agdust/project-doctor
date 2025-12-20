import type { Check, CheckResult } from "../types.ts";

const checkTsconfigExists: Check = {
  name: "tsconfig-exists",
  description: "Check if tsconfig.json exists",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for tsconfig.json
    // - Check for tsconfig.build.json or other configs
    throw new Error("Not implemented");
  },
};

const checkTsconfigStrict: Check = {
  name: "tsconfig-strict",
  description: "Check if TypeScript strict mode is enabled",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Parse tsconfig.json
    // - Check for strict: true
    // - Check individual strict options if strict is false
    throw new Error("Not implemented");
  },
};

const checkTypeErrors: Check = {
  name: "typescript-errors",
  description: "Run TypeScript compiler to check for type errors",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Run tsc --noEmit
    // - Parse and report errors
    throw new Error("Not implemented");
  },
};

export const checks = [
  checkTsconfigExists,
  checkTsconfigStrict,
  checkTypeErrors,
];
