import type { Check } from "../../../types.js";
import type { EslintContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "eslint-config-exists";

export const check: Check<EslintContext> = {
  name,
  description: "Check if ESLint configuration exists",
  tags: ["node", "recommended", "tool:eslint", "effort:medium"],
  run: (global, { hasFlatConfig, hasLegacyConfig }) => {
    if (!global.detected.hasEslint) {
      return skip(name, "ESLint not detected");
    }
    if (!hasFlatConfig && !hasLegacyConfig) {
      return fail(name, "No ESLint config found");
    }
    return pass(name, "ESLint configured");
  },
};
