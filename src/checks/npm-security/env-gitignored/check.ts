/**
 * Check: env-files-gitignored
 *
 * Verifies that .env files are properly ignored in .gitignore.
 * Prevents accidental exposure of secrets in version control.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import type { Check } from "../../../types.js";
import type { NpmSecurityContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "npm-security-env-gitignored";

export const check: Check<NpmSecurityContext> = {
  name,
  description: "Check if .env files are ignored in .gitignore",
  tags: ["universal", "required", "effort:low", "security", "source:lirantal-npm-security"],
  run: async (_global, { gitignoreInstance }) => {
    if (!gitignoreInstance) {
      return fail(name, ".gitignore not found");
    }

    // Check if .env or .env.local would be ignored
    if (gitignoreInstance.ignoresAny([".env", ".env.local"])) {
      return pass(name, ".env files are ignored in .gitignore");
    }

    return fail(name, ".env files are not ignored in .gitignore");
  },
};
