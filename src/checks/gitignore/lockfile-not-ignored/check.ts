import path from "node:path";
import { TAG, type Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { atomicWriteFile, detectLineEnding } from "../../../utils/safe-fs.js";

const name = "gitignore-lockfile-not-ignored";

const LOCKFILE_PATTERNS = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "*.lock",
  "*-lock.json",
  "*lock*",
];

export const check: Check<GitignoreContext> = {
  name,
  description: "Check that lockfiles are not ignored by git",
  tags: [TAG.node, TAG.required, TAG.effort.low, TAG.security],
  run: (_global, { raw, patterns }) => {
    if (raw === null) {
      return skip(name, "No .gitignore");
    }

    const ignoredLockfiles = patterns.filter((p) =>
      LOCKFILE_PATTERNS.some((lock) => p === lock || p === `/${lock}`),
    );

    if (ignoredLockfiles.length > 0) {
      return fail(name, `Lockfiles ignored: ${ignoredLockfiles.join(", ")}`);
    }

    return pass(name, "Lockfiles are not ignored");
  },
  fix: {
    description: "Remove lockfile patterns from .gitignore",
    run: async (global, { raw }) => {
      if (raw === null) {
        return { success: false, message: "No .gitignore found" };
      }

      const gitignorePath = path.join(global.projectPath, ".gitignore");
      const lineEnding = detectLineEnding(raw);
      const lines = raw.split(/\r?\n/);

      const filteredLines = lines.filter((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          return true;
        }
        return !LOCKFILE_PATTERNS.some((lock) => trimmed === lock || trimmed === `/${lock}`);
      });

      await atomicWriteFile(gitignorePath, filteredLines.join(lineEnding));
      return { success: true, message: "Removed lockfile patterns from .gitignore" };
    },
  },
};
