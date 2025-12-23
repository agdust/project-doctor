import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "readme-has-usage-section";

export const check: Check<DocsContext> = {
  name,
  description: "Check if README.md has usage instructions",
  tags: ["universal", "recommended"],
  run: async (_global, { readme }) => {
    if (!readme) return skip(name, "No README.md");
    const hasUsage = /##.*usage/i.test(readme) || /##.*example/i.test(readme);
    if (!hasUsage) {
      return fail(name, "No usage section");
    }
    return pass(name, "Usage section present");
  },
};
