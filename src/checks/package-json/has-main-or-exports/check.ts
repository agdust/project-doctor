import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson } from "../../../utils/json-editor.js";

const name = "package-json-has-main-or-exports";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has main or exports entry point",
  tags: ["node", "recommended", "effort:medium"],
  run: (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.main && !parsed.exports) {
      return fail(name, "No main or exports field");
    }
    return pass(name, "Entry point defined");
  },
  fix: {
    description: "Add entry point",
    options: [
      {
        id: "main",
        label: "Add main field",
        description: "Traditional entry point (dist/index.js)",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) return { success: false, message: "Could not read package.json" };

          pkg.main = "dist/index.js";
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added main: dist/index.js" };
        },
      },
      {
        id: "exports",
        label: "Add exports field",
        description: "Modern exports map with ESM support",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) return { success: false, message: "Could not read package.json" };

          pkg.exports = {
            ".": {
              import: "./dist/index.js",
              require: "./dist/index.cjs",
            },
          };
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added exports field" };
        },
      },
    ],
  },
};
