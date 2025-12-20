import type { Check, CheckResult } from "../types.ts";

const checkGitignoreExists: Check = {
  name: "gitignore-exists",
  description: "Check if .gitignore file exists",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check if .gitignore exists in project root
    throw new Error("Not implemented");
  },
};

const checkGitignoreContent: Check = {
  name: "gitignore-content",
  description: "Validate .gitignore contains essential patterns",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Read .gitignore content
    // - Check for essential patterns: node_modules, dist, .env, etc.
    // - Detect project type and check for type-specific patterns
    // - Report missing recommended patterns
    throw new Error("Not implemented");
  },
};

const checkGitignoreDuplicates: Check = {
  name: "gitignore-duplicates",
  description: "Check for duplicate patterns in .gitignore",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Parse .gitignore patterns
    // - Detect exact duplicates
    // - Detect patterns that are subsets of other patterns
    throw new Error("Not implemented");
  },
};

export const checks = [
  checkGitignoreExists,
  checkGitignoreContent,
  checkGitignoreDuplicates,
];
