import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-has-dist";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if dist/build output is ignored",
  tags: ["node", "recommended"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip(name, "No .gitignore");
    const hasIt = patterns.some((p) =>
      ["dist", "dist/", "build", "build/", "out", "out/"].includes(p)
    );
    if (!hasIt) return fail(name, "No dist/build ignored");
    return pass(name, "Build output ignored");
  },
  fix: {
    description: "Add dist/ to .gitignore",
    run: async (global) => {
      const gitignorePath = join(global.projectPath, ".gitignore");
      const content = await readFile(gitignorePath, "utf-8");
      const newContent = content.endsWith("\n") ? content + "dist/\n" : content + "\ndist/\n";
      await writeFile(gitignorePath, newContent, "utf-8");
      return { success: true, message: "Added dist/ to .gitignore" };
    },
  },
};
