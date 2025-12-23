import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-valid";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json is valid JSON",
  tags: ["node", "required"],
  run: async (_global, { raw, parseError }) => {
    if (!raw) return skip(name, "No package.json");
    if (parseError) return fail(name, `Invalid JSON: ${parseError}`);
    return pass(name, "Valid JSON");
  },
};
