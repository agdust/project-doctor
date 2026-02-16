import { basename } from "node:path";
import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson } from "../../../utils/json-editor.js";

const name = "package-json-has-name";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has name field",
  tags: ["node", "required", "effort:low"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.name) return fail(name, "Missing name field");
    return pass(name, `Name: ${parsed.name}`);
  },
  fix: {
    description: "Add name field from directory name",
    run: async (global) => {
      const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
      if (!pkg) return { success: false, message: "Could not read package.json" };

      const dirName = basename(global.projectPath);
      // Sanitize: lowercase, replace spaces with hyphens, remove invalid chars
      const safeName = dirName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_.]/g, "");
      pkg.name = safeName;

      await writeJson(global.projectPath, "package.json", pkg);
      return { success: true, message: `Added name: ${safeName}` };
    },
  },
};
