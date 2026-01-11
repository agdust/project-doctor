import type { Check } from "../../../types.js";
import type { TestingContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "has-test-script";

export const check: Check<TestingContext> = {
  name,
  description: "Check if package.json has a test script",
  tags: ["node", "recommended", "effort:low"],
  run: async (_global, ctx) => {
    if (ctx.hasTestScript) {
      return pass(name, `test script: ${ctx.testScriptValue}`);
    }
    return fail(name, "No test script in package.json");
  },
};
