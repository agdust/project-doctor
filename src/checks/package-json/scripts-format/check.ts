import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-scripts-format";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if format script exists",
  tags: ["node", "recommended", "effort:medium"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.scripts?.format) return fail(name, "No format script");
    return pass(name, "Format script present");
  },
};
