import type { Check, CheckResult } from "../../types.ts";
import type { GitContext } from "./context.ts";

function pass(name: string, message: string): CheckResult {
  return { name, status: "pass", message };
}

function fail(name: string, message: string): CheckResult {
  return { name, status: "fail", message };
}

function skip(name: string, message: string): CheckResult {
  return { name, status: "skip", message };
}

export const repoExists: Check<GitContext> = {
  name: "git-repo-exists",
  description: "Check if project is a git repository",
  tags: ["universal", "required"],
  run: async (_global, { isRepo }) => {
    if (!isRepo) return fail("git-repo-exists", "Not a git repository");
    return pass("git-repo-exists", "Git repository found");
  },
};

export const hooksSetup: Check<GitContext> = {
  name: "git-hooks-installed",
  description: "Check for git hooks setup (husky, lefthook, etc.)",
  tags: ["universal", "recommended"],
  run: async (global, { isRepo }) => {
    if (!isRepo) return skip("git-hooks-installed", "Not a git repo");

    const [hasHusky, hasLefthook, hasSimpleGitHooks] = await Promise.all([
      global.files.exists(".husky"),
      global.files.exists("lefthook.yml"),
      global.files.exists(".simple-git-hooks.json"),
    ]);

    if (hasHusky || hasLefthook || hasSimpleGitHooks) {
      return pass("git-hooks-installed", "Git hooks configured");
    }
    return fail("git-hooks-installed", "No git hooks setup found");
  },
};

export const conventionalCommits: Check<GitContext> = {
  name: "conventional-commits",
  description: "Check if commitlint or conventional commit tooling is configured",
  tags: ["universal", "opinionated"],
  run: async (global, { isRepo }) => {
    if (!isRepo) return skip("conventional-commits", "Not a git repo");

    const [hasCommitlint, hasCommitlintConfig] = await Promise.all([
      global.files.exists("commitlint.config.js"),
      global.files.exists(".commitlintrc.json"),
    ]);

    if (hasCommitlint || hasCommitlintConfig) {
      return pass("conventional-commits", "Commitlint configured");
    }
    return fail("conventional-commits", "No conventional commit tooling");
  },
};

export const checks = [repoExists, hooksSetup, conventionalCommits];
