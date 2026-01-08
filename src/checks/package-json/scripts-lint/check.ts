import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-scripts-lint";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if lint script exists",
  tags: ["node", "recommended", "effort:medium"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.scripts?.lint) return fail(name, "No lint script");
    return pass(name, "Lint script present");
  },
};
