import type { Check } from "../../../types.js";
import type { TsConfigContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "tsconfig-exists";

export const check: Check<TsConfigContext> = {
  name,
  description: "Check if tsconfig.json exists",
  tags: ["typescript", "required"],
  run: async (_global, { raw }) => {
    if (!raw) return fail(name, "tsconfig.json not found");
    return pass(name, "tsconfig.json exists");
  },
};
