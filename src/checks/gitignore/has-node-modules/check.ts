import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-has-node-modules";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if node_modules is ignored",
  tags: ["node", "required"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip(name, "No .gitignore");
    const hasIt = patterns.some((p) => p === "node_modules" || p === "node_modules/");
    if (!hasIt) return fail(name, "node_modules not ignored");
    return pass(name, "node_modules ignored");
  },
};
