import type { Check } from "../../../types.js";
import type { EditorconfigContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "editorconfig-exists";

export const check: Check<EditorconfigContext> = {
  name,
  description: "Check if .editorconfig exists",
  tags: ["universal", "recommended"],
  run: async (_global, { raw }) => {
    if (!raw) return fail(name, ".editorconfig not found");
    return pass(name, ".editorconfig exists");
  },
};
