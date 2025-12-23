import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "readme-exists";

export const check: Check<DocsContext> = {
  name,
  description: "Check if README.md exists",
  tags: ["universal", "required"],
  run: async (_global, { readme }) => {
    if (!readme) return fail(name, "README.md not found");
    return pass(name, "README.md exists");
  },
};
