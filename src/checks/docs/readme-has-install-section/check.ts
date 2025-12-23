import type { Check } from "../../../types.js";
import type { DocsContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "readme-has-install-section";

export const check: Check<DocsContext> = {
  name,
  description: "Check if README.md has installation instructions",
  tags: ["universal", "recommended"],
  run: async (_global, { readme }) => {
    if (!readme) return skip(name, "No README.md");
    const hasInstall = /##.*install/i.test(readme) || /##.*getting started/i.test(readme);
    if (!hasInstall) {
      return fail(name, "No installation section");
    }
    return pass(name, "Installation section present");
  },
};
