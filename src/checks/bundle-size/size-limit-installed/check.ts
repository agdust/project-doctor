import { TAG } from "../../../types.js";
import type { Check } from "../../../types.js";
import type { BundleSizeContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "size-limit-installed";

export const check: Check<BundleSizeContext> = {
  name,
  description: "Check if size-limit is installed for bundle size tracking",
  tags: [TAG.node, TAG.recommended, TAG.tool["size-limit"], TAG.effort.medium],
  run: (global, _ctx) => {
    if (!global.detected.hasSizeLimit) {
      return fail(name, "size-limit not installed");
    }
    return pass(name, "size-limit installed");
  },
};
