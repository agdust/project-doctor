import type { Check } from "../../../types.js";
import type { BundleSizeContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "size-limit-script";

export const check: Check<BundleSizeContext> = {
  name,
  description: "Check if package.json has a size-limit npm script",
  tags: ["node", "recommended", "tool:size-limit", "effort:low"],
  run: (global, ctx) => {
    if (!global.detected.hasSizeLimit) {
      return skip(name, "size-limit not installed");
    }

    if (!ctx.hasSizeLimitScript) {
      return fail(name, 'no npm script runs size-limit (e.g. "size": "size-limit")');
    }

    return pass(name, "size-limit script found in package.json");
  },
};
