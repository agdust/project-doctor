/**
 * Check: devcontainer-exists
 *
 * Verifies that a dev container configuration exists.
 * Dev containers isolate development environments, limiting malware blast radius.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import type { Check } from "../../../types.js";
import type { NpmSecurityContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "npm-security-devcontainer";

export const check: Check<NpmSecurityContext> = {
  name,
  description: "Check if dev container configuration exists",
  tags: ["universal", "opinionated", "effort:medium", "security", "source:lirantal-npm-security"],
  run: async (_global, { hasDevcontainer }) => {
    if (hasDevcontainer) {
      return pass(name, "Dev container configuration exists");
    }

    return fail(
      name,
      "No dev container configuration found. See: https://github.com/lirantal/npm-security-best-practices?tab=readme-ov-file#8-work-in-dev-containers",
    );
  },
};
