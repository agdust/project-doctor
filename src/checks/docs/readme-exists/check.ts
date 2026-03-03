import path from "node:path";
import { TAG } from "../../../types.js";
import { atomicWriteFile } from "../../../utils/safe-fs.js";
import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "readme-exists";

export const check: Check<DocsContext> = {
  name,
  description: "Check if README.md exists",
  tags: [TAG.universal, TAG.required, TAG.effort.low],
  run: (_global, { readme }) => {
    if (readme === null) {
      return fail(name, "README.md not found");
    }
    return pass(name, "README.md exists");
  },
  fix: {
    description: "Create README.md template",
    run: async (global) => {
      let projectName = "Project";
      const pkg = await global.files.readJson<{ name?: string }>("package.json");
      if (pkg && typeof pkg.name === "string") {
        projectName = pkg.name;
      }
      const content = `# ${projectName}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

`;
      const readmePath = path.join(global.projectPath, "README.md");
      await atomicWriteFile(readmePath, content, "utf8");
      return { success: true, message: "Created README.md" };
    },
  },
};
