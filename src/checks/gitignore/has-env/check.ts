import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TAG, type Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-has-env";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if .env files are ignored",
  tags: [TAG.universal, TAG.required, TAG.effort.low],
  run: (_global, { raw, gitignore }) => {
    if (raw === null || gitignore === null) {
      return skip(name, "No .gitignore");
    }
    // Check if .env or .env.local would be ignored
    if (!gitignore.ignoresAny([".env", ".env.local"])) {
      return fail(name, ".env files not ignored");
    }
    return pass(name, ".env files ignored");
  },
  fix: {
    description: "Add .env to .gitignore",
    run: async (global) => {
      const gitignorePath = path.join(global.projectPath, ".gitignore");
      const content = await readFile(gitignorePath, "utf8");
      const newContent = content.endsWith("\n") ? content + ".env\n" : content + "\n.env\n";
      await writeFile(gitignorePath, newContent, "utf8");
      return { success: true, message: "Added .env to .gitignore" };
    },
  },
};
