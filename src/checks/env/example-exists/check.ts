import type { Check } from "../../../types.js";
import type { EnvContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "env-example-exists";

export const check: Check<EnvContext> = {
  name,
  description: "Check if .env.example exists",
  tags: ["universal", "recommended"],
  run: async (_global, { exampleRaw }) => {
    if (!exampleRaw) return fail(name, ".env.example not found");
    return pass(name, ".env.example exists");
  },
};
