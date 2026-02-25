import { input } from "@inquirer/prompts";
import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson } from "../../../utils/json-editor.js";

const name = "package-json-has-description";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has description field",
  tags: ["node", "recommended", "effort:low"],
  run: (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.description) return fail(name, "Missing description");
    return pass(name, "Description present");
  },
  fix: {
    description: "Add description field",
    run: async (global) => {
      const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
      if (!pkg) return { success: false, message: "Could not read package.json" };

      const description = await input({
        message: "Enter project description:",
      });

      if (!description.trim()) {
        return { success: false, message: "Description cannot be empty" };
      }

      pkg.description = description.trim();
      await writeJson(global.projectPath, "package.json", pkg);
      return { success: true, message: "Added description" };
    },
  },
};
