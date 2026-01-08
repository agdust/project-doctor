import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "readme-has-title";

export const check: Check<DocsContext> = {
  name,
  description: "Check if README.md has a title",
  tags: ["universal", "recommended", "effort:low"],
  run: async (_global, { readme }) => {
    if (!readme) return skip(name, "No README.md");
    if (!readme.startsWith("#")) {
      return fail(name, "README.md missing title (# heading)");
    }
    return pass(name, "README.md has title");
  },
};
