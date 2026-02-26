import { TAG, type Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson, setNestedField } from "../../../utils/json-editor.js";

const name = "package-json-scripts-format";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if format script exists",
  tags: [TAG.node, TAG.recommended, TAG.effort.medium],
  run: (_global, { parsed }) => {
    if (!parsed) {
      return skip(name, "No package.json");
    }
    if (parsed.scripts?.format === undefined) {
      return fail(name, "No format script");
    }
    return pass(name, "Format script present");
  },
  fix: {
    description: "Add format script",
    options: [
      {
        id: "prettier",
        label: "Prettier",
        description: "Format with Prettier",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) {
            return { success: false, message: "Could not read package.json" };
          }

          setNestedField(pkg, "scripts.format", "prettier --write .");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added format script: prettier --write ." };
        },
      },
      {
        id: "biome",
        label: "Biome",
        description: "Format with Biome (fast, all-in-one)",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) {
            return { success: false, message: "Could not read package.json" };
          }

          setNestedField(pkg, "scripts.format", "biome format --write .");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added format script: biome format --write ." };
        },
      },
      {
        id: "dprint",
        label: "dprint",
        description: "Format with dprint (fast, pluggable)",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) {
            return { success: false, message: "Could not read package.json" };
          }

          setNestedField(pkg, "scripts.format", "dprint fmt");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added format script: dprint fmt" };
        },
      },
    ],
  },
};
