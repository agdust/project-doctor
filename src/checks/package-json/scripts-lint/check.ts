import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson, setNestedField } from "../../../utils/json-editor.js";

const name = "package-json-scripts-lint";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if lint script exists",
  tags: ["node", "recommended", "effort:medium"],
  run: (_global, { parsed }) => {
    if (!parsed) {
      return skip(name, "No package.json");
    }
    if (parsed.scripts?.lint === undefined) {
      return fail(name, "No lint script");
    }
    return pass(name, "Lint script present");
  },
  fix: {
    description: "Add lint script",
    options: [
      {
        id: "eslint",
        label: "ESLint",
        description: "Lint with ESLint",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) {
            return { success: false, message: "Could not read package.json" };
          }

          setNestedField(pkg, "scripts.lint", "eslint .");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added lint script: eslint ." };
        },
      },
      {
        id: "biome",
        label: "Biome",
        description: "Lint with Biome (fast, all-in-one)",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) {
            return { success: false, message: "Could not read package.json" };
          }

          setNestedField(pkg, "scripts.lint", "biome lint .");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added lint script: biome lint ." };
        },
      },
      {
        id: "tsc",
        label: "TypeScript (type-check only)",
        description: "Type-check with tsc --noEmit",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) {
            return { success: false, message: "Could not read package.json" };
          }

          setNestedField(pkg, "scripts.lint", "tsc --noEmit");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added lint script: tsc --noEmit" };
        },
      },
    ],
  },
};
