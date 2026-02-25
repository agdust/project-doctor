import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Check } from "../../../types.js";
import type { EditorconfigContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "editorconfig-exists";

const DEFAULT_EDITORCONFIG = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
`;

export const check: Check<EditorconfigContext> = {
  name,
  description: "Check if .editorconfig exists",
  tags: ["universal", "recommended", "effort:low"],
  run: (_global, { raw }) => {
    if (raw === null) {
      return fail(name, ".editorconfig not found");
    }
    return pass(name, ".editorconfig exists");
  },
  fix: {
    description: "Create .editorconfig with defaults",
    run: async (global) => {
      const editorconfigPath = path.join(global.projectPath, ".editorconfig");
      await writeFile(editorconfigPath, DEFAULT_EDITORCONFIG, "utf8");
      return { success: true, message: "Created .editorconfig" };
    },
  },
};
