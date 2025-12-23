import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "license-exists";

export const check: Check<DocsContext> = {
  name,
  description: "Check if LICENSE file exists",
  tags: ["universal", "recommended"],
  run: async (_global, { license }) => {
    if (!license) return fail(name, "LICENSE file not found");
    return pass(name, "LICENSE file exists");
  },
};
