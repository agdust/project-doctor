import type { Check } from "../../../types.js";
import type { TestingContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "vitest-config-exists";

export const check: Check<TestingContext> = {
  name,
  description: "Check if Vitest is configured",
  tags: ["node", "recommended", "tool:vitest", "effort:high"],
  run: async (_global, { hasVitest }) => {
    if (!hasVitest) return fail(name, "No vitest.config.ts");
    return pass(name, "Vitest configured");
  },
};
