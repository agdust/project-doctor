import type { Check } from "../../../types.js";
import type { PackageJsonContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "package-json-has-engines";

export const check: Check<PackageJsonContext> = {
  name,
  description: "Check if package.json specifies Node engine version",
  tags: ["node", "recommended", "effort:low"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No package.json");
    if (!parsed.engines?.node) return fail(name, "Missing engines.node");
    return pass(name, `Node: ${parsed.engines.node}`);
  },
};
