import type { Check } from "../../../types.js";
import type { EditorconfigContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "editorconfig-has-indent";

export const check: Check<EditorconfigContext> = {
  name,
  description: "Check if .editorconfig has indent settings",
  tags: ["universal", "recommended"],
  run: async (_global, { raw, hasIndent }) => {
    if (!raw) return skip(name, "No .editorconfig");
    if (!hasIndent) return fail(name, "No indent settings");
    return pass(name, "Indent settings present");
  },
};
