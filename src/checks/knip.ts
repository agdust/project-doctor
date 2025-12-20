import type { Check, CheckResult } from "../types.ts";

const checkKnipInstalled: Check = {
  name: "knip-installed",
  description: "Check if knip is installed in project",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check package.json devDependencies for knip
    // - Check for knip npm script
    throw new Error("Not implemented");
  },
};

const checkKnipConfig: Check = {
  name: "knip-config",
  description: "Check if knip configuration exists",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for knip.json, knip.ts, or knip key in package.json
    throw new Error("Not implemented");
  },
};

const runKnipAnalysis: Check = {
  name: "knip-analysis",
  description: "Run knip to detect unused dependencies and exports",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Run npx knip --reporter json
    // - Parse results
    // - Report unused dependencies
    // - Report unused exports
    // - Report unused files
    throw new Error("Not implemented");
  },
};

export const checks = [checkKnipInstalled, checkKnipConfig, runKnipAnalysis];
