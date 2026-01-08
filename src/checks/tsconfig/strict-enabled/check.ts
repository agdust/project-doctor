import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "tsconfig-strict-enabled";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if TypeScript strict mode is enabled",
  tags: ["typescript", "recommended", "effort:high"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No tsconfig.json");
    if (!parsed.compilerOptions?.strict) {
      return fail(name, "strict mode not enabled");
    }
    return pass(name, "strict mode enabled");
  },
};
