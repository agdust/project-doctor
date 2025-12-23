import type { Check } from "../../../types.js";
import type { PrettierContext } from "../context.js";
import { pass, warn, skip } from "../../helpers.js";

const name = "prettier-ignore-exists";

export const check: Check<PrettierContext> = {
  name,
  description: "Check if .prettierignore exists",
  tags: ["node", "recommended", "tool:prettier"],
  run: async (global, { hasIgnore }) => {
    if (!global.detected.hasPrettier) {
      return skip(name, "Prettier not detected");
    }
    if (!hasIgnore) {
      return warn(name, "No .prettierignore file");
    }
    return pass(name, ".prettierignore exists");
  },
};
