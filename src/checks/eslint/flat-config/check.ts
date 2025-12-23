import type { Check } from "../../../types.js";
import type { EslintContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "eslint-flat-config";

export const check: Check<EslintContext> = {
  name,
  description: "Check if using ESLint flat config format (v9+)",
  tags: ["node", "recommended", "tool:eslint"],
  run: async (global, { hasFlatConfig, flatConfigFile }) => {
    if (!global.detected.hasEslint) {
      return skip(name, "ESLint not detected");
    }
    if (!hasFlatConfig) {
      return fail(name, "Not using flat config (eslint.config.{js,mjs,ts})");
    }
    return pass(name, `Using flat config: ${flatConfigFile}`);
  },
};
