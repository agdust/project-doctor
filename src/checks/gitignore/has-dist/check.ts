import path from "node:path";
import { TAG, type Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readFileWithLineEnding, atomicWriteFile } from "../../../utils/safe-fs.js";

const name = "gitignore-has-dist";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if dist/build output is ignored",
  tags: [TAG.node, TAG.recommended, TAG.effort.low],
  run: (_global, { raw, gitignore }) => {
    if (raw === null || gitignore === null) {
      return skip(name, "No .gitignore");
    }
    // Check if any common build output directory is ignored
    const buildDirs = ["dist/index.js", "build/index.js", "out/index.js"];
    if (!gitignore.ignoresAny(buildDirs)) {
      return fail(name, "No dist/build ignored");
    }
    return pass(name, "Build output ignored");
  },
  fix: {
    description: "Add dist/ to .gitignore",
    run: async (global) => {
      const gitignorePath = path.join(global.projectPath, ".gitignore");
      const { content, lineEnding } = await readFileWithLineEnding(gitignorePath);
      const newContent =
        content.endsWith("\n") || content.endsWith("\r\n")
          ? content + `dist/${lineEnding}`
          : content + `${lineEnding}dist/${lineEnding}`;
      await atomicWriteFile(gitignorePath, newContent);
      return { success: true, message: "Added dist/ to .gitignore" };
    },
  },
};
