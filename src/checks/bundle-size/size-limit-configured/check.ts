import type { Check } from "../../../types.js";
import type { BundleSizeContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "size-limit-configured";

export const check: Check<BundleSizeContext> = {
  name,
  description: "Check if size-limit has limits configured",
  tags: ["node", "recommended", "tool:size-limit", "effort:medium"],
  run: async (global, ctx) => {
    if (!global.detected.hasSizeLimit) {
      return skip(name, "size-limit not installed");
    }

    if (!ctx.hasSizeLimitConfig) {
      return fail(name, "size-limit config not found (.size-limit.json or package.json)");
    }

    const location = ctx.configLocation === "file" ? ".size-limit.json" : "package.json";
    return pass(name, `size-limit configured in ${location}`);
  },
};
