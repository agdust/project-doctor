import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { PrettierContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "prettier-config-exists";

export const check: Check<PrettierContext> = {
  name,
  description: "Check if Prettier configuration exists",
  tags: [TAG.node, TAG.recommended, TAG.tool.prettier, TAG.effort.medium],
  run: (global, { hasConfig }) => {
    if (!global.detected.hasPrettier) {
      return skip(name, "Prettier not detected");
    }
    if (!hasConfig) {
      return fail(name, "No Prettier config found");
    }
    return pass(name, "Prettier configured");
  },
};
