import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-no-duplicates";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check for duplicate patterns in .gitignore",
  tags: ["universal", "recommended", "effort:low"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip(name, "No .gitignore");
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const p of patterns) {
      if (seen.has(p)) {
        duplicates.push(p);
      }
      seen.add(p);
    }
    if (duplicates.length > 0) {
      return fail(name, `Duplicates: ${duplicates.join(", ")}`);
    }
    return pass(name, "No duplicates");
  },
};
