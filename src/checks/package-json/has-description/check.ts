import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-has-description";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has description field",
  tags: ["node", "recommended", "effort:low"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.description) return fail(name, "Missing description");
    return pass(name, "Description present");
  },
};
