import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";
import { safeJsonParse } from "../../../utils/safe-json.js";

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
      try {
        const pkgPath = path.join(global.projectPath, "package.json");
        const pkgContent = await readFile(pkgPath, "utf8");
        const pkg = safeJsonParse<{ name?: string }>(pkgContent);
        if (pkg && typeof pkg.name === "string") {
          projectName = pkg.name;
        }
      } catch {
        // package.json doesn't exist, use default name
      }
      const content = `# ${projectName}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

`;
      const readmePath = path.join(global.projectPath, "README.md");
      await writeFile(readmePath, content, "utf8");
      return { success: true, message: "Created README.md" };
    },
  },
};
