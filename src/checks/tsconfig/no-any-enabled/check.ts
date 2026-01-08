import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "tsconfig-no-any-enabled";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if noImplicitAny is enabled",
  tags: ["typescript", "opinionated", "effort:high"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No tsconfig.json");
    const opts = parsed.compilerOptions;
    if (!opts?.strict && !opts?.noImplicitAny) {
      return fail(name, "noImplicitAny not enabled");
    }
    return pass(name, "noImplicitAny enabled");
  },
};
