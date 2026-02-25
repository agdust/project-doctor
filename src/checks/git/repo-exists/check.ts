import type { Check } from "../../../types.js";
import type { GitContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "git-repo-exists";

export const check: Check<GitContext> = {
  name,
  description: "Check if project is a git repository",
  tags: ["universal", "required", "effort:low"],
  run: (_global, { isRepo }) => {
    if (!isRepo) return fail(name, "Not a git repository");
    return pass(name, "Git repository found");
  },
};
