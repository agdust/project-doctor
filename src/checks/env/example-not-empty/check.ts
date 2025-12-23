import type { Check } from "../../../types.js";
import type { EnvContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "env-example-not-empty";

export const check: Check<EnvContext> = {
  name,
  description: "Check if .env.example has content",
  tags: ["universal", "recommended"],
  run: async (_global, { exampleRaw, exampleVars }) => {
    if (!exampleRaw) return skip(name, "No .env.example");
    if (exampleVars.length === 0) {
      return fail(name, ".env.example is empty");
    }
    return pass(name, `${exampleVars.length} vars documented`);
  },
};
