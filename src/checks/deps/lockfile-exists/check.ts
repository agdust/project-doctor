import type { Check } from "../../../types.js";
import type { DepsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "lockfile-exists";

export const check: Check<DepsContext> = {
  name,
  description: "Check if a lockfile exists",
  tags: ["node", "required", "effort:low"],
  run: async (_global, { lockfileType }) => {
    if (!lockfileType) return fail(name, "No lockfile found");
    return pass(name, `Lockfile: ${lockfileType}`);
  },
};
