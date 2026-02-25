import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson } from "../../../utils/json-editor.js";

const name = "package-json-type-module";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has type: module for ESM",
  tags: ["node", "recommended", "effort:medium"],
  run: (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (parsed.type !== "module") return fail(name, "Not using ESM (type: module)");
    return pass(name, "Using ESM");
  },
  fix: {
    description: "Set type: module for ESM",
    run: async (global) => {
      const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
      if (!pkg) return { success: false, message: "Could not read package.json" };

      pkg.type = "module";
      await writeJson(global.projectPath, "package.json", pkg);
      return { success: true, message: "Set type: module" };
    },
  },
};
