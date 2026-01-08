import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

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
};
