import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Check } from "../../../types.js";
import type { EnvContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "env-example-exists";

export const check: Check<EnvContext> = {
  name,
  description: "Create .env.example when .env exists (documents required variables)",
  tags: ["universal", "recommended", "effort:low"],
  run: (_global, ctx) => {
    // Only relevant if .env exists
    if (!ctx.envExists) {
      return skip(name, "No .env file");
    }
    if (ctx.exampleExists) {
      return pass(name, ".env.example exists");
    }
    return fail(name, ".env exists but .env.example is missing");
  },
  fix: {
    description: "Create .env.example from .env (with values removed)",
    run: async (global) => {
      const envPath = path.join(global.projectPath, ".env");
      const envExamplePath = path.join(global.projectPath, ".env.example");

      const envContent = await readFile(envPath, "utf8");

      // Convert .env to .env.example by removing values
      const exampleContent = envContent
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) {
            return line;
          }
          const eqIndex = line.indexOf("=");
          if (eqIndex === -1) {
            return line;
          }
          return line.slice(0, eqIndex + 1);
        })
        .join("\n");

      await writeFile(envExamplePath, exampleContent, "utf8");
      return { success: true, message: "Created .env.example from .env" };
    },
  },
};
