import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-has-project-doctor-dir";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if .project-doctor/ is ignored",
  tags: ["node", "recommended"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip(name, "No .gitignore");
    const hasIt = patterns.some((p) =>
      [".project-doctor", ".project-doctor/"].includes(p)
    );
    if (!hasIt) return fail(name, ".project-doctor/ not ignored");
    return pass(name, "Project doctor directory ignored");
  },
  fix: {
    description: "Add .project-doctor/ to .gitignore",
    run: async (global) => {
      const gitignorePath = join(global.projectPath, ".gitignore");
      const content = await readFile(gitignorePath, "utf-8");
      const newContent = content.endsWith("\n")
        ? content + ".project-doctor/\n"
        : content + "\n.project-doctor/\n";
      await writeFile(gitignorePath, newContent, "utf-8");
      return { success: true, message: "Added .project-doctor/ to .gitignore" };
    },
  },
};
