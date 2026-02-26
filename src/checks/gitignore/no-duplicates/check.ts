import path from "node:path";
import { TAG, type Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readFileWithLineEnding, atomicWriteFile } from "../../../utils/safe-fs.js";

const name = "gitignore-no-duplicates";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check for duplicate patterns in .gitignore",
  tags: [TAG.universal, TAG.recommended, TAG.effort.low],
  run: (_global, { raw, patterns }) => {
    if (raw === null) {
      return skip(name, "No .gitignore");
    }
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const p of patterns) {
      if (seen.has(p)) {
        duplicates.push(p);
      }
      seen.add(p);
    }
    if (duplicates.length > 0) {
      return fail(name, `Duplicates: ${duplicates.join(", ")}`);
    }
    return pass(name, "No duplicates");
  },
  fix: {
    description: "Remove duplicate patterns",
    run: async (global) => {
      const gitignorePath = path.join(global.projectPath, ".gitignore");
      const { content, lineEnding } = await readFileWithLineEnding(gitignorePath);
      // Split by any line ending, preserving original style for output
      const lines = content.split(/\r?\n/);
      const seenPatterns = new Set<string>();
      const deduped: string[] = [];
      let removedCount = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        // Keep comments and empty lines as-is
        if (!trimmed || trimmed.startsWith("#")) {
          deduped.push(line);
          continue;
        }
        // Only keep first occurrence of each pattern
        if (seenPatterns.has(trimmed)) {
          removedCount++;
        } else {
          seenPatterns.add(trimmed);
          deduped.push(line);
        }
      }

      await atomicWriteFile(gitignorePath, deduped.join(lineEnding));
      return { success: true, message: `Removed ${removedCount} duplicate(s)` };
    },
  },
};
