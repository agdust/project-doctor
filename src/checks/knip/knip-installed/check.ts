import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { KnipContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "knip-installed";

export const check: Check<KnipContext> = {
  name,
  description: "Check if knip is installed for dead code detection",
  tags: [TAG.node, TAG.recommended, TAG.tool.knip, TAG.effort.medium],
  run: (_global, _ctx) => {
    if (!_ctx.hasKnip) {
      return fail(name, "knip not installed");
    }
    return pass(name, "knip installed");
  },
};
