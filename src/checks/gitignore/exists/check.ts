import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "gitignore-exists";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if .gitignore exists",
  tags: ["universal", "required"],
  run: async (_global, { raw }) => {
    if (!raw) return fail(name, ".gitignore not found");
    return pass(name, ".gitignore exists");
  },
};
