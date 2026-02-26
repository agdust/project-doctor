import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "tsconfig-valid-json";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if tsconfig.json is valid JSON",
  tags: [TAG.typescript, TAG.required, TAG.effort.low],
  run: (_global, { raw, parseError }) => {
    if (raw === null) {
      return skip(name, "No tsconfig.json");
    }
    if (parseError !== null) {
      return fail(name, `Invalid JSON: ${parseError}`);
    }
    return pass(name, "Valid JSON");
  },
};
