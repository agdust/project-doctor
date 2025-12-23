import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "changelog-exists";

export const check: Check<DocsContext> = {
  name,
  description: "Check if CHANGELOG.md exists",
  tags: ["universal", "recommended"],
  run: async (_global, { changelog }) => {
    if (!changelog) return fail(name, "CHANGELOG.md not found");
    return pass(name, "CHANGELOG.md exists");
  },
};
