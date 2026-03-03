import path from "node:path";
import { TAG, type Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readFileWithLineEnding, atomicWriteFile } from "../../../utils/safe-fs.js";

const name = "gitignore-has-node-modules";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if node_modules is ignored",
  tags: [TAG.node, TAG.required, TAG.effort.low],
  run: (_global, { raw, gitignore }) => {
    if (raw === null || gitignore === null) {
      return skip(name, "No .gitignore");
    }
    if (!gitignore.ignores("node_modules/package.json")) {
      return fail(name, "node_modules not ignored");
    }
    return pass(name, "node_modules ignored");
  },
  fix: {
    description: "Add node_modules/ to .gitignore",
    run: async (global) => {
      const gitignorePath = path.join(global.projectPath, ".gitignore");
      const { content, lineEnding } = await readFileWithLineEnding(gitignorePath);
      const newContent =
        content.endsWith("\n") || content.endsWith("\r\n")
          ? content + `node_modules/${lineEnding}`
          : content + `${lineEnding}node_modules/${lineEnding}`;
      await atomicWriteFile(gitignorePath, newContent);
      return { success: true, message: "Added node_modules/ to .gitignore" };
    },
  },
};
