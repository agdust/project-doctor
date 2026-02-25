import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Check } from "../../../types.js";
import type { EnvContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "env-example-complete";

export const check: Check<EnvContext> = {
  name,
  description: "Check if .env.example documents all variables from .env",
  tags: ["universal", "recommended", "effort:low"],
  run: (_global, ctx) => {
    // Only relevant if both files exist
    if (!ctx.envExists) {
      return skip(name, "No .env file");
    }
    if (!ctx.exampleExists) {
      return skip(name, "No .env.example file");
    }

    // Find variables in .env that are missing from .env.example
    const missingVars = ctx.envVars.filter((v) => !ctx.exampleVars.includes(v));

    if (missingVars.length === 0) {
      return pass(name, "All env variables documented");
    }

    return fail(
      name,
      `.env.example missing ${missingVars.length} var${missingVars.length > 1 ? "s" : ""}: ${missingVars.join(", ")}`,
    );
  },
  fix: {
    description: "Add missing variables to .env.example",
    run: async (global) => {
      const envPath = path.join(global.projectPath, ".env");
      const examplePath = path.join(global.projectPath, ".env.example");

      const envContent = await readFile(envPath, "utf8");
      let exampleContent = await readFile(examplePath, "utf8");

      // Parse current example vars
      const exampleVars = new Set(
        exampleContent
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#"))
          .map((line) => {
            // Handle both VAR=value and VAR (without value)
            const eqIndex = line.indexOf("=");
            return eqIndex === -1 ? line : line.slice(0, eqIndex);
          })
          .filter(Boolean),
      );

      // Find and add missing vars from .env
      const linesToAdd: string[] = [];
      for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        // Handle both VAR=value and VAR (without value)
        const eqIndex = trimmed.indexOf("=");
        const varName = eqIndex === -1 ? trimmed : trimmed.slice(0, eqIndex);
        if (varName && !exampleVars.has(varName)) {
          // Add variable without value
          const lineEqIndex = line.indexOf("=");
          linesToAdd.push(lineEqIndex === -1 ? line : line.slice(0, lineEqIndex + 1));
        }
      }

      if (linesToAdd.length > 0) {
        // Ensure trailing newline before adding
        if (!exampleContent.endsWith("\n")) {
          exampleContent += "\n";
        }
        exampleContent += linesToAdd.join("\n") + "\n";
        await writeFile(examplePath, exampleContent, "utf8");
      }

      return {
        success: true,
        message: `Added ${linesToAdd.length} missing variable${linesToAdd.length > 1 ? "s" : ""}`,
      };
    },
  },
};
