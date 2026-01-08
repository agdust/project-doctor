import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-has-main-or-exports";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json has main or exports entry point",
  tags: ["node", "recommended", "effort:medium"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.main && !parsed.exports) {
      return fail(name, "No main or exports field");
    }
    return pass(name, "Entry point defined");
  },
};
