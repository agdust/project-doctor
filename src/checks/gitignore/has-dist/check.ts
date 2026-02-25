import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-has-dist";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if dist/build output is ignored",
  tags: ["node", "recommended", "effort:low"],
  run: (_global, { raw, gitignore }) => {
    if (!raw || !gitignore) return skip(name, "No .gitignore");
    // Check if any common build output directory is ignored
    const buildDirs = ["dist/index.js", "build/index.js", "out/index.js"];
    if (!gitignore.ignoresAny(buildDirs)) {
      return fail(name, "No dist/build ignored");
    }
    return pass(name, "Build output ignored");
  },
  fix: {
    description: "Add dist/ to .gitignore",
    run: async (global) => {
      const gitignorePath = path.join(global.projectPath, ".gitignore");
      const content = await readFile(gitignorePath, "utf8");
      const newContent = content.endsWith("\n") ? content + "dist/\n" : content + "\ndist/\n";
      await writeFile(gitignorePath, newContent, "utf8");
      return { success: true, message: "Added dist/ to .gitignore" };
    },
  },
};
