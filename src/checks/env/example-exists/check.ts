import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Check } from "../../../types.js";
import type { EnvContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "env-example-exists";

const DEFAULT_ENV_EXAMPLE = `# Environment variables
# Copy this file to .env and fill in the values

# NODE_ENV=development
`;

export const check: Check<EnvContext> = {
  name,
  description: "Check if .env.example exists",
  tags: ["universal", "recommended"],
  run: async (_global, { exampleRaw }) => {
    if (!exampleRaw) return fail(name, ".env.example not found");
    return pass(name, ".env.example exists");
  },
  fix: {
    description: "Create .env.example template",
    run: async (global) => {
      const envExamplePath = join(global.projectPath, ".env.example");
      await writeFile(envExamplePath, DEFAULT_ENV_EXAMPLE, "utf-8");
      return { success: true, message: "Created .env.example" };
    },
  },
};
