import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { EnvContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "env-example-not-empty";

export const check: Check<EnvContext> = {
  name,
  description: "Check if .env.example has content",
  tags: [TAG.universal, TAG.recommended, TAG.effort.medium],
  run: (_global, ctx) => {
    if (!ctx.exampleExists) {
      return skip(name, "No .env.example");
    }
    if (ctx.exampleVars.length === 0) {
      return fail(name, ".env.example is empty");
    }
    return pass(name, `${ctx.exampleVars.length} vars documented`);
  },
};
