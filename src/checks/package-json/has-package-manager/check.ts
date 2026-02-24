import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson } from "../../../utils/json-editor.js";

const name = "package-json-has-package-manager";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json specifies packageManager field",
  tags: ["node", "recommended", "effort:low"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.packageManager) return fail(name, "Missing packageManager field");
    return pass(name, `Package manager: ${parsed.packageManager}`);
  },
  fix: {
    description: "Add packageManager field based on detected lock file",
    run: async (global) => {
      const pm = global.detected.packageManager;
      if (!pm) {
        return { success: false, message: "Could not detect package manager from lock file" };
      }

      const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
      if (!pkg) return { success: false, message: "Could not read package.json" };

      pkg.packageManager = pm;
      await writeJson(global.projectPath, "package.json", pkg);
      return { success: true, message: `Added packageManager: ${pm}` };
    },
  },
};
