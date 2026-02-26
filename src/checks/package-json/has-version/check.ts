import { TAG, type Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";
import { readJson, writeJson } from "../../../utils/json-editor.js";

const name = "package-json-has-version";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has version field",
  tags: [TAG.node, TAG.required, TAG.effort.low],
  run: (_global, { parsed }) => {
    if (!parsed) {
      return skip(name, "No package.json");
    }
    if (parsed.version === undefined) {
      return fail(name, "Missing version field");
    }
    return pass(name, `Version: ${parsed.version}`);
  },
  fix: {
    description: "Add version 0.0.1",
    run: async (global) => {
      const pkg = await readJson<Record<string, unknown>>(global.projectPath, "package.json");
      if (!pkg) {
        return { success: false, message: "Could not read package.json" };
      }

      pkg.version = "0.0.1";
      await writeJson(global.projectPath, "package.json", pkg);
      return { success: true, message: "Added version: 0.0.1" };
    },
  },
};
