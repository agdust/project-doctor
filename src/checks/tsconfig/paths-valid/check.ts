import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "tsconfig-paths-valid";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if path aliases have baseUrl configured",
  tags: ["typescript", "recommended"],
  run: async (_global, { parsed }) => {
    if (!parsed) return skip(name, "No tsconfig.json");
    const opts = parsed.compilerOptions;
    if (opts?.paths && !opts?.baseUrl) {
      return fail(name, "paths defined but no baseUrl");
    }
    return pass(name, "Path config valid");
  },
};
