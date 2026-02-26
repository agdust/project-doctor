import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TAG } from "../../../types.js";
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
  tags: [TAG.universal, TAG.recommended, TAG.effort.low],
  run: (_global, { raw, hasIndent }) => {
    if (raw === null) {
      return skip(name, "No .editorconfig");
    }
    if (!hasIndent) {
      return fail(name, "No indent settings");
    }
    return pass(name, "Indent settings present");
  },
  fix: {
    description: "Add indent settings to .editorconfig",
    run: async (global) => {
      const editorconfigPath = path.join(global.projectPath, ".editorconfig");
      const content = await readFile(editorconfigPath, "utf8");
      const newContent = content.trimEnd() + "\n" + INDENT_SETTINGS;
      await writeFile(editorconfigPath, newContent, "utf8");
      return { success: true, message: "Added indent settings" };
    },
  },
};
