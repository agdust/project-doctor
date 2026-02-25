import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { Check } from "../../../types.js";
import type { PrettierContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "prettier-ignore-exists";

const DEFAULT_PRETTIERIGNORE = `dist/
build/
node_modules/
*.min.js
`;

export const check: Check<PrettierContext> = {
  name,
  description: "Check if .prettierignore exists",
  tags: ["node", "recommended", "tool:prettier", "effort:low"],
  run: (global, { hasIgnore }) => {
    if (!global.detected.hasPrettier) {
      return skip(name, "Prettier not detected");
    }
    if (!hasIgnore) {
      return fail(name, "No .prettierignore file");
    }
    return pass(name, ".prettierignore exists");
  },
  fix: {
    description: "Create .prettierignore with defaults",
    run: async (global) => {
      const prettierignorePath = path.join(global.projectPath, ".prettierignore");
      await writeFile(prettierignorePath, DEFAULT_PRETTIERIGNORE, "utf8");
      return { success: true, message: "Created .prettierignore" };
    },
  },
};
