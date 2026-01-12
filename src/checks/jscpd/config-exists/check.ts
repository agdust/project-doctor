import type { Check } from "../../../types.js";
import type { JscpdContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "jscpd-config-exists";

export const check: Check<JscpdContext> = {
  name,
  description: "Check if jscpd (copy/paste detector) is configured",
  tags: ["node", "recommended", "tool:jscpd", "effort:low"],
  run: async (_global, { hasConfig }) => {
    if (!hasConfig) {
      return fail(name, "No jscpd config found (.jscpd.json or .jscpdrc)");
    }
    return pass(name, "jscpd configured");
  },
};
