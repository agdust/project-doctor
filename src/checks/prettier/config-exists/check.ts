import type { Check } from "../../../types.js";
import type { PrettierContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "prettierrc-exists";

export const check: Check<PrettierContext> = {
  name,
  description: "Check if Prettier configuration exists",
  tags: ["node", "recommended", "tool:prettier", "effort:medium"],
  run: async (global, { hasConfig }) => {
    if (!global.detected.hasPrettier) {
      return skip(name, "Prettier not detected");
    }
    if (!hasConfig) {
      return fail(name, "No Prettier config found");
    }
    return pass(name, "Prettier configured");
  },
};
