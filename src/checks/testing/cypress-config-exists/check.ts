import type { Check } from "../../../types.js";
import type { TestingContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "cypress-config-exists";

export const check: Check<TestingContext> = {
  name,
  description: "Check if Cypress is configured",
  tags: ["node", "recommended", "tool:cypress"],
  run: async (_global, { hasCypress }) => {
    if (!hasCypress) return fail(name, "No cypress.config.ts");
    return pass(name, "Cypress configured");
  },
};
