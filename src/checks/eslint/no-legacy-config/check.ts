import type { Check } from "../../../types.js";
import type { EslintContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "eslint-no-legacy-config";

export const check: Check<EslintContext> = {
  name,
  description: "Check that no legacy .eslintrc files exist",
  tags: ["node", "recommended", "tool:eslint"],
  run: async (global, { hasLegacyConfig }) => {
    if (!global.detected.hasEslint) {
      return skip(name, "ESLint not detected");
    }
    if (hasLegacyConfig) {
      return fail(name, "Legacy .eslintrc config found");
    }
    return pass(name, "No legacy config");
  },
};
