import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";
import { safeJsonParse } from "../../../utils/safe-json.js";

const name = "readme-exists";

export const check: Check<DocsContext> = {
  name,
  description: "Check if README.md exists",
  tags: ["universal", "required", "effort:low"],
  run: async (_global, { readme }) => {
    if (!readme) return fail(name, "README.md not found");
    return pass(name, "README.md exists");
  },
  fix: {
    description: "Create README.md template",
    run: async (global) => {
      let projectName = "Project";
      try {
        const pkgPath = join(global.projectPath, "package.json");
        const pkgContent = await readFile(pkgPath, "utf-8");
        const pkg = safeJsonParse<{ name?: string }>(pkgContent);
        if (pkg && typeof pkg.name === "string") projectName = pkg.name;
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
      const readmePath = join(global.projectPath, "README.md");
      await writeFile(readmePath, content, "utf-8");
      return { success: true, message: "Created README.md" };
    },
  },
};
