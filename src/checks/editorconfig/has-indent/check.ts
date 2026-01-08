import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { EditorconfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "editorconfig-has-indent";

const INDENT_SETTINGS = `
[*]
indent_style = space
indent_size = 2
`;

export const check: Check<EditorconfigContext> = {
  name,
  description: "Check if .editorconfig has indent settings",
  tags: ["universal", "recommended", "effort:low"],
  run: async (_global, { raw, hasIndent }) => {
    if (!raw) return skip(name, "No .editorconfig");
    if (!hasIndent) return fail(name, "No indent settings");
    return pass(name, "Indent settings present");
  },
  fix: {
    description: "Add indent settings to .editorconfig",
    run: async (global) => {
      const editorconfigPath = join(global.projectPath, ".editorconfig");
      const content = await readFile(editorconfigPath, "utf-8");
      const newContent = content.trimEnd() + "\n" + INDENT_SETTINGS;
      await writeFile(editorconfigPath, newContent, "utf-8");
      return { success: true, message: "Added indent settings" };
    },
  },
};
