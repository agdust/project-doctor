import type { Check } from "../../../types.js";
import type { TestingContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "playwright-config-exists";

export const check: Check<TestingContext> = {
  name,
  description: "Check if Playwright is configured",
  tags: ["node", "recommended", "tool:playwright"],
  run: async (_global, { hasPlaywright }) => {
    if (!hasPlaywright) return fail(name, "No playwright.config.ts");
    return pass(name, "Playwright configured");
  },
};
