import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-has-env";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if .env files are ignored",
  tags: ["universal", "required", "effort:low"],
  run: async (_global, { raw, gitignore }) => {
    if (!raw || !gitignore) return skip(name, "No .gitignore");
    // Check if .env or .env.local would be ignored
    if (!gitignore.ignoresAny([".env", ".env.local"])) {
      return fail(name, ".env files not ignored");
    }
    return pass(name, ".env files ignored");
  },
  fix: {
    description: "Add .env to .gitignore",
    run: async (global) => {
      const gitignorePath = join(global.projectPath, ".gitignore");
      const content = await readFile(gitignorePath, "utf-8");
      const newContent = content.endsWith("\n") ? content + ".env\n" : content + "\n.env\n";
      await writeFile(gitignorePath, newContent, "utf-8");
      return { success: true, message: "Added .env to .gitignore" };
    },
  },
};
