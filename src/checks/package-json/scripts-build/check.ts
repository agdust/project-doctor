import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-scripts-build";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if build script exists",
  tags: ["node", "recommended", "effort:medium"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.scripts?.build) return fail(name, "No build script");
    return pass(name, "Build script present");
  },
};
