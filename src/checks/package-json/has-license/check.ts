import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-has-license";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has license field",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.license) return fail(name, "Missing license field");
    return pass(name, `License: ${parsed.license}`);
  },
};
