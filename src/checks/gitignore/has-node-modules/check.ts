import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-has-node-modules";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if node_modules is ignored",
  tags: ["node", "required", "effort:low"],
  run: (_global, { raw, gitignore }) => {
    if (raw === null || gitignore === null) {
      return skip(name, "No .gitignore");
    }
    if (!gitignore.ignores("node_modules/package.json")) {
      return fail(name, "node_modules not ignored");
    }
    return pass(name, "node_modules ignored");
  },
  fix: {
    description: "Add node_modules/ to .gitignore",
    run: async (global) => {
      const gitignorePath = path.join(global.projectPath, ".gitignore");
      const content = await readFile(gitignorePath, "utf8");
      const newContent = content.endsWith("\n")
        ? content + "node_modules/\n"
        : content + "\nnode_modules/\n";
      await writeFile(gitignorePath, newContent, "utf8");
      return { success: true, message: "Added node_modules/ to .gitignore" };
    },
  },
};
