import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-scripts-dev";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if dev script exists",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.scripts?.dev) return fail(name, "No dev script");
    return pass(name, "Dev script present");
  },
};
