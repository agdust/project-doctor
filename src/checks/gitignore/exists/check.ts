import path from "node:path";
import { TAG, type Check } from "../../../types.js";
import { atomicWriteFile } from "../../../utils/safe-fs.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "gitignore-exists";

const DEFAULT_GITIGNORE = `node_modules/
dist/
.env
.env.local
.DS_Store
*.log
`;

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if .gitignore exists",
  tags: [TAG.universal, TAG.required, TAG.effort.low],
  run: (_global, { raw }) => {
    if (raw === null) {
      return fail(name, ".gitignore not found");
    }
    return pass(name, ".gitignore exists");
  },
  fix: {
    description: "Create .gitignore with common defaults",
    run: async (global) => {
      const gitignorePath = path.join(global.projectPath, ".gitignore");
      await atomicWriteFile(gitignorePath, DEFAULT_GITIGNORE, "utf8");
      return { success: true, message: "Created .gitignore" };
    },
  },
};
