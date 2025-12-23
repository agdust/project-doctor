import type { Check } from "../../../types.js";
import type { DepsContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "knip-config";

export const check: Check<DepsContext> = {
  name,
  description: "Check if knip configuration exists",
  tags: ["node", "recommended", "tool:knip"],
  run: async (global, _ctx) => {
    if (!global.detected.hasKnip) {
      return skip(name, "knip not installed");
    }

    const [hasKnipJson, hasKnipTs] = await Promise.all([
      global.files.exists("knip.json"),
      global.files.exists("knip.ts"),
    ]);

    if (hasKnipJson || hasKnipTs) {
      return pass(name, "knip config found");
    }
    return fail(name, "No knip config found");
  },
};
