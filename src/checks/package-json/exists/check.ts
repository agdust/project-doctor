import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "package-json-exists";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json exists",
  tags: ["node", "required"],
  run: async (_global, { raw }) => {
    if (!raw) return fail(name, "package.json not found");
    return pass(name, "package.json exists");
  },
};
