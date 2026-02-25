import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson, setNestedField } from "../../../utils/json-editor.js";

const name = "package-json-scripts-build";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if build script exists",
  tags: ["node", "recommended", "effort:medium"],
  run: (_global, { parsed }) => {
    if (!parsed) {
      return skip(name, "No package.json");
    }
    if (parsed.scripts?.build === undefined) {
      return fail(name, "No build script");
    }
    return pass(name, "Build script present");
  },
  fix: {
    description: "Add build script",
    options: [
      {
        id: "tsc",
        label: "TypeScript (tsc)",
        description: "Compile TypeScript with tsc",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) {
            return { success: false, message: "Could not read package.json" };
          }

          setNestedField(pkg, "scripts.build", "tsc");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added build script: tsc" };
        },
      },
      {
        id: "tsup",
        label: "tsup",
        description: "Bundle with tsup (fast, esbuild-based)",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) {
            return { success: false, message: "Could not read package.json" };
          }

          setNestedField(pkg, "scripts.build", "tsup");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added build script: tsup" };
        },
      },
      {
        id: "vite",
        label: "Vite",
        description: "Build with Vite",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) {
            return { success: false, message: "Could not read package.json" };
          }

          setNestedField(pkg, "scripts.build", "vite build");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added build script: vite build" };
        },
      },
    ],
  },
};
