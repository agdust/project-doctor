import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-has-project-doctor-dir";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if .project-doctor/cache/ is ignored",
  tags: ["node", "recommended", "effort:low"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip(name, "No .gitignore");
    const hasIt = patterns.some((p) =>
      [".project-doctor/cache", ".project-doctor/cache/"].includes(p),
    );
    if (!hasIt) return fail(name, ".project-doctor/cache/ not ignored");
    return pass(name, "Project doctor cache directory ignored");
  },
  fix: {
    description: "Add .project-doctor/cache/ to .gitignore",
    run: async (global) => {
      const gitignorePath = join(global.projectPath, ".gitignore");
      const content = await readFile(gitignorePath, "utf-8");
      const newContent = content.endsWith("\n")
        ? content + ".project-doctor/cache/\n"
        : content + "\n.project-doctor/cache/\n";
      await writeFile(gitignorePath, newContent, "utf-8");
      return { success: true, message: "Added .project-doctor/cache/ to .gitignore" };
    },
  },
};
