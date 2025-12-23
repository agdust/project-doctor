import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-type-module";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has type: module for ESM",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (parsed.type !== "module") return fail(name, "Not using ESM (type: module)");
    return pass(name, "Using ESM");
  },
};
