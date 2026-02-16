/**
 * Check: lockfile-lint-configured
 *
 * Verifies that lockfile-lint is set up to prevent lockfile injection attacks.
 * Attackers can modify lockfiles in PRs to inject compromised packages.
 *
 * Source: https://github.com/lirantal/npm-security-best-practices
 */

import type { Check } from "../../../types.js";
import type { NpmSecurityContext } from "../context.js";
import { pass, fail } from "../../helpers.js";

const name = "npm-security-lockfile-lint";

export const check: Check<NpmSecurityContext> = {
  name,
  description: "Check if lockfile-lint is configured to prevent lockfile injection",
  tags: ["node", "recommended", "effort:low", "security", "source:lirantal-npm-security"],
  run: async (_global, { devDependencies, scripts }) => {
    const hasLockfileLint = "lockfile-lint" in devDependencies;

    if (!hasLockfileLint) {
      return fail(name, "lockfile-lint not found in devDependencies");
    }

    // Check if there's a script that runs lockfile-lint
    const hasLintScript = Object.values(scripts).some(
      (script) => script.includes("lockfile-lint")
    );

    if (!hasLintScript) {
      return fail(name, "lockfile-lint installed but no script configured to run it");
    }

    return pass(name, "lockfile-lint is configured");
  },
};
