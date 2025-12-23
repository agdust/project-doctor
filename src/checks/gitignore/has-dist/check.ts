import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, warn, skip } from "../../helpers.js";

const name = "gitignore-has-dist";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if dist/build output is ignored",
  tags: ["node", "recommended"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip(name, "No .gitignore");
    const hasIt = patterns.some((p) =>
      ["dist", "dist/", "build", "build/", "out", "out/"].includes(p)
    );
    if (!hasIt) return warn(name, "No dist/build ignored");
    return pass(name, "Build output ignored");
  },
};
