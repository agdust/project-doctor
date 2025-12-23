import type { Check } from "../../../types.js";
import type { EditorconfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "editorconfig-has-root";

export const check: Check<EditorconfigContext> = {
  name,
  description: "Check if .editorconfig has root = true",
  tags: ["universal", "recommended"],
  run: async (_global, { raw, hasRoot }) => {
    if (!raw) return skip(name, "No .editorconfig");
    if (!hasRoot) return fail(name, "Missing root = true");
    return pass(name, "root = true present");
  },
};
