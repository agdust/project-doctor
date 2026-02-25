import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson, setNestedField } from "../../../utils/json-editor.js";

const name = "package-json-scripts-test";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if test script exists",
  tags: ["node", "recommended", "effort:medium"],
  run: (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.scripts?.test) return fail(name, "No test script");
    return pass(name, "Test script present");
  },
  fix: {
    description: "Add test script",
    options: [
      {
        id: "vitest",
        label: "Vitest",
        description: "Fast, Vite-native testing framework",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) return { success: false, message: "Could not read package.json" };

          setNestedField(pkg, "scripts.test", "vitest");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added test script: vitest" };
        },
      },
      {
        id: "jest",
        label: "Jest",
        description: "Popular testing framework by Facebook",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) return { success: false, message: "Could not read package.json" };

          setNestedField(pkg, "scripts.test", "jest");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added test script: jest" };
        },
      },
      {
        id: "node-test",
        label: "Node.js test runner",
        description: "Built-in Node.js test runner (no dependencies)",
        run: async (global) => {
          const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
          if (!pkg) return { success: false, message: "Could not read package.json" };

          setNestedField(pkg, "scripts.test", "node --test");
          await writeJson(global.projectPath, "package.json", pkg);
          return { success: true, message: "Added test script: node --test" };
        },
      },
    ],
  },
};
