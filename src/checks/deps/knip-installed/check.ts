import type { Check } from "../../../types.js";
import type { DepsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "knip-installed";

export const check: Check<DepsContext> = {
  name,
  description: "Check if knip is installed for dead code detection",
  tags: ["node", "recommended", "tool:knip"],
  run: async (global, _ctx) => {
    if (!global.detected.hasKnip) {
      return fail(name, "knip not installed");
    }
    return pass(name, "knip installed");
  },
};
