import type { Check } from "../../../types.js";
import type { TestingContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "jest-config-exists";

export const check: Check<TestingContext> = {
  name,
  description: "Check if Jest is configured",
  tags: ["node", "recommended", "tool:jest", "effort:high"],
  run: async (_global, { hasJest }) => {
    if (!hasJest) return fail(name, "No jest.config.js");
    return pass(name, "Jest configured");
  },
};
