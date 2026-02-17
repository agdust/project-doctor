import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import { type GitignoreContext, matchesPattern } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-no-secrets-committed";

const SECRET_FILES = [".env", ".env.local", "credentials.json", "secrets.json", ".npmrc"];

export const check: Check<GitignoreContext> = {
  name,
  description: "Check that common secret files are ignored",
  tags: ["universal", "required", "effort:medium"],
  run: async (global, { raw, patterns }) => {
    if (!raw) return skip(name, "No .gitignore");

    const notIgnored: string[] = [];

    for (const file of SECRET_FILES) {
      const exists = await global.files.exists(file);
      if (exists) {
        const isIgnored = patterns.some((p) => matchesPattern(p, file));
        if (!isIgnored) {
          notIgnored.push(file);
        }
      }
    }

    if (notIgnored.length > 0) {
      return fail(name, `Secret files not ignored: ${notIgnored.join(", ")}`);
    }
    return pass(name, "Secret files properly ignored");
  },
  fix: {
    description: "Add secret files to .gitignore",
    run: async (global, { patterns }) => {
      const gitignorePath = join(global.projectPath, ".gitignore");
      const content = await readFile(gitignorePath, "utf-8");

      // Find which secret files exist but aren't ignored
      const toAdd: string[] = [];
      for (const file of SECRET_FILES) {
        const exists = await global.files.exists(file);
        if (exists) {
          const isIgnored = patterns.some((p) => matchesPattern(p, file));
          if (!isIgnored) {
            toAdd.push(file);
          }
        }
      }

      if (toAdd.length === 0) {
        return { success: true, message: "No secret files to add" };
      }

      // Append to .gitignore with a comment
      const addition = `\n# Secret files\n${toAdd.join("\n")}\n`;
      const newContent = content.endsWith("\n") ? content + addition : content + "\n" + addition;
      await writeFile(gitignorePath, newContent, "utf-8");

      return { success: true, message: `Added: ${toAdd.join(", ")}` };
    },
  },
};
