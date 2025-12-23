import type { Check } from "../../../types.js";
import type { NvmrcContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "nvmrc-exists";

export const check: Check<NvmrcContext> = {
  name,
  description: "Check if .nvmrc file exists",
  tags: ["node", "recommended"],
  run: async (_global, { raw }) => {
    if (!raw) return fail(name, ".nvmrc not found");
    return pass(name, ".nvmrc exists");
  },
};
