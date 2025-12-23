import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "tsconfig-valid-json";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if tsconfig.json is valid JSON",
  tags: ["typescript", "required"],
  run: async (_global, { raw, parseError }) => {
    if (!raw) return skip(name, "No tsconfig.json");
    if (parseError) return fail(name, `Invalid JSON: ${parseError}`);
    return pass(name, "Valid JSON");
  },
};
