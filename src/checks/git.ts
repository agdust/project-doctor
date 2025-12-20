import type { Check, CheckResult } from "../types.ts";

const checkGitRepo: Check = {
  name: "git-repo",
  description: "Check if project is a git repository",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for .git directory
    throw new Error("Not implemented");
  },
};

const checkGitHooks: Check = {
  name: "git-hooks",
  description: "Check for git hooks setup (husky, lefthook, etc.)",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Check for .husky directory
    // - Check for lefthook.yml
    // - Check for simple-git-hooks in package.json
    throw new Error("Not implemented");
  },
};

const checkUncommittedChanges: Check = {
  name: "git-uncommitted",
  description: "Check for uncommitted changes",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Run git status --porcelain
    // - Report modified, staged, untracked files
    throw new Error("Not implemented");
  },
};

const checkBranchStatus: Check = {
  name: "git-branch-status",
  description: "Check if branch is up to date with remote",
  run: async (_projectPath): Promise<CheckResult> => {
    // TODO: Implement
    // - Run git fetch
    // - Check ahead/behind counts
    throw new Error("Not implemented");
  },
};

export const checks = [
  checkGitRepo,
  checkGitHooks,
  checkUncommittedChanges,
  checkBranchStatus,
];
