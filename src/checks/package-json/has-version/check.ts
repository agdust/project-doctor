import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-has-version";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has version field",
  tags: ["node", "required"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.version) return fail(name, "Missing version field");
    return pass(name, `Version: ${parsed.version}`);
  },
};
