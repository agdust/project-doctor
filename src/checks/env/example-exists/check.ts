import path from "node:path";
import { TAG } from "../../../types.js";
import { atomicWriteFile } from "../../../utils/safe-fs.js";
import type { Check } from "../../../types.js";
import type { EnvContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "env-example-exists";

export const check: Check<EnvContext> = {
  name,
  description: "Check if .env.example exists when .env is present",
  tags: [TAG.universal, TAG.recommended, TAG.effort.low],
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
      const envExamplePath = path.join(global.projectPath, ".env.example");

      const envContent = (await global.files.readText(".env")) ?? "";

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

      await atomicWriteFile(envExamplePath, exampleContent, "utf8");
      return { success: true, message: "Created .env.example from .env" };
    },
  },
};
