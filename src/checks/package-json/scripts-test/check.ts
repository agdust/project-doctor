import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-scripts-test";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if test script exists",
  tags: ["node", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.scripts?.test) return fail(name, "No test script");
    return pass(name, "Test script present");
  },
};
