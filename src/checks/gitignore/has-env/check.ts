import type { Check } from "../../../types.js";
import type { GitignoreContext } from "../context.js";
import { pass, fail, skip } from "../../helpers.js";

const name = "gitignore-has-env";

export const check: Check<GitignoreContext> = {
  name,
  description: "Check if .env files are ignored",
  tags: ["universal", "required"],
  run: async (_global, { raw, patterns }) => {
    if (!raw) return skip(name, "No .gitignore");
    const hasIt = patterns.some((p) =>
      [".env", ".env.local", ".env*.local", "*.env"].includes(p) || p.startsWith(".env")
    );
    if (!hasIt) return fail(name, ".env files not ignored");
    return pass(name, ".env files ignored");
  },
};
