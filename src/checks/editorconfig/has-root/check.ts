import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { EditorconfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "editorconfig-has-root";

export const check: Check<EditorconfigContext> = {
  name,
  description: "Check if .editorconfig has root = true",
  tags: [TAG.universal, TAG.recommended, TAG.effort.low],
  run: (_global, { raw, hasRoot }) => {
    if (raw === null) {
      return skip(name, "No .editorconfig");
    }
    if (!hasRoot) {
      return fail(name, "Missing root = true");
    }
    return pass(name, "root = true present");
  },
  fix: {
    description: "Add root = true to .editorconfig",
    run: async (global) => {
      const editorconfigPath = path.join(global.projectPath, ".editorconfig");
      const content = await readFile(editorconfigPath, "utf8");
      const newContent = "root = true\n\n" + content;
      await writeFile(editorconfigPath, newContent, "utf8");
      return { success: true, message: "Added root = true" };
    },
  },
};
